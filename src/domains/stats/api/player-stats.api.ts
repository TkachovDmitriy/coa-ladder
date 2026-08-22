import { fetchJson } from "@/infrastructure/ladder-source/client"

import type { PlayerStatsDataset } from "../model/player-stats.type"

function validateDataset(raw: unknown): PlayerStatsDataset {
  if (!raw || typeof raw !== "object") throw new Error("Player statistics dataset is not an object")
  const data = raw as Partial<PlayerStatsDataset>
  if (!Array.isArray(data.realms)) throw new Error("Player statistics dataset has no realms")
  return data as PlayerStatsDataset
}

export async function fetchPlayerStatsDataset(): Promise<PlayerStatsDataset> {
  return validateDataset(await fetchJson("player-stats.json"))
}
