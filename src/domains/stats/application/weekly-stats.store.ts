import { create } from "zustand"

import { fetchStatsDataset } from "../api/weekly-stats.api"
import type { WeeklyStatsState } from "../model/weekly-stats.type"

interface WeeklyStatsStore {
  data: WeeklyStatsState
  load: () => Promise<void>
}

/** Fetches stats.json once; the active realm/bracket are selected downstream. */
export const useWeeklyStatsStore = create<WeeklyStatsStore>((set, get) => ({
  data: { status: "idle" },

  load: async () => {
    const status = get().data.status
    if (status === "loading" || status === "success") return
    set({ data: { status: "loading" } })
    try {
      const dataset = await fetchStatsDataset()
      set({ data: { status: "success", dataset } })
    } catch (error) {
      set({ data: { status: "error", error: error instanceof Error ? error.message : "Failed to load stats" } })
    }
  },
}))
