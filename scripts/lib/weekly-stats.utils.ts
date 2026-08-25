/**
 * Pure aggregation for the weekly-statistics dataset (public/stats.json).
 *
 * Everything here is deterministic and side-effect free so it can be exercised
 * with fixtures (see weekly-stats.utils.test.ts). build-ladder.ts wires the
 * real history and realm list through buildStatsDataset().
 *
 * All figures describe changes *between snapshots*, never per-match results.
 */

import {
  COVERAGE_COMPLETE_MIN_SNAPSHOTS,
  COVERAGE_COMPLETE_MIN_SPAN_DAYS,
  COVERAGE_PARTIAL_MIN_SNAPSHOTS,
  EXPECTED_WEEKLY_SNAPSHOTS,
  MAX_TREND_POINTS,
  TREND_MIN_SNAPSHOTS,
  WEEKLY_LEADERS_LIMIT,
  WEEKLY_PERIOD_DAYS,
  WEEKLY_PERIOD_MS,
} from "./pipeline.constants"
import type { Bracket, HistorySnapshot } from "./pipeline.type"
import type {
  BracketWeeklyStats,
  Coverage,
  PlayerWeeklyStats,
  RealmWeeklyStats,
  StatsDataset,
  TrendPoint,
  WeeklyLeader,
  WeeklyStatsConfig,
} from "./weekly-stats.type"

const DAY_MS = 24 * 60 * 60 * 1000

export const DEFAULT_WEEKLY_STATS_CONFIG: WeeklyStatsConfig = {
  periodMs: WEEKLY_PERIOD_MS,
  periodDays: WEEKLY_PERIOD_DAYS,
  expectedSnapshotCount: EXPECTED_WEEKLY_SNAPSHOTS,
  completeMinSnapshots: COVERAGE_COMPLETE_MIN_SNAPSHOTS,
  completeMinSpanDays: COVERAGE_COMPLETE_MIN_SPAN_DAYS,
  partialMinSnapshots: COVERAGE_PARTIAL_MIN_SNAPSHOTS,
  trendMinSnapshots: TREND_MIN_SNAPSHOTS,
  maxTrendPoints: MAX_TREND_POINTS,
  leadersLimit: WEEKLY_LEADERS_LIMIT,
}

/** One player's data at a single snapshot, tagged with when it was captured. */
interface TimedPoint {
  capturedAt: string
  rating: number
  place: number
  wins: number | undefined
  losses: number | undefined
}

const timeOf = (capturedAt: string): number => new Date(capturedAt).getTime()

/**
 * Snapshots inside the window ending at `now`, ordered oldest-first, with
 * invalid timestamps dropped and duplicate timestamps collapsed (last wins).
 */
export function selectWindowSnapshots(
  snapshots: HistorySnapshot[],
  now: string,
  periodMs: number,
): HistorySnapshot[] {
  const end = timeOf(now)
  const start = end - periodMs
  const byTime = new Map<number, HistorySnapshot>()
  for (const snapshot of snapshots) {
    const t = timeOf(snapshot.capturedAt)
    if (Number.isNaN(t) || t < start || t > end) continue
    byTime.set(t, snapshot) // later occurrence of a duplicate replaces earlier
  }
  return [...byTime.keys()].sort((a, b) => a - b).map((t) => byTime.get(t)!)
}

/** Collect one bracket's per-player point series across the window snapshots. */
function collectBracketPoints(
  windowSnapshots: HistorySnapshot[],
  realmId: number,
  bracket: Bracket,
): { byName: Map<string, TimedPoint[]>; bracketSnapshots: HistorySnapshot[] } {
  const byName = new Map<string, TimedPoint[]>()
  const bracketSnapshots: HistorySnapshot[] = []
  for (const snapshot of windowSnapshots) {
    const points = snapshot.realms[String(realmId)]?.[bracket]
    if (!points) continue
    bracketSnapshots.push(snapshot)
    for (const [name, pt] of Object.entries(points)) {
      // The upstream ladder occasionally carries a blank-name row; keying stats
      // off it would surface an empty "player", so skip it.
      if (name.trim() === "") continue
      const series = byName.get(name) ?? []
      series.push({
        capturedAt: snapshot.capturedAt,
        rating: pt.rating,
        place: pt.place,
        wins: typeof pt.wins === "number" ? pt.wins : undefined,
        losses: typeof pt.losses === "number" ? pt.losses : undefined,
      })
      byName.set(name, series)
    }
  }
  return { byName, bracketSnapshots }
}

/** Evenly downsample a series to at most `max` points, keeping first and last. */
export function downsampleTrend(points: TrendPoint[], max: number): TrendPoint[] {
  const n = points.length
  if (n <= max || max < 2) return n <= max ? points : [points[0], points[n - 1]]
  const step = (n - 1) / (max - 1)
  const seen = new Set<number>()
  const out: TrendPoint[] = []
  for (let i = 0; i < max; i++) {
    const idx = Math.round(i * step)
    if (!seen.has(idx)) {
      seen.add(idx)
      out.push(points[idx])
    }
  }
  return out
}

export function coverageFor(snapshotCount: number, spanDays: number, config: WeeklyStatsConfig): Coverage {
  if (snapshotCount < config.partialMinSnapshots) return "insufficient"
  if (snapshotCount >= config.completeMinSnapshots && spanDays >= config.completeMinSpanDays) return "complete"
  return "partial"
}

/** Aggregate one player's window points into their weekly stats. */
export function computePlayerStats(name: string, points: TimedPoint[], config: WeeklyStatsConfig): PlayerWeeklyStats {
  const first = points[0]
  const last = points[points.length - 1]
  const ratings = points.map((p) => p.rating)
  const spanDays = (timeOf(last.capturedAt) - timeOf(first.capturedAt)) / DAY_MS

  let wins: number | null = null
  let losses: number | null = null
  let games: number | null = null
  let winRate: number | null = null
  if (typeof first.wins === "number" && typeof last.wins === "number" &&
      typeof first.losses === "number" && typeof last.losses === "number") {
    const winsDelta = last.wins - first.wins
    const lossesDelta = last.losses - first.losses
    // A negative delta means a season reset or incompatible data: leave the
    // game totals null rather than report a misleading value.
    if (winsDelta >= 0 && lossesDelta >= 0) {
      wins = winsDelta
      losses = lossesDelta
      games = winsDelta + lossesDelta
      winRate = games > 0 ? winsDelta / games : null
    }
  }

  const trend =
    points.length >= config.trendMinSnapshots
      ? downsampleTrend(
          points.map((p) => ({ capturedAt: p.capturedAt, rating: p.rating, place: p.place })),
          config.maxTrendPoints,
        )
      : []

  return {
    name,
    firstCapturedAt: first.capturedAt,
    lastCapturedAt: last.capturedAt,
    snapshotCount: points.length,
    ratingChange: last.rating - first.rating,
    placeChange: first.place - last.place,
    wins,
    losses,
    games,
    winRate,
    minRating: Math.min(...ratings),
    maxRating: Math.max(...ratings),
    currentRating: last.rating,
    trend,
    coverage: coverageFor(points.length, spanDays, config),
  }
}

const toLeader = (p: PlayerWeeklyStats): WeeklyLeader => ({
  name: p.name,
  ratingChange: p.ratingChange,
  placeChange: p.placeChange,
  currentRating: p.currentRating,
})

/** Top rating gainers and fallers, excluding series too thin to trust. */
export function rankLeaders(
  players: Record<string, PlayerWeeklyStats>,
  config: WeeklyStatsConfig,
): { gainers: WeeklyLeader[]; fallers: WeeklyLeader[] } {
  const measurable = Object.values(players).filter((p) => p.coverage !== "insufficient")
  const gainers = measurable
    .filter((p) => p.ratingChange > 0)
    .sort((a, b) => b.ratingChange - a.ratingChange || a.name.localeCompare(b.name))
    .slice(0, config.leadersLimit)
    .map(toLeader)
  const fallers = measurable
    .filter((p) => p.ratingChange < 0)
    .sort((a, b) => a.ratingChange - b.ratingChange || a.name.localeCompare(b.name))
    .slice(0, config.leadersLimit)
    .map(toLeader)
  return { gainers, fallers }
}

/** Aggregate a single realm+bracket over the window snapshots. */
export function aggregateBracket(
  windowSnapshots: HistorySnapshot[],
  realmId: number,
  bracket: Bracket,
  config: WeeklyStatsConfig,
): BracketWeeklyStats {
  const { byName, bracketSnapshots } = collectBracketPoints(windowSnapshots, realmId, bracket)
  const players: Record<string, PlayerWeeklyStats> = {}
  for (const [name, points] of byName) players[name] = computePlayerStats(name, points, config)
  return {
    capturedFrom: bracketSnapshots[0]?.capturedAt ?? null,
    capturedTo: bracketSnapshots[bracketSnapshots.length - 1]?.capturedAt ?? null,
    snapshotCount: bracketSnapshots.length,
    players,
    leaders: rankLeaders(players, config),
  }
}

/** Build the full public weekly-statistics dataset from retained history. */
export function buildStatsDataset(
  snapshots: HistorySnapshot[],
  realmIds: number[],
  brackets: Bracket[],
  generatedAt: string,
  config: WeeklyStatsConfig = DEFAULT_WEEKLY_STATS_CONFIG,
): StatsDataset {
  const window = selectWindowSnapshots(snapshots, generatedAt, config.periodMs)
  const realms: RealmWeeklyStats[] = realmIds.map((id) => ({
    id,
    brackets: Object.fromEntries(
      brackets.map((b) => [b, aggregateBracket(window, id, b, config)]),
    ) as Record<Bracket, BracketWeeklyStats>,
  }))
  return {
    generatedAt,
    periodDays: config.periodDays,
    expectedSnapshotCount: config.expectedSnapshotCount,
    realms,
  }
}
