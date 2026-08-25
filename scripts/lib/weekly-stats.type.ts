/**
 * Types for the derived weekly-statistics dataset (public/stats.json).
 *
 * These describe changes *between aggregate ladder snapshots*, not per-match
 * data — the upstream source contains neither opponents nor individual match
 * results. UI copy should say "between ladder snapshots" for game totals.
 */

import type { Bracket } from "./pipeline.type"

/** How much of the seven-day window a series actually covers. */
export type Coverage = "complete" | "partial" | "insufficient"

/** One compact point on a player's rating trend. */
export interface TrendPoint {
  capturedAt: string
  rating: number
  place: number
}

export interface PlayerWeeklyStats {
  name: string
  firstCapturedAt: string
  lastCapturedAt: string
  snapshotCount: number
  /** lastRating - firstRating over the window. */
  ratingChange: number
  /** firstPlace - lastPlace; positive means the player climbed the ladder. */
  placeChange: number
  /** null when wins/losses are missing or a season reset was detected. */
  wins: number | null
  losses: number | null
  games: number | null
  winRate: number | null
  minRating: number
  maxRating: number
  currentRating: number
  trend: TrendPoint[]
  coverage: Coverage
}

/** A ranked mover in the gainers/fallers lists. */
export interface WeeklyLeader {
  name: string
  ratingChange: number
  placeChange: number
  currentRating: number
}

export interface BracketWeeklyStats {
  /** Earliest/latest window snapshot that actually held this realm+bracket. */
  capturedFrom: string | null
  capturedTo: string | null
  snapshotCount: number
  players: Record<string, PlayerWeeklyStats>
  leaders: {
    gainers: WeeklyLeader[]
    fallers: WeeklyLeader[]
  }
}

export interface RealmWeeklyStats {
  id: number
  brackets: Record<Bracket, BracketWeeklyStats>
}

/** The single public weekly-statistics dataset the web app fetches. */
export interface StatsDataset {
  generatedAt: string
  periodDays: number
  expectedSnapshotCount: number
  realms: RealmWeeklyStats[]
}

/** Tunable thresholds, bundled so aggregation stays pure and testable. */
export interface WeeklyStatsConfig {
  periodMs: number
  periodDays: number
  expectedSnapshotCount: number
  completeMinSnapshots: number
  completeMinSpanDays: number
  partialMinSnapshots: number
  trendMinSnapshots: number
  maxTrendPoints: number
  leadersLimit: number
}
