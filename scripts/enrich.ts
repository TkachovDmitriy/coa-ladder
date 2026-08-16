#!/usr/bin/env bun
/**
 * Add `class` and `spec` to a raw arena ladder by looking each character up on
 * the armory. Spec is only available for players with an armory capture
 * (~1 in 5); everyone else gets a `spec_status` explaining why. Players with no
 * armory can still be filled in via scripts/overrides.json.
 *
 * Server-side only (armory blocks browser origins).
 *
 * Usage:  bun scripts/enrich.ts [input.json] [output.json]
 *   --no-spec         class only (faster)
 *   --refresh         ignore cache, re-fetch everything
 *   --concurrency N   parallel requests (default 5)
 *   --realm NAME      realm to query (default "" = let the API resolve)
 */

import { join } from "node:path"
import { DATA_DIR, rawFile, REALMS } from "./lib/pipeline.constants"
import type { EnrichedEntry, RawEntry } from "./lib/pipeline.type"
import {
  applyOverride,
  cacheKey,
  isFreshHit,
  loadCache,
  loadOverrides,
  pool,
  resolve,
  saveCache,
} from "./lib/armory.utils"

// ---- CLI parsing -----------------------------------------------------------

const rawArgs = process.argv.slice(2)
const positional: string[] = []
let refresh = false
let withSpec = true
let concurrency = 5
let realmParam = ""

for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i]
  if (a === "--refresh") refresh = true
  else if (a === "--no-spec") withSpec = false
  else if (a === "--concurrency") concurrency = Number(rawArgs[++i]) || 5
  else if (a === "--realm") realmParam = rawArgs[++i] ?? ""
  else positional.push(a)
}

const INPUT = positional[0] ?? join(DATA_DIR, rawFile(REALMS[0].id, "1v1"))
const OUTPUT = positional[1] ?? INPUT.replace(/\.json$/i, "") + ".enriched.json"

// ---- Load inputs -----------------------------------------------------------

const entries: RawEntry[] = await Bun.file(INPUT).json()
if (!Array.isArray(entries)) {
  console.error(`Expected a JSON array in ${INPUT}`)
  process.exit(1)
}

const cache = await loadCache(refresh)
const overrides = await loadOverrides()

console.log(
  `Enriching ${entries.length} entries from ${INPUT} ` +
    `(concurrency=${concurrency}, spec=${withSpec ? "on" : "off"}, cache=${refresh ? "off" : "on"})\n`,
)

// ---- Resolve ---------------------------------------------------------------

let done = 0
let cacheHits = 0

await pool(entries, concurrency, async (entry) => {
  const name = entry.name
  const key = cacheKey(name, realmParam)
  let hit = cache[key]

  if (hit && isFreshHit(hit) && !refresh) {
    cacheHits++
  } else {
    hit = await resolve(name, realmParam, withSpec)
    cache[key] = hit
  }

  applyOverride(hit, overrides[name])

  const enriched = entry as EnrichedEntry
  enriched.class = hit.class
  enriched.spec = hit.spec
  enriched.armory_realm = hit.realm
  enriched.armory_status = hit.status
  enriched.spec_status = hit.spec_status

  done++
  const classTag =
    hit.status === "resolved"
      ? hit.class
      : hit.status === "no-class"
        ? "(no class)"
        : hit.status === "not-found"
          ? "(not found)"
          : "(error)"
  const specTag = hit.spec ? ` / ${hit.spec}` : hit.class ? ` / — (${hit.spec_status})` : ""
  console.log(`[${String(done).padStart(3)}/${entries.length}] ${name.padEnd(16)} -> ${classTag}${specTag}`)
})

await saveCache(cache)
await Bun.write(OUTPUT, JSON.stringify(entries, null, 2))

// ---- Summary ---------------------------------------------------------------

const byClass = new Map<string, number>()
const bySpec = new Map<string, number>()
let classResolved = 0
let specResolved = 0
for (const e of entries as EnrichedEntry[]) {
  if (e.class) {
    classResolved++
    byClass.set(e.class, (byClass.get(e.class) ?? 0) + 1)
  }
  if (e.spec) {
    specResolved++
    const key = `${e.class} — ${e.spec}`
    bySpec.set(key, (bySpec.get(key) ?? 0) + 1)
  }
}

console.log(`\n--- Class distribution (${classResolved}/${entries.length} resolved) ---`)
for (const [cls, n] of [...byClass].sort((a, b) => b[1] - a[1])) console.log(`  ${cls.padEnd(18)} ${n}`)

console.log(`\n--- Spec distribution (${specResolved}/${entries.length} have armory data) ---`)
for (const [spec, n] of [...bySpec].sort((a, b) => b[1] - a[1])) console.log(`  ${spec.padEnd(30)} ${n}`)

console.log(`\nCache hits this run: ${cacheHits}`)
console.log(`Wrote ${OUTPUT}`)
