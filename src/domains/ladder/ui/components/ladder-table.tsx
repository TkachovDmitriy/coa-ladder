import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, CircleHelp, Crown, Medal, ShieldQuestion, Swords } from "lucide-react"

import { ClassIcon } from "@/shared/components/class-icon"
import { classColor } from "@/shared/constants/classes.constants"
import { Button } from "@/shared/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/utils/utils"

import type { LadderEntry } from "../../model/ladder.type"
import { armoryUrl, winRate } from "../../utils/ladder.utils"
import { TablePagination } from "./table-pagination"

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })
const signedNumber = new Intl.NumberFormat("en-US", { signDisplay: "always" })
const columnHelper = createColumnHelper<LadderEntry>()

function buildColumns(realmId: number) {
  return [
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
      header: () => <ChangeHeader label="Rating" />,
      cell: (c) => (
        <span className="inline-flex items-baseline gap-1.5">
          <span className="font-semibold tabular">{c.getValue().toLocaleString()}</span>
          <RatingChangeBadge value={c.row.original.ratingChange} />
        </span>
      ),
    }),
    columnHelper.display({
      id: "record",
      header: () => <ChangeHeader label="W–L" />,
      cell: ({ row }) => (
        <span className="inline-flex items-baseline gap-1.5">
          <span className="tabular text-muted-foreground">
            {row.original.wins}–{row.original.losses}
          </span>
          <RecordChangeBadge wins={row.original.winsChange} losses={row.original.lossesChange} />
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
          {row.original.spec ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={armoryUrl(row.original, realmId)}
                target="_blank"
                rel="noreferrer"
                title={`View ${row.original.name}'s gear on the armory`}
              >
                <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                View gear
                <span className="sr-only">for {row.original.name} on the armory</span>
              </a>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-block cursor-not-allowed">
                  <Button variant="outline" size="sm" className="gap-1.5 pointer-events-none" disabled>
                    <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                    View gear
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.hasArmory
                  ? "No gear/talent capture on the armory for this player."
                  : "No armory data — this player couldn't be resolved."}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    }),
  ]
}

interface LadderTableProps {
  entries: LadderEntry[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  realmId: number
}

export function LadderTable({ entries, sorting, onSortingChange, realmId }: LadderTableProps) {
  const columns = useMemo(() => buildColumns(realmId), [realmId])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [entries])

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setPagination((current) => ({ ...current, pageIndex: 0 }))
      onSortingChange(typeof updater === "function" ? updater(sorting) : updater)
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="rounded-lg border border-border">
      <div className="overflow-x-auto">
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
      <TablePagination
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={entries.length}
        onPageIndexChange={(pageIndex) => table.setPageIndex(pageIndex)}
        onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
      />
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

function ChangeHeader({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1">
          {label}
          <CircleHelp className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Change over the last 24 hours.</TooltipContent>
    </Tooltip>
  )
}

function RatingChangeBadge({ value }: { value: number | undefined }) {
  if (value === undefined || value === 0) return null
  const up = value > 0
  const color = up ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular", color)}>
      <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
      {signedNumber.format(value)}
    </span>
  )
}

function RecordChangeBadge({ wins, losses }: { wins: number | undefined; losses: number | undefined }) {
  if (!wins && !losses) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium tabular">
      {wins ? <span className="text-emerald-600 dark:text-emerald-500">{signedNumber.format(wins)}</span> : null}
      {losses ? <span className="text-red-600 dark:text-red-500">{signedNumber.format(-losses)}</span> : null}
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
