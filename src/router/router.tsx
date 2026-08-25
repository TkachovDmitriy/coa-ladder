import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router"

import { IndexLadderPage, BracketLadderPage } from "@/pages/ladder-page"
import { PlayerPage } from "@/pages/player-page"
import { PrivacyPage } from "@/pages/privacy-page"
import { RootLayout } from "@/presentation/layouts/root-layout"
import { DEFAULT_LADDER_SEARCH, validateLadderSearch } from "@/domains/ladder/utils/ladder-search.utils"
import { DEFAULT_BRACKET, isBracket } from "@/shared/constants/brackets.constants"
import { realmFromSlug } from "@/shared/constants/realms.constants"

const rootRoute = createRootRoute({ component: RootLayout })

// `/` is the canonical 1v1 ladder — it renders the default bracket in place
// (no redirect away from it) so its ranking signals stay on one URL.
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: validateLadderSearch,
  component: IndexLadderPage,
})

const bracketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$bracket",
  validateSearch: validateLadderSearch,
  beforeLoad: ({ params, search }) => {
    // The 1v1 bracket lives at `/`; consolidate `/1v1` into it so the two
    // URLs don't compete for the same content.
    if (params.bracket === DEFAULT_BRACKET) {
      throw redirect({ to: "/", search })
    }
    if (!isBracket(params.bracket)) {
      throw redirect({ to: "/", search: DEFAULT_LADDER_SEARCH })
    }
  },
  component: BracketLadderPage,
})

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "privacy",
  component: PrivacyPage,
})

// Per-player weekly stats, deep-linkable. Realm slug + bracket disambiguate
// players whose names collide across realms/brackets.
const playerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "player/$realm/$bracket/$name",
  beforeLoad: ({ params }) => {
    if (realmFromSlug(params.realm) === undefined || !isBracket(params.bracket)) {
      throw redirect({ to: "/", search: DEFAULT_LADDER_SEARCH })
    }
  },
  component: PlayerPage,
})

const routeTree = rootRoute.addChildren([indexRoute, bracketRoute, privacyRoute, playerRoute])

// Strip the trailing slash so the router basepath matches Vite's base.
const basepath = import.meta.env.BASE_URL.replace(/\/$/, "")

// Drop empty/default values from the URL so shared links stay clean:
// `/` with no filters instead of `?search=&class=null&spec=null&sort=null&dir=null`.
// Every meaningful ladder search value is a plain string, so we serialize as
// flat strings (no JSON quoting) and let validateLadderSearch narrow on read.
function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === null || value === undefined || value === "") continue
    params.set(key, String(value))
  }
  const str = params.toString()
  return str ? `?${str}` : ""
}

function parseSearch(searchStr: string): Record<string, unknown> {
  const params = new URLSearchParams(searchStr.replace(/^\?/, ""))
  return Object.fromEntries(params.entries())
}

export const router = createRouter({
  routeTree,
  basepath,
  defaultPreload: "intent",
  parseSearch,
  stringifySearch,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
