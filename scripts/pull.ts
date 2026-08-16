#!/usr/bin/env bun
/**
 * Pull the Conquest of Azeroth arena ladders (all realms x brackets) straight
 * from the Ascension game API into scripts/data/data-{realm}-{bracket}.json.
 *
 * Runs server-side only (CI or local): the browser is CORS-blocked from this
 * API, so this is the sole place the raw ladder is fetched.
 *
 * Usage:  bun scripts/pull.ts
 */

import { join } from "node:path"
import { BRACKETS, DATA_DIR, LADDER_API, LADDER_HEADERS, rawFile, REALMS } from "./lib/pipeline.constants"

async function pull(realmId: number, endpoint: string, outName: string): Promise<void> {
  const res = await fetch(`${LADDER_API}/${endpoint}`, {
    method: "POST",
    headers: LADDER_HEADERS,
    body: JSON.stringify({ realm: realmId }),
  })
  if (!res.ok) {
    console.error(`realm ${realmId} ${endpoint}: HTTP ${res.status} — ${await res.text()}`)
    process.exit(1)
  }
  const data = await res.json()
  await Bun.write(join(DATA_DIR, outName), JSON.stringify(data, null, 2))
  const top = data[0] ?? {}
  console.log(`${outName.padEnd(18)} ${String(data.length).padStart(3)} entries (top: ${top.rating} ${top.name})`)
}

for (const realm of REALMS) {
  console.log(`\nrealm ${realm.id} (${realm.name})`)
  for (const bracket of BRACKETS) {
    await pull(realm.id, bracket.endpoint, rawFile(realm.id, bracket.id))
  }
}
