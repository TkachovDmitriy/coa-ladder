import { ChevronDown, Ghost, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { ClassIcon } from "@/shared/components/class-icon"
import { Input } from "@/shared/components/ui/input"
import { classColor } from "@/shared/constants/classes.constants"

import type { PreviouslyRankedEntry } from "../../model/ladder.type"
import { TablePagination } from "./table-pagination"

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" })

interface PreviouslyRankedTableProps {
  entries: PreviouslyRankedEntry[]
  currentCutoff: number | null
}

export function PreviouslyRankedTable({ entries, currentCutoff }: PreviouslyRankedTableProps) {
  const [search, setSearch] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...entries]
      .filter((entry) => !query || entry.name.toLowerCase().includes(query))
      .sort((a, b) => b.rating - a.rating || b.lastSeenAt.localeCompare(a.lastSeenAt))
  }, [entries, search])
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const pageEntries = visible.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  useEffect(() => {
    setPageIndex(0)
  }, [entries])

  useEffect(() => {
    if (pageIndex >= pageCount) setPageIndex(pageCount - 1)
  }, [pageCount, pageIndex])

  if (entries.length === 0) return null

  return (
    <details open className="group overflow-hidden rounded-xl border border-dashed border-border bg-card/60 shadow-sm open:border-solid open:bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 marker:hidden transition-colors hover:bg-secondary/30 sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors group-open:bg-primary/10 group-open:text-primary">
          <Ghost className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="font-semibold">Hall of Fallen Heroes</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular">
              {entries.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Once top 100. Now waiting for the comeback arc.</p>
        </div>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="space-y-3 border-t border-border p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          Ratings and records are last known values, not live data.
          {currentCutoff === null ? null : ` A missing player's current rating may be at or below the top-100 cutoff of ${currentCutoff.toLocaleString()}.`}
        </p>
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPageIndex(0)
            }}
            placeholder="Search tracked players"
            aria-label="Search previously ranked players"
            className="pl-9"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium"><span className="sr-only">Class icon</span></th>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-3 py-2 font-medium">Class</th>
                <th className="px-3 py-2 font-medium">Last rating</th>
                <th className="px-3 py-2 font-medium">Last rank</th>
                <th className="px-3 py-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {pageEntries.map((entry) => (
                <tr key={entry.name} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                  <td className="px-3 py-2"><ClassIcon name={entry.className} size={36} /></td>
                  <td className="px-3 py-2 font-medium">{entry.name}</td>
                  <td className="px-3 py-2 font-medium" style={entry.className ? { color: classColor(entry.className) } : undefined}>
                    {entry.className ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-semibold tabular">{entry.rating.toLocaleString()}</td>
                  <td className="px-3 py-2 text-muted-foreground tabular">#{entry.place}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{dateTime.format(new Date(entry.lastSeenAt))}</td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No tracked players match your search.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <TablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={visible.length}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPageIndex(0)
          }}
        />
      </div>
    </details>
  )
}
