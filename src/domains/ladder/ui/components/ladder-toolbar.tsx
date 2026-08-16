import { Search } from "lucide-react"

import { Input } from "@/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"

const ALL_VALUE = "__all__"

interface LadderToolbarProps {
  search: string
  className: string | null
  classOptions: string[]
  spec: string | null
  specOptions: string[]
  onSearch: (value: string) => void
  onClassName: (value: string | null) => void
  onSpec: (value: string | null) => void
  resultCount: number
}

export function LadderToolbar({
  search,
  className,
  classOptions,
  spec,
  specOptions,
  onSearch,
  onClassName,
  onSpec,
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

      <Select value={className ?? ALL_VALUE} onValueChange={(v) => onClassName(v === ALL_VALUE ? null : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All classes</SelectItem>
          {classOptions.map((cls) => (
            <SelectItem key={cls} value={cls}>
              {cls}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={spec ?? ALL_VALUE} onValueChange={(v) => onSpec(v === ALL_VALUE ? null : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All specs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All specs</SelectItem>
          {specOptions.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="ml-auto text-sm text-muted-foreground tabular">{resultCount} players</span>
    </div>
  )
}
