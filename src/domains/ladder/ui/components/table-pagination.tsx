import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/shared/components/ui/button"

const PAGE_SIZES = [25, 50, 100] as const

interface TablePaginationProps {
  pageIndex: number
  pageSize: number
  totalItems: number
  onPageIndexChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function TablePagination({
  pageIndex,
  pageSize,
  totalItems,
  onPageIndexChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = totalItems === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm text-muted-foreground">
      <span>{from}–{to} of {totalItems}</span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-foreground"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <span className="min-w-20 text-center">Page {pageIndex + 1} of {pageCount}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={pageIndex === 0}
          onClick={() => onPageIndexChange(pageIndex - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageIndexChange(pageIndex + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
