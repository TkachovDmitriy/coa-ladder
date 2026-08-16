#!/usr/bin/env bun
/**
 * Full data refresh, in order: pull -> enrich (per realm/bracket) -> build.
 * This is what produces public/ladder.json.
 *
 * Usage:  bun scripts/refresh.ts [--refresh]   (--refresh bypasses the cache)
 */

import { $ } from "bun"
import { join } from "node:path"
import { BRACKETS, DATA_DIR, rawFile, REALMS, SCRIPTS_DIR } from "./lib/pipeline.constants"

const bypassCache = process.argv.includes("--refresh")
const script = (name: string) => join(SCRIPTS_DIR, name)

console.log("① pull — fetch raw ladders (all realms x brackets)")
await $`bun ${script("pull.ts")}`

console.log("\n② enrich — resolve class/spec per realm/bracket")
for (const realm of REALMS) {
  for (const bracket of BRACKETS) {
    console.log(`\n· realm ${realm.id} ${bracket.id}`)
    const input = join(DATA_DIR, rawFile(realm.id, bracket.id))
    if (bypassCache) await $`bun ${script("enrich.ts")} ${input} --refresh`
    else await $`bun ${script("enrich.ts")} ${input}`
  }
}

console.log("\n③ build — merge into public/ladder.json")
await $`bun ${script("build-ladder.ts")}`

console.log("\n✓ refresh complete")
