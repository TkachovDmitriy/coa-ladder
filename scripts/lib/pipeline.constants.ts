import { join } from "node:path"
import type { BracketDef, RealmDef } from "./pipeline.type"

/**
 * Shared config for the data pipeline (pull -> enrich -> build-ladder).
 *
 * These are non-secret public endpoints, kept here as constants on purpose:
 * GitHub Pages has no runtime env, and the pipeline runs server-side (CI or
 * local), never in the browser.
 */

/** Ladder realms to pull. `name` is a UI label; `id` is the game realm id. */
export const REALMS = [
  { id: 40, name: "Vol'Jin" },
  { id: 41, name: "Rexxar" },
] as const satisfies readonly RealmDef[]

/** Conquest of Azeroth arena leaderboards (raw name/rating/wins/losses). */
export const LADDER_API = "https://api.ascension.gg/api/v3/leaderboards"

/** Armory used to resolve class/spec. Blocks browser CORS — server-side only. */
export const ARMORY_API = "https://coa.ascensionlogs.gg"

export const BRACKETS = [
  { id: "1v1", endpoint: "arena-1v1" },
  { id: "2v2", endpoint: "arena-2v2" },
  { id: "3v3", endpoint: "arena-3v3" },
] as const satisfies readonly BracketDef[]

/** Data file names are realm- and bracket-scoped, e.g. data-40-1v1.json. */
export const rawFile = (realmId: number, bracket: string) => `data-${realmId}-${bracket}.json`
export const enrichedFile = (realmId: number, bracket: string) => `data-${realmId}-${bracket}.enriched.json`

/** Browser-ish headers so the game API answers our server-side requests. */
export const LADDER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36",
  Origin: "https://ascension.gg",
  Referer: "https://ascension.gg/",
  "Content-Type": "application/json",
  Accept: "application/json",
}

// ---- Filesystem layout (resolved from this file, CWD-independent) ----------

/** scripts/ root — this file lives in scripts/lib/. */
export const SCRIPTS_DIR = join(import.meta.dir, "..")
export const DATA_DIR = join(SCRIPTS_DIR, "data")
export const CACHE_FILE = join(SCRIPTS_DIR, "cache", "armory.json")
export const HISTORY_FILE = join(SCRIPTS_DIR, "cache", "history.json")
export const TRACKED_PLAYERS_FILE = join(SCRIPTS_DIR, "cache", "tracked-players.json")
/** Near-instant reruns replace the latest snapshot instead of adding noise. */
export const MIN_SNAPSHOT_GAP_MS = 60 * 60 * 1000
/** Target age for displayed rating and W/L changes; the closest eligible snapshot is used. */
export const CHANGE_WINDOW_MS = 24 * 60 * 60 * 1000
/** Refresh runs twice daily, so this covers roughly the same ~8-day window as before. */
export const MAX_HISTORY_SNAPSHOTS = 16
export const OVERRIDES_FILE = join(SCRIPTS_DIR, "overrides.json")

/** Final trimmed dataset served by the app (the only public file). */
export const LADDER_JSON_OUT = join(SCRIPTS_DIR, "..", "public", "ladder.json")
