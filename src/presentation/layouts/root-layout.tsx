import { Outlet } from "@tanstack/react-router"

import { useLadderStore } from "@/domains/ladder/application/ladder.store"
import { BracketTabs, RealmTabs } from "@/domains/ladder/ui"
import { ThemeToggle } from "@/presentation/theme/theme-toggle"
import { realmName } from "@/shared/constants/realms.constants"

export function RootLayout() {
  const state = useLadderStore((s) => s.data)
  const realmId = useLadderStore((s) => s.realmId)
  const generatedAt = state.status === "success" ? state.dataset.generatedAt : null

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border/80 backdrop-blur">
        <div className="container flex flex-col gap-4 py-5">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Conquest of Azeroth — Arena Ladder</h1>
              <p className="text-sm text-muted-foreground">
                {realmName(realmId)} realm · 1v1 / 2v2 / 3v3
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Realm</span>
              <RealmTabs />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bracket</span>
              <BracketTabs />
            </div>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border/60">
        <div className="container py-4 text-xs text-muted-foreground">
          {generatedAt ? <>Data updated {new Date(generatedAt).toLocaleString()} · </> : null}
          armory links open on ascensionlogs.gg · © 2026 Dmytro Tkachov. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
