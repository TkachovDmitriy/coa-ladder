import { ClassIcon } from "@/shared/components/class-icon"
import { classColor } from "@/shared/constants/classes.constants"

import type { ClassStat } from "../../model/stats.type"

interface ClassDistributionProps {
  stats: ClassStat[]
}

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 })

/** Class icons + class-colored bars, sorted by share (gamer-friendly view). */
export function ClassDistribution({ stats }: ClassDistributionProps) {
  const max = Math.max(...stats.map((s) => s.share), 0.0001)

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[minmax(8.5rem,10rem)_1fr_auto] items-center gap-3 px-1 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
        <span>Class</span>
        <span>Share</span>
        <span className="text-right">Share / Players / Best</span>
      </div>

      {stats.map((stat) => {
        const color = classColor(stat.className)
        return (
          <div
            key={stat.className}
            className="grid grid-cols-[minmax(8.5rem,10rem)_1fr_auto] items-center gap-3 rounded-md px-1 py-1 hover:bg-secondary/40"
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

            <div className="flex justify-end gap-3 text-xs tabular">
              <span className="w-11 text-right font-medium">{percent.format(stat.share)}</span>
              <span className="w-8 text-right text-muted-foreground">{stat.players}</span>
              <span className="w-10 text-right text-muted-foreground">#{stat.bestPlace}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
