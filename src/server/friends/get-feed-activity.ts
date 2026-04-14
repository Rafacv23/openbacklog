import { desc, eq, inArray } from "drizzle-orm"

import { db } from "@/server/db"
import { friendships, games, libraryEntries, reviews, user } from "@/server/db/schema"
import type { LibraryState } from "@/server/library/states"
import { fromRecommendBoolean } from "@/server/reviews/constants"

const DEFAULT_FEED_LIMIT = 12
const MAX_FEED_LIMIT = 40

export type FriendFeedEvent =
  | {
      id: string
      kind: "library_update"
      updatedAt: string
      actor: {
        userId: string
        username: string
        displayName: string
      }
      game: {
        igdbId: number
        name: string
      }
      state: LibraryState
    }
  | {
      id: string
      kind: "review"
      updatedAt: string
      actor: {
        userId: string
        username: string
        displayName: string
      }
      game: {
        igdbId: number
        name: string
      }
      recommend: "recommend" | "not_recommend"
    }

function clampLimit(limit: unknown): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_FEED_LIMIT
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_FEED_LIMIT)
}

function toDisplayName(input: { displayUsername: string | null; username: string }) {
  return input.displayUsername ?? input.username
}

export async function getFriendFeedActivity(input: {
  userId: string
  limit?: number
}): Promise<FriendFeedEvent[]> {
  const safeLimit = clampLimit(input.limit)

  const followRows = await db
    .select({
      followedUserId: friendships.addresseeUserId,
    })
    .from(friendships)
    .where(eq(friendships.requesterUserId, input.userId))

  const followedUserIds = [...new Set(followRows.map((row) => row.followedUserId))].slice(0, 250)

  if (followedUserIds.length === 0) {
    return []
  }

  const expandedLimit = Math.min(safeLimit * 3, MAX_FEED_LIMIT * 3)

  const [libraryRows, reviewRows] = await Promise.all([
    db
      .select({
        entry: libraryEntries,
        game: games,
        actor: user,
      })
      .from(libraryEntries)
      .innerJoin(games, eq(libraryEntries.gameId, games.id))
      .innerJoin(user, eq(libraryEntries.userId, user.id))
      .where(inArray(libraryEntries.userId, followedUserIds))
      .orderBy(desc(libraryEntries.updatedAt))
      .limit(expandedLimit),
    db
      .select({
        review: reviews,
        game: games,
        actor: user,
      })
      .from(reviews)
      .innerJoin(games, eq(reviews.gameId, games.id))
      .innerJoin(user, eq(reviews.userId, user.id))
      .where(inArray(reviews.userId, followedUserIds))
      .orderBy(desc(reviews.updatedAt))
      .limit(expandedLimit),
  ])

  const mergedEvents: FriendFeedEvent[] = []

  for (const row of libraryRows) {
    if (!row.actor.username) {
      continue
    }

    mergedEvents.push({
      id: `library-${row.entry.id}`,
      kind: "library_update",
      updatedAt: row.entry.updatedAt.toISOString(),
      actor: {
        userId: row.actor.id,
        username: row.actor.username,
        displayName: toDisplayName({
          displayUsername: row.actor.displayUsername,
          username: row.actor.username,
        }),
      },
      game: {
        igdbId: row.game.igdbId,
        name: row.game.name,
      },
      state: row.entry.state as LibraryState,
    })
  }

  for (const row of reviewRows) {
    if (!row.actor.username) {
      continue
    }

    mergedEvents.push({
      id: `review-${row.review.id}`,
      kind: "review",
      updatedAt: row.review.updatedAt.toISOString(),
      actor: {
        userId: row.actor.id,
        username: row.actor.username,
        displayName: toDisplayName({
          displayUsername: row.actor.displayUsername,
          username: row.actor.username,
        }),
      },
      game: {
        igdbId: row.game.igdbId,
        name: row.game.name,
      },
      recommend: fromRecommendBoolean(row.review.recommend),
    })
  }

  return mergedEvents
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, safeLimit)
}
