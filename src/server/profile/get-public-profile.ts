import { desc, eq, sql } from "drizzle-orm"

import { db } from "@/server/db"
import { games, libraryEntries, reviews, user } from "@/server/db/schema"
import { LIBRARY_STATES, type LibraryState } from "@/server/library/states"
import { fromRecommendBoolean } from "@/server/reviews/constants"

export type PublicProfileData = {
  userId: string
  username: string
  displayName: string
  joinedAt: string
  lastActivityAt: string
  libraryStats: Record<LibraryState, number>
  recentLibrary: Array<{
    entryId: number
    state: LibraryState
    updatedAt: string
    game: {
      igdbId: number
      name: string
      slug: string
      coverUrl: string | null
      platform: string | null
    }
  }>
  recentReviews: Array<{
    id: number
    body: string
    recommend: "recommend" | "not_recommend"
    updatedAt: string
    platformPlayed: string | null
    hoursToComplete: number | null
    game: {
      igdbId: number
      name: string
      slug: string
      coverUrl: string | null
    }
  }>
}

function parseUsername(value: string): string | null {
  const normalized = value.trim().toLowerCase()

  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    return null
  }

  return normalized
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

function resolveLastActivityAt(input: {
  entryDate?: Date
  reviewDate?: Date
  userDate: Date
}): Date {
  const candidates = [input.userDate]

  if (input.entryDate) {
    candidates.push(input.entryDate)
  }

  if (input.reviewDate) {
    candidates.push(input.reviewDate)
  }

  return candidates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  )
}

export async function getPublicProfileByUsername(
  usernameCandidate: string,
): Promise<PublicProfileData | null> {
  const username = parseUsername(usernameCandidate)

  if (!username) {
    return null
  }

  const userRows = await db
    .select()
    .from(user)
    .where(eq(user.username, username))
    .limit(1)

  const profileUser = userRows[0]

  if (!profileUser?.username) {
    return null
  }

  const [statsRows, recentLibraryRows, recentReviewRows, latestLibraryRows, latestReviewRows] =
    await Promise.all([
      db
        .select({
          state: libraryEntries.state,
          count: sql<number>`count(*)`,
        })
        .from(libraryEntries)
        .where(eq(libraryEntries.userId, profileUser.id))
        .groupBy(libraryEntries.state),
      db
        .select({
          entry: libraryEntries,
          game: games,
        })
        .from(libraryEntries)
        .innerJoin(games, eq(libraryEntries.gameId, games.id))
        .where(eq(libraryEntries.userId, profileUser.id))
        .orderBy(desc(libraryEntries.updatedAt))
        .limit(6),
      db
        .select({
          review: reviews,
          game: games,
        })
        .from(reviews)
        .innerJoin(games, eq(reviews.gameId, games.id))
        .where(eq(reviews.userId, profileUser.id))
        .orderBy(desc(reviews.updatedAt))
        .limit(6),
      db
        .select({ updatedAt: libraryEntries.updatedAt })
        .from(libraryEntries)
        .where(eq(libraryEntries.userId, profileUser.id))
        .orderBy(desc(libraryEntries.updatedAt))
        .limit(1),
      db
        .select({ updatedAt: reviews.updatedAt })
        .from(reviews)
        .where(eq(reviews.userId, profileUser.id))
        .orderBy(desc(reviews.updatedAt))
        .limit(1),
    ])

  const libraryStats = Object.fromEntries(
    LIBRARY_STATES.map((state) => [state, 0]),
  ) as Record<LibraryState, number>

  for (const row of statsRows) {
    const state = row.state as LibraryState

    if (state in libraryStats) {
      libraryStats[state] = Number(row.count)
    }
  }

  const lastActivityAt = resolveLastActivityAt({
    userDate: profileUser.updatedAt,
    entryDate: latestLibraryRows[0]?.updatedAt,
    reviewDate: latestReviewRows[0]?.updatedAt,
  })

  return {
    userId: profileUser.id,
    username: profileUser.username,
    displayName: profileUser.displayUsername ?? profileUser.username,
    joinedAt: profileUser.createdAt.toISOString(),
    lastActivityAt: lastActivityAt.toISOString(),
    libraryStats,
    recentLibrary: recentLibraryRows.map((row) => ({
      entryId: row.entry.id,
      state: row.entry.state as LibraryState,
      updatedAt: row.entry.updatedAt.toISOString(),
      game: {
        igdbId: row.game.igdbId,
        name: row.game.name,
        slug: row.game.slug,
        coverUrl: row.game.coverUrl,
        platform: safeParseStringArray(row.game.platforms)[0] ?? null,
      },
    })),
    recentReviews: recentReviewRows.map((row) => ({
      id: row.review.id,
      body: row.review.body,
      recommend: fromRecommendBoolean(row.review.recommend),
      updatedAt: row.review.updatedAt.toISOString(),
      platformPlayed: row.review.platformPlayed,
      hoursToComplete: row.review.hoursToComplete,
      game: {
        igdbId: row.game.igdbId,
        name: row.game.name,
        slug: row.game.slug,
        coverUrl: row.game.coverUrl,
      },
    })),
  }
}
