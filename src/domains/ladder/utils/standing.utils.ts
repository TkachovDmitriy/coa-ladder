import type { LadderEntry } from "../model/ladder.type"

/** Where a player sits in their bracket, relative to the field and their class. */
export interface PlayerStanding {
  total: number
  place: number
  /** 0..1 share; 0.03 means top 3%. */
  percentile: number
  /** rating(#1) - player.rating; 0 when the player is #1. */
  toFirst: number
  /** player.rating - rating(#10); >= 0 means inside the top 10. null if the bracket has < 10 players. */
  toTop10: number | null
  className: string | null
  /** rank among same-class players by rating (1 = best); null without a resolved class. */
  classRank: number | null
  classCount: number | null
  /** player.rating - average rating of the class; null without a resolved class. */
  vsClassAvg: number | null
}

/** Compute a player's standing from the live bracket rows. Pure. */
export function playerStanding(entries: LadderEntry[], entry: LadderEntry): PlayerStanding {
  const total = entries.length
  const topRating = entries.reduce((max, e) => Math.max(max, e.rating), entry.rating)
  const tenth = [...entries].sort((a, b) => a.place - b.place)[9]

  let classRank: number | null = null
  let classCount: number | null = null
  let vsClassAvg: number | null = null
  if (entry.className) {
    const sameClass = entries.filter((e) => e.className === entry.className)
    classCount = sameClass.length
    classRank = [...sameClass].sort((a, b) => b.rating - a.rating).findIndex((e) => e.name === entry.name) + 1 || null
    const avg = sameClass.reduce((sum, e) => sum + e.rating, 0) / sameClass.length
    vsClassAvg = Math.round(entry.rating - avg)
  }

  return {
    total,
    place: entry.place,
    percentile: total > 0 ? entry.place / total : 1,
    toFirst: topRating - entry.rating,
    toTop10: tenth ? entry.rating - tenth.rating : null,
    className: entry.className,
    classRank,
    classCount,
    vsClassAvg,
  }
}
