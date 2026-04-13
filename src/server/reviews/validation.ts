import {
  parseReviewRecommend,
  type ReviewRecommend,
} from "@/server/reviews/constants"

export const REVIEW_BODY_MAX_LENGTH = 500

export type ValidatedReviewInput = {
  body: string
  hoursToComplete: number | null
  platformPlayed: string | null
  recommend: ReviewRecommend
}

export function parseReviewBody(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()

  if (normalized.length < 1 || normalized.length > REVIEW_BODY_MAX_LENGTH) {
    return null
  }

  return normalized
}

export function parseReviewHours(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null
  }

  return parsed
}

export function parseReviewPlatform(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()

  if (normalized.length < 1 || normalized.length > 60) {
    return null
  }

  return normalized
}

export function validateReviewInput(input: {
  body: unknown
  hoursToComplete: unknown
  platformPlayed: unknown
  recommend: unknown
}): ValidatedReviewInput | null {
  const body = parseReviewBody(input.body)
  const recommend = parseReviewRecommend(input.recommend)

  if (!body || !recommend) {
    return null
  }

  const platformPlayed = parseReviewPlatform(input.platformPlayed)

  if (input.platformPlayed && !platformPlayed) {
    return null
  }

  const hoursToComplete = parseReviewHours(input.hoursToComplete)

  if (input.hoursToComplete && input.hoursToComplete !== "" && !hoursToComplete) {
    return null
  }

  return {
    body,
    recommend,
    platformPlayed,
    hoursToComplete,
  }
}
