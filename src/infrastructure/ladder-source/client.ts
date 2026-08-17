/**
 * The app's only data source: static files served from the app's own origin
 * under its base path (e.g. /coa-ladder/). No external API is called from the
 * browser — the browser is CORS-blocked from the game/armory APIs, so the
 * dataset is produced server-side (see scripts/) and fetched here as a file.
 */

const BASE_URL = import.meta.env.BASE_URL

export async function fetchJson<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-cache" })
  if (!res.ok) throw new Error(`Failed to fetch ${path} (HTTP ${res.status})`)
  return (await res.json()) as T
}
