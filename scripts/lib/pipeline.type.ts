/** Shared types for the data pipeline (pull -> enrich -> build-ladder). */

export type Bracket = "1v1" | "2v2" | "3v3"

export interface BracketDef {
  id: Bracket
  /** leaderboard endpoint segment, e.g. "arena-1v1" */
  endpoint: string
}

export interface RealmDef {
  /** game realm id sent to the ladder API */
  id: number
  /** UI label, e.g. "Vol'Jin" */
  name: string
}

/** Raw ladder entry as returned by the game API. */
export interface RawEntry {
  place: number
  name: string
  rating: number
  season_wins: number
  season_losses: number
  [k: string]: unknown
}

export type SpecStatus = "resolved" | "manual" | "no-armory" | "no-talents" | "error" | "n/a"
export type ArmoryStatus = "resolved" | "no-class" | "not-found" | "error"

/** One armory lookup result, cached by character name. */
export interface CacheHit {
  id: number | null
  class: string | null
  realm: string | null
  region: string | null
  has_armory: boolean
  status: ArmoryStatus
  spec: string | null
  spec_status: SpecStatus
  spec_points?: Record<string, number>
}

/** Enriched entry = raw entry + resolved class/spec fields. */
export interface EnrichedEntry extends RawEntry {
  class: string | null
  spec: string | null
  armory_realm: string | null
  armory_status: ArmoryStatus
  spec_status: SpecStatus
}

/** Manual class/spec override for players with no armory capture. */
export interface ManualOverride {
  class?: string
  spec?: string
}

/** Trimmed entry served to the browser. */
export interface LadderEntry {
  place: number
  name: string
  rating: number
  wins: number
  losses: number
  className: string | null
  spec: string | null
  armoryRealm: string | null
  hasArmory: boolean
  /** Rating point change versus the snapshot closest to 24h ago; absent if there's no prior data point. */
  ratingChange?: number
  /** Wins gained versus the snapshot closest to 24h ago; absent if there's no prior data point. */
  winsChange?: number
  /** Losses gained versus the snapshot closest to 24h ago; absent if there's no prior data point. */
  lossesChange?: number
}

/** A player retained after leaving the API's current top 100. */
export interface PreviouslyRankedEntry extends LadderEntry {
  firstSeenAt: string
  lastSeenAt: string
}

/** One player's tracked stats at snapshot time. */
export interface HistoryPoint {
  rating: number
  place: number
  wins: number
  losses: number
}

/** One ladder snapshot: realm id (stringified) -> bracket -> player name -> point. */
export interface HistorySnapshot {
  capturedAt: string
  realms: Record<string, Record<Bracket, Record<string, HistoryPoint>>>
}

/** Rolling window of snapshots, used to compute ratingChange. */
export interface HistoryFile {
  snapshots: HistorySnapshot[]
}

export interface PlayerTrendPoint extends HistoryPoint {
  capturedAt: string
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
  realms: Array<{
    id: number
    brackets: Record<Bracket, BracketPlayerStats>
  }>
}

/** One realm's ladders. */
export interface RealmLadder {
  id: number
  name: string
  brackets: Record<Bracket, LadderEntry[]>
  previouslyRanked: Record<Bracket, PreviouslyRankedEntry[]>
}

export type TrackedPlayer = PreviouslyRankedEntry

/** Durable registry: realm id -> bracket -> player name -> last known data. */
export interface TrackedPlayersFile {
  realms: Record<string, Record<Bracket, Record<string, TrackedPlayer>>>
}

/** The single public dataset the web app fetches (all realms + brackets). */
export interface LadderDataset {
  generatedAt: string
  realms: RealmLadder[]
}
