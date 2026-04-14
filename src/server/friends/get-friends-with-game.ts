import { and, desc, eq, ne, or } from "drizzle-orm"

import { db } from "@/server/db"
import { friendships, games, libraryEntries, user } from "@/server/db/schema"
import type { LibraryState } from "@/server/library/states"

export type FriendWithGame = {
  userId: string
  username: string
  displayName: string
  state: LibraryState
}

export async function getFriendsWithGame(input: {
  userId: string
  gameIgdbId: number
  limit?: number
}): Promise<FriendWithGame[]> {
  if (!Number.isInteger(input.gameIgdbId) || input.gameIgdbId <= 0) {
    return []
  }

  const rawLimit = input.limit
  const safeLimit =
    typeof rawLimit === "number" && Number.isInteger(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 20)
    : 8

  const rows = await db
    .select({
      entry: libraryEntries,
      friendUser: user,
    })
    .from(libraryEntries)
    .innerJoin(games, eq(libraryEntries.gameId, games.id))
    .innerJoin(user, eq(libraryEntries.userId, user.id))
    .innerJoin(
      friendships,
      and(
        eq(friendships.status, "accepted"),
        or(
          and(
            eq(friendships.requesterUserId, input.userId),
            eq(friendships.addresseeUserId, libraryEntries.userId),
          ),
          and(
            eq(friendships.addresseeUserId, input.userId),
            eq(friendships.requesterUserId, libraryEntries.userId),
          ),
        ),
      ),
    )
    .where(and(eq(games.igdbId, input.gameIgdbId), ne(libraryEntries.userId, input.userId)))
    .orderBy(desc(libraryEntries.updatedAt))
    .limit(safeLimit)

  const deduplicated = new Map<string, FriendWithGame>()

  for (const row of rows) {
    if (!row.friendUser.username) {
      continue
    }

    if (deduplicated.has(row.friendUser.id)) {
      continue
    }

    deduplicated.set(row.friendUser.id, {
      userId: row.friendUser.id,
      username: row.friendUser.username,
      displayName: row.friendUser.displayUsername ?? row.friendUser.username,
      state: row.entry.state as LibraryState,
    })
  }

  return [...deduplicated.values()]
}
