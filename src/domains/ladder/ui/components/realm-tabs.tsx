import { useLadderStore } from "@/domains/ladder/application/ladder.store"
import { REALMS } from "@/shared/constants/realms.constants"
import { cn } from "@/shared/utils/utils"

/** Realm switcher — store-driven (realm is a UI selection, not a route). */
export function RealmTabs() {
  const realmId = useLadderStore((s) => s.realmId)
  const setRealm = useLadderStore((s) => s.setRealm)

  return (
    <nav className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary p-1" aria-label="Realm">
      {REALMS.map((realm) => {
        const active = realm.id === realmId
        return (
          <button
            key={realm.id}
            type="button"
            onClick={() => setRealm(realm.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {realm.name}
          </button>
        )
      })}
    </nav>
  )
}
