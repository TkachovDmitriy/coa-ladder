import { useEffect, useMemo } from "react"

import type { Bracket } from "@/shared/constants/brackets.constants"
import { type RealmId, realmName } from "@/shared/constants/realms.constants"

import type { LadderEntry, LadderState } from "../model/ladder.type"
import { filterEntries } from "../utils/ladder.utils"
import { useLadderStore } from "./ladder.store"

interface UseLadderResult {
  state: LadderState
  realmId: RealmId
  realmName: string
  setRealm: (realmId: RealmId) => void
  /** all entries for the bracket (drives stats + tiles). */
  bracketEntries: LadderEntry[]
  /** entries after search/class filter (drives the table; TanStack Table sorts). */
  visibleEntries: LadderEntry[]
  classOptions: string[]
  generatedAt: string | null
  search: string
  className: string | null
  setSearch: (search: string) => void
  setClassName: (className: string | null) => void
}

/** Load the dataset once and derive the current realm + bracket's view. */
export function useLadder(bracket: Bracket): UseLadderResult {
  const state = useLadderStore((s) => s.data)
  const realmId = useLadderStore((s) => s.realmId)
  const filters = useLadderStore((s) => s.filters)
  const load = useLadderStore((s) => s.load)
  const setRealm = useLadderStore((s) => s.setRealm)
  const setSearch = useLadderStore((s) => s.setSearch)
  const setClassName = useLadderStore((s) => s.setClassName)

  useEffect(() => {
    void load()
  }, [load])

  const realm = state.status === "success" ? state.dataset.realms.find((r) => r.id === realmId) : undefined
  const bracketEntries = realm?.brackets[bracket] ?? []
  const generatedAt = state.status === "success" ? state.dataset.generatedAt : null

  const classOptions = useMemo(() => {
    const set = new Set<string>()
    for (const e of bracketEntries) if (e.className) set.add(e.className)
    return [...set].sort()
  }, [bracketEntries])

  const visibleEntries = useMemo(
    () => filterEntries(bracketEntries, filters.search, filters.className),
    [bracketEntries, filters],
  )

  return {
    state,
    realmId,
    realmName: realmName(realmId),
    setRealm,
    bracketEntries,
    visibleEntries,
    classOptions,
    generatedAt,
    search: filters.search,
    className: filters.className,
    setSearch,
    setClassName,
  }
}
