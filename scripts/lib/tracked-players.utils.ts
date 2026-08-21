import { TRACKED_PLAYERS_FILE } from "./pipeline.constants"
import type {
  CacheHit,
  Bracket,
  HistoryFile,
  LadderEntry,
  PreviouslyRankedEntry,
  TrackedPlayer,
  TrackedPlayersFile,
} from "./pipeline.type"

export function applyArmoryHit(player: TrackedPlayer, hit: CacheHit): void {
  player.className = hit.class ?? player.className
  player.spec = hit.spec ?? player.spec
  player.armoryRealm = hit.realm ?? player.armoryRealm
  player.hasArmory = hit.status === "resolved" || player.hasArmory
}

/** Bootstrap the durable registry from retained snapshots on the first deployment. */
export function seedTrackedPlayersFromHistory(tracked: TrackedPlayersFile, history: HistoryFile): void {
  const snapshots = [...history.snapshots].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))

  for (const snapshot of snapshots) {
    for (const [realmId, brackets] of Object.entries(snapshot.realms)) {
      const realm = (tracked.realms[realmId] ??= {} as Record<Bracket, Record<string, TrackedPlayer>>)
      for (const [bracket, points] of Object.entries(brackets) as [Bracket, (typeof brackets)[Bracket]][]) {
        const players = (realm[bracket] ??= {})
        for (const [name, point] of Object.entries(points)) {
          const previous = players[name]
          if (previous && previous.lastSeenAt >= snapshot.capturedAt) {
            if (snapshot.capturedAt < previous.firstSeenAt) previous.firstSeenAt = snapshot.capturedAt
            continue
          }
          players[name] = {
            place: point.place,
            name,
            rating: point.rating,
            wins: point.wins,
            losses: point.losses,
            className: previous?.className ?? null,
            spec: previous?.spec ?? null,
            armoryRealm: previous?.armoryRealm ?? null,
            hasArmory: previous?.hasArmory ?? false,
            firstSeenAt: previous?.firstSeenAt ?? snapshot.capturedAt,
            lastSeenAt: snapshot.capturedAt,
          }
        }
      }
    }
  }
}

export async function loadTrackedPlayers(): Promise<TrackedPlayersFile> {
  const file = Bun.file(TRACKED_PLAYERS_FILE)
  return (await file.exists()) ? await file.json() : { realms: {} }
}

export async function saveTrackedPlayers(players: TrackedPlayersFile): Promise<void> {
  await Bun.write(TRACKED_PLAYERS_FILE, JSON.stringify(players))
}

/** Update last-known data for current players and return everyone outside the current top 100. */
export function updateTrackedBracket(
  tracked: TrackedPlayersFile,
  realmId: number,
  bracket: Bracket,
  current: LadderEntry[],
  capturedAt: string,
): PreviouslyRankedEntry[] {
  const realm = (tracked.realms[String(realmId)] ??= {} as Record<Bracket, Record<string, TrackedPlayer>>)
  const players = (realm[bracket] ??= {})
  const currentNames = new Set<string>()

  for (const entry of current) {
    currentNames.add(entry.name)
    const previous = players[entry.name]
    players[entry.name] = {
      ...entry,
      className: entry.className ?? previous?.className ?? null,
      spec: entry.spec ?? previous?.spec ?? null,
      armoryRealm: entry.armoryRealm ?? previous?.armoryRealm ?? null,
      hasArmory: entry.hasArmory || previous?.hasArmory || false,
      firstSeenAt: previous?.firstSeenAt ?? capturedAt,
      lastSeenAt: capturedAt,
    }
  }

  return Object.values(players)
    .filter((player) => !currentNames.has(player.name))
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt) || b.rating - a.rating)
}
