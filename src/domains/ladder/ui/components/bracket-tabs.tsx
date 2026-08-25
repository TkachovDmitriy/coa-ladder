import { Link, useMatchRoute } from "@tanstack/react-router"

import { DEFAULT_LADDER_SEARCH } from "@/domains/ladder/utils/ladder-search.utils"
import { BRACKETS, DEFAULT_BRACKET, isBracket, type Bracket } from "@/shared/constants/brackets.constants"
import { cn } from "@/shared/utils/utils"

const baseClass = "inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors"
const activeClass = "bg-primary text-primary-foreground shadow"
const idleClass = "text-muted-foreground hover:text-foreground"

/**
 * Bracket switcher — each tab is a route link. The active bracket is derived
 * directly from the current route (root = 1v1, otherwise the `$bracket` param)
 * rather than from Link activeProps, which mis-highlight across the split
 * `/` and `/$bracket` routes.
 */
export function BracketTabs() {
  const matchRoute = useMatchRoute()
  const match = matchRoute({ to: "/$bracket" })
  const param = match ? (match as { bracket: string }).bracket : undefined
  const activeBracket: Bracket = param && isBracket(param) ? param : DEFAULT_BRACKET

  return (
    <nav className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary p-1">
      {BRACKETS.map((bracket) => {
        const className = cn(baseClass, bracket.id === activeBracket ? activeClass : idleClass)
        // 1v1 is the canonical root URL; other brackets are `/$bracket`.
        return bracket.id === DEFAULT_BRACKET ? (
          <Link key={bracket.id} to="/" search={(prev) => ({ ...DEFAULT_LADDER_SEARCH, ...prev })} className={className}>
            {bracket.label}
          </Link>
        ) : (
          <Link
            key={bracket.id}
            to="/$bracket"
            params={{ bracket: bracket.id }}
            search={(prev) => ({ ...DEFAULT_LADDER_SEARCH, ...prev })}
            className={className}
          >
            {bracket.label}
          </Link>
        )
      })}
    </nav>
  )
}
