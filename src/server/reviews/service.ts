import { and, desc, eq, sql } from "drizzle-orm"

import { db } from "@/server/db"
import { games, reviews, user } from "@/server/db/schema"
import { getGameRowByIgdbId } from "@/server/games/get-game-row-by-igdb-id"
import {
  fromRecommendBoolean,
  toRecommendBoolean,
  type ReviewRecommend,
} from "@/server/reviews/constants"
import { validateReviewInput } from "@/server/reviews/validation"

export type UserReview = {
  id: number
  gameIgdbId: number
  userId: string
  body: string
  containsSpoilers: boolean
  recommend: ReviewRecommend
  platformPlayed: string | null
  hoursToComplete: number | null
  createdAt: string
  updatedAt: string
}

export type PublicReviewDetails = {
  id: number
  body: string
  containsSpoilers: boolean
  recommend: ReviewRecommend
  platformPlayed: string | null
  hoursToComplete: number | null
  createdAt: string
  updatedAt: string
  author: {
    username: string
    displayName: string
  }
  game: {
    igdbId: number
    name: string
    slug: string
    summary: string | null
    coverUrl: string | null
    firstReleaseDate: string | null
    rating: number | null
    platforms: string[]
    genres: string[]
  }
}

export type GameReviewListItem = {
  id: number
  body: string
  containsSpoilers: boolean
  recommend: ReviewRecommend
  platformPlayed: string | null
  hoursToComplete: number | null
  createdAt: string
  updatedAt: string
  author: {
    username: string
    displayName: string
  }
}

export type UpsertReviewResult =
  | { status: "ok"; review: UserReview }
  | { status: "invalid_game" }
  | { status: "invalid_payload" }
  | { status: "invalid_platform" }

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

function toUserReview(row: typeof reviews.$inferSelect & { gameIgdbId: number }): UserReview {
  return {
    id: row.id,
    gameIgdbId: row.gameIgdbId,
    userId: row.userId,
    body: row.body,
    containsSpoilers: row.containsSpoilers,
    recommend: fromRecommendBoolean(row.recommend),
    platformPlayed: row.platformPlayed,
    hoursToComplete: row.hoursToComplete,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function isAllowedPlatform(
  platformPlayed: string | null,
  gamePlatforms: string[],
): boolean {
  if (!platformPlayed) {
    return true
  }

  if (platformPlayed === "Other") {
    return true
  }

  return gamePlatforms.includes(platformPlayed)
}

export async function upsertReviewForGame(input: {
  body: unknown
  containsSpoilers: unknown
  gameIgdbId: number
  hoursToComplete: unknown
  platformPlayed: unknown
  recommend: unknown
  userId: string
}): Promise<UpsertReviewResult> {
  const game = await getGameRowByIgdbId(input.gameIgdbId)

  if (!game) {
    return { status: "invalid_game" }
  }

  const validatedInput = validateReviewInput({
    body: input.body,
    containsSpoilers: input.containsSpoilers,
    recommend: input.recommend,
    platformPlayed: input.platformPlayed,
    hoursToComplete: input.hoursToComplete,
  })

  if (!validatedInput) {
    return { status: "invalid_payload" }
  }

  const gamePlatforms = safeParseStringArray(game.platforms)

  if (!isAllowedPlatform(validatedInput.platformPlayed, gamePlatforms)) {
    return { status: "invalid_platform" }
  }

  await db
    .insert(reviews)
    .values({
      userId: input.userId,
      gameId: game.id,
      body: validatedInput.body,
      recommend: toRecommendBoolean(validatedInput.recommend),
      containsSpoilers: validatedInput.containsSpoilers,
      platformPlayed: validatedInput.platformPlayed,
      hoursToComplete: validatedInput.hoursToComplete,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [reviews.userId, reviews.gameId],
      set: {
        body: sql`excluded.body`,
        recommend: sql`excluded.recommend`,
        containsSpoilers: sql`excluded.contains_spoilers`,
        platformPlayed: sql`excluded.platform_played`,
        hoursToComplete: sql`excluded.hours_to_complete`,
        updatedAt: sql`(unixepoch())`,
      },
    })

  const rows = await db
    .select({
      review: reviews,
      gameIgdbId: games.igdbId,
    })
    .from(reviews)
    .innerJoin(games, eq(reviews.gameId, games.id))
    .where(and(eq(reviews.userId, input.userId), eq(games.id, game.id)))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return { status: "invalid_payload" }
  }

  return {
    status: "ok",
    review: toUserReview({
      ...row.review,
      gameIgdbId: row.gameIgdbId,
    }),
  }
}

export async function getUserReviewForGame(input: {
  gameIgdbId: number
  userId: string
}): Promise<UserReview | null> {
  const rows = await db
    .select({
      review: reviews,
      gameIgdbId: games.igdbId,
    })
    .from(reviews)
    .innerJoin(games, eq(reviews.gameId, games.id))
    .where(and(eq(reviews.userId, input.userId), eq(games.igdbId, input.gameIgdbId)))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  return toUserReview({
    ...row.review,
    gameIgdbId: row.gameIgdbId,
  })
}

export async function getRecentReviewsByUser(input: {
  limit: number
  userId: string
}): Promise<UserReview[]> {
  const rows = await db
    .select({
      review: reviews,
      gameIgdbId: games.igdbId,
    })
    .from(reviews)
    .innerJoin(games, eq(reviews.gameId, games.id))
    .where(eq(reviews.userId, input.userId))
    .orderBy(desc(reviews.updatedAt))
    .limit(input.limit)

  return rows.map((row) =>
    toUserReview({
      ...row.review,
      gameIgdbId: row.gameIgdbId,
    }),
  )
}

export async function getPublicReviewById(reviewId: number): Promise<PublicReviewDetails | null> {
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return null
  }

  const rows = await db
    .select({
      review: reviews,
      game: games,
      author: user,
    })
    .from(reviews)
    .innerJoin(games, eq(reviews.gameId, games.id))
    .innerJoin(user, eq(reviews.userId, user.id))
    .where(eq(reviews.id, reviewId))
    .limit(1)

  const row = rows[0]

  if (!row || !row.author.username) {
    return null
  }

  return {
    id: row.review.id,
    body: row.review.body,
    containsSpoilers: row.review.containsSpoilers,
    recommend: fromRecommendBoolean(row.review.recommend),
    platformPlayed: row.review.platformPlayed,
    hoursToComplete: row.review.hoursToComplete,
    createdAt: row.review.createdAt.toISOString(),
    updatedAt: row.review.updatedAt.toISOString(),
    author: {
      username: row.author.username,
      displayName: row.author.displayUsername ?? row.author.username,
    },
    game: {
      igdbId: row.game.igdbId,
      name: row.game.name,
      slug: row.game.slug,
      summary: row.game.summary,
      coverUrl: row.game.coverUrl,
      firstReleaseDate: toIsoString(row.game.firstReleaseDate),
      rating: row.game.rating,
      platforms: safeParseStringArray(row.game.platforms),
      genres: safeParseStringArray(row.game.genres),
    },
  }
}

export async function getRecentReviewsForGame(input: {
  gameIgdbId: number
  limit: number
}): Promise<GameReviewListItem[]> {
  if (!Number.isInteger(input.gameIgdbId) || input.gameIgdbId <= 0) {
    return []
  }

  const safeLimit = Number.isInteger(input.limit)
    ? Math.min(Math.max(input.limit, 1), 30)
    : 10

  const rows = await db
    .select({
      review: reviews,
      author: user,
    })
    .from(reviews)
    .innerJoin(games, eq(reviews.gameId, games.id))
    .innerJoin(user, eq(reviews.userId, user.id))
    .where(eq(games.igdbId, input.gameIgdbId))
    .orderBy(desc(reviews.updatedAt))
    .limit(safeLimit)

  return rows
    .filter((row) => Boolean(row.author.username))
    .map((row) => ({
      id: row.review.id,
      body: row.review.body,
      containsSpoilers: row.review.containsSpoilers,
      recommend: fromRecommendBoolean(row.review.recommend),
      platformPlayed: row.review.platformPlayed,
      hoursToComplete: row.review.hoursToComplete,
      createdAt: row.review.createdAt.toISOString(),
      updatedAt: row.review.updatedAt.toISOString(),
      author: {
        username: row.author.username!,
        displayName: row.author.displayUsername ?? row.author.username!,
      },
    }))
}
