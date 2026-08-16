import { Crown, Trophy } from "lucide-react"
import { useMemo, type ReactNode } from "react"

import { ClassIcon } from "@/shared/components/class-icon"
import { classColor } from "@/shared/constants/classes.constants"
import { Card, CardContent } from "@/shared/components/ui/card"
import { cn } from "@/shared/utils/utils"

import type { LadderEntry } from "../../model/ladder.type"
import { summarize } from "../../utils/ladder.utils"

interface StatTilesProps {
  entries: LadderEntry[]
}

export function StatTiles({ entries }: StatTilesProps) {
  const summary = useMemo(() => summarize(entries), [entries])
  const { topEntry, resolved, total, dominantClass, avgRating } = summary

  return (
    <div className="space-y-3">
      <TopPlayer entry={topEntry} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile label="Avg rating" value={avgRating.toLocaleString()} sub={`${total} players`} />
        <Tile label="Armory resolved" value={`${resolved}/${total}`} sub="class known" />
        <Tile
          label="Dominant class"
          value={dominantClass ?? "—"}
          icon={dominantClass}
          accent={dominantClass ? classColor(dominantClass) : undefined}
          iconSize={32}
          valueClassName="truncate"
          className="col-span-2 lg:col-span-1"
        />
      </div>
    </div>
  )
}

function TopPlayer({ entry }: { entry: LadderEntry | null }) {
  const accent = classColor(entry?.className ?? null)

  return (
    <Card
      className="relative overflow-hidden border-amber-500/40 bg-amber-500/[0.06] shadow-[0_12px_30px_rgba(245,158,11,0.14)]"
      style={{ borderColor: `${accent}88` }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-70"
        style={{ background: `radial-gradient(circle at right center, ${accent}38, transparent 65%)` }}
      />
      <CardContent className="relative flex min-w-0 items-center gap-3 p-4 sm:gap-5 sm:p-5">
        <ClassIcon name={entry?.className ?? null} size={64} className="rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            Top rating
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-2 text-2xl font-bold leading-tight sm:text-3xl" style={{ color: accent }}>
            <Crown className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-label="Ladder leader" />
            <span className="truncate">{entry?.name ?? "—"}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-amber-500 dark:text-amber-400">#1</span>
            {entry?.className ? ` · ${entry.className}${entry.spec ? ` — ${entry.spec}` : ""}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Rating</p>
          <p className="mt-1 text-3xl font-bold leading-none tabular sm:text-4xl">{entry ? entry.rating.toLocaleString() : "—"}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface TileProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: string
  icon?: string | null
  iconSize?: number
  featured?: boolean
  valueClassName?: string
  subClassName?: string
  className?: string
}

function Tile({ label, value, sub, accent, icon, iconSize = 20, featured = false, valueClassName, subClassName, className }: TileProps) {
  return (
    <Card className={cn(featured && "border-primary/40 bg-primary/[0.06] shadow-[0_8px_24px_hsl(var(--primary)/0.12)]", className)}>
      <CardContent className="p-4">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
          {featured ? <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : null}
          {label}
        </p>
        <p className={cn("mt-1 flex min-w-0 items-center gap-2 text-xl font-semibold tabular", valueClassName)}>
          {icon ? (
            <ClassIcon name={icon} size={iconSize} />
          ) : accent ? (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
          ) : null}
          <span className="truncate" style={accent && !featured ? { color: accent } : undefined}>
            {value}
          </span>
        </p>
        {sub ? <p className={cn("mt-0.5 truncate text-xs text-muted-foreground", subClassName)}>{sub}</p> : null}
      </CardContent>
    </Card>
  )
}
