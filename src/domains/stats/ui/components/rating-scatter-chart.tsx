import { defineChart, dot } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { useMemo } from "react"

import { useTheme } from "@/presentation/theme/theme-provider"
import { classColor } from "@/shared/constants/classes.constants"

import type { RatingPoint } from "../../model/stats.type"

interface RatingScatterChartProps {
  points: RatingPoint[]
}

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })
const number = new Intl.NumberFormat("en-US")

const chartTheme = {
  light: {
    foreground: "#40384c",
    muted: "#766d83",
    grid: "#e6e0ec",
    background: "transparent",
  },
  dark: {
    foreground: "#f7f5fa",
    muted: "#aaa1b6",
    grid: "#332b40",
    background: "transparent",
  },
} as const

/** Rating × win-rate scatter — one dot per resolved player. */
export function RatingScatterChart({ points }: RatingScatterChartProps) {
  const { theme } = useTheme()
  const classNames = useMemo(() => [...new Set(points.map((point) => point.className))], [points])

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          dot(points, {
            x: "rating",
            y: "winRate",
            key: (point) => `${point.name}-${point.className}-${point.rating}`,
            r: 4.5,
            color: "className",
            fillOpacity: 0.82,
            stroke: theme === "dark" ? "#0e0b16" : "#ffffff",
            strokeWidth: 1.25,
            states: [
              {
                when: { focus: "primary" },
                style: { r: 6.5, fillOpacity: 1, stroke: theme === "dark" ? "#ffffff" : "#241b30", strokeWidth: 2 },
              },
            ],
          }),
        ],
        theme: chartTheme[theme],
        color: { domain: classNames, range: classNames.map(classColor) },
        margin: { top: 12, right: 12 },
        x: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: "Rating", ticks: { count: 5, format: (value: number) => number.format(value) } },
        },
        y: {
          scale: scaleLinear([0, 1], [0, 1]),
          grid: true,
          axis: { label: "Win rate", ticks: { count: 5, format: (value: number) => percent.format(value) } },
        },
        focus: "nearest",
        maxFocusDistance: 24,
        tooltip: {
          use: tooltip,
          className: "rating-chart-tooltip",
          content: ([point]) => {
            const player = point.datum
            return {
              title: player.name,
              color: classColor(player.className),
              rows: [
                { label: "Class", value: player.className },
                { label: "Rating", value: number.format(player.rating) },
                { label: "Win rate", value: percent.format(player.winRate) },
              ],
            }
          },
        },
      }),
    [classNames, points, theme],
  )

  return (
    <Chart
      definition={definition}
      height={340}
      ariaLabel="Rating versus win rate"
      ariaDescription="Each point represents one resolved player. Color identifies the player's class."
    />
  )
}
