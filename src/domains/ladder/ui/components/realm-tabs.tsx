import { getRouteApi } from "@tanstack/react-router"

import { useLadderStore } from "@/domains/ladder/application/ladder.store"
import { DEFAULT_LADDER_SEARCH } from "@/domains/ladder/utils/ladder-search.utils"
import { REALMS } from "@/shared/constants/realms.constants"
import { cn } from "@/shared/utils/utils"

const route = getRouteApi("/$bracket")

/** Realm switcher — store-driven (realm is a UI selection, not a route). Resets filters: class/spec rosters differ between realms. */
export function RealmTabs() {
  const realmId = useLadderStore((s) => s.realmId)
  const setRealm = useLadderStore((s) => s.setRealm)
  const navigate = route.useNavigate()

  const handleSelect = (id: typeof realmId) => {
    setRealm(id)
    void navigate({ search: DEFAULT_LADDER_SEARCH, replace: true })
  }

  return (
    <nav className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary p-1" aria-label="Realm">
      {REALMS.map((realm) => {
        const active = realm.id === realmId
        return (
          <button
            key={realm.id}
            type="button"
            onClick={() => handleSelect(realm.id)}
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
