import { useEffect, useMemo } from "react"

import type { Bracket } from "@/shared/constants/brackets.constants"
import { type RealmId, realmName } from "@/shared/constants/realms.constants"

import type { LadderSearchParams } from "../model/ladder-search.type"
import type { LadderEntry, LadderState, PreviouslyRankedEntry } from "../model/ladder.type"
import { filterEntries } from "../utils/ladder.utils"
import { useLadderStore } from "./ladder.store"

interface UseLadderResult {
  state: LadderState
  realmId: RealmId
  realmName: string
  setRealm: (realmId: RealmId) => void
  /** all entries for the bracket (drives stats + tiles). */
  bracketEntries: LadderEntry[]
  /** entries after search/class/spec filter (drives the table; TanStack Table sorts). */
  visibleEntries: LadderEntry[]
  previouslyRankedEntries: PreviouslyRankedEntry[]
  classOptions: string[]
  specOptions: string[]
  generatedAt: string | null
}

/** Load the dataset once and derive the current realm + bracket's view, filtered by the URL search params. */
export function useLadder(bracket: Bracket, search: LadderSearchParams): UseLadderResult {
  const state = useLadderStore((s) => s.data)
  const realmId = useLadderStore((s) => s.realmId)
  const load = useLadderStore((s) => s.load)
  const setRealm = useLadderStore((s) => s.setRealm)

  useEffect(() => {
    void load()
  }, [load])

  const realm = state.status === "success" ? state.dataset.realms.find((r) => r.id === realmId) : undefined
  const bracketEntries = realm?.brackets[bracket] ?? []
  const previouslyRankedEntries = realm?.previouslyRanked?.[bracket] ?? []
  const generatedAt = state.status === "success" ? state.dataset.generatedAt : null

  const classOptions = useMemo(() => {
    const set = new Set<string>()
    for (const e of bracketEntries) if (e.className) set.add(e.className)
    return [...set].sort()
  }, [bracketEntries])

  const specOptions = useMemo(() => {
    const set = new Set<string>()
    for (const e of bracketEntries) if (e.spec) set.add(e.spec)
    return [...set].sort()
  }, [bracketEntries])

  const visibleEntries = useMemo(
    () => filterEntries(bracketEntries, search.search, search.class, search.spec),
    [bracketEntries, search.search, search.class, search.spec],
  )

  return {
    state,
    realmId,
    realmName: realmName(realmId),
    setRealm,
    bracketEntries,
    visibleEntries,
    previouslyRankedEntries,
    classOptions,
    specOptions,
    generatedAt,
  }
}
