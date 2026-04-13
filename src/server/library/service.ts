import { and, desc, eq, like, or, sql } from "drizzle-orm"

import { db } from "@/server/db"
import { games, libraryEntries, reviews } from "@/server/db/schema"
import {
  parseLibrarySort,
  parseOptionalLibraryState,
  parseLibraryPage,
  normalizeLibrarySearch,
  type LibrarySort,
} from "@/server/library/validation"
import { type LibraryState } from "@/server/library/states"
import { getGameRowByIgdbId } from "@/server/games/get-game-row-by-igdb-id"
import { fromRecommendBoolean } from "@/server/reviews/constants"

export const LIBRARY_PAGE_SIZE = 20

export type LibraryListItem = {
  entryId: number
  state: LibraryState
  createdAt: string
  updatedAt: string
  game: {
    igdbId: number
    slug: string
    name: string
    summary: string | null
    coverUrl: string | null
    firstReleaseDate: string | null
    rating: number | null
    platforms: string[]
    genres: string[]
  }
  review: {
    id: number
    recommend: "recommend" | "not_recommend"
  } | null
}

export type UserLibraryResult = {
  items: LibraryListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
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

function resolveSortOrder(sort: LibrarySort) {
  if (sort === "release_desc") {
    return [desc(games.firstReleaseDate), desc(libraryEntries.updatedAt)] as const
  }

  if (sort === "rating_desc") {
    return [desc(games.rating), desc(libraryEntries.updatedAt)] as const
  }

  return [desc(libraryEntries.updatedAt)] as const
}

function toLibraryItem(row: {
  entry: typeof libraryEntries.$inferSelect
  game: typeof games.$inferSelect
  review: typeof reviews.$inferSelect | null
}): LibraryListItem {
  return {
    entryId: row.entry.id,
    state: row.entry.state as LibraryState,
    createdAt: row.entry.createdAt.toISOString(),
    updatedAt: row.entry.updatedAt.toISOString(),
    game: {
      igdbId: row.game.igdbId,
      slug: row.game.slug,
      name: row.game.name,
      summary: row.game.summary,
      coverUrl: row.game.coverUrl,
      firstReleaseDate: toIsoString(row.game.firstReleaseDate),
      rating: row.game.rating,
      platforms: safeParseStringArray(row.game.platforms),
      genres: safeParseStringArray(row.game.genres),
    },
    review: row.review
      ? {
          id: row.review.id,
          recommend: fromRecommendBoolean(row.review.recommend),
        }
      : null,
  }
}

export async function getUserLibrary(input: {
  page?: unknown
  search?: unknown
  sort?: unknown
  state?: unknown
  userId: string
}): Promise<UserLibraryResult> {
  const page = parseLibraryPage(input.page)
  const sort = parseLibrarySort(input.sort)
  const search = normalizeLibrarySearch(input.search)
  const state = parseOptionalLibraryState(input.state)

  const filters = [eq(libraryEntries.userId, input.userId)]

  if (state) {
    filters.push(eq(libraryEntries.state, state))
  }

  if (search.length > 0) {
    const searchPattern = `%${search}%`
    const searchFilter = or(like(games.name, searchPattern), like(games.slug, searchPattern))

    if (searchFilter) {
      filters.push(searchFilter)
    }
  }

  const whereClause = and(...filters) ?? eq(libraryEntries.userId, input.userId)
  const offset = (page - 1) * LIBRARY_PAGE_SIZE

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .where(whereClause)

  const totalItems = Number(countRows[0]?.count ?? 0)
  const totalPages = Math.max(Math.ceil(totalItems / LIBRARY_PAGE_SIZE), 1)

  const rows = await db
    .select({
      entry: libraryEntries,
      game: games,
      review: reviews,
    })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .leftJoin(
      reviews,
      and(eq(reviews.gameId, games.id), eq(reviews.userId, libraryEntries.userId)),
    )
    .where(whereClause)
    .orderBy(...resolveSortOrder(sort))
    .limit(LIBRARY_PAGE_SIZE)
    .offset(offset)

  return {
    items: rows.map(toLibraryItem),
    page,
    pageSize: LIBRARY_PAGE_SIZE,
    totalItems,
    totalPages,
  }
}

export async function addGameToLibrary(input: {
  gameIgdbId: number
  state: LibraryState
  userId: string
}): Promise<LibraryListItem | null> {
  const game = await getGameRowByIgdbId(input.gameIgdbId)

  if (!game) {
    return null
  }

  await db
    .insert(libraryEntries)
    .values({
      gameId: game.id,
      userId: input.userId,
      state: input.state,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [libraryEntries.userId, libraryEntries.gameId],
      set: {
        state: input.state,
        updatedAt: sql`(unixepoch())`,
      },
    })

  const rows = await db
    .select({
      entry: libraryEntries,
      game: games,
      review: reviews,
    })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .leftJoin(
      reviews,
      and(eq(reviews.gameId, games.id), eq(reviews.userId, libraryEntries.userId)),
    )
    .where(and(eq(libraryEntries.userId, input.userId), eq(games.id, game.id)))
    .limit(1)

  const row = rows[0]

  return row ? toLibraryItem(row) : null
}

export async function updateLibraryEntryState(input: {
  entryId: number
  state: LibraryState
  userId: string
}): Promise<LibraryListItem | null> {
  await db
    .update(libraryEntries)
    .set({
      state: input.state,
      updatedAt: new Date(),
    })
    .where(and(eq(libraryEntries.id, input.entryId), eq(libraryEntries.userId, input.userId)))

  const rows = await db
    .select({
      entry: libraryEntries,
      game: games,
      review: reviews,
    })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .leftJoin(
      reviews,
      and(eq(reviews.gameId, games.id), eq(reviews.userId, libraryEntries.userId)),
    )
    .where(and(eq(libraryEntries.id, input.entryId), eq(libraryEntries.userId, input.userId)))
    .limit(1)

  const row = rows[0]

  return row ? toLibraryItem(row) : null
}

export async function getUserLibraryEntryForGame(input: {
  gameIgdbId: number
  userId: string
}): Promise<LibraryListItem | null> {
  const rows = await db
    .select({
      entry: libraryEntries,
      game: games,
      review: reviews,
    })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .leftJoin(
      reviews,
      and(eq(reviews.gameId, games.id), eq(reviews.userId, libraryEntries.userId)),
    )
    .where(and(eq(libraryEntries.userId, input.userId), eq(games.igdbId, input.gameIgdbId)))
    .limit(1)

  const row = rows[0]

  return row ? toLibraryItem(row) : null
}
