import { and, asc, gte, lt } from "drizzle-orm"

import { db } from "@/server/db"
import { games } from "@/server/db/schema"
import { upsertIgdbGames } from "@/server/games/search-games"
import { getIgdbUpcomingGamesByDateRange } from "@/server/igdb/client"

const DEFAULT_LIMIT = 9
const MAX_LIMIT = 24
const DEFAULT_SYNC_TTL_HOURS = 24

export type UpcomingRelease = {
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

export type UpcomingReleasesResult = {
  generalReleases: UpcomingRelease[]
  monthReleases: UpcomingRelease[]
  weekReleases: UpcomingRelease[]
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit) || !limit) {
    return DEFAULT_LIMIT
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT)
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

function toIsoString(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

function toUpcomingRelease(game: typeof games.$inferSelect): UpcomingRelease {
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

function hasStaleEntries(rows: Array<typeof games.$inferSelect>): boolean {
  const now = Date.now()
  const syncTtlMs = getSyncTtlMs()

  return rows.some((row) => now - row.lastSyncedAt.getTime() > syncTtlMs)
}

function toMonthWindow(referenceDate: Date): { end: Date; start: Date } {
  const year = referenceDate.getUTCFullYear()
  const month = referenceDate.getUTCMonth()

  return {
    start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0)),
  }
}

function toUtcDayStart(referenceDate: Date): Date {
  return new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  )
}

function addUtcDays(date: Date, daysToAdd: number): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  return new Date(Date.UTC(year, month, day + daysToAdd, 0, 0, 0, 0))
}

function getCurrentWeekEnd(referenceDate: Date): Date {
  const dayStart = toUtcDayStart(referenceDate)
  const weekday = dayStart.getUTCDay()
  const mondayOffset = (weekday + 6) % 7
  const weekStart = addUtcDays(dayStart, -mondayOffset)

  return addUtcDays(weekStart, 7)
}

function addUtcMonths(date: Date, monthsToAdd: number): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const seconds = date.getUTCSeconds()
  const milliseconds = date.getUTCMilliseconds()

  return new Date(
    Date.UTC(year, month + monthsToAdd, day, hours, minutes, seconds, milliseconds),
  )
}

async function readLocalReleasesInRange({
  end,
  limit,
  start,
}: {
  end: Date
  limit: number
  start: Date
}): Promise<Array<typeof games.$inferSelect>> {
  return db
    .select()
    .from(games)
    .where(and(gte(games.firstReleaseDate, start), lt(games.firstReleaseDate, end)))
    .orderBy(asc(games.firstReleaseDate), asc(games.name))
    .limit(limit)
}

async function readLocalFutureReleases({
  from,
  limit,
}: {
  from: Date
  limit: number
}): Promise<Array<typeof games.$inferSelect>> {
  return db
    .select()
    .from(games)
    .where(gte(games.firstReleaseDate, from))
    .orderBy(asc(games.firstReleaseDate), asc(games.name))
    .limit(limit)
}

async function syncReleasesFromIgdb({
  end,
  limit,
  start,
}: {
  end: Date
  limit: number
  start: Date
}): Promise<void> {
  try {
    const igdbResults = await getIgdbUpcomingGamesByDateRange({
      fromUnixSeconds: Math.floor(start.getTime() / 1_000),
      limit,
      toUnixSeconds: Math.floor(end.getTime() / 1_000),
    })

    await upsertIgdbGames(igdbResults)
  } catch (error) {
    console.error("[games] Failed to sync upcoming releases from IGDB", {
      end: end.toISOString(),
      error,
      start: start.toISOString(),
    })
  }
}

async function getRangeReleases({
  end,
  limit,
  start,
  syncLimit,
}: {
  end: Date
  limit: number
  start: Date
  syncLimit: number
}): Promise<Array<typeof games.$inferSelect>> {
  let rows = await readLocalReleasesInRange({
    end,
    limit,
    start,
  })

  if (rows.length < limit || hasStaleEntries(rows)) {
    await syncReleasesFromIgdb({
      end,
      limit: syncLimit,
      start,
    })

    rows = await readLocalReleasesInRange({
      end,
      limit,
      start,
    })
  }

  return rows
}

export async function getUpcomingReleases({
  limit,
  referenceDate,
}: {
  limit?: number
  referenceDate?: Date
} = {}): Promise<UpcomingReleasesResult> {
  const cappedLimit = clampLimit(limit)
  const now = referenceDate ?? new Date()
  const todayStart = toUtcDayStart(now)
  const weekEnd = getCurrentWeekEnd(now)
  const monthWindow = toMonthWindow(now)
  const generalStart = monthWindow.end
  const generalEnd = addUtcMonths(monthWindow.end, 6)
  const monthQueryLimit = cappedLimit * 3
  const generalQueryLimit = cappedLimit * 4

  const weekRows = await getRangeReleases({
    end: weekEnd,
    limit: cappedLimit,
    start: todayStart,
    syncLimit: Math.max(cappedLimit * 4, 36),
  })

  const monthRows = await getRangeReleases({
    end: monthWindow.end,
    limit: monthQueryLimit,
    start: todayStart,
    syncLimit: Math.max(monthQueryLimit * 4, 42),
  })

  let generalRows = await readLocalFutureReleases({
    from: generalStart,
    limit: generalQueryLimit,
  })

  if (generalRows.length < generalQueryLimit || hasStaleEntries(generalRows)) {
    await syncReleasesFromIgdb({
      end: generalEnd,
      limit: Math.max(generalQueryLimit * 3, 54),
      start: generalStart,
    })

    generalRows = await readLocalFutureReleases({
      from: generalStart,
      limit: generalQueryLimit,
    })
  }

  const weekIds = new Set(weekRows.map((row) => row.igdbId))
  const monthRowsWithoutWeek = monthRows.filter((row) => !weekIds.has(row.igdbId))
  const monthIds = new Set(monthRowsWithoutWeek.map((row) => row.igdbId))
  const generalRowsWithoutDuplicates = generalRows.filter(
    (row) => !weekIds.has(row.igdbId) && !monthIds.has(row.igdbId),
  )

  return {
    weekReleases: weekRows.map(toUpcomingRelease),
    monthReleases: monthRowsWithoutWeek.slice(0, cappedLimit).map(toUpcomingRelease),
    generalReleases: generalRowsWithoutDuplicates
      .slice(0, cappedLimit)
      .map(toUpcomingRelease),
  }
}
