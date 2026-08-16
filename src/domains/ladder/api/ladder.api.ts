import { fetchJson } from "@/infrastructure/ladder-source/client"

import type { LadderDataset } from "../model/ladder.type"
import { toLadderDataset } from "../utils/ladder.adapter"

/** Fetch and validate the single ladder dataset file. */
export async function fetchLadderDataset(): Promise<LadderDataset> {
  const raw = await fetchJson("ladder.json")
  return toLadderDataset(raw)
}
