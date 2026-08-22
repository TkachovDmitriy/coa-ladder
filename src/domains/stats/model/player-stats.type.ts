import type { Bracket } from "@/shared/constants/brackets.constants"

export interface PlayerTrendPoint {
  capturedAt: string
  rating: number
  place: number
  wins: number
  losses: number
}

export type PlayerStatsCoverage = "complete" | "partial" | "insufficient"

export interface PlayerPeriodStats {
  name: string
  firstCapturedAt: string
  lastCapturedAt: string
  snapshotCount: number
  ratingChange: number
  placeChange: number
  wins: number | null
  losses: number | null
  games: number | null
  winRate: number | null
  minRating: number
  maxRating: number
  currentRating: number
  currentPlace: number
  coverage: PlayerStatsCoverage
  trend: PlayerTrendPoint[]
}

export interface BracketPlayerStats {
  capturedFrom: string | null
  capturedTo: string | null
  snapshotCount: number
  players: Record<string, PlayerPeriodStats>
}

export interface PlayerStatsDataset {
  generatedAt: string
  periodDays: number
  realms: Array<{ id: number; brackets: Record<Bracket, BracketPlayerStats> }>
}

export type PlayerStatsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; dataset: PlayerStatsDataset }
