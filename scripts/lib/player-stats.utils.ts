import type {
  Bracket,
  BracketPlayerStats,
  HistoryFile,
  HistoryPoint,
  HistorySnapshot,
  PlayerPeriodStats,
  PlayerStatsDataset,
} from "./pipeline.type"

const DAY_MS = 24 * 60 * 60 * 1000

function validSnapshots(history: HistoryFile, generatedAt: string, windowMs: number): HistorySnapshot[] {
  const end = new Date(generatedAt).getTime()
  const start = end - windowMs
  const byTimestamp = new Map<number, HistorySnapshot>()

  for (const snapshot of history.snapshots) {
    const timestamp = new Date(snapshot.capturedAt).getTime()
    if (Number.isFinite(timestamp) && timestamp >= start && timestamp <= end) byTimestamp.set(timestamp, snapshot)
  }

  return [...byTimestamp.entries()].sort(([a], [b]) => a - b).map(([, snapshot]) => snapshot)
}

function statsForPlayer(name: string, points: Array<{ capturedAt: string; point: HistoryPoint }>, totalSnapshots: number): PlayerPeriodStats {
  const first = points[0]
  const last = points.at(-1)!
  const winsDelta = last.point.wins - first.point.wins
  const lossesDelta = last.point.losses - first.point.losses
  const hasValidRecord = Number.isFinite(winsDelta) && Number.isFinite(lossesDelta) && winsDelta >= 0 && lossesDelta >= 0
  const games = hasValidRecord ? winsDelta + lossesDelta : null

  return {
    name,
    firstCapturedAt: first.capturedAt,
    lastCapturedAt: last.capturedAt,
    snapshotCount: points.length,
    ratingChange: last.point.rating - first.point.rating,
    placeChange: first.point.place - last.point.place,
    wins: hasValidRecord ? winsDelta : null,
    losses: hasValidRecord ? lossesDelta : null,
    games,
    winRate: games && games > 0 ? winsDelta / games : null,
    minRating: Math.min(...points.map(({ point }) => point.rating)),
    maxRating: Math.max(...points.map(({ point }) => point.rating)),
    currentRating: last.point.rating,
    currentPlace: last.point.place,
    coverage: points.length < 2 ? "insufficient" : points.length === totalSnapshots ? "complete" : "partial",
    trend: points.map(({ capturedAt, point }) => ({ capturedAt, ...point })),
  }
}

function buildBracketStats(snapshots: HistorySnapshot[], realmId: number, bracket: Bracket): BracketPlayerStats {
  const playersByKey = new Map<string, { name: string; points: Array<{ capturedAt: string; point: HistoryPoint }> }>()
  for (const snapshot of snapshots) {
    const players = snapshot.realms[String(realmId)]?.[bracket] ?? {}
    for (const [name, point] of Object.entries(players)) {
      const key = name.toLocaleLowerCase("en-US")
      const player = playersByKey.get(key) ?? { name, points: [] }
      player.name = name
      player.points.push({ capturedAt: snapshot.capturedAt, point })
      playersByKey.set(key, player)
    }
  }

  return {
    capturedFrom: snapshots[0]?.capturedAt ?? null,
    capturedTo: snapshots.at(-1)?.capturedAt ?? null,
    snapshotCount: snapshots.length,
    players: Object.fromEntries(
      [...playersByKey.entries()].map(([key, player]) => [key, statsForPlayer(player.name, player.points, snapshots.length)]),
    ),
  }
}

export function buildPlayerStatsDataset(
  history: HistoryFile,
  generatedAt: string,
  windowMs: number,
  realmIds: readonly number[],
  brackets: readonly Bracket[],
): PlayerStatsDataset {
  const snapshots = validSnapshots(history, generatedAt, windowMs)
  return {
    generatedAt,
    periodDays: windowMs / DAY_MS,
    realms: realmIds.map((id) => ({
      id,
      brackets: Object.fromEntries(brackets.map((bracket) => [bracket, buildBracketStats(snapshots, id, bracket)])) as Record<Bracket, BracketPlayerStats>,
    })),
  }
}
