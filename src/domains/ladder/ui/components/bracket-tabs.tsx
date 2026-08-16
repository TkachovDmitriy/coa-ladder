import { Link } from "@tanstack/react-router"

import { DEFAULT_LADDER_SEARCH } from "@/domains/ladder/utils/ladder-search.utils"
import { BRACKETS } from "@/shared/constants/brackets.constants"
import { cn } from "@/shared/utils/utils"

/** Bracket switcher — each tab is a route link (deep-linkable). */
export function BracketTabs() {
  return (
    <nav className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary p-1">
      {BRACKETS.map((bracket) => (
        <Link
          key={bracket.id}
          to="/$bracket"
          params={{ bracket: bracket.id }}
          search={(prev) => ({ ...DEFAULT_LADDER_SEARCH, ...prev })}
          className={cn(
            "inline-flex items-center rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
          )}
          activeProps={{ className: "bg-primary text-primary-foreground shadow hover:text-primary-foreground" }}
        >
          {bracket.label}
        </Link>
      ))}
    </nav>
  )
}
