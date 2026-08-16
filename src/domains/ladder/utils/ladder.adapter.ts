import type { LadderDataset } from "../model/ladder.type"

/**
 * Validate the raw ladder.json payload at the boundary and hand back a typed
 * dataset. We trust our own build step for field shapes, but guard the top
 * level so a bad/empty file surfaces as an error state, not a render crash.
 */
export function toLadderDataset(raw: unknown): LadderDataset {
  if (!raw || typeof raw !== "object") throw new Error("Ladder dataset is not an object")
  const data = raw as Partial<LadderDataset>
  if (!Array.isArray(data.realms) || data.realms.length === 0) throw new Error("Ladder dataset has no realms")
  return data as LadderDataset
}
