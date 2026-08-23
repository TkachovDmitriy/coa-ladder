import { Search } from "lucide-react"

import { ClassIcon } from "@/shared/components/class-icon"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"
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

      <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by class">
        <Button
          type="button"
          size="sm"
          variant={className === null ? "default" : "outline"}
          aria-pressed={className === null}
          onClick={() => onClassName(null)}
        >
          All
        </Button>
        {classOptions.map((cls) => {
          const selected = className === cls

          return (
            <Tooltip key={cls}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Filter by ${cls}`}
                  aria-pressed={selected}
                  onClick={() => onClassName(selected ? null : cls)}
                  className={cn(
                    "size-[58px]",
                    selected && "border-primary bg-primary/10 text-foreground ring-1 ring-primary",
                  )}
                >
                  <ClassIcon name={cls} size={44} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{cls}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
