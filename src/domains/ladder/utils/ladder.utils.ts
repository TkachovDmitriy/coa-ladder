import { ARMORY_BASE, ARMORY_PROFILE_BASE } from "../model/ladder.constants"
import type { LadderEntry, LadderSummary } from "../model/ladder.type"

export function games(entry: LadderEntry): number {
  return entry.wins + entry.losses
}

export function winRate(entry: LadderEntry): number {
  const total = games(entry)
  return total === 0 ? 0 : entry.wins / total
}

/** Armory page by name + realm; fall back to the name-only page when unknown. */
export function armoryUrl(entry: Pick<LadderEntry, "armoryRealm" | "name">): string {
  if (entry.armoryRealm) {
    return `${ARMORY_BASE}/${encodeURIComponent(entry.name)}/${encodeURIComponent(entry.armoryRealm)}`
  }
  return `${ARMORY_PROFILE_BASE}/${encodeURIComponent(entry.name)}`
}

export function filterEntries(
  entries: readonly LadderEntry[],
  search: string,
  className: string | null,
): LadderEntry[] {
  const q = search.trim().toLowerCase()
  return entries.filter((e) => {
    if (className && e.className !== className) return false
    if (q && !e.name.toLowerCase().includes(q)) return false
    return true
  })
}

export function summarize(entries: readonly LadderEntry[]): LadderSummary {
  const counts = new Map<string, number>()
  let ratingSum = 0
  let resolved = 0
  let topEntry: LadderEntry | null = null

  for (const e of entries) {
    ratingSum += e.rating
    if (!topEntry || e.rating > topEntry.rating) topEntry = e
    if (e.className) {
      resolved++
      counts.set(e.className, (counts.get(e.className) ?? 0) + 1)
    }
  }

  let dominantClass: string | null = null
  let dominantCount = 0
  for (const [cls, n] of counts) {
    if (n > dominantCount) {
      dominantCount = n
      dominantClass = cls
    }
  }

  return {
    total: entries.length,
    resolved,
    topEntry,
    dominantClass,
    avgRating: entries.length === 0 ? 0 : Math.round(ratingSum / entries.length),
  }
}
