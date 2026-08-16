/** Table columns the user can sort by (matches `columnHelper` ids in ladder-table.tsx). */
export type SortableLadderColumn = "place" | "className" | "rating" | "winRate"

export type SortDirection = "asc" | "desc"

/** Filter + sort state, serialized to the `$bracket` route's URL search params so views are shareable. */
export interface LadderSearchParams {
  search: string
  class: string | null
  spec: string | null
  sort: SortableLadderColumn | null
  dir: SortDirection | null
}
