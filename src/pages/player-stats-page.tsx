import { getRouteApi, Link } from "@tanstack/react-router"
import { ArrowLeft, CalendarDays } from "lucide-react"
import { useEffect } from "react"

import { useLadderStore } from "@/domains/ladder/application/ladder.store"
import { usePlayerStats } from "@/domains/stats/application/use-player-stats.hook"
import { PlayerRatingChart } from "@/domains/stats/ui/components/player-rating-chart"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { Bracket } from "@/shared/constants/brackets.constants"
import { isRealm, realmName, type RealmId } from "@/shared/constants/realms.constants"

const route = getRouteApi("/$bracket/player/$realmId/$player")
const signed = new Intl.NumberFormat("en-US", { signDisplay: "always" })
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 })

export function PlayerStatsPage() {
  const params = route.useParams() as { bracket: Bracket; realmId: string; player: string }
  const realmId = Number(params.realmId) as RealmId
  const setRealm = useLadderStore((store) => store.setRealm)
  const { state, bracketStats, player } = usePlayerStats(realmId, params.bracket, params.player)

  useEffect(() => {
    if (isRealm(realmId)) setRealm(realmId)
  }, [realmId, setRealm])

  useEffect(() => {
    document.title = `${player?.name ?? params.player} — ${params.bracket} statistics | CoA Arena Ladder`
  }, [params.bracket, params.player, player?.name])

  if (state.status === "idle" || state.status === "loading") return <PlayerStatsSkeleton />
  if (state.status === "error") return <Message title="Couldn’t load player statistics" detail={state.error} bracket={params.bracket} />
  if (!bracketStats || !player) {
    return <Message title="No statistics yet" detail="This player has not appeared in the retained snapshots for this realm and bracket." bracket={params.bracket} />
  }

  const hasEnoughData = player.coverage !== "insufficient"
  const periodLabel = formatPeriod(player.firstCapturedAt, player.lastCapturedAt)

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link to="/$bracket" params={{ bracket: params.bracket }} search={{ search: params.player, class: null, spec: null, sort: null, dir: null }}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to ladder
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{realmName(realmId)} · {params.bracket}</p>
          <h2 className="text-3xl font-bold tracking-tight">{player.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> {periodLabel}
          </p>
        </div>
        <Badge className={coverageClass(player.coverage)}>{coverageLabel(player.coverage)}</Badge>
      </div>

      {!hasEnoughData ? (
        <Card className="border-amber-500/40 bg-amber-500/[0.06]">
          <CardContent className="p-4 text-sm">Statistics collection has just started. At least two snapshots are needed to calculate changes.</CardContent>
        </Card>
      ) : player.coverage === "partial" ? (
        <Card className="border-amber-500/40 bg-amber-500/[0.06]">
          <CardContent className="p-4 text-sm">This player was present in {player.snapshotCount} of {bracketStats.snapshotCount} available snapshots, so the period is incomplete.</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Current rating" value={player.currentRating.toLocaleString()} detail={`${player.minRating.toLocaleString()}–${player.maxRating.toLocaleString()} range`} />
        <Stat label="Rating change" value={hasEnoughData ? signed.format(player.ratingChange) : "—"} detail="during available period" tone={player.ratingChange} />
        <Stat label="Current place" value={`#${player.currentPlace}`} detail={hasEnoughData ? `${signed.format(player.placeChange)} places` : "change unavailable"} tone={player.placeChange} />
        <Stat label="Games" value={player.games?.toLocaleString() ?? "—"} detail={player.wins === null ? "record unavailable" : `${player.wins}W–${player.losses}L · ${player.winRate === null ? "—" : percent.format(player.winRate)}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rating history</CardTitle>
          <CardDescription>{player.snapshotCount} captured snapshots. Points are aggregate ladder snapshots, not individual matches.</CardDescription>
        </CardHeader>
        <CardContent><PlayerRatingChart points={player.trend} /></CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, detail, tone = 0 }: { label: string; value: string; detail: string; tone?: number }) {
  const color = tone > 0 ? "text-emerald-600 dark:text-emerald-500" : tone < 0 ? "text-red-600 dark:text-red-500" : ""
  return <Card><CardContent className="space-y-1 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className={`text-2xl font-bold tabular ${color}`}>{value}</p><p className="text-xs text-muted-foreground">{detail}</p></CardContent></Card>
}

function Message({ title, detail, bracket }: { title: string; detail: string; bracket: Bracket }) {
  return <div className="flex flex-col items-center gap-3 py-16 text-center"><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{detail}</p><Button asChild variant="outline"><Link to="/$bracket" params={{ bracket }} search={{ search: "", class: null, spec: null, sort: null, dir: null }}>Back to ladder</Link></Button></div>
}

function PlayerStatsSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-9 w-32" /><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-56" /><Skeleton className="h-4 w-48" /></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28" />)}</div><Skeleton className="h-80" /></div>
}

function formatPeriod(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })
  return from === to ? `First snapshot: ${formatter.format(new Date(to))}` : `${formatter.format(new Date(from))} – ${formatter.format(new Date(to))}`
}

function coverageLabel(coverage: "complete" | "partial" | "insufficient") {
  if (coverage === "complete") return "Complete coverage"
  if (coverage === "partial") return "Partial coverage"
  return "Collecting data"
}

function coverageClass(coverage: "complete" | "partial" | "insufficient") {
  return coverage === "complete" ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "border-amber-500/40 text-amber-600 dark:text-amber-400"
}
