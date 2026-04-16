import type { LibraryState } from "@/server/library/states"

const DAY_IN_MS = 24 * 60 * 60 * 1_000
const MAX_RECOMMENDATIONS = 3
const MAX_DROP_RISK_SIGNALS = 3
const MAX_RELEASE_REMINDERS = 4
const RELEASE_REMINDER_WINDOW_DAYS = 90

export const PRODUCTIVITY_RISK_LEVELS = ["low", "medium", "high"] as const
export type ProductivityRiskLevel = (typeof PRODUCTIVITY_RISK_LEVELS)[number]

export const PRODUCTIVITY_RECOMMENDATION_REASONS = [
  "keep_momentum",
  "quick_win",
  "manageable_scope",
  "high_quality",
  "low_drop_risk",
  "rescue_on_hold",
  "recent_progress",
  "balanced_pick",
] as const

export type ProductivityRecommendationReason =
  (typeof PRODUCTIVITY_RECOMMENDATION_REASONS)[number]

export type ProductivityGame = {
  coverUrl: string | null
  firstReleaseDate: string | null
  genres: string[]
  igdbId: number
  name: string
  platforms: string[]
  rating: number | null
  slug: string
  summary: string | null
  timeToBeatMainSeconds: number | null
}

export type ProductivityLibraryItem = {
  entryId: number
  game: ProductivityGame
  review:
    | {
        hoursToComplete: number | null
        recommend: "not_recommend" | "recommend"
      }
    | null
  state: LibraryState
  updatedAt: string
}

export type ProductivityRecommendation = {
  dropRiskLevel: ProductivityRiskLevel
  estimatedRemainingHours: number
  estimatedSessionsToFinish: number
  game: ProductivityGame
  reasons: ProductivityRecommendationReason[]
  score: number
}

export type ProductivityDropRiskSignal = {
  daysSinceActivity: number
  estimatedRemainingHours: number
  game: ProductivityGame
  level: ProductivityRiskLevel
  score: number
}

export type ProductivitySessionPlan = {
  projectedWeeksToClearBacklog: number | null
  sessionsPerWeek: number
  sessionMinutes: number
  targetWeeklyHours: number
}

export type ProductivityReleaseReminder = {
  daysUntilRelease: number
  game: ProductivityGame
  releaseDate: string
}

export const PRODUCTIVITY_PENDING_SORT_VALUES = [
  "hours_asc",
  "rating_desc",
  "rating_per_hour_desc",
] as const

export type ProductivityPendingSort = (typeof PRODUCTIVITY_PENDING_SORT_VALUES)[number]

export type ProductivityPendingBacklogCandidate = {
  daysSinceActivity: number
  dropRiskLevel: ProductivityRiskLevel
  estimatedRemainingHours: number
  game: ProductivityGame
  ratingPerHour: number | null
  state: LibraryState
}

export type ProductivityOverview = {
  backlogCompletionScore: number
  dropRisk: {
    highRiskCount: number
    lowRiskCount: number
    mediumRiskCount: number
    signals: ProductivityDropRiskSignal[]
  }
  estimatedHoursToClearBacklog: number
  pendingBacklogCandidates: ProductivityPendingBacklogCandidate[]
  recommendations: ProductivityRecommendation[]
  releaseReminders: ProductivityReleaseReminder[]
  sessionPlan: ProductivitySessionPlan
}

type ParsedLibraryItem = {
  estimatedRemainingHours: number
  parsedUpdatedAt: Date
  risk: {
    level: ProductivityRiskLevel
    score: number
  }
  source: ProductivityLibraryItem
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function compareNullableNumberDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) {
    return 0
  }

  if (a === null) {
    return 1
  }

  if (b === null) {
    return -1
  }

  return b - a
}

function safeDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function getDaysSince(targetDate: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - targetDate.getTime()) / DAY_IN_MS))
}

function getDaysUntil(targetDate: Date, now: Date): number {
  return Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / DAY_IN_MS))
}

function isFutureRelease(game: ProductivityGame, now: Date): boolean {
  const releaseDate = safeDate(game.firstReleaseDate)
  return Boolean(releaseDate && releaseDate.getTime() > now.getTime())
}

function estimateRemainingHours(item: ProductivityLibraryItem): number {
  if (item.state === "completed" || item.state === "dropped") {
    return 0
  }

  const reviewHours =
    typeof item.review?.hoursToComplete === "number" && item.review.hoursToComplete > 0
      ? item.review.hoursToComplete
      : null

  const gameHours =
    typeof item.game.timeToBeatMainSeconds === "number" && item.game.timeToBeatMainSeconds > 0
      ? item.game.timeToBeatMainSeconds / 3_600
      : null

  const baseHours =
    reviewHours ??
    gameHours ??
    (item.state === "playing" ? 12 : item.state === "on_hold" ? 14 : 18)

  const stateMultiplier = item.state === "playing" ? 0.6 : item.state === "on_hold" ? 0.8 : 1

  return roundToSingleDecimal(clamp(baseHours * stateMultiplier, 1, 200))
}

function scoreDropRisk({
  daysSinceActivity,
  estimatedRemainingHours,
  item,
}: {
  daysSinceActivity: number
  estimatedRemainingHours: number
  item: ProductivityLibraryItem
}): { level: ProductivityRiskLevel; score: number } {
  let score = 0

  if (item.state === "on_hold") {
    score += 35
  } else if (item.state === "planned") {
    score += 12
  }

  if (daysSinceActivity >= 14) {
    score += 12
  }

  if (daysSinceActivity >= 30) {
    score += 14
  }

  if (daysSinceActivity >= 60) {
    score += 18
  }

  if (estimatedRemainingHours >= 25) {
    score += 10
  }

  if (estimatedRemainingHours >= 40) {
    score += 10
  }

  if (typeof item.game.rating === "number" && item.game.rating < 65) {
    score += 8
  }

  if (item.review?.recommend === "not_recommend") {
    score += 16
  }

  if (item.state === "playing" && daysSinceActivity <= 7) {
    score -= 12
  }

  if (daysSinceActivity <= 3) {
    score -= 8
  }

  const safeScore = clamp(Math.round(score), 0, 100)

  if (safeScore >= 65) {
    return { level: "high", score: safeScore }
  }

  if (safeScore >= 40) {
    return { level: "medium", score: safeScore }
  }

  return { level: "low", score: safeScore }
}

function scoreRecommendation(item: ParsedLibraryItem, now: Date): number {
  const { source } = item
  const daysSinceActivity = getDaysSince(item.parsedUpdatedAt, now)
  let score = 20

  if (source.state === "playing") {
    score += 40
  } else if (source.state === "planned") {
    score += 28
  } else if (source.state === "on_hold") {
    score += 16
  }

  if (daysSinceActivity <= 7) {
    score += 20
  } else if (daysSinceActivity <= 21) {
    score += 12
  } else if (daysSinceActivity <= 45) {
    score += 5
  } else {
    score -= 8
  }

  if (item.estimatedRemainingHours <= 8) {
    score += 16
  } else if (item.estimatedRemainingHours <= 20) {
    score += 10
  } else if (item.estimatedRemainingHours <= 35) {
    score += 4
  } else {
    score -= 6
  }

  if (item.risk.level === "low") {
    score += 10
  } else if (item.risk.level === "medium") {
    score += 3
  } else {
    score -= 14
  }

  if (typeof source.game.rating === "number" && source.game.rating >= 85) {
    score += 8
  } else if (typeof source.game.rating === "number" && source.game.rating >= 70) {
    score += 4
  } else if (typeof source.game.rating === "number" && source.game.rating < 60) {
    score -= 4
  }

  if (source.review?.recommend === "recommend") {
    score += 6
  }

  if (source.review?.recommend === "not_recommend") {
    score -= 10
  }

  return clamp(Math.round(score), 0, 100)
}

function getRecommendationReasons(
  item: ParsedLibraryItem,
  now: Date,
): ProductivityRecommendationReason[] {
  const reasons: ProductivityRecommendationReason[] = []
  const daysSinceActivity = getDaysSince(item.parsedUpdatedAt, now)

  if (item.source.state === "playing") {
    reasons.push("keep_momentum")
  }

  if (item.estimatedRemainingHours <= 8) {
    reasons.push("quick_win")
  } else if (item.estimatedRemainingHours <= 20) {
    reasons.push("manageable_scope")
  }

  if (typeof item.source.game.rating === "number" && item.source.game.rating >= 85) {
    reasons.push("high_quality")
  }

  if (item.risk.level === "low") {
    reasons.push("low_drop_risk")
  }

  if (item.source.state === "on_hold") {
    reasons.push("rescue_on_hold")
  }

  if (daysSinceActivity <= 7) {
    reasons.push("recent_progress")
  }

  if (reasons.length === 0) {
    reasons.push("balanced_pick")
  }

  return reasons.slice(0, 3)
}

function computeCompletionScore({
  completedCount,
  droppedCount,
  onHoldCount,
  recentActiveCount,
  totalBacklogCount,
  totalEntries,
}: {
  completedCount: number
  droppedCount: number
  onHoldCount: number
  recentActiveCount: number
  totalBacklogCount: number
  totalEntries: number
}): number {
  if (totalEntries === 0) {
    return 0
  }

  const completedRatio = completedCount / totalEntries
  const droppedRatio = droppedCount / totalEntries
  const recentActiveRatio = totalBacklogCount > 0 ? recentActiveCount / totalBacklogCount : 0
  const onHoldRatio = totalBacklogCount > 0 ? onHoldCount / totalBacklogCount : 0

  const score =
    completedRatio * 55 +
    recentActiveRatio * 25 +
    (1 - droppedRatio) * 15 +
    (1 - onHoldRatio) * 5

  return clamp(Math.round(score), 0, 100)
}

function getTargetWeeklyHours(backlogEntriesCount: number, highRiskCount: number): number {
  let weeklyHours = 5

  if (backlogEntriesCount <= 2) {
    weeklyHours = 3.5
  } else if (backlogEntriesCount <= 5) {
    weeklyHours = 5
  } else if (backlogEntriesCount <= 10) {
    weeklyHours = 7
  } else {
    weeklyHours = 9
  }

  if (highRiskCount >= 2) {
    weeklyHours += 1
  }

  return roundToSingleDecimal(weeklyHours)
}

function getSessionMinutes(topRecommendation: ParsedLibraryItem | null): number {
  if (!topRecommendation) {
    return 60
  }

  const remainingHours = topRecommendation.estimatedRemainingHours

  if (remainingHours <= 8) {
    return 45
  }

  if (remainingHours <= 20) {
    return 60
  }

  if (remainingHours <= 35) {
    return 75
  }

  return 90
}

export function parseProductivityPendingSort(value: unknown): ProductivityPendingSort {
  if (value === "hours_asc" || value === "rating_desc" || value === "rating_per_hour_desc") {
    return value
  }

  return "rating_per_hour_desc"
}

export function sortPendingBacklogCandidates(input: {
  candidates: ProductivityPendingBacklogCandidate[]
  sortBy: ProductivityPendingSort
}): ProductivityPendingBacklogCandidate[] {
  return [...input.candidates].sort((a, b) => {
    if (input.sortBy === "hours_asc") {
      if (a.estimatedRemainingHours !== b.estimatedRemainingHours) {
        return a.estimatedRemainingHours - b.estimatedRemainingHours
      }

      return compareNullableNumberDesc(a.game.rating, b.game.rating)
    }

    if (input.sortBy === "rating_desc") {
      const ratingCompare = compareNullableNumberDesc(a.game.rating, b.game.rating)

      if (ratingCompare !== 0) {
        return ratingCompare
      }

      return a.estimatedRemainingHours - b.estimatedRemainingHours
    }

    const ratioCompare = compareNullableNumberDesc(a.ratingPerHour, b.ratingPerHour)

    if (ratioCompare !== 0) {
      return ratioCompare
    }

    const ratingCompare = compareNullableNumberDesc(a.game.rating, b.game.rating)

    if (ratingCompare !== 0) {
      return ratingCompare
    }

    return a.estimatedRemainingHours - b.estimatedRemainingHours
  })
}

export function buildProductivityOverview(input: {
  items: ProductivityLibraryItem[]
  now?: Date
}): ProductivityOverview {
  const now = input.now ?? new Date()
  const parsedItems = input.items.map((item): ParsedLibraryItem => {
    const parsedUpdatedAt = safeDate(item.updatedAt) ?? now
    const estimatedRemainingHours = estimateRemainingHours(item)
    const daysSinceActivity = getDaysSince(parsedUpdatedAt, now)

    return {
      source: item,
      parsedUpdatedAt,
      estimatedRemainingHours,
      risk: scoreDropRisk({
        daysSinceActivity,
        estimatedRemainingHours,
        item,
      }),
    }
  })

  const backlogItems = parsedItems.filter(
    (item) =>
      item.source.state === "planned" ||
      item.source.state === "playing" ||
      item.source.state === "on_hold",
  )

  const completedCount = parsedItems.filter((item) => item.source.state === "completed").length
  const droppedCount = parsedItems.filter((item) => item.source.state === "dropped").length
  const onHoldCount = backlogItems.filter((item) => item.source.state === "on_hold").length
  const recentActiveCount = backlogItems.filter(
    (item) => getDaysSince(item.parsedUpdatedAt, now) <= 14,
  ).length

  const backlogCompletionScore = computeCompletionScore({
    completedCount,
    droppedCount,
    onHoldCount,
    recentActiveCount,
    totalBacklogCount: backlogItems.length,
    totalEntries: parsedItems.length,
  })

  const estimatedHoursToClearBacklog = roundToSingleDecimal(
    backlogItems.reduce((total, item) => total + item.estimatedRemainingHours, 0),
  )

  const highRiskCount = backlogItems.filter((item) => item.risk.level === "high").length
  const mediumRiskCount = backlogItems.filter((item) => item.risk.level === "medium").length
  const lowRiskCount = backlogItems.filter((item) => item.risk.level === "low").length

  const dropRiskSignals = backlogItems
    .filter((item) => item.risk.level !== "low")
    .sort((a, b) => {
      if (b.risk.score !== a.risk.score) {
        return b.risk.score - a.risk.score
      }

      return b.parsedUpdatedAt.getTime() - a.parsedUpdatedAt.getTime()
    })
    .slice(0, MAX_DROP_RISK_SIGNALS)
    .map((item) => ({
      daysSinceActivity: getDaysSince(item.parsedUpdatedAt, now),
      estimatedRemainingHours: item.estimatedRemainingHours,
      game: item.source.game,
      level: item.risk.level,
      score: item.risk.score,
    }))

  const releasedBacklogItems = backlogItems.filter(
    (item) => !isFutureRelease(item.source.game, now),
  )
  const recommendationCandidates =
    releasedBacklogItems.length > 0 ? releasedBacklogItems : backlogItems

  const sortedRecommendations = recommendationCandidates
    .map((item) => ({
      item,
      score: scoreRecommendation(item, now),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      return b.item.parsedUpdatedAt.getTime() - a.item.parsedUpdatedAt.getTime()
    })
    .slice(0, MAX_RECOMMENDATIONS)

  const topRecommendation = sortedRecommendations[0]?.item ?? null
  const sessionMinutes = getSessionMinutes(topRecommendation)
  const targetWeeklyHours = getTargetWeeklyHours(backlogItems.length, highRiskCount)
  const sessionsPerWeek =
    estimatedHoursToClearBacklog > 0
      ? Math.max(2, Math.ceil((targetWeeklyHours * 60) / sessionMinutes))
      : 0
  const projectedWeeksToClearBacklog =
    estimatedHoursToClearBacklog > 0
      ? Math.ceil(estimatedHoursToClearBacklog / targetWeeklyHours)
      : null

  const recommendations = sortedRecommendations.map(({ item, score }) => ({
    dropRiskLevel: item.risk.level,
    estimatedRemainingHours: item.estimatedRemainingHours,
    estimatedSessionsToFinish: Math.max(
      1,
      Math.ceil((item.estimatedRemainingHours * 60) / sessionMinutes),
    ),
    game: item.source.game,
    reasons: getRecommendationReasons(item, now),
    score,
  }))

  const releaseReminders = backlogItems
    .map((item) => {
      const releaseDate = safeDate(item.source.game.firstReleaseDate)

      if (!releaseDate) {
        return null
      }

      const daysUntilRelease = getDaysUntil(releaseDate, now)

      if (daysUntilRelease <= 0 || daysUntilRelease > RELEASE_REMINDER_WINDOW_DAYS) {
        return null
      }

      return {
        daysUntilRelease,
        game: item.source.game,
        releaseDate: releaseDate.toISOString(),
      }
    })
    .filter((entry): entry is ProductivityReleaseReminder => Boolean(entry))
    .sort((a, b) => {
      if (a.daysUntilRelease !== b.daysUntilRelease) {
        return a.daysUntilRelease - b.daysUntilRelease
      }

      return a.game.name.localeCompare(b.game.name)
    })
    .slice(0, MAX_RELEASE_REMINDERS)

  const pendingBacklogCandidates = sortPendingBacklogCandidates({
    candidates: backlogItems.map((item) => ({
      daysSinceActivity: getDaysSince(item.parsedUpdatedAt, now),
      dropRiskLevel: item.risk.level,
      estimatedRemainingHours: item.estimatedRemainingHours,
      game: item.source.game,
      ratingPerHour:
        typeof item.source.game.rating === "number" && item.estimatedRemainingHours > 0
          ? roundToSingleDecimal(item.source.game.rating / item.estimatedRemainingHours)
          : null,
      state: item.source.state,
    })),
    sortBy: "rating_per_hour_desc",
  })

  return {
    backlogCompletionScore,
    dropRisk: {
      highRiskCount,
      lowRiskCount,
      mediumRiskCount,
      signals: dropRiskSignals,
    },
    estimatedHoursToClearBacklog,
    pendingBacklogCandidates,
    recommendations,
    releaseReminders,
    sessionPlan: {
      projectedWeeksToClearBacklog,
      sessionsPerWeek,
      sessionMinutes,
      targetWeeklyHours,
    },
  }
}
