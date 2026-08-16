import type { Bracket } from "@/shared/constants/brackets.constants"

/** One ladder row as served in ladder.json. */
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
  /** % change vs. the last earlier-day snapshot; absent if there's no prior data point. */
  ratingChange?: number
}

/** One realm's ladders, keyed by bracket. */
export interface RealmLadder {
  id: number
  name: string
  brackets: Record<Bracket, LadderEntry[]>
}

/** The full dataset the app fetches (all realms + brackets in one file). */
export interface LadderDataset {
  generatedAt: string
  realms: RealmLadder[]
}

/** Headline numbers for the stat tiles. */
export interface LadderSummary {
  total: number
  resolved: number
  topEntry: LadderEntry | null
  dominantClass: string | null
  avgRating: number
}

/** Load state as a discriminated union — never a bare boolean/null. */
export type LadderState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; dataset: LadderDataset }
