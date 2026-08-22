import { ExternalLink, Radio, Twitch, Users } from "lucide-react"

import type { LadderEntry } from "@/domains/ladder/model/ladder.type"
import { ClassIcon } from "@/shared/components/class-icon"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { cn } from "@/shared/utils/utils"

import { useStreamerStatuses } from "../application/use-streamer-statuses.hook"
import { STREAMERS } from "../model/streamers.constants"
import type { Streamer, StreamerLiveStatus } from "../model/streamer.type"

interface StreamersPanelProps {
  entries: LadderEntry[]
  realmId: number
}

interface StreamerCardData {
  streamer: Streamer
  entry?: LadderEntry
  status?: StreamerLiveStatus
}

export function StreamersPanel({ entries, realmId }: StreamersPanelProps) {
  const statuses = useStreamerStatuses()
  const realmStreamers = STREAMERS.filter((streamer) => streamer.realmId === realmId)
    .map<StreamerCardData>((streamer) => ({
      streamer,
      entry: entries.find((entry) => entry.name.toLowerCase() === streamer.characterName.toLowerCase()),
      status: statuses.get(streamer.twitchChannel.toLowerCase()),
    }))
    .sort((left, right) => Number(Boolean(right.status?.isLive)) - Number(Boolean(left.status?.isLive)))

  if (realmStreamers.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3 sm:px-5">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Twitch className="size-4 text-[#9146ff]" aria-hidden="true" />
            Streamers
          </CardTitle>
          <p className="text-xs text-muted-foreground">Watch ladder players on Twitch</p>
        </div>
        {realmStreamers.some(({ status }) => status?.isLive) ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            Live now
          </span>
        ) : null}
      </CardHeader>
      <CardContent
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto p-4 pt-0 sm:px-5"
        aria-label="Streamer channels"
      >
        {realmStreamers.map((data) => (
          <StreamerCard key={`${data.streamer.twitchChannel}-${data.streamer.characterName}`} data={data} />
        ))}
      </CardContent>
    </Card>
  )
}

function StreamerCard({ data: { streamer, entry, status } }: { data: StreamerCardData }) {
  const isLive = status?.isLive === true
  const channelUrl = `https://www.twitch.tv/${encodeURIComponent(streamer.twitchChannel)}`

  return (
    <a
      href={channelUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex w-[88%] shrink-0 snap-start items-center gap-3 rounded-md border p-3 transition-colors sm:w-[calc(50%-0.25rem)] lg:w-[calc(25%-0.375rem)]",
        isLive
          ? "border-red-500/40 bg-red-500/[0.06] hover:bg-red-500/10"
          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
      aria-label={`Watch ${streamer.twitchChannel} on Twitch${isLive ? " — live now" : ""}`}
    >
      <ClassIcon name={entry?.className ?? null} size={36} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{streamer.characterName}</span>
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              <Radio className="size-2.5" aria-hidden="true" /> LIVE
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs">
          <Twitch className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{streamer.twitchChannel}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{entry?.className ?? "Class unavailable"}</span>
        </span>
        {isLive && status.title ? (
          <span className="mt-1 block truncate text-xs text-foreground/80">{status.title}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
        <span className="font-medium text-foreground">{entry ? entry.rating.toLocaleString() : "—"}</span>
        {isLive && status.viewerCount !== undefined ? (
          <span className="flex items-center gap-1">
            <Users className="size-3" aria-hidden="true" />
            {status.viewerCount.toLocaleString()}
          </span>
        ) : (
          <ExternalLink className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        )}
      </span>
    </a>
  )
}
