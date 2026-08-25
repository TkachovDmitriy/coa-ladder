import { Link } from "@tanstack/react-router"

import { DEFAULT_LADDER_SEARCH } from "@/domains/ladder/utils/ladder-search.utils"
import { BRACKETS, DEFAULT_BRACKET } from "@/shared/constants/brackets.constants"
import { cn } from "@/shared/utils/utils"

const tabClassName = cn(
  "inline-flex items-center rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
)
const activeProps = { className: "bg-primary text-primary-foreground shadow hover:text-primary-foreground" }

/** Bracket switcher — each tab is a route link (deep-linkable). */
export function BracketTabs() {
  return (
    <nav className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary p-1">
      {BRACKETS.map((bracket) =>
        // 1v1 is the canonical root URL; other brackets are `/$bracket`.
        bracket.id === DEFAULT_BRACKET ? (
          <Link
            key={bracket.id}
            to="/"
            search={(prev) => ({ ...DEFAULT_LADDER_SEARCH, ...prev })}
            activeOptions={{ exact: true }}
            className={tabClassName}
            activeProps={activeProps}
          >
            {bracket.label}
          </Link>
        ) : (
          <Link
            key={bracket.id}
            to="/$bracket"
            params={{ bracket: bracket.id }}
            search={(prev) => ({ ...DEFAULT_LADDER_SEARCH, ...prev })}
            className={tabClassName}
            activeProps={activeProps}
          >
            {bracket.label}
          </Link>
        ),
      )}
    </nav>
  )
}
