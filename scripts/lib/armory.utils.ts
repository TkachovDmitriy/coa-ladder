/**
 * Armory resolution helpers — the class/spec lookup logic used by enrich.ts.
 *
 * Runs server-side only: the armory refuses browser origins (403), so these
 * requests forge `Origin`/`Referer` to look like they come from its own site.
 */

import { ARMORY_API, CACHE_FILE, OVERRIDES_FILE } from "./pipeline.constants"
import type { CacheHit, ManualOverride, SpecStatus } from "./pipeline.type"

const BY_NAME = (name: string, realm: string) =>
  `${ARMORY_API}/api/armory/by-name/${encodeURIComponent(name)}?realm=${encodeURIComponent(realm)}`
const CHARACTER = (id: number) => `${ARMORY_API}/api/armory/character/${id}`

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Referer: `${ARMORY_API}/`,
  Origin: ARMORY_API,
  Accept: "application/json",
}

// ---- Cache + overrides I/O -------------------------------------------------

export async function loadCache(refresh: boolean): Promise<Record<string, CacheHit>> {
  if (refresh) return {}
  const f = Bun.file(CACHE_FILE)
  return (await f.exists()) ? await f.json() : {}
}

export async function saveCache(cache: Record<string, CacheHit>): Promise<void> {
  await Bun.write(CACHE_FILE, JSON.stringify(cache, null, 0))
}

export async function loadOverrides(): Promise<Record<string, ManualOverride>> {
  const f = Bun.file(OVERRIDES_FILE)
  if (!(await f.exists())) return {}
  const raw = await f.json()
  delete raw._comment
  return raw
}

/** A cache hit is reusable only if written by this (spec-aware) version. */
export function isFreshHit(hit: unknown): hit is CacheHit {
  return !!hit && typeof hit === "object" && "has_armory" in hit && "spec_status" in hit
}

// ---- Fetch with retry/backoff ----------------------------------------------

async function getJSON(url: string): Promise<any | null> {
  const maxAttempts = 4
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (res.status === 429 || res.status >= 500) {
        await Bun.sleep(500 * 2 ** (attempt - 1))
        continue
      }
      if (res.status === 404) return { __notFound: true }
      if (!res.ok) {
        if (attempt === maxAttempts) return null
        await Bun.sleep(500 * attempt)
        continue
      }
      return await res.json()
    } catch {
      if (attempt === maxAttempts) return null
      await Bun.sleep(500 * 2 ** (attempt - 1))
    }
  }
  return null
}

// ---- Class + spec derivation from talent trees -----------------------------
//
// From /api/armory/character/{id}, dig into
//   ci_resolved -> specialization -> talents -> trees
// Exactly two trees carry points: the class tree (slug === class_slug) and the
// spec tree. Class = talents.class_label; spec = highest-point non-class tree.

async function fetchSpec(id: number): Promise<{
  spec: string | null
  className: string | null
  status: SpecStatus
  points?: Record<string, number>
}> {
  const data = await getJSON(CHARACTER(id))
  if (!data || data.__notFound || !data.success) return { spec: null, className: null, status: "error" }

  const talents = data?.ci_resolved?.specialization?.talents
  const trees = talents?.trees
  if (!trees || typeof trees !== "object") return { spec: null, className: null, status: "no-talents" }

  const classSlug: string | undefined = talents.class_slug
  const className: string | null = talents.class_label ?? null

  const pointsOf = (tree: any) =>
    tree?.points ?? (tree?.talents ?? []).reduce((a: number, t: any) => a + (t?.rank ?? 0), 0)

  const points: Record<string, number> = {}
  let specTree: { label: string; pts: number } | null = null

  for (const [slug, tree] of Object.entries<any>(trees)) {
    const pts = pointsOf(tree)
    const label: string = tree?.label ?? slug
    if (pts > 0) points[label] = pts
    if (slug === classSlug) continue
    if (pts > 0 && (!specTree || pts > specTree.pts)) specTree = { label, pts }
  }

  if (!specTree) return { spec: null, className, status: "no-talents" }
  return { spec: specTree.label, className, status: "resolved", points }
}

// ---- Resolve one character (class + optional spec) -------------------------

function blank(status: CacheHit["status"], withSpec: boolean): CacheHit {
  return {
    id: null,
    class: null,
    realm: null,
    region: null,
    has_armory: false,
    status,
    spec: null,
    spec_status: withSpec ? "no-armory" : "n/a",
  }
}

export async function resolve(name: string, realm: string, withSpec: boolean): Promise<CacheHit> {
  const data = await getJSON(BY_NAME(name, realm))
  if (!data || data.__notFound) return blank("not-found", withSpec)

  const ch = data?.character
  if (!data?.success || !ch) return blank("not-found", withSpec)

  const klass: string | null = ch.class ?? null
  const hit: CacheHit = {
    id: ch.id ?? null,
    class: klass,
    realm: ch.realm ?? null,
    region: ch.region ?? null,
    has_armory: !!data.has_armory,
    status: klass ? "resolved" : "no-class",
    spec: null,
    spec_status: "n/a",
  }

  if (!withSpec) return hit
  if (!hit.has_armory || hit.id == null) {
    hit.spec_status = "no-armory"
    return hit
  }

  const s = await fetchSpec(hit.id)
  hit.spec = s.spec
  hit.spec_status = s.status
  if (s.points) hit.spec_points = s.points
  if (!hit.class && s.className) {
    hit.class = s.className
    hit.status = "resolved"
  }
  return hit
}

/** Apply a manual class/spec override from in-game knowledge (mutates hit). */
export function applyOverride(hit: CacheHit, override: ManualOverride | undefined): void {
  if (!override) return
  if (override.class) {
    hit.class = override.class
    if (hit.status !== "resolved") hit.status = "resolved"
  }
  if (override.spec) {
    hit.spec = override.spec
    hit.spec_status = "manual"
  }
}

// ---- Bounded concurrency pool ----------------------------------------------

export async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await worker(items[next++])
    }),
  )
}
