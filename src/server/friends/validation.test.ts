import assert from "node:assert/strict"
import test from "node:test"

import { parsePeopleSearch, parseUsernameCandidate } from "@/server/friends/validation"

test("parseUsernameCandidate validates normalized usernames", () => {
  assert.equal(parseUsernameCandidate("Rafa_CV"), "rafa_cv")
  assert.equal(parseUsernameCandidate("  abc123  "), "abc123")
  assert.equal(parseUsernameCandidate("ab"), null)
  assert.equal(parseUsernameCandidate("with-dash"), null)
  assert.equal(parseUsernameCandidate(123), null)
})

test("parsePeopleSearch trims and clamps query", () => {
  assert.equal(parsePeopleSearch("  metroid  "), "metroid")
  assert.equal(parsePeopleSearch(42), "")
  assert.equal(parsePeopleSearch("x".repeat(200)).length, 80)
})
