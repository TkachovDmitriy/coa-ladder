import { getRouteApi } from "@tanstack/react-router"
import type { SortingState } from "@tanstack/react-table"
import { useEffect } from "react"

import { useLadder } from "@/domains/ladder/application/use-ladder.hook"
import type { LadderSearchParams } from "@/domains/ladder/model/ladder-search.type"
import { fromSortingState, toSortingState } from "@/domains/ladder/utils/ladder-search.utils"
import { ratingCutoff } from "@/domains/ladder/utils/ladder.utils"
import { LadderTable, LadderToolbar, PreviouslyRankedTable, StatTiles } from "@/domains/ladder/ui"
import { Stats } from "@/domains/stats/ui"
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { DEFAULT_BRACKET, type Bracket } from "@/shared/constants/brackets.constants"

const indexRoute = getRouteApi("/")
const bracketRoute = getRouteApi("/$bracket")

/** Route entry for `/` — the canonical 1v1 ladder. */
export function IndexLadderPage() {
  const search = indexRoute.useSearch()
  const navigate = indexRoute.useNavigate()
  const updateSearch = (patch: Partial<LadderSearchParams>) => {
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false })
  }
  return <LadderView bracket={DEFAULT_BRACKET} search={search} updateSearch={updateSearch} />
}

/** Route entry for `/$bracket` — the 2v2/3v3 ladders (1v1 redirects to `/`). */
export function BracketLadderPage() {
  const { bracket } = bracketRoute.useParams() as { bracket: Bracket }
  const search = bracketRoute.useSearch()
  const navigate = bracketRoute.useNavigate()
  const updateSearch = (patch: Partial<LadderSearchParams>) => {
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false })
  }
  return <LadderView bracket={bracket} search={search} updateSearch={updateSearch} />
}

interface LadderViewProps {
  bracket: Bracket
  search: LadderSearchParams
  updateSearch: (patch: Partial<LadderSearchParams>) => void
}

/** Compose the ladder + stats domains for the active bracket. */
function LadderView({ bracket, search, updateSearch }: LadderViewProps) {
  const ladder = useLadder(bracket, search)
  const { state } = ladder

  useDocumentMeta(bracket)

  if (state.status === "idle" || state.status === "loading") return <LadderSkeleton />
  if (state.status === "error") return <ErrorState message={state.error} />

  return (
    <div className="space-y-6">
      <StatTiles entries={ladder.bracketEntries} />
      <Stats entries={ladder.bracketEntries} />

      <section className="space-y-3">
        <LadderToolbar
          search={search.search}
          className={search.class}
          classOptions={ladder.classOptions}
          onSearch={(value) => updateSearch({ search: value })}
          onClassName={(value) => updateSearch({ class: value })}
          resultCount={ladder.visibleEntries.length}
        />
        <LadderTable
          entries={ladder.visibleEntries}
          sorting={toSortingState(search)}
          onSortingChange={(sorting: SortingState) => updateSearch(fromSortingState(sorting))}
          realmId={ladder.realmId}
          bracket={bracket}
        />
      </section>

      <PreviouslyRankedTable
        entries={ladder.previouslyRankedEntries}
        currentCutoff={ratingCutoff(ladder.bracketEntries)}
      />
    </div>
  )
}

/** Keep document metadata and the bracket-specific canonical URL current during SPA navigation. */
function useDocumentMeta(bracket: Bracket) {
  useEffect(() => {
    const realmName = "Vol'Jin"
    const title = `CoA ${bracket} Arena Ladder — ${realmName} Rankings`
    const pageDescription = `View the Conquest of Azeroth ${bracket} PvP ladder for ${realmName}, including player ratings, wins, losses, classes, and arena rankings.`

    document.title = title

    // 1v1 is canonicalised to the site root; 2v2/3v3 keep their own URLs.
    const canonicalUrl =
      bracket === DEFAULT_BRACKET
        ? "https://tkachovdmitriy.github.io/coa-ladder/"
        : `https://tkachovdmitriy.github.io/coa-ladder/${bracket}/`

    const description = document.querySelector('meta[name="description"]')
    description?.setAttribute(
      "content",
      pageDescription,
    )

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl

    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl)

    const structuredData = document.querySelector<HTMLScriptElement>("#structured-data")
    if (structuredData) {
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://tkachovdmitriy.github.io/coa-ladder/#website",
            url: "https://tkachovdmitriy.github.io/coa-ladder/",
            name: "CoA Arena Ladder",
            description: pageDescription,
            inLanguage: "en",
          },
          {
            "@type": "WebPage",
            "@id": `${canonicalUrl}#webpage`,
            url: canonicalUrl,
            name: title,
            description: pageDescription,
            isPartOf: { "@id": "https://tkachovdmitriy.github.io/coa-ladder/#website" },
            inLanguage: "en",
          },
        ],
      })
    }
  }, [bracket])
}

/**
 * Mirrors StatTiles/Stats/LadderToolbar's real card/grid structure (not just
 * a flat block) so its height at each breakpoint approximates the real
 * content — the fetched data replaces this in place, and CLS is driven by
 * the height delta between the two, not by the table below (nothing in the
 * flow depends on the table's height but the footer).
 */
function LadderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Card className="border-primary/40 bg-primary/[0.06]">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-5 sm:p-5">
            <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="hidden h-10 w-16 shrink-0 sm:block" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-14" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-[480px] w-full rounded-lg" />
      </div>
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
