import assert from "node:assert/strict"
import test from "node:test"

import {
  parseReviewRecommend,
  toRecommendBoolean,
  fromRecommendBoolean,
} from "@/server/reviews/constants"
import {
  parseReviewBody,
  parseReviewContainsSpoilers,
  parseReviewHours,
  parseReviewPlatform,
  validateReviewInput,
} from "@/server/reviews/validation"

test("recommend parser keeps required values", () => {
  assert.equal(parseReviewRecommend("recommend"), "recommend")
  assert.equal(parseReviewRecommend("not_recommend"), "not_recommend")
  assert.equal(parseReviewRecommend("invalid"), null)
  assert.equal(toRecommendBoolean("recommend"), true)
  assert.equal(toRecommendBoolean("not_recommend"), false)
  assert.equal(fromRecommendBoolean(true), "recommend")
  assert.equal(fromRecommendBoolean(false), "not_recommend")
})

test("review body validates min and max length", () => {
  assert.equal(parseReviewBody("Great pacing"), "Great pacing")
  assert.equal(parseReviewBody("   "), null)
  assert.equal(parseReviewBody("x".repeat(501)), null)
})

test("review optional fields validate format", () => {
  assert.equal(parseReviewHours("20"), 20)
  assert.equal(parseReviewHours("0"), null)
  assert.equal(parseReviewHours("1.5"), null)

  assert.equal(parseReviewPlatform("PS5"), "PS5")
  assert.equal(parseReviewPlatform(""), null)
  assert.equal(parseReviewPlatform("x".repeat(61)), null)

  assert.equal(parseReviewContainsSpoilers(true), true)
  assert.equal(parseReviewContainsSpoilers(false), false)
  assert.equal(parseReviewContainsSpoilers(undefined), false)
  assert.equal(parseReviewContainsSpoilers("true"), true)
  assert.equal(parseReviewContainsSpoilers("false"), false)
  assert.equal(parseReviewContainsSpoilers("invalid"), null)
})

test("validateReviewInput enforces recommend + body", () => {
  const valid = validateReviewInput({
    body: "Finished with all side quests.",
    recommend: "recommend",
    platformPlayed: "PS5",
    hoursToComplete: "45",
    containsSpoilers: true,
  })

  assert.deepEqual(valid, {
    body: "Finished with all side quests.",
    recommend: "recommend",
    platformPlayed: "PS5",
    hoursToComplete: 45,
    containsSpoilers: true,
  })

  assert.equal(
    validateReviewInput({
      body: "",
      recommend: "recommend",
      platformPlayed: null,
      hoursToComplete: null,
      containsSpoilers: false,
    }),
    null,
  )

  assert.equal(
    validateReviewInput({
      body: "Good",
      recommend: null,
      platformPlayed: null,
      hoursToComplete: null,
      containsSpoilers: false,
    }),
    null,
  )
})
