#!/usr/bin/env bun
/** Resolve missing class/spec data for players bootstrapped from ladder history. */

import { applyOverride, cacheKey, isFreshHit, loadCache, loadOverrides, pool, resolve, saveCache } from "./lib/armory.utils"
import { loadHistory } from "./lib/history.utils"
import { REALMS } from "./lib/pipeline.constants"
import type { TrackedPlayer } from "./lib/pipeline.type"
import {
  applyArmoryHit,
  loadTrackedPlayers,
  saveTrackedPlayers,
  seedTrackedPlayersFromHistory,
} from "./lib/tracked-players.utils"

const history = await loadHistory()
const tracked = await loadTrackedPlayers()
if (Object.keys(tracked.realms).length === 0) seedTrackedPlayersFromHistory(tracked, history)

const cache = await loadCache(false)
const overrides = await loadOverrides()
const pending: Array<{ player: TrackedPlayer; realmName: string }> = []

for (const [realmId, brackets] of Object.entries(tracked.realms)) {
  const realmName = REALMS.find((realm) => String(realm.id) === realmId)?.name
  if (!realmName) continue
  for (const players of Object.values(brackets)) {
    for (const player of Object.values(players)) {
      if (!player.className) pending.push({ player, realmName })
    }
  }
}

let resolved = 0
await pool(pending, 5, async ({ player, realmName }) => {
  const key = cacheKey(player.name, realmName)
  let hit = cache[key]
  if (!hit || !isFreshHit(hit)) {
    hit = await resolve(player.name, realmName, true)
    cache[key] = hit
  }
  applyOverride(hit, overrides[player.name])
  applyArmoryHit(player, hit)
  if (player.className) resolved++
})

await saveCache(cache)
await saveTrackedPlayers(tracked)
console.log(`Historical armory enrichment: ${resolved}/${pending.length} missing players resolved`)
