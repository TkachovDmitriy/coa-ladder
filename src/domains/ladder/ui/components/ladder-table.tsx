import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, Crown, ExternalLink, Medal, ShieldQuestion } from "lucide-react"

import { ClassIcon } from "@/shared/components/class-icon"
import { classColor } from "@/shared/constants/classes.constants"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/utils/utils"

import type { LadderEntry } from "../../model/ladder.type"
import { armoryUrl, winRate } from "../../utils/ladder.utils"

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })
const ratingChangePercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "always",
})
const columnHelper = createColumnHelper<LadderEntry>()

const columns = [
  columnHelper.display({
    id: "classIcon",
    header: () => <span className="sr-only">Class icon</span>,
    cell: ({ row }) => <ClassIcon name={row.original.className} size={44} />,
  }),
  columnHelper.accessor("place", {
    header: "#",
    cell: (c) => <RankBadge place={c.getValue()} />,
  }),
  columnHelper.accessor("name", {
    header: "Player",
    enableSorting: false,
    cell: (c) => {
      const name = c.getValue()
      if (!name) return <span className="text-muted-foreground">—</span>
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="font-medium">{name}</span>
          {c.row.original.hasArmory ? null : <NoArmoryBadge />}
        </span>
      )
    },
  }),
  columnHelper.accessor("className", {
    header: "Class",
    cell: (c) => {
      const name = c.getValue()
      if (!name) return <span className="text-muted-foreground">—</span>
      return (
        <span className="font-medium" style={{ color: classColor(name) }}>
          {name}
        </span>
      )
    },
  }),
  columnHelper.accessor("rating", {
    header: "Rating",
    cell: (c) => (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-semibold tabular">{c.getValue().toLocaleString()}</span>
        <RatingChangeBadge value={c.row.original.ratingChange} />
      </span>
    ),
  }),
  columnHelper.display({
    id: "record",
    header: "W–L",
    cell: ({ row }) => (
      <span className="tabular text-muted-foreground">
        {row.original.wins}–{row.original.losses}
      </span>
    ),
  }),
  columnHelper.accessor((row) => winRate(row), {
    id: "winRate",
    header: "Win%",
    cell: (c) => <span className="tabular">{percent.format(c.getValue())}</span>,
  }),
  columnHelper.accessor("spec", {
    header: "Spec",
    enableSorting: false,
    cell: (c) => c.getValue() ?? <span className="text-muted-foreground">—</span>,
  }),
  columnHelper.display({
    id: "armory",
    header: () => <span className="sr-only">Armory</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <a
          href={armoryUrl(row.original)}
          target="_blank"
          rel="noreferrer"
          title={`Open ${row.original.name} on the armory`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="sr-only">Open {row.original.name} on the armory</span>
        </a>
      </div>
    ),
  }),
]

interface LadderTableProps {
  entries: LadderEntry[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}

export function LadderTable({ entries, sorting, onSortingChange }: LadderTableProps) {
  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting },
    onSortingChange: (updater) => onSortingChange(typeof updater === "function" ? updater(sorting) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-border bg-secondary/40">
              {group.headers.map((header) => {
                const sortable = header.column.getCanSort()
                const dir = header.column.getIsSorted()
                return (
                  <th key={header.id} className="px-3 py-2 text-left font-medium text-muted-foreground">
                    {sortable ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon dir={dir} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={cn("border-b border-border/50 last:border-0", rankRowClass(row.original.place))}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                No players match your filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function RankBadge({ place }: { place: number }) {
  if (place === 1) {
    return (
      <span className="inline-flex min-w-9 items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-1 font-semibold text-amber-500 tabular dark:text-amber-400" aria-label="Rank 1, ladder leader">
        <Crown className="h-4.5 w-4.5" strokeWidth={2.5} aria-hidden="true" />1
      </span>
    )
  }

  if (place <= 3) {
    const color = place === 2 ? "text-slate-400" : "text-amber-700 dark:text-amber-600"
    return (
      <span className={cn("inline-flex min-w-10 items-center gap-1 rounded-md px-1 py-1 font-semibold tabular", color)} aria-label={`Rank ${place}`}>
        <Medal className="h-4.5 w-4.5" strokeWidth={2.25} aria-hidden="true" />{place}
      </span>
    )
  }

  if (place <= 5) {
    return (
      <span className="inline-flex min-w-10 items-center gap-1 rounded-md bg-secondary px-1 py-1 font-semibold text-foreground tabular" aria-label={`Rank ${place}`}>
        <Medal className="h-4.5 w-4.5 text-primary/70" strokeWidth={2.25} aria-hidden="true" />{place}
      </span>
    )
  }

  return <span className="text-muted-foreground tabular">{place}</span>
}

function rankRowClass(place: number) {
  if (place === 1) return "bg-amber-500/[0.07] hover:bg-amber-500/[0.11]"
  if (place <= 5) return "bg-secondary/20 hover:bg-secondary/40"
  return "hover:bg-secondary/30"
}

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  const className = cn("h-3.5 w-3.5", dir ? "text-foreground" : "text-muted-foreground/50")
  if (dir === "asc") return <ArrowUp className={className} />
  if (dir === "desc") return <ArrowDown className={className} />
  return <ChevronsUpDown className={className} />
}

function RatingChangeBadge({ value }: { value: number | undefined }) {
  if (value === undefined || value === 0) return null
  const up = value > 0
  const color = up ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular", color)}>
      <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
      {ratingChangePercent.format(value / 100)}
    </span>
  )
}

function NoArmoryBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ShieldQuestion className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-label="No armory data" />
      </TooltipTrigger>
      <TooltipContent>No armory data — class/spec could not be resolved.</TooltipContent>
    </Tooltip>
  )
}
