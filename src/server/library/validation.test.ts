import assert from "node:assert/strict"
import test from "node:test"

import { parseLibraryState } from "@/server/library/states"
import { parseLibraryPage, parseLibrarySort, normalizeLibrarySearch } from "@/server/library/validation"

test("parseLibraryState validates stable enum", () => {
  assert.equal(parseLibraryState("planned"), "planned")
  assert.equal(parseLibraryState("on_hold"), "on_hold")
  assert.equal(parseLibraryState("invalid"), null)
})

test("parseLibrarySort returns safe default", () => {
  assert.equal(parseLibrarySort("updated_desc"), "updated_desc")
  assert.equal(parseLibrarySort("release_desc"), "release_desc")
  assert.equal(parseLibrarySort("rating_desc"), "rating_desc")
  assert.equal(parseLibrarySort("whatever"), "updated_desc")
})

test("parseLibraryPage returns positive integer page", () => {
  assert.equal(parseLibraryPage("1"), 1)
  assert.equal(parseLibraryPage("7"), 7)
  assert.equal(parseLibraryPage("0"), 1)
  assert.equal(parseLibraryPage("-1"), 1)
  assert.equal(parseLibraryPage("abc"), 1)
})

test("normalizeLibrarySearch trims and clamps input", () => {
  assert.equal(normalizeLibrarySearch("  Elden Ring  "), "Elden Ring")
  assert.equal(normalizeLibrarySearch(123), "")
  assert.equal(normalizeLibrarySearch("a".repeat(200)).length, 120)
})
