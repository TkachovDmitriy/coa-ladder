/** Game realms — shown by name in the UI, addressed by numeric id under the hood. */

export interface RealmMeta {
  id: number
  name: string
}

export const REALMS = [
  { id: 40, name: "Vol'Jin" },
  { id: 41, name: "Rexxar" },
] as const satisfies readonly RealmMeta[]

export type RealmId = (typeof REALMS)[number]["id"]

export const DEFAULT_REALM: RealmId = 40

export function isRealm(value: number): value is RealmId {
  return REALMS.some((realm) => realm.id === value)
}

export function realmName(id: number): string {
  return REALMS.find((realm) => realm.id === id)?.name ?? `Realm ${id}`
}

/** URL-safe realm slug, e.g. "Vol'Jin" -> "voljin". Used in player URLs. */
export function realmSlug(id: number): string {
  return realmName(id)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

/** Resolve a realm slug back to its id; undefined if it matches no realm. */
export function realmFromSlug(slug: string): RealmId | undefined {
  const normalized = slug.toLowerCase()
  return REALMS.find((realm) => realmSlug(realm.id) === normalized)?.id
}
