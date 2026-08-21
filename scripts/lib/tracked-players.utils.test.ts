import { describe, expect, test } from "bun:test"

import type { CacheHit, LadderEntry, TrackedPlayersFile } from "./pipeline.type"
import { applyArmoryHit, seedTrackedPlayersFromHistory, updateTrackedBracket } from "./tracked-players.utils"

const entry = (name: string, rating: number): LadderEntry => ({
  place: 100,
  name,
  rating,
  wins: 10,
  losses: 5,
  className: "Reaper",
  spec: "Harvest",
  armoryRealm: "Vol'Jin",
  hasArmory: true,
})

describe("updateTrackedBracket", () => {
  test("retains a player after they leave the current ladder", () => {
    const tracked: TrackedPlayersFile = { realms: {} }
    updateTrackedBracket(tracked, 40, "1v1", [entry("Newcomer", 1500)], "2026-08-20T00:00:00.000Z")

    const missing = updateTrackedBracket(tracked, 40, "1v1", [], "2026-08-21T00:00:00.000Z")

    expect(missing).toHaveLength(1)
    expect(missing[0]).toMatchObject({
      name: "Newcomer",
      rating: 1500,
      firstSeenAt: "2026-08-20T00:00:00.000Z",
      lastSeenAt: "2026-08-20T00:00:00.000Z",
    })
  })

  test("removes a returning player from the previous list and refreshes their data", () => {
    const tracked: TrackedPlayersFile = { realms: {} }
    updateTrackedBracket(tracked, 40, "1v1", [entry("Returner", 1500)], "2026-08-19T00:00:00.000Z")
    updateTrackedBracket(tracked, 40, "1v1", [], "2026-08-20T00:00:00.000Z")

    const missing = updateTrackedBracket(tracked, 40, "1v1", [entry("Returner", 1600)], "2026-08-21T00:00:00.000Z")

    expect(missing).toEqual([])
    expect(tracked.realms["40"]["1v1"]["Returner"]).toMatchObject({
      rating: 1600,
      firstSeenAt: "2026-08-19T00:00:00.000Z",
      lastSeenAt: "2026-08-21T00:00:00.000Z",
    })
  })
})

describe("seedTrackedPlayersFromHistory", () => {
  test("restores a player missing from the current ladder using their latest historical point", () => {
    const tracked: TrackedPlayersFile = { realms: {} }
    seedTrackedPlayersFromHistory(tracked, {
      snapshots: [
        {
          capturedAt: "2026-08-19T00:00:00.000Z",
          realms: { "40": { "1v1": { Historical: { rating: 1450, place: 99, wins: 8, losses: 4 } }, "2v2": {}, "3v3": {} } },
        },
        {
          capturedAt: "2026-08-20T00:00:00.000Z",
          realms: { "40": { "1v1": { Historical: { rating: 1510, place: 96, wins: 10, losses: 4 } }, "2v2": {}, "3v3": {} } },
        },
      ],
    })

    const restored = tracked.realms["40"]["1v1"].Historical
    expect(restored).toMatchObject({
      rating: 1510,
      place: 96,
      firstSeenAt: "2026-08-19T00:00:00.000Z",
      lastSeenAt: "2026-08-20T00:00:00.000Z",
    })
  })
})

describe("applyArmoryHit", () => {
  test("backfills class, spec and armory fields on a historical player", () => {
    const tracked: TrackedPlayersFile = { realms: {} }
    updateTrackedBracket(tracked, 40, "1v1", [entry("Historical", 1500)], "2026-08-20T00:00:00.000Z")
    const player = tracked.realms["40"]["1v1"].Historical
    player.className = null
    player.spec = null
    player.armoryRealm = null
    player.hasArmory = false
    const hit: CacheHit = {
      id: 123,
      class: "Reaper",
      realm: "Vol'Jin",
      region: "US",
      has_armory: true,
      status: "resolved",
      spec: "Harvest",
      spec_status: "resolved",
    }

    applyArmoryHit(player, hit)

    expect(player).toMatchObject({ className: "Reaper", spec: "Harvest", armoryRealm: "Vol'Jin", hasArmory: true })
  })
})
