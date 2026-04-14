import { eq, sql } from "drizzle-orm"

import { db } from "@/server/db"
import { games } from "@/server/db/schema"
import {
  getIgdbGameById,
  toCoverImageUrl,
  type IgdbGame,
} from "@/server/igdb/client"

const DEFAULT_SYNC_TTL_HOURS = 24

export type GameDetails = {
  coverUrl: string | null
  firstReleaseDate: string | null
  genres: string[]
  igdbId: number
  lastSyncedAt: string
  name: string
  platforms: string[]
  rating: number | null
  timeToBeatCompletionistSeconds: number | null
  timeToBeatMainSeconds: number | null
  similarGames: Array<{
    igdbId: number
    name: string
    slug: string
    coverUrl: string | null
    rating: number | null
    firstReleaseDate: string | null
  }>
  slug: string
  summary: string | null
}

function getSyncTtlMs(): number {
  const rawHours = Number(process.env.IGDB_SYNC_TTL_HOURS)

  if (!Number.isFinite(rawHours) || rawHours <= 0) {
    return DEFAULT_SYNC_TTL_HOURS * 60 * 60 * 1_000
  }

  return rawHours * 60 * 60 * 1_000
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

function safeParseSimilarGames(
  value: string,
): Array<{
  igdbId: number
  name: string
  slug: string
  coverUrl: string | null
  rating: number | null
  firstReleaseDate: string | null
}> {
  try {
    const parsed = JSON.parse(value) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (
          entry,
        ): entry is {
          igdbId: number
          name: string
          slug: string
          coverUrl: string | null
          rating: number | null
          firstReleaseDate: string | null
        } =>
          typeof entry === "object" &&
          entry !== null &&
          Number.isInteger(entry.igdbId) &&
          typeof entry.name === "string" &&
          typeof entry.slug === "string" &&
          (typeof entry.coverUrl === "string" || entry.coverUrl === null) &&
          (typeof entry.rating === "number" || entry.rating === null) &&
          (typeof entry.firstReleaseDate === "string" || entry.firstReleaseDate === null),
      )
      .slice(0, 6)
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

function toGameDetails(game: typeof games.$inferSelect): GameDetails {
  return {
    igdbId: game.igdbId,
    slug: game.slug,
    name: game.name,
    summary: game.summary,
    coverUrl: game.coverUrl,
    firstReleaseDate: toIsoString(game.firstReleaseDate),
    rating: game.rating,
    timeToBeatMainSeconds: game.timeToBeatMainSeconds,
    timeToBeatCompletionistSeconds: game.timeToBeatCompletionistSeconds,
    platforms: safeParseStringArray(game.platforms),
    genres: safeParseStringArray(game.genres),
    similarGames: safeParseSimilarGames(game.similarGames),
    lastSyncedAt: game.lastSyncedAt.toISOString(),
  }
}

function toGameDetailsFromIgdbGame(game: IgdbGame): GameDetails {
  const nowIso = new Date().toISOString()

  return {
    igdbId: game.id,
    slug: game.slug,
    name: game.name,
    summary: game.summary?.trim() || null,
    coverUrl: toCoverImageUrl(game.cover?.url),
    firstReleaseDate: toIsoString(toDateFromUnixSeconds(game.first_release_date)),
    rating: typeof game.rating === "number" ? game.rating : null,
    timeToBeatMainSeconds:
      typeof game.time_to_beat?.normally === "number"
        ? game.time_to_beat.normally
        : null,
    timeToBeatCompletionistSeconds:
      typeof game.time_to_beat?.completely === "number"
        ? game.time_to_beat.completely
        : null,
    platforms: uniqueNonEmptyValues(
      game.platforms?.map((platform) => platform.abbreviation ?? platform.name) ?? [],
    ),
    genres: uniqueNonEmptyValues(game.genres?.map((genre) => genre.name) ?? []),
    similarGames: (game.similar_games ?? [])
      .filter((similarGame) => Boolean(similarGame.id && similarGame.name && similarGame.slug))
      .slice(0, 6)
      .map((similarGame) => ({
        igdbId: similarGame.id,
        name: similarGame.name?.trim() ?? "",
        slug: similarGame.slug?.trim() ?? "",
        coverUrl: toCoverImageUrl(similarGame.cover?.url),
        rating: typeof similarGame.rating === "number" ? similarGame.rating : null,
        firstReleaseDate: toIsoString(
          toDateFromUnixSeconds(similarGame.first_release_date),
        ),
      })),
    lastSyncedAt: nowIso,
  }
}

function isStale(lastSyncedAt: Date): boolean {
  return Date.now() - lastSyncedAt.getTime() > getSyncTtlMs()
}

async function readLocalGame(igdbId: number): Promise<typeof games.$inferSelect | null> {
  const rows = await db
    .select()
    .from(games)
    .where(eq(games.igdbId, igdbId))
    .limit(1)

  return rows[0] ?? null
}

async function upsertIgdbGame(game: IgdbGame): Promise<void> {
  const platforms = uniqueNonEmptyValues(
    game.platforms?.map((platform) => platform.abbreviation ?? platform.name) ?? [],
  )
  const genres = uniqueNonEmptyValues(game.genres?.map((genre) => genre.name) ?? [])

  await db
    .insert(games)
    .values({
      igdbId: game.id,
      slug: game.slug,
      name: game.name,
      summary: game.summary?.trim() || null,
      coverUrl: toCoverImageUrl(game.cover?.url),
      firstReleaseDate: toDateFromUnixSeconds(game.first_release_date),
      rating: typeof game.rating === "number" ? game.rating : null,
      timeToBeatMainSeconds:
        typeof game.time_to_beat?.normally === "number"
          ? game.time_to_beat.normally
          : null,
      timeToBeatCompletionistSeconds:
        typeof game.time_to_beat?.completely === "number"
          ? game.time_to_beat.completely
          : null,
      platforms: JSON.stringify(platforms),
      genres: JSON.stringify(genres),
      similarGames: JSON.stringify(
        (game.similar_games ?? [])
          .filter((similarGame) => Boolean(similarGame.id && similarGame.name && similarGame.slug))
          .slice(0, 6)
          .map((similarGame) => ({
            igdbId: similarGame.id,
            name: similarGame.name?.trim() ?? "",
            slug: similarGame.slug?.trim() ?? "",
            coverUrl: toCoverImageUrl(similarGame.cover?.url),
            rating: typeof similarGame.rating === "number" ? similarGame.rating : null,
            firstReleaseDate: toIsoString(
              toDateFromUnixSeconds(similarGame.first_release_date),
            ),
          })),
      ),
      checksum: game.checksum?.trim() || null,
      igdbUpdatedAt: toDateFromUnixSeconds(game.updated_at),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: games.igdbId,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        summary: sql`excluded.summary`,
        coverUrl: sql`excluded.cover_url`,
        firstReleaseDate: sql`excluded.first_release_date`,
        rating: sql`excluded.rating`,
        timeToBeatMainSeconds: sql`excluded.time_to_beat_main_seconds`,
        timeToBeatCompletionistSeconds: sql`excluded.time_to_beat_completionist_seconds`,
        platforms: sql`excluded.platforms`,
        genres: sql`excluded.genres`,
        similarGames: sql`excluded.similar_games`,
        checksum: sql`excluded.checksum`,
        igdbUpdatedAt: sql`excluded.igdb_updated_at`,
        updatedAt: sql`(unixepoch())`,
        lastSyncedAt: sql`(unixepoch())`,
      },
    })
}

async function refreshFromIgdb(igdbId: number): Promise<GameDetails | null> {
  const igdbGame = await getIgdbGameById(igdbId)

  if (!igdbGame) {
    return null
  }

  await upsertIgdbGame(igdbGame)

  return toGameDetailsFromIgdbGame(igdbGame)
}

export async function getGameByIgdbId(igdbId: number): Promise<GameDetails | null> {
  if (!Number.isInteger(igdbId) || igdbId <= 0) {
    return null
  }

  const localGame = await readLocalGame(igdbId)

  if (localGame && !isStale(localGame.lastSyncedAt)) {
    return toGameDetails(localGame)
  }

  try {
    const refreshed = await refreshFromIgdb(igdbId)

    if (refreshed) {
      return refreshed
    }
  } catch (error) {
    console.error("[games] Failed to refresh game from IGDB", { error, igdbId })
  }

  if (localGame) {
    return toGameDetails(localGame)
  }

  return null
}
