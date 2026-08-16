import { defineChart, dot } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { useMemo } from "react"

import { CHART_ACCENT } from "@/shared/lib/palette"

import type { RatingPoint } from "../../model/stats.type"

interface RatingScatterChartProps {
  points: RatingPoint[]
}

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })

/** Rating × win-rate scatter — one dot per resolved player. */
export function RatingScatterChart({ points }: RatingScatterChartProps) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [dot(points, { x: "rating", y: "winRate", r: 4, fill: CHART_ACCENT, fillOpacity: 0.7 })],
        x: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Rating" } },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: "Win rate", ticks: { format: (v: number) => percent.format(v) } },
        },
        tooltip,
      }),
    [points],
  )

  return <Chart definition={definition} height={340} ariaLabel="Rating versus win rate" />
}
