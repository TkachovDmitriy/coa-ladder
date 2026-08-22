import { Outlet } from "@tanstack/react-router"
import { Coffee, Github } from "lucide-react"

import { useLadderStore } from "@/domains/ladder/application/ladder.store"
import { BracketTabs, RealmTabs } from "@/domains/ladder/ui"
import { ThemeToggle } from "@/presentation/theme/theme-toggle"
import { Button } from "@/shared/components/ui/button"

export function RootLayout() {
  const state = useLadderStore((s) => s.data)
  const generatedAt = state.status === "success" ? state.dataset.generatedAt : null

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border/80 backdrop-blur">
        <div className="container flex flex-col gap-4 py-5">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Conquest of Azeroth — Arena Ladder</h1>
            </div>
            <div className="flex items-center gap-2 pt-2 md:pt-0">
              <Button asChild size="sm" variant="outline">
                <a href="https://github.com/TkachovDmitriy" target="_blank" rel="noopener noreferrer">
                  <Github className="size-4" aria-hidden="true" />
                  GitHub
                </a>
              </Button>
              <Button
                asChild
                className="bg-[#bb73f5] text-white hover:bg-[#a95ee8]"
                size="sm"
              >
                <a href="https://ko-fi.com/F0B325BP3P" target="_blank" rel="noopener noreferrer">
                  <Coffee className="size-4" aria-hidden="true" />
                  Support me on Ko-fi
                </a>
              </Button>
              <ThemeToggle />
            </div>
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
