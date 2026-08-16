import { useMemo, type ReactNode } from "react"

import { classColor, classIcon } from "@/shared/constants/classes.constants"
import { Card, CardContent } from "@/shared/components/ui/card"

import type { LadderEntry } from "../../model/ladder.type"
import { summarize } from "../../utils/ladder.utils"

interface StatTilesProps {
  entries: LadderEntry[]
}

export function StatTiles({ entries }: StatTilesProps) {
  const summary = useMemo(() => summarize(entries), [entries])
  const { topEntry, resolved, total, dominantClass, avgRating } = summary

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        label="Top rating"
        value={topEntry ? topEntry.rating.toLocaleString() : "—"}
        sub={topEntry?.name}
      />
      <Tile label="Avg rating" value={avgRating.toLocaleString()} sub={`${total} players`} />
      <Tile label="Armory resolved" value={`${resolved}/${total}`} sub="class known" />
      <Tile
        label="Dominant class"
        value={dominantClass ?? "—"}
        icon={dominantClass ? classIcon(dominantClass) : null}
        accent={dominantClass ? classColor(dominantClass) : undefined}
      />
    </div>
  )
}

interface TileProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: string
  icon?: string | null
}

function Tile({ label, value, sub, accent, icon }: TileProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 flex items-center gap-2 text-xl font-semibold tabular">
          {icon ? (
            <img
              src={icon}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 rounded-sm object-cover"
              style={accent ? { boxShadow: `0 0 0 1px ${accent}66` } : undefined}
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : accent ? (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
          ) : null}
          {value}
        </p>
        {sub ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}
