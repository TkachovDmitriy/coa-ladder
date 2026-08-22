import type { PlayerTrendPoint } from "../../model/player-stats.type"

export function PlayerRatingChart({ points }: { points: PlayerTrendPoint[] }) {
  if (points.length < 2) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">More snapshots are needed to draw the rating history.</div>
  }

  const width = 800
  const height = 240
  const padding = 28
  const ratings = points.map((point) => point.rating)
  const min = Math.min(...ratings)
  const max = Math.max(...ratings)
  const range = Math.max(max - min, 1)
  const coordinates = points.map((point, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2)
    const y = padding + ((max - point.rating) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(" ")

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full" role="img" aria-label="Player rating history">
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-border" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-border" />
        <polyline points={coordinates} fill="none" className="stroke-primary" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {coordinates.split(" ").map((coordinate, index) => {
          const [cx, cy] = coordinate.split(",")
          const point = points[index]
          return <circle key={point.capturedAt} cx={cx} cy={cy} r="4" className="fill-primary"><title>{new Date(point.capturedAt).toLocaleString()}: {point.rating}</title></circle>
        })}
        <text x={padding + 4} y={padding + 14} className="fill-muted-foreground text-xs">{max.toLocaleString()}</text>
        <text x={padding + 4} y={height - padding - 8} className="fill-muted-foreground text-xs">{min.toLocaleString()}</text>
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{new Date(points[0].capturedAt).toLocaleString()}</span>
        <span>{new Date(points.at(-1)!.capturedAt).toLocaleString()}</span>
      </div>
    </div>
  )
}
