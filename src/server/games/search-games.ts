import { asc, like, or, sql } from "drizzle-orm"

import { db } from "@/server/db"
import { games } from "@/server/db/schema"
import { searchIgdbGames, toCoverImageUrl, type IgdbGame } from "@/server/igdb/client"

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 24
const DEFAULT_SEARCH_CACHE_TTL_MS = 60_000
const DEFAULT_SYNC_TTL_HOURS = 24

type SearchCacheEntry = {
  expiresAt: number
  value: SearchGamesResult[]
}

export type SearchGamesResult = {
  coverUrl: string | null
  firstReleaseDate: string | null
  genres: string[]
  igdbId: number
  lastSyncedAt: string
  name: string
  platforms: string[]
  rating: number | null
  slug: string
  summary: string | null
}

const searchResultCache = new Map<string, SearchCacheEntry>()
const inFlightSearches = new Map<string, Promise<SearchGamesResult[]>>()

function getSearchCacheTtlMs(): number {
  const rawValue = Number(process.env.IGDB_SEARCH_CACHE_TTL_MS)

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return DEFAULT_SEARCH_CACHE_TTL_MS
  }

  return rawValue
}

function getSyncTtlMs(): number {
  const rawHours = Number(process.env.IGDB_SYNC_TTL_HOURS)

  if (!Number.isFinite(rawHours) || rawHours <= 0) {
    return DEFAULT_SYNC_TTL_HOURS * 60 * 60 * 1_000
  }

  return rawHours * 60 * 60 * 1_000
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").slice(0, 80)
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit) || !limit) {
    return DEFAULT_LIMIT
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT)
}

function safeParseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((entry): entry is string => typeof entry === "string")
  } catch {
    return []
  }
}

function uniqueNonEmptyValues(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[]
}

function toDateFromUnixSeconds(unixTimestamp?: number | null): Date | null {
  if (!Number.isFinite(unixTimestamp) || !unixTimestamp) {
    return null
  }

  return new Date(unixTimestamp * 1_000)
}

function toIsoString(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

function toSearchResult(
  game: typeof games.$inferSelect,
): SearchGamesResult {
  return {
    igdbId: game.igdbId,
    slug: game.slug,
    name: game.name,
    summary: game.summary,
    coverUrl: game.coverUrl,
    firstReleaseDate: toIsoString(game.firstReleaseDate),
    rating: game.rating,
    platforms: safeParseStringArray(game.platforms),
    genres: safeParseStringArray(game.genres),
    lastSyncedAt: game.lastSyncedAt.toISOString(),
  }
}

function toSearchResultFromIgdbGame(game: IgdbGame): SearchGamesResult {
  const nowIso = new Date().toISOString()

  return {
    igdbId: game.id,
    slug: game.slug,
    name: game.name,
    summary: game.summary?.trim() || null,
    coverUrl: toCoverImageUrl(game.cover?.url),
    firstReleaseDate: toIsoString(toDateFromUnixSeconds(game.first_release_date)),
    rating: typeof game.rating === "number" ? game.rating : null,
    platforms: uniqueNonEmptyValues(
      game.platforms?.map((platform) => platform.abbreviation ?? platform.name) ?? [],
    ),
    genres: uniqueNonEmptyValues(game.genres?.map((genre) => genre.name) ?? []),
    lastSyncedAt: nowIso,
  }
}

async function readLocalSearchResults(
  query: string,
  limit: number,
): Promise<Array<typeof games.$inferSelect>> {
  const pattern = `%${query}%`

  return db
    .select()
    .from(games)
    .where(or(like(games.name, pattern), like(games.slug, pattern)))
    .orderBy(asc(games.name))
    .limit(limit)
}

function hasStaleEntries(rows: Array<typeof games.$inferSelect>): boolean {
  const now = Date.now()
  const syncTtlMs = getSyncTtlMs()

  return rows.some((row) => now - row.lastSyncedAt.getTime() > syncTtlMs)
}

async function upsertIgdbGames(igdbGames: IgdbGame[]): Promise<void> {
  if (igdbGames.length === 0) {
    return
  }

  const rows = igdbGames.map((game) => {
    const platforms = uniqueNonEmptyValues(
      game.platforms?.map((platform) => platform.abbreviation ?? platform.name) ?? [],
    )
    const genres = uniqueNonEmptyValues(game.genres?.map((genre) => genre.name) ?? [])

    return {
      igdbId: game.id,
      slug: game.slug,
      name: game.name,
      summary: game.summary?.trim() || null,
      coverUrl: toCoverImageUrl(game.cover?.url),
      firstReleaseDate: toDateFromUnixSeconds(game.first_release_date),
      rating: typeof game.rating === "number" ? game.rating : null,
      platforms: JSON.stringify(platforms),
      genres: JSON.stringify(genres),
      checksum: game.checksum?.trim() || null,
      igdbUpdatedAt: toDateFromUnixSeconds(game.updated_at),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    }
  })

  await db
    .insert(games)
    .values(rows)
    .onConflictDoUpdate({
      target: games.igdbId,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        summary: sql`excluded.summary`,
        coverUrl: sql`excluded.cover_url`,
        firstReleaseDate: sql`excluded.first_release_date`,
        rating: sql`excluded.rating`,
        platforms: sql`excluded.platforms`,
        genres: sql`excluded.genres`,
        checksum: sql`excluded.checksum`,
        igdbUpdatedAt: sql`excluded.igdb_updated_at`,
        updatedAt: sql`(unixepoch())`,
        lastSyncedAt: sql`(unixepoch())`,
      },
    })
}

async function performSearch(
  query: string,
  limit: number,
): Promise<SearchGamesResult[]> {
  const normalizedQuery = normalizeQuery(query)

  if (normalizedQuery.length < 2) {
    return []
  }

  const cappedLimit = clampLimit(limit)
  const localMatches = await readLocalSearchResults(normalizedQuery, cappedLimit)

  const shouldFetchFromIgdb =
    localMatches.length < cappedLimit || hasStaleEntries(localMatches)

  let igdbResults: IgdbGame[] = []

  if (shouldFetchFromIgdb) {
    try {
      igdbResults = await searchIgdbGames(normalizedQuery, cappedLimit)
      await upsertIgdbGames(igdbResults)
    } catch (error) {
      console.error("[games] Failed to fetch games from IGDB", {
        error,
        query: normalizedQuery,
      })
    }
  }

  const refreshedMatches = await readLocalSearchResults(normalizedQuery, cappedLimit)

  if (refreshedMatches.length > 0) {
    return refreshedMatches.map(toSearchResult)
  }

  return igdbResults.slice(0, cappedLimit).map(toSearchResultFromIgdbGame)
}

function getCacheKey(query: string, limit: number): string {
  return `${normalizeQuery(query)}::${clampLimit(limit)}`
}

function cleanupSearchCache(now: number): void {
  if (searchResultCache.size < 500) {
    return
  }

  for (const [key, entry] of searchResultCache) {
    if (entry.expiresAt <= now) {
      searchResultCache.delete(key)
    }
  }
}

export async function searchGames(
  query: string,
  limit?: number,
): Promise<SearchGamesResult[]> {
  const resolvedLimit = clampLimit(limit)
  const cacheKey = getCacheKey(query, resolvedLimit)
  const now = Date.now()
  const cachedResult = searchResultCache.get(cacheKey)

  cleanupSearchCache(now)

  if (cachedResult && cachedResult.expiresAt > now) {
    return cachedResult.value
  }

  const inFlightResult = inFlightSearches.get(cacheKey)

  if (inFlightResult) {
    return inFlightResult
  }

  const promise = performSearch(query, resolvedLimit)
    .then((result) => {
      searchResultCache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + getSearchCacheTtlMs(),
      })

      return result
    })
    .finally(() => {
      inFlightSearches.delete(cacheKey)
    })

  inFlightSearches.set(cacheKey, promise)

  return promise
}
