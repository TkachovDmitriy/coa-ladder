import { useMemo } from "react"

import type { LadderEntry } from "@/domains/ladder/model/ladder.type"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

import { aggregateByClass, toRatingPoints } from "../utils/class-stats.utils"
import { ClassDistribution } from "./components/class-distribution"
import { RatingScatterChart } from "./components/rating-scatter-chart"

interface StatsProps {
  entries: LadderEntry[]
}

/** Stats domain entry — class distribution + rating scatter over a bracket. */
export function Stats({ entries }: StatsProps) {
  const classStats = useMemo(() => aggregateByClass(entries), [entries])
  const points = useMemo(() => toRatingPoints(entries), [entries])

  if (classStats.length === 0) return null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Class distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassDistribution stats={classStats} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rating × win rate</CardTitle>
        </CardHeader>
        <CardContent>
          <RatingScatterChart points={points} />
        </CardContent>
      </Card>
    </div>
  )
}
