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
} from "./lib/pipeline.constants"
import type {
  Bracket,
  EnrichedEntry,
  HistoryPoint,
  LadderDataset,
  LadderEntry,
  RealmLadder,
} from "./lib/pipeline.type"
import { loadTrackedPlayers, saveTrackedPlayers, updateTrackedBracket } from "./lib/tracked-players.utils"

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

const snapshot = buildSnapshot(realms, generatedAt)
await saveHistory(appendSnapshot(history, snapshot, MAX_HISTORY_SNAPSHOTS, MIN_SNAPSHOT_GAP_MS))
await saveTrackedPlayers(trackedPlayers)

console.log(`Wrote ${LADDER_JSON_OUT}`)
for (const realm of realms) {
  const counts = BRACKETS.map((b) => `${b.id}:${realm.brackets[b.id].length}`).join("  ")
  console.log(`  realm ${realm.id} (${realm.name})  ${counts}`)
}
console.log(`  generated ${dataset.generatedAt}`)
