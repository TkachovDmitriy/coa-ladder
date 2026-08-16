import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, ExternalLink } from "lucide-react"
import { useState } from "react"

import { ClassIcon } from "@/shared/components/class-icon"
import { classColor } from "@/shared/constants/classes.constants"
import { cn } from "@/shared/utils/utils"

import type { LadderEntry } from "../../model/ladder.type"
import { armoryUrl, winRate } from "../../utils/ladder.utils"

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })
const columnHelper = createColumnHelper<LadderEntry>()

const columns = [
  columnHelper.display({
    id: "classIcon",
    header: () => <span className="sr-only">Class icon</span>,
    cell: ({ row }) => <ClassIcon name={row.original.className} size={44} />,
  }),
  columnHelper.accessor("place", {
    header: "#",
    cell: (c) => <span className="text-muted-foreground tabular">{c.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "Player",
    enableSorting: false,
    cell: (c) => <span className="font-medium">{c.getValue()}</span>,
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
    cell: (c) => <span className="font-semibold tabular">{c.getValue().toLocaleString()}</span>,
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
}

export function LadderTable({ entries }: LadderTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "place", desc: false }])

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
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
            <tr key={row.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
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

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  const className = cn("h-3.5 w-3.5", dir ? "text-foreground" : "text-muted-foreground/50")
  if (dir === "asc") return <ArrowUp className={className} />
  if (dir === "desc") return <ArrowDown className={className} />
  return <ChevronsUpDown className={className} />
}
