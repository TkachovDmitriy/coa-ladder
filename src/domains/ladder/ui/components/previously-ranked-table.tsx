import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { ClassIcon } from "@/shared/components/class-icon"
import { Input } from "@/shared/components/ui/input"
import { classColor } from "@/shared/constants/classes.constants"

import type { PreviouslyRankedEntry } from "../../model/ladder.type"

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" })

interface PreviouslyRankedTableProps {
  entries: PreviouslyRankedEntry[]
  currentCutoff: number | null
}

export function PreviouslyRankedTable({ entries, currentCutoff }: PreviouslyRankedTableProps) {
  const [search, setSearch] = useState("")
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...entries]
      .filter((entry) => !query || entry.name.toLowerCase().includes(query))
      .sort((a, b) => b.rating - a.rating || b.lastSeenAt.localeCompare(a.lastSeenAt))
  }, [entries, search])

  if (entries.length === 0) return null

  return (
    <details className="group rounded-lg border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <div>
          <h2 className="font-semibold">Previously ranked</h2>
          <p className="text-sm text-muted-foreground">
            {entries.length} tracked {entries.length === 1 ? "player" : "players"} outside the current top 100
          </p>
        </div>
        <span className="text-sm text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden text-sm text-muted-foreground group-open:inline">Hide</span>
      </summary>

      <div className="space-y-3 border-t border-border p-4">
        <p className="text-sm text-muted-foreground">
          Ratings and records are last known values, not live data.
          {currentCutoff === null ? null : ` A missing player's current rating may be at or below the top-100 cutoff of ${currentCutoff.toLocaleString()}.`}
        </p>
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
              {visible.map((entry) => (
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
      </div>
    </details>
  )
}
