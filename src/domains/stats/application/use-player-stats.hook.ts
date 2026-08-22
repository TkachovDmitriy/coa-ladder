import { useEffect } from "react"

import type { Bracket } from "@/shared/constants/brackets.constants"

import { usePlayerStatsStore } from "./player-stats.store"

export function usePlayerStats(realmId: number, bracket: Bracket, playerName: string) {
  const state = usePlayerStatsStore((store) => store.data)
  const load = usePlayerStatsStore((store) => store.load)

  useEffect(() => { void load() }, [load])

  const bracketStats = state.status === "success"
    ? state.dataset.realms.find((realm) => realm.id === realmId)?.brackets[bracket]
    : undefined
  const player = bracketStats?.players[playerName.toLocaleLowerCase("en-US")]

  return { state, bracketStats, player }
}
