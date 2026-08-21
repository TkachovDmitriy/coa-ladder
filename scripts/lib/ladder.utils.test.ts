import { describe, expect, test } from "bun:test"

import type { LadderEntry } from "../../src/domains/ladder/model/ladder.type"
import { ratingCutoff } from "../../src/domains/ladder/utils/ladder.utils"

const entry = (rating: number): LadderEntry => ({
  place: 1,
  name: "Player",
  rating,
  wins: 0,
  losses: 0,
  className: null,
  spec: null,
  armoryRealm: null,
  hasArmory: false,
})

describe("ratingCutoff", () => {
  test("uses the lowest rating regardless of API order", () => {
    expect(ratingCutoff([entry(1700), entry(1500), entry(1600)])).toBe(1500)
  })

  test("returns null for an empty ladder", () => {
    expect(ratingCutoff([])).toBeNull()
  })
})
