import type { StatsDataset } from "../model/weekly-stats.type"

/**
 * Validate the raw stats.json payload at the fetch boundary. Same contract as
 * the ladder adapter: the build step is trusted for field shapes, but a
 * bad/empty file must surface as an error state, not a render crash.
 */
export function toStatsDataset(raw: unknown): StatsDataset {
  if (!raw || typeof raw !== "object") throw new Error("Stats dataset is not an object")
  const data = raw as Partial<StatsDataset>
  if (!Array.isArray(data.realms)) throw new Error("Stats dataset has no realms array")
  if (typeof data.periodDays !== "number" || typeof data.expectedSnapshotCount !== "number") {
    throw new Error("Stats dataset is missing period metadata")
  }
  return data as StatsDataset
}
