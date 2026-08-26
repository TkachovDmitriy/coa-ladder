import { getRouteApi, Link } from "@tanstack/react-router"
import { ArrowDown, ArrowLeft, ArrowUp, Crown, Medal, Minus, Percent, Swords, TrendingUp } from "lucide-react"
import { useEffect } from "react"

import { useLadderStore } from "@/domains/ladder/application/ladder.store"
import type { LadderEntry, RealmLadder } from "@/domains/ladder/model/ladder.type"
import { DEFAULT_LADDER_SEARCH } from "@/domains/ladder/utils/ladder-search.utils"
import { armoryUrl, winRate } from "@/domains/ladder/utils/ladder.utils"
import { playerStanding, type PlayerStanding } from "@/domains/ladder/utils/standing.utils"
import { usePlayerWeeklyStats, type PlayerWeeklyView } from "@/domains/stats/application/use-weekly-stats.hook"
import { RatingTrendChart } from "@/domains/stats/ui/components/rating-trend-chart"
import type { PlayerWeeklyStats } from "@/domains/stats/model/weekly-stats.type"
import { findStreamer, STREAMERS, StreamerLink } from "@/domains/streamers"
import { ClassIcon } from "@/shared/components/class-icon"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { BRACKETS, isBracket, type Bracket } from "@/shared/constants/brackets.constants"
import { classColor } from "@/shared/constants/classes.constants"
import { DEFAULT_REALM, realmFromSlug, realmName, realmSlug, type RealmId } from "@/shared/constants/realms.constants"
import { cn } from "@/shared/utils/utils"

const playerRoute = getRouteApi("/player/$realm/$bracket/$name")

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })
const dateLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** Locate a player's current ladder row (live table first, then dropped-out registry). */
function findLadderEntry(
  dataset: { realms: { id: number; brackets: Record<Bracket, LadderEntry[]>; previouslyRanked?: Record<Bracket, LadderEntry[]> }[] } | null,
  realmId: RealmId,
  bracket: Bracket,
  name: string,
): LadderEntry | undefined {
  const realm = dataset?.realms.find((r) => r.id === realmId)
  return realm?.brackets[bracket]?.find((e) => e.name === name) ?? realm?.previouslyRanked?.[bracket]?.find((e) => e.name === name)
}

/** Route entry for `/player/$realm/$bracket/$name` — one player's full profile. */
export function PlayerPage() {
  const params = playerRoute.useParams() as { realm: string; bracket: string; name: string }
  const realmId = realmFromSlug(params.realm) ?? DEFAULT_REALM
  const bracket: Bracket = isBracket(params.bracket) ? params.bracket : "1v1"
  const name = params.name

  const ladderData = useLadderStore((s) => s.data)
  const loadLadder = useLadderStore((s) => s.load)
  useEffect(() => {
    void loadLadder()
  }, [loadLadder])

  const weekly = usePlayerWeeklyStats(realmId, bracket, name)
  usePlayerMeta(name, realmId, bracket)

  const ladderReady = ladderData.status === "success"
  const realm = ladderReady ? ladderData.dataset.realms.find((r) => r.id === realmId) : undefined
  const bracketEntries = realm?.brackets[bracket] ?? []
  const entry = ladderReady ? findLadderEntry(ladderData.dataset, realmId, bracket, name) : undefined
  const standing = entry && bracketEntries.length > 0 ? playerStanding(bracketEntries, entry) : null
  const streamer = findStreamer(STREAMERS, realmId, name)

  const weeklyRatingChange = weekly.status === "ready" ? weekly.player.ratingChange : null
  const loading = weekly.status === "loading" || ladderData.status === "idle" || ladderData.status === "loading"
  const nothingFound = ladderReady && !entry && (weekly.status === "not-found" || weekly.status === "absent")

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm" className="w-fit gap-1.5">
        <Link to="/" search={DEFAULT_LADDER_SEARCH}>
          <ArrowLeft className="size-4" />
          Back to ladder
        </Link>
      </Button>

      <ProfileHeader name={name} realmId={realmId} bracket={bracket} entry={entry} streamer={streamer} />

      {!loading && (entry || weeklyRatingChange !== null) ? (
        <MomentumRow day={entry?.ratingChange ?? null} week={weeklyRatingChange} />
      ) : null}

      {loading ? <PlayerSkeleton /> : null}

      {!loading && nothingFound ? (
        <Notice>
          No data for “{name}” in {bracket} on {realmName(realmId)} — they may be new or off the tracked ladder.
        </Notice>
      ) : null}

      {!loading && !nothingFound ? (
        <>
          {entry ? <StandingCard entry={entry} standing={standing} realmId={realmId} /> : null}
          {realm ? <CrossBracket realm={realm} currentBracket={bracket} name={name} /> : null}
          <WeeklySection weekly={weekly} color={entry?.className ? classColor(entry.className) : undefined} />
        </>
      ) : null}
    </div>
  )
}

function ProfileHeader({
  name,
  realmId,
  bracket,
  entry,
  streamer,
}: {
  name: string
  realmId: RealmId
  bracket: Bracket
  entry: LadderEntry | undefined
  streamer: ReturnType<typeof findStreamer>
}) {
  const className = entry?.className ?? null
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ClassIcon name={className} size={72} />
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <span className="truncate" style={className ? { color: classColor(className) } : undefined}>
            {name}
          </span>
          {streamer ? <StreamerLink streamer={streamer} /> : null}
        </h1>
        <p className="text-sm text-muted-foreground">
          {className ? <span style={{ color: classColor(className) }}>{className}</span> : "Unknown class"}
          {entry?.spec ? ` · ${entry.spec}` : ""} · {realmName(realmId)} · {bracket}
        </p>
      </div>
      {entry?.spec ? (
        <Button asChild variant="outline" size="sm" className="ml-auto gap-1.5">
          <a href={armoryUrl(entry, realmId)} target="_blank" rel="noreferrer">
            <Swords className="size-4" aria-hidden="true" />
            View gear
          </a>
        </Button>
      ) : null}
    </div>
  )
}

interface ContextTile {
  icon: typeof Crown
  label: string
  value: string
  hint: string
  tone: "good" | "bad" | "neutral"
  className?: string | null
}

function buildContextTiles(standing: PlayerStanding): ContextTile[] {
  const pct = Math.max(1, Math.ceil(standing.percentile * 100))
  const tiles: ContextTile[] = [
    {
      icon: Percent,
      label: "Field",
      value: `Top ${pct}% · of ${standing.total}`,
      hint: `Ranked #${standing.place} of ${standing.total} players in this bracket — the top ${pct}%.`,
      tone: "neutral",
    },
    {
      icon: Crown,
      label: "Behind top 1",
      value: standing.toFirst === 0 ? "Top 1 — leader" : `${standing.toFirst.toLocaleString()} rating`,
      hint:
        standing.toFirst === 0
          ? "You hold the top spot (rank #1) in this bracket."
          : `You're ${standing.toFirst.toLocaleString()} rating below the top player (rank #1).`,
      tone: standing.toFirst === 0 ? "good" : "neutral",
    },
  ]
  if (standing.toTop10 !== null) {
    tiles.push({
      icon: Medal,
      label: "Top 10",
      value: standing.toTop10 >= 0 ? "Inside top 10" : `${(-standing.toTop10).toLocaleString()} rating away`,
      hint:
        standing.toTop10 >= 0
          ? "You're currently inside the top 10 of this bracket."
          : `You need ${(-standing.toTop10).toLocaleString()} more rating to reach the current top-10 cutoff.`,
      tone: standing.toTop10 >= 0 ? "good" : "neutral",
    })
  }
  if (standing.classRank && standing.className) {
    tiles.push({
      icon: Crown,
      label: "In class",
      value: `#${standing.classRank} · of ${standing.classCount}`,
      hint: `Rank #${standing.classRank} among the ${standing.classCount} ${standing.className} players in this bracket.`,
      tone: "neutral",
      className: standing.className,
    })
  }
  if (standing.vsClassAvg !== null) {
    tiles.push({
      icon: TrendingUp,
      label: "vs class avg",
      value: `${signed(standing.vsClassAvg)} rating`,
      hint: `Your rating is ${signed(standing.vsClassAvg)} versus the average rating of your class in this bracket.`,
      tone: standing.vsClassAvg > 0 ? "good" : standing.vsClassAvg < 0 ? "bad" : "neutral",
    })
  }
  return tiles
}

const toneClass = {
  good: "text-emerald-600 dark:text-emerald-500",
  bad: "text-red-600 dark:text-red-500",
  neutral: "text-foreground",
} as const

/** Combined current standing (rank/rating/record/win%) + positional context. */
function StandingCard({ entry, standing, realmId }: { entry: LadderEntry; standing: PlayerStanding | null; realmId: RealmId }) {
  const tiles = standing ? buildContextTiles(standing) : []
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Standing</CardTitle>
        <span className="text-xs text-muted-foreground">{realmName(realmId)} · live ladder</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Rank" value={`#${entry.place}`} />
          <Metric
            label="Rating"
            value={
              <span className="inline-flex items-baseline gap-1.5">
                {entry.rating.toLocaleString()}
                {entry.ratingChange ? <ChangeBadge value={entry.ratingChange} /> : null}
              </span>
            }
            hint="Current rating; badge is the change over the last 24h"
          />
          <Metric label="Record" value={`${entry.wins}–${entry.losses}`} hint="Season wins–losses" />
          <Metric label="Win rate" value={percent.format(winRate(entry))} hint="Season win rate" />
        </div>

        {tiles.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-4 sm:grid-cols-3">
            {tiles.map((t) => (
              <Tooltip key={t.label}>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center gap-3 rounded-lg bg-secondary/30 p-3">
                    {t.className ? (
                      <ClassIcon name={t.className} size={34} />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <t.icon className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</div>
                      <div className={cn("truncate text-sm font-semibold tabular", toneClass[t.tone])}>{t.value}</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t.hint}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function MomentumRow({ day, week }: { day: number | null; week: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Momentum</span>
      <MomentumBadge label="24h" value={day} />
      <MomentumBadge label="7d" value={week} />
    </div>
  )
}

function MomentumBadge({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  const steady = value === 0
  const up = value > 0
  const color = steady
    ? "text-muted-foreground"
    : up
      ? "text-emerald-600 dark:text-emerald-500"
      : "text-red-600 dark:text-red-500"
  const Icon = steady ? Minus : up ? ArrowUp : ArrowDown
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-0.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("inline-flex items-center gap-0.5 font-medium tabular", color)}>
        <Icon className="size-3" strokeWidth={2.5} />
        {steady ? "steady" : signed(value)}
      </span>
    </span>
  )
}

/**
 * Bracket switcher for the same player — a segmented control over the brackets
 * they appear in, with the current one highlighted (not hidden). Hidden
 * entirely when the player only appears in a single bracket.
 */
function CrossBracket({ realm, currentBracket, name }: { realm: RealmLadder; currentBracket: Bracket; name: string }) {
  const appearances = BRACKETS.map((b) => {
    const found = realm.brackets[b.id]?.find((e) => e.name === name)
    return found ? { bracket: b.id, place: found.place, rating: found.rating } : null
  }).filter((a): a is { bracket: Bracket; place: number; rating: number } => a !== null)

  if (appearances.length <= 1) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">Brackets</h2>
      <nav className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-secondary p-1" aria-label="Player brackets">
        {appearances.map((a) => {
          const isCurrent = a.bracket === currentBracket
          const tabClass = cn(
            "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
            isCurrent ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
          )
          return isCurrent ? (
            <span key={a.bracket} className={tabClass} aria-current="page">
              {a.bracket}
            </span>
          ) : (
            <Link
              key={a.bracket}
              to="/player/$realm/$bracket/$name"
              params={{ realm: realmSlug(realm.id), bracket: a.bracket, name }}
              className={tabClass}
            >
              {a.bracket}
            </Link>
          )
        })}
      </nav>
    </section>
  )
}

function WeeklySection({ weekly, color }: { weekly: PlayerWeeklyView; color?: string }) {
  if (weekly.status === "error") {
    // Soft-fail: the rest of the profile still renders. Keep the technical
    // detail in the console rather than showing an HTTP code to players.
    if (typeof console !== "undefined") console.warn("weekly stats unavailable:", weekly.error)
    return <Notice>Weekly statistics are temporarily unavailable — check back soon.</Notice>
  }
  if (weekly.status === "absent") return <Notice>Weekly statistics aren’t available for this realm and bracket yet.</Notice>
  if (weekly.status === "not-found") {
    return <Notice>No seven-day history yet — this player hasn’t appeared in enough ladder snapshots.</Notice>
  }
  if (weekly.status === "loading") return null

  const { player, expectedSnapshotCount } = weekly
  const range =
    player.firstCapturedAt && player.lastCapturedAt
      ? `${dateLabel.format(new Date(player.firstCapturedAt))} – ${dateLabel.format(new Date(player.lastCapturedAt))}`
      : "unknown range"

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Last 7 days</h2>
        <CoverageBadge coverage={player.coverage} />
        <span className="text-xs text-muted-foreground">
          {player.snapshotCount} of ~{expectedSnapshotCount} snapshots · {range}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Rating change" value={<Delta value={player.ratingChange} />} />
        <Metric label="Place change" value={<Delta value={player.placeChange} higherIsBetter />} hint="Positive means the player climbed the ladder" />
        <Metric label="Games" value={numOrDash(player.games)} hint="Wins + losses between snapshots — not per-match data" />
        <Metric label="7d win rate" value={player.winRate === null ? dash() : percent.format(player.winRate)} />
        <Metric label="Wins (7d)" value={numOrDash(player.wins)} />
        <Metric label="Losses (7d)" value={numOrDash(player.losses)} />
        <Metric label="Min rating" value={player.minRating.toLocaleString()} />
        <Metric label="Max rating" value={player.maxRating.toLocaleString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rating trend</CardTitle>
        </CardHeader>
        <CardContent>
          <RatingTrendChart points={player.trend} color={color} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Seven-day figures describe change between ladder snapshots, not individual matches. “—” means a value can’t be
        computed (missing W/L history or a season reset).
      </p>
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  const labelEl = hint ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs uppercase tracking-wide text-muted-foreground underline decoration-dotted underline-offset-2 cursor-help">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  ) : (
    <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
  )
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      {labelEl}
      <div className="mt-1 text-lg font-semibold tabular">{value}</div>
    </div>
  )
}

function Delta({ value, higherIsBetter = true }: { value: number; higherIsBetter?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground">0</span>
  const good = higherIsBetter ? value > 0 : value < 0
  const color = good ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
  const Icon = value > 0 ? ArrowUp : ArrowDown
  return (
    <span className={cn("inline-flex items-center gap-0.5", color)}>
      <Icon className="size-4" strokeWidth={2.5} />
      {signed(value)}
    </span>
  )
}

function ChangeBadge({ value }: { value: number }) {
  const up = value > 0
  const color = up ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular", color)}>
      <Icon className="size-3" strokeWidth={2.5} />
      {signed(value)}
    </span>
  )
}

function numOrDash(n: number | null) {
  return n === null ? dash() : n.toLocaleString()
}

function dash() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center text-muted-foreground">
          <Minus className="size-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent>No comparable data (missing W/L history or a season reset).</TooltipContent>
    </Tooltip>
  )
}

function CoverageBadge({ coverage }: { coverage: PlayerWeeklyStats["coverage"] }) {
  const map = {
    complete: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    partial: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    insufficient: "border-border bg-secondary/40 text-muted-foreground",
  } as const
  return <span className={cn("rounded-md border px-2 py-0.5 text-xs font-medium capitalize", map[coverage])}>{coverage}</span>
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">{children}</div>
}

function PlayerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

/** Player-specific document metadata for shared links. */
function usePlayerMeta(name: string, realmId: RealmId, bracket: Bracket) {
  useEffect(() => {
    const title = `${name} — ${bracket} weekly stats — ${realmName(realmId)} — CoA Arena`
    document.title = title
    const description = `Seven-day rating, place, games, and win-rate changes for ${name} in Conquest of Azeroth ${bracket} arena on ${realmName(realmId)}.`
    document.querySelector('meta[name="description"]')?.setAttribute("content", description)
  }, [name, realmId, bracket])
}
