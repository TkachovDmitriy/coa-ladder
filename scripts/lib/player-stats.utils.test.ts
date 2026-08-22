import { describe, expect, test } from "bun:test"

import type { HistoryFile, HistoryPoint } from "./pipeline.type"
import { buildPlayerStatsDataset } from "./player-stats.utils"

const DAY_MS = 24 * 60 * 60 * 1000
const generatedAt = "2026-08-22T12:00:00.000Z"

function snapshot(capturedAt: string, players: Record<string, HistoryPoint>) {
  return { capturedAt, realms: { "40": { "1v1": players, "2v2": {}, "3v3": {} } } }
}

describe("buildPlayerStatsDataset", () => {
  test("aggregates the available rolling period for a player", () => {
    const history: HistoryFile = { snapshots: [
      snapshot("2026-08-20T12:00:00.000Z", { Hero: { rating: 1500, place: 20, wins: 10, losses: 5 } }),
      snapshot(generatedAt, { HERO: { rating: 1625, place: 12, wins: 14, losses: 7 } }),
    ] }

    const result = buildPlayerStatsDataset(history, generatedAt, 8 * DAY_MS, [40], ["1v1"])
    const player = result.realms[0].brackets["1v1"].players.hero

    expect(player.name).toBe("HERO")
    expect(player.ratingChange).toBe(125)
    expect(player.placeChange).toBe(8)
    expect(player.games).toBe(6)
    expect(player.winRate).toBe(4 / 6)
    expect(player.minRating).toBe(1500)
    expect(player.maxRating).toBe(1625)
    expect(player.coverage).toBe("complete")
  })

  test("marks missing player snapshots as partial and rejects season-reset record deltas", () => {
    const history: HistoryFile = { snapshots: [
      snapshot("2026-08-20T12:00:00.000Z", { Hero: { rating: 1500, place: 20, wins: 20, losses: 10 } }),
      snapshot("2026-08-21T12:00:00.000Z", {}),
      snapshot(generatedAt, { Hero: { rating: 1510, place: 18, wins: 2, losses: 1 } }),
    ] }

    const player = buildPlayerStatsDataset(history, generatedAt, 8 * DAY_MS, [40], ["1v1"])
      .realms[0].brackets["1v1"].players.hero

    expect(player.coverage).toBe("partial")
    expect(player.games).toBeNull()
    expect(player.winRate).toBeNull()
  })

  test("ignores snapshots outside the eight-day window and duplicate timestamps", () => {
    const history: HistoryFile = { snapshots: [
      snapshot("2026-08-10T12:00:00.000Z", { Hero: { rating: 1000, place: 50, wins: 0, losses: 0 } }),
      snapshot(generatedAt, { Hero: { rating: 1500, place: 20, wins: 10, losses: 5 } }),
      snapshot(generatedAt, { Hero: { rating: 1550, place: 18, wins: 11, losses: 5 } }),
    ] }

    const bracket = buildPlayerStatsDataset(history, generatedAt, 8 * DAY_MS, [40], ["1v1"])
      .realms[0].brackets["1v1"]

    expect(bracket.snapshotCount).toBe(1)
    expect(bracket.players.hero.currentRating).toBe(1550)
    expect(bracket.players.hero.coverage).toBe("insufficient")
  })
})
