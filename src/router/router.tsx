import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router"

import { LadderPage } from "@/pages/ladder-page"
import { RootLayout } from "@/presentation/layouts/root-layout"
import { DEFAULT_LADDER_SEARCH, validateLadderSearch } from "@/domains/ladder/utils/ladder-search.utils"
import { DEFAULT_BRACKET, isBracket } from "@/shared/constants/brackets.constants"

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/$bracket", params: { bracket: DEFAULT_BRACKET }, search: DEFAULT_LADDER_SEARCH })
  },
})

const bracketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$bracket",
  validateSearch: validateLadderSearch,
  beforeLoad: ({ params }) => {
    if (!isBracket(params.bracket)) {
      throw redirect({ to: "/$bracket", params: { bracket: DEFAULT_BRACKET }, search: DEFAULT_LADDER_SEARCH })
    }
  },
  component: LadderPage,
})

const routeTree = rootRoute.addChildren([indexRoute, bracketRoute])

// Strip the trailing slash so the router basepath matches Vite's base.
const basepath = import.meta.env.BASE_URL.replace(/\/$/, "")

export const router = createRouter({ routeTree, basepath, defaultPreload: "intent" })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
