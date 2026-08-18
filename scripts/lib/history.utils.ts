/**
 * Rolling ladder-history helpers, used by build-ladder.ts to compute
 * ratingChange vs. the snapshot closest to the configured comparison age.
 * Persisted at HISTORY_FILE and copied to the durable ladder-data branch by
 * .github/workflows/refresh-ladder.yml.
 */

import { HISTORY_FILE } from "./pipeline.constants"
import type { Bracket, HistoryFile, HistoryPoint, HistorySnapshot, RealmLadder } from "./pipeline.type"

export async function loadHistory(): Promise<HistoryFile> {
  const f = Bun.file(HISTORY_FILE)
  return (await f.exists()) ? await f.json() : { snapshots: [] }
}

export async function saveHistory(history: HistoryFile): Promise<void> {
  await Bun.write(HISTORY_FILE, JSON.stringify(history))
}

/**
 * Snapshot closest to targetAgeMs, excluding near-instant snapshots younger
 * than minAgeMs. This keeps the comparison near 24h without hiding changes
 * when the available history falls a few minutes short of that exact age.
 */
export function findPreviousSnapshot(
  history: HistoryFile,
  capturedAt: string,
  targetAgeMs: number,
  minAgeMs = targetAgeMs,
): HistorySnapshot | undefined {
  const now = new Date(capturedAt).getTime()
  return history.snapshots
    .map((snapshot) => ({ snapshot, age: now - new Date(snapshot.capturedAt).getTime() }))
    .filter(({ age }) => age >= minAgeMs)
    .reduce<{ snapshot: HistorySnapshot; distance: number } | undefined>((closest, { snapshot, age }) => {
      const distance = Math.abs(age - targetAgeMs)
      return !closest || distance < closest.distance ? { snapshot, distance } : closest
    }, undefined)?.snapshot
}

export function buildSnapshot(realms: RealmLadder[], capturedAt: string): HistorySnapshot {
  const snapshotRealms: HistorySnapshot["realms"] = {}
  for (const realm of realms) {
    const brackets = {} as Record<Bracket, Record<string, HistoryPoint>>
    for (const bracket of Object.keys(realm.brackets) as Bracket[]) {
      const points: Record<string, HistoryPoint> = {}
      for (const entry of realm.brackets[bracket])
        points[entry.name] = { rating: entry.rating, place: entry.place, wins: entry.wins, losses: entry.losses }
      brackets[bracket] = points
    }
    snapshotRealms[String(realm.id)] = brackets
  }
  return { capturedAt, realms: snapshotRealms }
}

/** Replace the last entry if it's within minGapMs (near-instant rerun), else append; trim to maxSnapshots. */
export function appendSnapshot(history: HistoryFile, snapshot: HistorySnapshot, maxSnapshots: number, minGapMs: number): HistoryFile {
  const snapshots = [...history.snapshots]
  const last = snapshots.at(-1)
  const gap = last ? new Date(snapshot.capturedAt).getTime() - new Date(last.capturedAt).getTime() : Infinity
  if (last && gap < minGapMs) snapshots[snapshots.length - 1] = snapshot
  else snapshots.push(snapshot)
  return { snapshots: snapshots.slice(-maxSnapshots) }
}
