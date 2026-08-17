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
  /** Rating point change vs. the last earlier-day snapshot; absent if there's no prior data point. */
  ratingChange?: number
  /** Wins gained since the last earlier-day snapshot; absent if there's no prior data point. */
  winsChange?: number
  /** Losses gained since the last earlier-day snapshot; absent if there's no prior data point. */
  lossesChange?: number
}

/** One player's tracked stats at snapshot time. */
export interface HistoryPoint {
  rating: number
  place: number
  wins: number
  losses: number
}

/** One daily ladder snapshot: realm id (stringified) -> bracket -> player name -> point. */
export interface HistorySnapshot {
  capturedAt: string
  realms: Record<string, Record<Bracket, Record<string, HistoryPoint>>>
}

/** Rolling window of daily snapshots, used to compute ratingChange. */
export interface HistoryFile {
  snapshots: HistorySnapshot[]
}

/** One realm's ladders. */
export interface RealmLadder {
  id: number
  name: string
  brackets: Record<Bracket, LadderEntry[]>
}

/** The single public dataset the web app fetches (all realms + brackets). */
export interface LadderDataset {
  generatedAt: string
  realms: RealmLadder[]
}
