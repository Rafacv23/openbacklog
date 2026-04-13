export const REVIEW_RECOMMEND_VALUES = ["recommend", "not_recommend"] as const

export type ReviewRecommend = (typeof REVIEW_RECOMMEND_VALUES)[number]

const REVIEW_RECOMMEND_SET = new Set<string>(REVIEW_RECOMMEND_VALUES)

export function isReviewRecommend(value: string): value is ReviewRecommend {
  return REVIEW_RECOMMEND_SET.has(value)
}

export function parseReviewRecommend(value: unknown): ReviewRecommend | null {
  if (typeof value !== "string") {
    return null
  }

  return isReviewRecommend(value) ? value : null
}

export function toRecommendBoolean(value: ReviewRecommend): boolean {
  return value === "recommend"
}

export function fromRecommendBoolean(value: boolean): ReviewRecommend {
  return value ? "recommend" : "not_recommend"
}
