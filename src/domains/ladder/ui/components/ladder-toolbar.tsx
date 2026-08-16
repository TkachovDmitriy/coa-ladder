import { Search } from "lucide-react"

import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/utils/utils"

interface LadderToolbarProps {
  search: string
  className: string | null
  classOptions: string[]
  onSearch: (value: string) => void
  onClassName: (value: string | null) => void
  resultCount: number
}

export function LadderToolbar({
  search,
  className,
  classOptions,
  onSearch,
  onClassName,
  resultCount,
}: LadderToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search player…"
          className="w-56 pl-8"
        />
      </div>

      <select
        value={className ?? ""}
        onChange={(e) => onClassName(e.target.value || null)}
        className={cn(
          "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <option value="">All classes</option>
        {classOptions.map((cls) => (
          <option key={cls} value={cls}>
            {cls}
          </option>
        ))}
      </select>

      <span className="ml-auto text-sm text-muted-foreground tabular">{resultCount} players</span>
    </div>
  )
}
