#!/usr/bin/env bun

/** Validate the durable files before they are committed or restored. */

import { join } from "node:path"

const directory = process.argv[2] ?? "."

async function readJson(name: string): Promise<unknown> {
  const path = join(directory, name)
  const file = Bun.file(path)
  if (!(await file.exists())) throw new Error(`Missing ${path}`)
  try {
    return await file.json()
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const ladder = await readJson("ladder.json")
if (!isRecord(ladder) || typeof ladder.generatedAt !== "string" || !Array.isArray(ladder.realms))
  throw new Error("ladder.json must contain generatedAt and a realms array")
if (ladder.realms.length === 0) throw new Error("ladder.json contains no realms")

for (const realm of ladder.realms) {
  if (!isRecord(realm) || typeof realm.id !== "number" || !isRecord(realm.brackets))
    throw new Error("ladder.json contains an invalid realm")
  for (const bracket of ["1v1", "2v2", "3v3"])
    if (!Array.isArray(realm.brackets[bracket])) throw new Error(`Realm ${realm.id} is missing bracket ${bracket}`)
}

const history = await readJson("history.json")
if (!isRecord(history) || !Array.isArray(history.snapshots))
  throw new Error("history.json must contain a snapshots array")
if (history.snapshots.length > 96) throw new Error("history.json exceeds the 96-snapshot retention limit")

const playerStats = await readJson("player-stats.json")
if (!isRecord(playerStats) || typeof playerStats.generatedAt !== "string" || !Array.isArray(playerStats.realms))
  throw new Error("player-stats.json must contain generatedAt and a realms array")

const trackedPlayers = await readJson("tracked-players.json")
if (!isRecord(trackedPlayers) || !isRecord(trackedPlayers.realms))
  throw new Error("tracked-players.json must contain a realms object")

const armory = await readJson("armory.json")
if (!isRecord(armory)) throw new Error("armory.json must contain an object")

console.log(`Validated ladder data in ${directory}`)
