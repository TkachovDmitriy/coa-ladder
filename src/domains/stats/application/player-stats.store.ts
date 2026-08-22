import { create } from "zustand"

import { fetchPlayerStatsDataset } from "../api/player-stats.api"
import type { PlayerStatsState } from "../model/player-stats.type"

interface PlayerStatsStore {
  data: PlayerStatsState
  load: () => Promise<void>
}

export const usePlayerStatsStore = create<PlayerStatsStore>((set, get) => ({
  data: { status: "idle" },
  load: async () => {
    if (get().data.status === "loading" || get().data.status === "success") return
    set({ data: { status: "loading" } })
    try {
      set({ data: { status: "success", dataset: await fetchPlayerStatsDataset() } })
    } catch (error) {
      set({ data: { status: "error", error: error instanceof Error ? error.message : "Failed to load player statistics" } })
    }
  },
}))
