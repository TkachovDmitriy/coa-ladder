import type { LadderEntry } from "@/domains/ladder/model/ladder.type"
import { winRate } from "@/domains/ladder/utils/ladder.utils"

import type { ClassStat, RatingPoint } from "../model/stats.type"

interface ClassAccumulator {
  players: number
  ratingSum: number
  topRating: number
  bestPlace: number
  winRateSum: number
  top10: number
}

/** Aggregate resolved entries by class, sorted by player count (desc). */
export function aggregateByClass(entries: readonly LadderEntry[]): ClassStat[] {
  const acc = new Map<string, ClassAccumulator>()
  let resolved = 0

  for (const e of entries) {
    if (!e.className) continue
    resolved++
    const a =
      acc.get(e.className) ??
      { players: 0, ratingSum: 0, topRating: 0, bestPlace: Infinity, winRateSum: 0, top10: 0 }
    a.players++
    a.ratingSum += e.rating
    a.topRating = Math.max(a.topRating, e.rating)
    a.bestPlace = Math.min(a.bestPlace, e.place)
    a.winRateSum += winRate(e)
    if (e.place <= 10) a.top10++
    acc.set(e.className, a)
  }

  const stats: ClassStat[] = [...acc.entries()].map(([className, a]) => ({
    className,
    players: a.players,
    share: resolved === 0 ? 0 : a.players / resolved,
    avgRating: Math.round(a.ratingSum / a.players),
    topRating: a.topRating,
    bestPlace: a.bestPlace,
    avgWinRate: a.winRateSum / a.players,
    top10: a.top10,
  }))

  return stats.sort((a, b) => b.players - a.players || b.avgRating - a.avgRating)
}

/** Resolved entries as points for the rating × win-rate scatter. */
export function toRatingPoints(entries: readonly LadderEntry[]): RatingPoint[] {
  const points: RatingPoint[] = []
  for (const e of entries) {
    if (!e.className) continue
    points.push({ name: e.name, className: e.className, rating: e.rating, winRate: winRate(e) })
  }
  return points
}
