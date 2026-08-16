#!/usr/bin/env bun
/**
 * Merge the enriched per-realm/per-bracket files into the single trimmed
 * dataset the web app serves: public/ladder.json (the only file the browser
 * downloads).
 *
 * Usage:  bun scripts/build-ladder.ts
 */

import { join } from "node:path"
import { appendSnapshot, buildSnapshot, dayKey, findPreviousSnapshot, loadHistory, saveHistory } from "./lib/history.utils"
import { BRACKETS, DATA_DIR, enrichedFile, LADDER_JSON_OUT, MAX_HISTORY_SNAPSHOTS, REALMS } from "./lib/pipeline.constants"
import type {
  Bracket,
  EnrichedEntry,
  HistoryPoint,
  LadderDataset,
  LadderEntry,
  RealmLadder,
} from "./lib/pipeline.type"

function toEntry(e: EnrichedEntry, prevPoint: HistoryPoint | undefined): LadderEntry {
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
    ratingChange: prevPoint ? ((e.rating - prevPoint.rating) / prevPoint.rating) * 100 : undefined,
  }
}

const generatedAt = new Date().toISOString()
const history = await loadHistory()
const previousSnapshot = findPreviousSnapshot(history, dayKey(generatedAt))

const realms: RealmLadder[] = []

for (const realm of REALMS) {
  const brackets = {} as Record<Bracket, LadderEntry[]>
  for (const bracket of BRACKETS) {
    const file = Bun.file(join(DATA_DIR, enrichedFile(realm.id, bracket.id)))
    if (!(await file.exists())) {
      console.error(`Missing enriched file for realm ${realm.id} ${bracket.id} — run pull + enrich first.`)
      process.exit(1)
    }
    const enriched: EnrichedEntry[] = await file.json()
    const prevPoints = previousSnapshot?.realms[String(realm.id)]?.[bracket.id] ?? {}
    brackets[bracket.id] = enriched.map((e) => toEntry(e, prevPoints[e.name]))
  }
  realms.push({ id: realm.id, name: realm.name, brackets })
}

const dataset: LadderDataset = { generatedAt, realms }
await Bun.write(LADDER_JSON_OUT, JSON.stringify(dataset))

const snapshot = buildSnapshot(realms, generatedAt)
await saveHistory(appendSnapshot(history, snapshot, MAX_HISTORY_SNAPSHOTS))

console.log(`Wrote ${LADDER_JSON_OUT}`)
for (const realm of realms) {
  const counts = BRACKETS.map((b) => `${b.id}:${realm.brackets[b.id].length}`).join("  ")
  console.log(`  realm ${realm.id} (${realm.name})  ${counts}`)
}
console.log(`  generated ${dataset.generatedAt}`)
