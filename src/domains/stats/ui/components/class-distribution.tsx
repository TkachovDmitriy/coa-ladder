import { ClassIcon } from "@/shared/components/class-icon"
import { classColor } from "@/shared/constants/classes.constants"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"

import type { ClassStat } from "../../model/stats.type"

interface ClassDistributionProps {
  stats: ClassStat[]
}

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 })

const COLUMNS: { key: string; label: string; width: string; hideBelowSm?: boolean; hint: string }[] = [
  { key: "share", label: "Share", width: "w-14", hint: "Percentage of all ranked players playing this class" },
  { key: "players", label: "Players", width: "w-16", hint: "Number of ranked players playing this class" },
  {
    key: "topRating",
    label: "Top rating",
    width: "w-20",
    hideBelowSm: true,
    hint: "Highest rating reached by a player of this class",
  },
  { key: "winRate", label: "Win %", width: "w-14", hint: "Average win rate across this class's players" },
  {
    key: "top10",
    label: "Top 10",
    width: "w-14",
    hideBelowSm: true,
    hint: "How many of this class's players are in the current top 10",
  },
  { key: "best", label: "Best", width: "w-14", hint: "Best rank reached by a player of this class" },
]

/** Class icons + class-colored bars, sorted by share (gamer-friendly view). */
export function ClassDistribution({ stats }: ClassDistributionProps) {
  const max = Math.max(...stats.map((s) => s.share), 0.0001)

  return (
    <div className="space-y-1 overflow-x-auto">
      <div className="grid min-w-[38rem] grid-cols-[minmax(8.5rem,10rem)_1fr_auto] items-center gap-3 px-1 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
        <span>Class</span>
        <span>Share</span>
        <div className="flex shrink-0 justify-end gap-3">
          {COLUMNS.map((col) => (
            <Tooltip key={col.key}>
              <TooltipTrigger asChild>
                <span
                  className={`${col.width} shrink-0 whitespace-nowrap text-right underline decoration-dotted underline-offset-2 cursor-help ${col.hideBelowSm ? "hidden sm:inline-block" : ""}`}
                >
                  {col.label}
                </span>
              </TooltipTrigger>
              <TooltipContent>{col.hint}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {stats.map((stat) => {
        const color = classColor(stat.className)
        return (
          <div
            key={stat.className}
            className="grid min-w-[38rem] grid-cols-[minmax(8.5rem,10rem)_1fr_auto] items-center gap-3 rounded-md px-1 py-1 hover:bg-secondary/40"
          >
            <div className="flex min-w-0 items-center gap-2">
              <ClassIcon name={stat.className} size={22} />
              <span className="truncate text-sm font-medium" style={{ color }}>
                {stat.className}
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-secondary/70">
              <div
                className="h-full rounded-full"
                style={{ width: `${(stat.share / max) * 100}%`, backgroundColor: color }}
              />
            </div>

            <div className="flex shrink-0 justify-end gap-3 text-sm tabular">
              <span className="w-14 shrink-0 text-right font-medium">{percent.format(stat.share)}</span>
              <span className="w-16 shrink-0 text-right text-muted-foreground">{stat.players}</span>
              <span className="hidden w-20 shrink-0 text-right text-muted-foreground sm:inline-block">
                {stat.topRating.toLocaleString()}
              </span>
              <span className="w-14 shrink-0 text-right text-muted-foreground">{percent.format(stat.avgWinRate)}</span>
              <span className="hidden w-14 shrink-0 text-right text-muted-foreground sm:inline-block">{stat.top10}</span>
              <span className="w-14 shrink-0 text-right text-muted-foreground">#{stat.bestPlace}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
