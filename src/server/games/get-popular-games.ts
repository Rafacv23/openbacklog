import { and, desc, eq, gte, ne, or, sql } from "drizzle-orm"

import { db } from "@/server/db"
import { friendships, games, libraryEntries, reviews } from "@/server/db/schema"

const DEFAULT_COLLECTION_LIMIT = 9
const DEFAULT_FACET_OPTIONS_LIMIT = 8
const MAX_COLLECTION_LIMIT = 24
const MAX_FACET_OPTIONS_LIMIT = 20
const FACET_SOURCE_MIN_LIMIT = 180
const RECENT_RELEASE_WINDOW_DAYS = 120
const RECENT_REVIEW_WINDOW_DAYS = 30

const DEFAULT_PLATFORM_OPTIONS = ["PC", "PlayStation 5", "Xbox Series X|S", "Nintendo Switch"]
const DEFAULT_GENRE_OPTIONS = ["RPG", "Action", "Adventure", "Shooter", "Strategy"]

export const POPULAR_FACET_TYPES = ["platform", "genre"] as const

export type PopularFacetType = (typeof POPULAR_FACET_TYPES)[number]

export type PopularGame = {
  coverUrl: string | null
  firstReleaseDate: string | null
  genres: string[]
  igdbId: number
  name: string
  platforms: string[]
  rating: number | null
  slug: string
  summary: string | null
}

export type PopularFacetOption = {
  label: string
  slug: string
  weight: number
}

export type PopularCollectionsResult = {
  friendsPopularGames: PopularGame[]
  genreOptions: PopularFacetOption[]
  mostPopularGames: PopularGame[]
  platformOptions: PopularFacetOption[]
  recentlyActiveGames: PopularGame[]
}

export type PopularFacetGamesResult = {
  activeFacet: PopularFacetOption | null
  games: PopularGame[]
  options: PopularFacetOption[]
}

type RankedGameRow = {
  game: typeof games.$inferSelect
  libraryCount: number
  reviewCount: number
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

function clampLimit(limit: unknown, fallback: number, max: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return fallback
  }

  return Math.min(Math.max(Math.floor(limit), 1), max)
}

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function toPopularGame(game: typeof games.$inferSelect): PopularGame {
  return {
    coverUrl: game.coverUrl,
    firstReleaseDate: toIsoString(game.firstReleaseDate),
    genres: safeParseStringArray(game.genres),
    igdbId: game.igdbId,
    name: game.name,
    platforms: safeParseStringArray(game.platforms),
    rating: game.rating,
    slug: game.slug,
    summary: game.summary,
  }
}

function normalizeFacetLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function toFacetSlug(value: string): string {
  return normalizeFacetLabel(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function normalizeFacetSlug(value: string): string {
  return toFacetSlug(value)
}

function toPopularFacetOption(label: string, weight = 0): PopularFacetOption {
  return {
    label,
    slug: toFacetSlug(label),
    weight,
  }
}

function getFallbackFacetOptions(facetType: PopularFacetType): PopularFacetOption[] {
  const values = facetType === "platform" ? DEFAULT_PLATFORM_OPTIONS : DEFAULT_GENRE_OPTIONS

  return values.map((value) => toPopularFacetOption(value))
}

function getFacetValues(game: typeof games.$inferSelect, facetType: PopularFacetType): string[] {
  const rawValues = facetType === "platform" ? safeParseStringArray(game.platforms) : safeParseStringArray(game.genres)

  return rawValues
    .map(normalizeFacetLabel)
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
}

export function toPopularFacetType(value: string): PopularFacetType | null {
  return POPULAR_FACET_TYPES.find((facetType) => facetType === value) ?? null
}

async function readRankedGames(limit: number): Promise<RankedGameRow[]> {
  const safeLimit = clampLimit(limit, DEFAULT_COLLECTION_LIMIT, 300)

  return db
    .select({
      game: games,
      libraryCount: sql<number>`count(distinct ${libraryEntries.id})`,
      reviewCount: sql<number>`count(distinct ${reviews.id})`,
    })
    .from(games)
    .leftJoin(libraryEntries, eq(libraryEntries.gameId, games.id))
    .leftJoin(reviews, eq(reviews.gameId, games.id))
    .groupBy(games.id)
    .orderBy(
      desc(sql`count(distinct ${libraryEntries.id})`),
      desc(sql`count(distinct ${reviews.id})`),
      desc(games.rating),
      desc(games.lastSyncedAt),
    )
    .limit(safeLimit)
}

async function readRecentlyActiveGames(limit: number): Promise<PopularGame[]> {
  const now = new Date()
  const releaseThreshold = new Date(now.getTime() - RECENT_RELEASE_WINDOW_DAYS * 24 * 60 * 60 * 1_000)
  const reviewThreshold = new Date(now.getTime() - RECENT_REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1_000)

  const rows = await db
    .select({
      game: games,
      latestReviewAt: sql<Date | null>`max(${reviews.updatedAt})`,
    })
    .from(games)
    .leftJoin(reviews, eq(reviews.gameId, games.id))
    .where(or(gte(games.firstReleaseDate, releaseThreshold), gte(reviews.updatedAt, reviewThreshold)))
    .groupBy(games.id)
    .orderBy(
      desc(sql`coalesce(max(${reviews.updatedAt}), ${games.firstReleaseDate})`),
      desc(games.rating),
      desc(games.lastSyncedAt),
    )
    .limit(clampLimit(limit, DEFAULT_COLLECTION_LIMIT, MAX_COLLECTION_LIMIT))

  return rows.map((row) => toPopularGame(row.game))
}

async function readFriendsPopularGames({
  limit,
  userId,
}: {
  limit: number
  userId: string
}): Promise<PopularGame[]> {
  if (!userId) {
    return []
  }

  const rows = await db
    .select({
      game: games,
      friendCount: sql<number>`count(distinct ${libraryEntries.userId})`,
      entryCount: sql<number>`count(distinct ${libraryEntries.id})`,
      reviewCount: sql<number>`count(distinct ${reviews.id})`,
    })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .leftJoin(reviews, eq(reviews.gameId, games.id))
    .innerJoin(
      friendships,
      and(
        eq(friendships.status, "accepted"),
        or(
          and(
            eq(friendships.requesterUserId, userId),
            eq(friendships.addresseeUserId, libraryEntries.userId),
          ),
          and(
            eq(friendships.addresseeUserId, userId),
            eq(friendships.requesterUserId, libraryEntries.userId),
          ),
        ),
      ),
    )
    .where(ne(libraryEntries.userId, userId))
    .groupBy(games.id)
    .orderBy(
      desc(sql`count(distinct ${libraryEntries.userId})`),
      desc(sql`count(distinct ${libraryEntries.id})`),
      desc(sql`count(distinct ${reviews.id})`),
      desc(games.rating),
      desc(games.lastSyncedAt),
    )
    .limit(clampLimit(limit, DEFAULT_COLLECTION_LIMIT, MAX_COLLECTION_LIMIT))

  return rows.map((row) => toPopularGame(row.game))
}

function buildFacetOptions({
  facetType,
  limit,
  rows,
}: {
  facetType: PopularFacetType
  limit: number
  rows: RankedGameRow[]
}): PopularFacetOption[] {
  const optionsBySlug = new Map<string, PopularFacetOption>()

  for (const row of rows) {
    const values = getFacetValues(row.game, facetType)

    if (values.length === 0) {
      continue
    }

    const weight = Math.max(1, row.libraryCount + row.reviewCount)
    const seenSlugsInGame = new Set<string>()

    for (const value of values) {
      const slug = toFacetSlug(value)

      if (!slug || seenSlugsInGame.has(slug)) {
        continue
      }

      seenSlugsInGame.add(slug)
      const existing = optionsBySlug.get(slug)

      if (!existing) {
        optionsBySlug.set(slug, toPopularFacetOption(value, weight))
        continue
      }

      existing.weight += weight
    }
  }

  const options = [...optionsBySlug.values()]
    .sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight
      }

      return a.label.localeCompare(b.label)
    })
    .slice(0, limit)

  if (options.length > 0) {
    return options
  }

  return getFallbackFacetOptions(facetType).slice(0, limit)
}

function filterGamesByFacet({
  facetSlug,
  facetType,
  limit,
  rows,
}: {
  facetSlug: string
  facetType: PopularFacetType
  limit: number
  rows: RankedGameRow[]
}): PopularGame[] {
  const filtered: PopularGame[] = []

  for (const row of rows) {
    const matches = getFacetValues(row.game, facetType).some(
      (value) => toFacetSlug(value) === facetSlug,
    )

    if (!matches) {
      continue
    }

    filtered.push(toPopularGame(row.game))

    if (filtered.length >= limit) {
      break
    }
  }

  return filtered
}

export async function getPopularCollections({
  collectionLimit,
  facetOptionsLimit,
  userId,
}: {
  collectionLimit?: number
  facetOptionsLimit?: number
  userId: string
}): Promise<PopularCollectionsResult> {
  const safeCollectionLimit = clampLimit(
    collectionLimit,
    DEFAULT_COLLECTION_LIMIT,
    MAX_COLLECTION_LIMIT,
  )
  const safeFacetOptionsLimit = clampLimit(
    facetOptionsLimit,
    DEFAULT_FACET_OPTIONS_LIMIT,
    MAX_FACET_OPTIONS_LIMIT,
  )
  const facetSourceLimit = Math.max(FACET_SOURCE_MIN_LIMIT, safeCollectionLimit * 8)

  const [mostPopularRows, recentlyActiveGames, friendsPopularGames, facetRows] = await Promise.all([
    readRankedGames(safeCollectionLimit),
    readRecentlyActiveGames(safeCollectionLimit),
    readFriendsPopularGames({ limit: safeCollectionLimit, userId }),
    readRankedGames(facetSourceLimit),
  ])

  return {
    mostPopularGames: mostPopularRows.map((row) => toPopularGame(row.game)),
    recentlyActiveGames,
    friendsPopularGames,
    platformOptions: buildFacetOptions({
      facetType: "platform",
      limit: safeFacetOptionsLimit,
      rows: facetRows,
    }),
    genreOptions: buildFacetOptions({
      facetType: "genre",
      limit: safeFacetOptionsLimit,
      rows: facetRows,
    }),
  }
}

export async function getPopularGamesByFacet({
  facetSlug,
  facetType,
  limit,
}: {
  facetSlug: string
  facetType: PopularFacetType
  limit?: number
}): Promise<PopularFacetGamesResult> {
  const safeLimit = clampLimit(limit, DEFAULT_COLLECTION_LIMIT, MAX_COLLECTION_LIMIT)
  const normalizedFacetSlug = normalizeFacetSlug(facetSlug)

  if (!normalizedFacetSlug) {
    return {
      activeFacet: null,
      games: [],
      options: getFallbackFacetOptions(facetType),
    }
  }

  const sourceLimit = Math.max(FACET_SOURCE_MIN_LIMIT, safeLimit * 10)
  const rows = await readRankedGames(sourceLimit)
  const options = buildFacetOptions({
    facetType,
    limit: DEFAULT_FACET_OPTIONS_LIMIT,
    rows,
  })
  const activeFacet = options.find((option) => option.slug === normalizedFacetSlug) ?? null

  if (!activeFacet) {
    return {
      activeFacet: null,
      games: [],
      options,
    }
  }

  return {
    activeFacet,
    games: filterGamesByFacet({
      facetSlug: normalizedFacetSlug,
      facetType,
      limit: safeLimit,
      rows,
    }),
    options,
  }
}
