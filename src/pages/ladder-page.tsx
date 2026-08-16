import { getRouteApi } from "@tanstack/react-router"
import { useEffect } from "react"

import { useLadder } from "@/domains/ladder/application/use-ladder.hook"
import { LadderTable, LadderToolbar, StatTiles } from "@/domains/ladder/ui"
import { Stats } from "@/domains/stats/ui"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { Bracket } from "@/shared/constants/brackets.constants"

const route = getRouteApi("/$bracket")

/** Thin route entry: compose the ladder + stats domains for the active bracket. */
export function LadderPage() {
  const { bracket } = route.useParams() as { bracket: Bracket }
  const ladder = useLadder(bracket)
  const { state } = ladder

  useDocumentMeta(bracket, ladder.realmName)

  if (state.status === "idle" || state.status === "loading") return <LadderSkeleton />
  if (state.status === "error") return <ErrorState message={state.error} />

  return (
    <div className="space-y-6">
      <StatTiles entries={ladder.bracketEntries} />
      <Stats entries={ladder.bracketEntries} />

      <section className="space-y-3">
        <LadderToolbar
          search={ladder.search}
          className={ladder.className}
          classOptions={ladder.classOptions}
          onSearch={ladder.setSearch}
          onClassName={ladder.setClassName}
          resultCount={ladder.visibleEntries.length}
        />
        <LadderTable entries={ladder.visibleEntries} />
      </section>
    </div>
  )
}

/** Keep the tab title/description in sync with the active bracket for SPA navigation. */
function useDocumentMeta(bracket: Bracket, realmName: string) {
  useEffect(() => {
    document.title = `CoA Arena ${bracket} Ladder — ${realmName} (Realm 40)`

    const description = document.querySelector('meta[name="description"]')
    description?.setAttribute(
      "content",
      `Live ${bracket} arena ladder for Conquest of Azeroth realm 40 (${realmName}): player ratings, class distribution and armory links.`,
    )
  }, [bracket, realmName])
}

function LadderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-96" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <h2 className="text-lg font-semibold">Couldn’t load the ladder</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
