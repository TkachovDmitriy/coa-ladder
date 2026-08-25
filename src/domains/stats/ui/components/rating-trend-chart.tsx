import { areaY, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { useMemo, useState } from "react"

import { useTheme } from "@/presentation/theme/theme-provider"
import { cn } from "@/shared/utils/utils"

import type { TrendPoint } from "../../model/weekly-stats.type"

interface RatingTrendChartProps {
  points: TrendPoint[]
  /** Line/area accent; defaults to the theme violet when the class is unknown. */
  color?: string
}

const number = new Intl.NumberFormat("en-US")
const dateLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

// Same theme object shape as rating-scatter-chart, plus the line accent.
const chartTheme = {
  light: { foreground: "#40384c", muted: "#766d83", grid: "#e6e0ec", background: "transparent" },
  dark: { foreground: "#f7f5fa", muted: "#aaa1b6", grid: "#332b40", background: "transparent" },
} as const
const lineColor = { light: "#7c3aed", dark: "#a78bfa" } as const

type Metric = "rating" | "place"
const METRICS: { id: Metric; label: string }[] = [
  { id: "place", label: "Place" },
  { id: "rating", label: "Rating" },
]

interface TrendDatum {
  t: number
  rating: number
  place: number
  /** Negated place so #1 sits at the top of the axis (lower place = better). */
  placeY: number
  capturedAt: string
}

/** Rating (or place) over the tracked snapshots — house @tanstack/charts style. */
export function RatingTrendChart({ points, color }: RatingTrendChartProps) {
  const { theme } = useTheme()
  const [metric, setMetric] = useState<Metric>("place")
  const accent = color ?? lineColor[theme]

  const data = useMemo<TrendDatum[]>(
    () =>
      points.map((p) => ({
        t: new Date(p.capturedAt).getTime(),
        rating: p.rating,
        place: p.place,
        placeY: -p.place,
        capturedAt: p.capturedAt,
      })),
    [points],
  )

  const definition = useMemo(() => {
    const y = metric === "rating" ? "rating" : "placeY"
    const formatY = (value: number) => (metric === "rating" ? number.format(value) : String(Math.round(-value)))
    return defineChart({
      marks: [
        // Area reads correctly only for rating (fills down to the baseline);
        // the inverted place axis would fill the wrong side, so skip it there.
        ...(metric === "rating" ? [areaY(data, { x: "t", y, fill: accent, fillOpacity: 0.14 })] : []),
        // Dots only when the series is sparse — 40+ points read as clutter.
        lineY(data, { x: "t", y, stroke: accent, strokeWidth: 2.5, points: data.length <= 16, key: (d) => d.capturedAt }),
      ],
      theme: chartTheme[theme],
      margin: { top: 12, right: 16, bottom: 4, left: 8 },
      x: {
        scale: scaleLinear,
        // No `nice`: it rounds the time domain outward to a round date before
        // the first snapshot, so the axis would start earlier than the line.
        axis: { ticks: { count: 5, format: (value: number) => dateLabel.format(new Date(value)) } },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: metric === "rating" ? "Rating" : "Place", ticks: { count: 5, format: formatY } },
      },
      focus: "nearest",
      maxFocusDistance: 32,
      tooltip: {
        use: tooltip,
        className: "rating-chart-tooltip",
        content: ([point]) => {
          const d = point.datum
          return {
            title: dateLabel.format(new Date(d.capturedAt)),
            rows: [
              { label: "Rating", value: number.format(d.rating) },
              { label: "Place", value: `#${d.place}` },
            ],
          }
        },
      },
    })
  }, [data, metric, theme, accent])

  if (points.length < 2) {
    return <p className="text-sm text-muted-foreground">Not enough snapshots yet to draw a trend.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <nav className="inline-flex h-8 items-center gap-1 rounded-lg bg-secondary p-1" aria-label="Trend metric">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetric(m.id)}
              aria-pressed={m.id === metric}
              className={cn(
                "inline-flex items-center rounded-md px-3 py-1 text-xs font-medium transition-colors",
                m.id === metric ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </div>
      <Chart
        definition={definition}
        height={240}
        ariaLabel={`${metric === "rating" ? "Rating" : "Ladder place"} over the tracked period`}
        ariaDescription="Line across the available ladder snapshots."
      />
    </div>
  )
}
