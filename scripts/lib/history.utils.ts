/**
 * Rolling ladder-history helpers, used by build-ladder.ts to compute
 * day-over-day ratingChange. Persisted at HISTORY_FILE via GitHub Actions
 * cache (not committed) — see .github/workflows/pages.yml.
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

export function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

/** Last snapshot from a different, earlier day — never a same-day rerun. */
export function findPreviousSnapshot(history: HistoryFile, today: string): HistorySnapshot | undefined {
  return history.snapshots.findLast((s) => dayKey(s.capturedAt) !== today)
}

export function buildSnapshot(realms: RealmLadder[], capturedAt: string): HistorySnapshot {
  const snapshotRealms: HistorySnapshot["realms"] = {}
  for (const realm of realms) {
    const brackets = {} as Record<Bracket, Record<string, HistoryPoint>>
    for (const bracket of Object.keys(realm.brackets) as Bracket[]) {
      const points: Record<string, HistoryPoint> = {}
      for (const entry of realm.brackets[bracket])
        points[entry.name] = { rating: entry.rating, place: entry.place, games: entry.wins + entry.losses }
      brackets[bracket] = points
    }
    snapshotRealms[String(realm.id)] = brackets
  }
  return { capturedAt, realms: snapshotRealms }
}

/** Replace today's entry if one already exists (reruns), else append; trim to maxSnapshots. */
export function appendSnapshot(history: HistoryFile, snapshot: HistorySnapshot, maxSnapshots: number): HistoryFile {
  const today = dayKey(snapshot.capturedAt)
  const snapshots = [...history.snapshots]
  const last = snapshots.at(-1)
  if (last && dayKey(last.capturedAt) === today) snapshots[snapshots.length - 1] = snapshot
  else snapshots.push(snapshot)
  return { snapshots: snapshots.slice(-maxSnapshots) }
}
