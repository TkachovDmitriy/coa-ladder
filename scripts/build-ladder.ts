#!/usr/bin/env bun
/**
 * Merge the enriched per-realm/per-bracket files into the single trimmed
 * dataset the web app serves: public/ladder.json (the only file the browser
 * downloads).
 *
 * Usage:  bun scripts/build-ladder.ts
 */

import { join } from "node:path"
import { appendSnapshot, buildSnapshot, findPreviousSnapshot, loadHistory, saveHistory } from "./lib/history.utils"
import {
  BRACKETS,
  CHANGE_WINDOW_MS,
  DATA_DIR,
  enrichedFile,
  LADDER_JSON_OUT,
  MAX_HISTORY_SNAPSHOTS,
  MIN_SNAPSHOT_GAP_MS,
  REALMS,
  STATS_JSON_OUT,
} from "./lib/pipeline.constants"
import { buildStatsDataset } from "./lib/weekly-stats.utils"
import type {
  Bracket,
  EnrichedEntry,
  HistoryPoint,
  LadderDataset,
  LadderEntry,
  RealmLadder,
} from "./lib/pipeline.type"
import {
  loadTrackedPlayers,
  saveTrackedPlayers,
  seedTrackedPlayersFromHistory,
  updateTrackedBracket,
} from "./lib/tracked-players.utils"

function toEntry(e: EnrichedEntry, prevPoint: HistoryPoint | undefined): LadderEntry {
  // Guards against cached history snapshots from before wins/losses were
  // added to HistoryPoint — a stale entry with only {rating, place} would
  // otherwise silently produce NaN (serialized as `null`) here.
  const hasRecord = prevPoint && typeof prevPoint.wins === "number" && typeof prevPoint.losses === "number"
  return {
    place: e.place,
    name: e.name,
    rating: e.rating,
    wins: e.season_wins,
    losses: e.season_losses,
    className: e.class,
    spec: e.spec,
    armoryRealm: e.armory_realm,
    hasArmory: e.armory_status === "resolved",
    ratingChange: prevPoint ? e.rating - prevPoint.rating : undefined,
    winsChange: hasRecord ? e.season_wins - prevPoint.wins : undefined,
    lossesChange: hasRecord ? e.season_losses - prevPoint.losses : undefined,
  }
}

const generatedAt = new Date().toISOString()
const history = await loadHistory()
const trackedPlayers = await loadTrackedPlayers()
// History import is a one-time migration for deployments created before the
// durable registry existed. Normal twice-daily refreshes skip this traversal.
if (Object.keys(trackedPlayers.realms).length === 0) seedTrackedPlayersFromHistory(trackedPlayers, history)
const previousSnapshot = findPreviousSnapshot(history, generatedAt, CHANGE_WINDOW_MS, MIN_SNAPSHOT_GAP_MS)

const realms: RealmLadder[] = []

for (const realm of REALMS) {
  const brackets = {} as Record<Bracket, LadderEntry[]>
  const previouslyRanked = {} as RealmLadder["previouslyRanked"]
  for (const bracket of BRACKETS) {
    const file = Bun.file(join(DATA_DIR, enrichedFile(realm.id, bracket.id)))
    if (!(await file.exists())) {
      console.error(`Missing enriched file for realm ${realm.id} ${bracket.id} — run pull + enrich first.`)
      process.exit(1)
    }
    const enriched: EnrichedEntry[] = await file.json()
    const prevPoints = previousSnapshot?.realms[String(realm.id)]?.[bracket.id] ?? {}
    brackets[bracket.id] = enriched.map((e) => toEntry(e, prevPoints[e.name]))
    previouslyRanked[bracket.id] = updateTrackedBracket(
      trackedPlayers,
      realm.id,
      bracket.id,
      brackets[bracket.id],
      generatedAt,
    )
  }
  realms.push({ id: realm.id, name: realm.name, brackets, previouslyRanked })
}

const dataset: LadderDataset = { generatedAt, realms }
await Bun.write(LADDER_JSON_OUT, JSON.stringify(dataset))

// Include the freshly built snapshot in the retained history *before*
// aggregating, so the weekly window ends on the current data point.
const snapshot = buildSnapshot(realms, generatedAt)
const updatedHistory = appendSnapshot(history, snapshot, MAX_HISTORY_SNAPSHOTS, MIN_SNAPSHOT_GAP_MS)

const stats = buildStatsDataset(
  updatedHistory.snapshots,
  REALMS.map((r) => r.id),
  BRACKETS.map((b) => b.id),
  generatedAt,
)
await Bun.write(STATS_JSON_OUT, JSON.stringify(stats))
await saveHistory(updatedHistory)
await saveTrackedPlayers(trackedPlayers)

console.log(`Wrote ${LADDER_JSON_OUT}`)
for (const realm of realms) {
  const counts = BRACKETS.map((b) => `${b.id}:${realm.brackets[b.id].length}`).join("  ")
  console.log(`  realm ${realm.id} (${realm.name})  ${counts}`)
}
console.log(`  generated ${dataset.generatedAt}`)

// Weekly-stats data-quality logging: retained + windowed snapshot counts, the
// covered range, and the emitted file size (see the implementation plan).
const statsSize = Bun.file(STATS_JSON_OUT).size
const firstRealm = stats.realms[0]
const sampleBracket = firstRealm && firstRealm.brackets[BRACKETS[0].id]
console.log(`Wrote ${STATS_JSON_OUT} (${(statsSize / 1024).toFixed(1)} KB)`)
console.log(`  retained ${updatedHistory.snapshots.length}/${MAX_HISTORY_SNAPSHOTS} snapshots`)
if (sampleBracket) {
  console.log(
    `  weekly window: ${sampleBracket.snapshotCount}/${stats.expectedSnapshotCount} snapshots` +
      `  ${sampleBracket.capturedFrom ?? "—"} → ${sampleBracket.capturedTo ?? "—"}`,
  )
}
