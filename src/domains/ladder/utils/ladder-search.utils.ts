import type { SortingState } from "@tanstack/react-table"

import type { LadderSearchParams, SortableLadderColumn } from "../model/ladder-search.type"

const SORTABLE_COLUMNS: readonly SortableLadderColumn[] = ["place", "className", "rating", "winRate"]

function isSortableColumn(value: string): value is SortableLadderColumn {
  return (SORTABLE_COLUMNS as readonly string[]).includes(value)
}

export const DEFAULT_LADDER_SEARCH: LadderSearchParams = { search: "", class: null, spec: null, sort: null, dir: null }

/** Parse+narrow raw URL search params (TanStack Router's `validateSearch`). Unknown/invalid values fall back to defaults. */
export function validateLadderSearch(search: Record<string, unknown>): LadderSearchParams {
  const sort = typeof search.sort === "string" && isSortableColumn(search.sort) ? search.sort : null
  const dir = search.dir === "asc" || search.dir === "desc" ? search.dir : null

  // Treat the literal "null" string as absent — older shared links serialized
  // an unset filter as `class=null`/`spec=null`; a real class/spec is never "null".
  const asFilter = (value: unknown) => (typeof value === "string" && value !== "null" ? value : null)

  return {
    search: typeof search.search === "string" ? search.search : "",
    class: asFilter(search.class),
    spec: asFilter(search.spec),
    sort,
    dir: sort ? (dir ?? "asc") : null,
  }
}

/** Table's default view: ranked by place, ascending. */
const DEFAULT_SORTING: SortingState = [{ id: "place", desc: false }]

export function toSortingState(params: Pick<LadderSearchParams, "sort" | "dir">): SortingState {
  if (!params.sort) return DEFAULT_SORTING
  return [{ id: params.sort, desc: params.dir === "desc" }]
}

/** The default sort (place asc) is omitted from the URL to keep links clean. */
export function fromSortingState(sorting: SortingState): Pick<LadderSearchParams, "sort" | "dir"> {
  const [first] = sorting
  if (!first || (first.id === "place" && !first.desc)) return { sort: null, dir: null }
  return { sort: first.id as SortableLadderColumn, dir: first.desc ? "desc" : "asc" }
}
