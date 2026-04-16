import assert from "node:assert/strict"
import test from "node:test"

import {
  buildProductivityOverview,
  parseProductivityPendingSort,
  sortPendingBacklogCandidates,
  type ProductivityLibraryItem,
} from "@/server/productivity/engine"

const NOW = new Date("2026-04-16T12:00:00.000Z")

type CreateItemInput = {
  entryId: number
  game?: Partial<ProductivityLibraryItem["game"]>
  igdbId: number
  name: string
  review?: ProductivityLibraryItem["review"]
  state: ProductivityLibraryItem["state"]
  updatedAt: string
}

function createItem(input: CreateItemInput): ProductivityLibraryItem {
  return {
    entryId: input.entryId,
    game: {
      coverUrl: null,
      firstReleaseDate: input.game?.firstReleaseDate ?? null,
      genres: [],
      igdbId: input.igdbId,
      name: input.name,
      platforms: [],
      rating: input.game?.rating ?? null,
      slug: input.game?.slug ?? input.name.toLowerCase().replace(/\s+/g, "-"),
      summary: null,
      timeToBeatMainSeconds: input.game?.timeToBeatMainSeconds ?? null,
    },
    review: input.review ?? null,
    state: input.state,
    updatedAt: input.updatedAt,
  }
}

test("buildProductivityOverview returns recommendations, risk signals, and reminders", () => {
  const items: ProductivityLibraryItem[] = [
    createItem({
      entryId: 1,
      igdbId: 1001,
      name: "Momentum Quest",
      state: "playing",
      updatedAt: "2026-04-15T10:00:00.000Z",
      game: {
        firstReleaseDate: "2025-09-01T00:00:00.000Z",
        rating: 86,
        slug: "momentum-quest",
        timeToBeatMainSeconds: 18 * 3_600,
      },
      review: {
        hoursToComplete: null,
        recommend: "recommend",
      },
    }),
    createItem({
      entryId: 2,
      igdbId: 1002,
      name: "Frozen Save",
      state: "on_hold",
      updatedAt: "2026-01-10T10:00:00.000Z",
      game: {
        firstReleaseDate: "2022-04-01T00:00:00.000Z",
        rating: 61,
        slug: "frozen-save",
        timeToBeatMainSeconds: 42 * 3_600,
      },
      review: {
        hoursToComplete: null,
        recommend: "not_recommend",
      },
    }),
    createItem({
      entryId: 3,
      igdbId: 1003,
      name: "Soon Launch",
      state: "planned",
      updatedAt: "2026-04-01T10:00:00.000Z",
      game: {
        firstReleaseDate: "2026-05-05T00:00:00.000Z",
        rating: 78,
        slug: "soon-launch",
        timeToBeatMainSeconds: 20 * 3_600,
      },
    }),
    createItem({
      entryId: 4,
      igdbId: 1004,
      name: "Done Story",
      state: "completed",
      updatedAt: "2026-04-10T10:00:00.000Z",
      game: {
        firstReleaseDate: "2021-03-01T00:00:00.000Z",
        rating: 80,
        slug: "done-story",
        timeToBeatMainSeconds: 12 * 3_600,
      },
    }),
  ]

  const overview = buildProductivityOverview({
    items,
    now: NOW,
  })

  assert.equal(overview.recommendations.length, 2)
  assert.equal(overview.recommendations[0]?.game.name, "Momentum Quest")
  assert.equal(overview.pendingBacklogCandidates.length, 3)
  assert.equal(overview.pendingBacklogCandidates[0]?.game.name, "Momentum Quest")
  assert.equal(overview.dropRisk.highRiskCount, 1)
  assert.equal(overview.dropRisk.signals[0]?.game.name, "Frozen Save")
  assert.equal(overview.releaseReminders[0]?.game.name, "Soon Launch")
  assert.equal(overview.sessionPlan.sessionsPerWeek > 0, true)
  assert.equal(overview.estimatedHoursToClearBacklog > 0, true)
  assert.equal(overview.backlogCompletionScore > 0, true)
})

test("buildProductivityOverview handles empty library", () => {
  const overview = buildProductivityOverview({
    items: [],
    now: NOW,
  })

  assert.equal(overview.backlogCompletionScore, 0)
  assert.equal(overview.estimatedHoursToClearBacklog, 0)
  assert.equal(overview.pendingBacklogCandidates.length, 0)
  assert.equal(overview.recommendations.length, 0)
  assert.equal(overview.dropRisk.highRiskCount, 0)
  assert.equal(overview.dropRisk.mediumRiskCount, 0)
  assert.equal(overview.dropRisk.lowRiskCount, 0)
  assert.equal(overview.dropRisk.signals.length, 0)
  assert.equal(overview.releaseReminders.length, 0)
  assert.equal(overview.sessionPlan.sessionsPerWeek, 0)
  assert.equal(overview.sessionPlan.projectedWeeksToClearBacklog, null)
})

test("parseProductivityPendingSort returns safe default", () => {
  assert.equal(parseProductivityPendingSort("hours_asc"), "hours_asc")
  assert.equal(parseProductivityPendingSort("rating_desc"), "rating_desc")
  assert.equal(parseProductivityPendingSort("rating_per_hour_desc"), "rating_per_hour_desc")
  assert.equal(parseProductivityPendingSort("nope"), "rating_per_hour_desc")
})

test("sortPendingBacklogCandidates supports all sorting strategies", () => {
  const candidates = [
    {
      daysSinceActivity: 4,
      dropRiskLevel: "low" as const,
      estimatedRemainingHours: 20,
      game: {
        coverUrl: null,
        firstReleaseDate: null,
        genres: [],
        igdbId: 1,
        name: "A",
        platforms: [],
        rating: 90,
        slug: "a",
        summary: null,
        timeToBeatMainSeconds: null,
      },
      ratingPerHour: 4.5,
      state: "planned" as const,
    },
    {
      daysSinceActivity: 2,
      dropRiskLevel: "low" as const,
      estimatedRemainingHours: 10,
      game: {
        coverUrl: null,
        firstReleaseDate: null,
        genres: [],
        igdbId: 2,
        name: "B",
        platforms: [],
        rating: 80,
        slug: "b",
        summary: null,
        timeToBeatMainSeconds: null,
      },
      ratingPerHour: 8,
      state: "playing" as const,
    },
    {
      daysSinceActivity: 10,
      dropRiskLevel: "medium" as const,
      estimatedRemainingHours: 14,
      game: {
        coverUrl: null,
        firstReleaseDate: null,
        genres: [],
        igdbId: 3,
        name: "C",
        platforms: [],
        rating: 95,
        slug: "c",
        summary: null,
        timeToBeatMainSeconds: null,
      },
      ratingPerHour: 6.8,
      state: "on_hold" as const,
    },
  ]

  const byHours = sortPendingBacklogCandidates({
    candidates,
    sortBy: "hours_asc",
  })
  assert.deepEqual(
    byHours.map((item) => item.game.name),
    ["B", "C", "A"],
  )

  const byRating = sortPendingBacklogCandidates({
    candidates,
    sortBy: "rating_desc",
  })
  assert.deepEqual(
    byRating.map((item) => item.game.name),
    ["C", "A", "B"],
  )

  const byRatio = sortPendingBacklogCandidates({
    candidates,
    sortBy: "rating_per_hour_desc",
  })
  assert.deepEqual(
    byRatio.map((item) => item.game.name),
    ["B", "C", "A"],
  )
})
