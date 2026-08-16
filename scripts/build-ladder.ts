#!/usr/bin/env bun
/**
 * Merge the enriched per-realm/per-bracket files into the single trimmed
 * dataset the web app serves: public/ladder.json (the only file the browser
 * downloads).
 *
 * Usage:  bun scripts/build-ladder.ts
 */

import { join } from "node:path"
import { BRACKETS, DATA_DIR, enrichedFile, LADDER_JSON_OUT, REALMS } from "./lib/pipeline.constants"
import type { Bracket, EnrichedEntry, LadderDataset, LadderEntry, RealmLadder } from "./lib/pipeline.type"

function toEntry(e: EnrichedEntry): LadderEntry {
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
  }
}

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
    brackets[bracket.id] = enriched.map(toEntry)
  }
  realms.push({ id: realm.id, name: realm.name, brackets })
}

const dataset: LadderDataset = { generatedAt: new Date().toISOString(), realms }
await Bun.write(LADDER_JSON_OUT, JSON.stringify(dataset))

console.log(`Wrote ${LADDER_JSON_OUT}`)
for (const realm of realms) {
  const counts = BRACKETS.map((b) => `${b.id}:${realm.brackets[b.id].length}`).join("  ")
  console.log(`  realm ${realm.id} (${realm.name})  ${counts}`)
}
console.log(`  generated ${dataset.generatedAt}`)
