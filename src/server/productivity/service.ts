import { and, desc, eq } from "drizzle-orm"

import { db } from "@/server/db"
import { games, libraryEntries, reviews } from "@/server/db/schema"
import { fromRecommendBoolean } from "@/server/reviews/constants"
import {
  buildProductivityOverview,
  type ProductivityLibraryItem,
  type ProductivityOverview,
} from "@/server/productivity/engine"

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

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function toProductivityLibraryItem(input: {
  entry: typeof libraryEntries.$inferSelect
  game: typeof games.$inferSelect
  review: typeof reviews.$inferSelect | null
}): ProductivityLibraryItem {
  return {
    entryId: input.entry.id,
    game: {
      coverUrl: input.game.coverUrl,
      firstReleaseDate: toIsoString(input.game.firstReleaseDate),
      genres: safeParseStringArray(input.game.genres),
      igdbId: input.game.igdbId,
      name: input.game.name,
      platforms: safeParseStringArray(input.game.platforms),
      rating: input.game.rating,
      slug: input.game.slug,
      summary: input.game.summary,
      timeToBeatMainSeconds: input.game.timeToBeatMainSeconds,
    },
    review: input.review
      ? {
          hoursToComplete: input.review.hoursToComplete,
          recommend: fromRecommendBoolean(input.review.recommend),
        }
      : null,
    state: input.entry.state as ProductivityLibraryItem["state"],
    updatedAt: input.entry.updatedAt.toISOString(),
  }
}

export async function getProductivityOverview(input: {
  now?: Date
  userId: string
}): Promise<ProductivityOverview> {
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
    .where(eq(libraryEntries.userId, input.userId))
    .orderBy(desc(libraryEntries.updatedAt))

  return buildProductivityOverview({
    items: rows.map(toProductivityLibraryItem),
    now: input.now,
  })
}
