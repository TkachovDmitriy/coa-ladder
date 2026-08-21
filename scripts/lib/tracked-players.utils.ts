import { TRACKED_PLAYERS_FILE } from "./pipeline.constants"
import type {
  Bracket,
  LadderEntry,
  PreviouslyRankedEntry,
  TrackedPlayer,
  TrackedPlayersFile,
} from "./pipeline.type"

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
