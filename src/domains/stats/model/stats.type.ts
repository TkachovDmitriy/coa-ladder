/** Per-class aggregate over a bracket's resolved entries. */
export interface ClassStat {
  className: string
  players: number
  /** share of resolved players, 0..1 */
  share: number
  avgRating: number
  topRating: number
  /** best (lowest) place reached by the class */
  bestPlace: number
  /** average win rate, 0..1 */
  avgWinRate: number
  top10: number
}

/** One resolved player as a point for the rating × win-rate scatter. */
export interface RatingPoint {
  name: string
  className: string
  rating: number
  winRate: number
}
