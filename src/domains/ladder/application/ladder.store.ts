import { create } from "zustand"

import { DEFAULT_REALM, type RealmId } from "@/shared/constants/realms.constants"

import { fetchLadderDataset } from "../api/ladder.api"
import type { LadderState } from "../model/ladder.type"

interface LadderStore {
  data: LadderState
  realmId: RealmId
  load: () => Promise<void>
  setRealm: (realmId: RealmId) => void
}

export const useLadderStore = create<LadderStore>((set, get) => ({
  data: { status: "idle" },
  realmId: DEFAULT_REALM,

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

  setRealm: (realmId) => set({ realmId }),
}))
