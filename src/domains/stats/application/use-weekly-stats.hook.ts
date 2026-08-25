import { useEffect } from "react"

import type { Bracket } from "@/shared/constants/brackets.constants"
import type { RealmId } from "@/shared/constants/realms.constants"

import type { PlayerWeeklyStats } from "../model/weekly-stats.type"
import { useWeeklyStatsStore } from "./weekly-stats.store"

/** Derived view for a single player's weekly detail page. */
export type PlayerWeeklyView =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "absent" }
  | { status: "not-found" }
  | {
      status: "ready"
      player: PlayerWeeklyStats
      expectedSnapshotCount: number
      periodDays: number
      generatedAt: string
    }

/**
 * Fetch stats.json once and select one player's weekly stats for
 * `realmId`/`bracket`/`name`, classifying the result into render states.
 */
export function usePlayerWeeklyStats(realmId: RealmId, bracket: Bracket, name: string): PlayerWeeklyView {
  const data = useWeeklyStatsStore((s) => s.data)
  const load = useWeeklyStatsStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  if (data.status === "idle" || data.status === "loading") return { status: "loading" }
  if (data.status === "error") return { status: "error", error: data.error }

  const { dataset } = data
  const stats = dataset.realms.find((r) => r.id === realmId)?.brackets[bracket]
  if (!stats) return { status: "absent" }
  const player = stats.players[name]
  if (!player) return { status: "not-found" }

  return {
    status: "ready",
    player,
    expectedSnapshotCount: dataset.expectedSnapshotCount,
    periodDays: dataset.periodDays,
    generatedAt: dataset.generatedAt,
  }
}
