import type { Bracket } from "@/shared/constants/brackets.constants"

/**
 * Frontend shape of the derived weekly-statistics dataset (public/stats.json).
 * Mirrors scripts/lib/weekly-stats.type.ts — the build produces it, the app
 * consumes it. All figures are changes *between ladder snapshots*, not matches.
 */

export type Coverage = "complete" | "partial" | "insufficient"

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
  ratingChange: number
  /** positive means the player climbed the ladder */
  placeChange: number
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

export interface WeeklyLeader {
  name: string
  ratingChange: number
  placeChange: number
  currentRating: number
}

export interface BracketWeeklyStats {
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

export interface StatsDataset {
  generatedAt: string
  periodDays: number
  expectedSnapshotCount: number
  realms: RealmWeeklyStats[]
}

/** Load state as a discriminated union, matching the ladder domain's pattern. */
export type WeeklyStatsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; dataset: StatsDataset }
