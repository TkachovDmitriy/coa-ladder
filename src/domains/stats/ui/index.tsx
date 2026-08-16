import { useMemo, useState } from "react"

import type { LadderEntry } from "@/domains/ladder/model/ladder.type"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { cn } from "@/shared/utils/utils"

import { aggregateByClass, toRatingPoints } from "../utils/class-stats.utils"
import { ClassDistribution } from "./components/class-distribution"
import { RatingScatterChart } from "./components/rating-scatter-chart"

interface StatsProps {
  entries: LadderEntry[]
}

const CHARTS = [
  { id: "distribution", label: "Class distribution" },
  { id: "scatter", label: "Rating × win rate" },
] as const

type ChartId = (typeof CHARTS)[number]["id"]

/** Stats domain entry — switchable class distribution / rating scatter chart, full width, over a bracket. */
export function Stats({ entries }: StatsProps) {
  const classStats = useMemo(() => aggregateByClass(entries), [entries])
  const points = useMemo(() => toRatingPoints(entries), [entries])
  const [active, setActive] = useState<ChartId>("distribution")

  if (classStats.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{active === "distribution" ? "Class distribution" : "Rating × win rate"}</CardTitle>
          {active === "scatter" ? (
            <CardDescription>Each point is a player. Colors match the class palette; hover a point for details.</CardDescription>
          ) : null}
        </div>
        <nav className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary p-1" aria-label="Chart">
          {CHARTS.map((chart) => {
            const isActive = chart.id === active
            return (
              <button
                key={chart.id}
                type="button"
                onClick={() => setActive(chart.id)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {chart.label}
              </button>
            )
          })}
        </nav>
      </CardHeader>
      <CardContent>
        {active === "distribution" ? <ClassDistribution stats={classStats} /> : <RatingScatterChart points={points} />}
      </CardContent>
    </Card>
  )
}
