import { create } from "zustand"

import { DEFAULT_REALM, type RealmId } from "@/shared/constants/realms.constants"

import { fetchLadderDataset } from "../api/ladder.api"
import type { LadderState } from "../model/ladder.type"

interface LadderFilters {
  search: string
  className: string | null
}

interface LadderStore {
  data: LadderState
  realmId: RealmId
  filters: LadderFilters
  load: () => Promise<void>
  setRealm: (realmId: RealmId) => void
  setSearch: (search: string) => void
  setClassName: (className: string | null) => void
}

const INITIAL_FILTERS: LadderFilters = { search: "", className: null }

export const useLadderStore = create<LadderStore>((set, get) => ({
  data: { status: "idle" },
  realmId: DEFAULT_REALM,
  filters: INITIAL_FILTERS,

  load: async () => {
    const status = get().data.status
    if (status === "loading" || status === "success") return
    set({ data: { status: "loading" } })
    try {
      const dataset = await fetchLadderDataset()
      set({ data: { status: "success", dataset } })
    } catch (error) {
      set({ data: { status: "error", error: error instanceof Error ? error.message : "Failed to load ladder" } })
    }
  },

  // Switching realm resets filters — class rosters differ between realms.
  setRealm: (realmId) => set({ realmId, filters: INITIAL_FILTERS }),
  setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),
  setClassName: (className) => set((s) => ({ filters: { ...s.filters, className } })),
}))
