import { Search } from "lucide-react"

import { ClassIcon } from "@/shared/components/class-icon"
import { Button } from "@/shared/components/ui/button"
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
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search player…"
            className="w-full pl-8"
          />
        </div>
        <span className="ml-auto shrink-0 text-sm text-muted-foreground tabular">{resultCount} players</span>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1" aria-label="Filter by class">
        <div className="flex w-max items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={className === null ? "default" : "outline"}
            aria-pressed={className === null}
            onClick={() => onClassName(null)}
          >
            All classes
          </Button>
          {classOptions.map((cls) => {
            const selected = className === cls

            return (
              <Button
                key={cls}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={selected}
                onClick={() => onClassName(selected ? null : cls)}
                className={cn(selected && "border-primary bg-primary/10 text-foreground ring-1 ring-primary")}
              >
                <ClassIcon name={cls} size={20} />
                {cls}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
