import { fetchJson } from "@/infrastructure/ladder-source/client"

import type { StatsDataset } from "../model/weekly-stats.type"
import { toStatsDataset } from "../utils/weekly-stats.adapter"

/** Fetch and validate the single weekly-statistics dataset file. */
export async function fetchStatsDataset(): Promise<StatsDataset> {
  const raw = await fetchJson("stats.json")
  return toStatsDataset(raw)
}
