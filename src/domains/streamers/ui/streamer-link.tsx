import { Twitch } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"

import type { LiveStream, Streamer } from "../model/streamer.type"

interface StreamerLinkProps {
  streamer: Streamer
  liveStream?: LiveStream
}

export function StreamerLink({ streamer, liveStream }: StreamerLinkProps) {
  const channelUrl = `https://www.twitch.tv/${encodeURIComponent(streamer.twitchChannel)}`
  const label = liveStream ? `${streamer.twitchChannel} is live on Twitch` : `Watch ${streamer.twitchChannel} on Twitch`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className={liveStream
            ? "inline-flex h-7 items-center gap-1.5 rounded-full bg-[#9146ff]/15 px-2 text-[0.6875rem] font-bold uppercase tracking-wide text-[#9146ff] ring-1 ring-inset ring-[#9146ff]/25 transition-colors hover:bg-[#9146ff]/25"
            : "inline-flex size-7 items-center justify-center rounded-md bg-secondary text-muted-foreground transition-colors hover:bg-[#9146ff]/15 hover:text-[#9146ff]"}
          aria-label={label}
        >
          <Twitch className="size-4" aria-hidden="true" />
          {liveStream ? (
            <>
              <span className="size-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
              Live
            </>
          ) : (
            <span className="sr-only">Twitch</span>
          )}
        </a>
      </TooltipTrigger>
      <TooltipContent>
        {liveStream ? (
          <div className="max-w-64">
            <p className="font-medium">{liveStream.title}</p>
            <p className="text-xs opacity-80">{liveStream.viewerCount.toLocaleString()} watching</p>
          </div>
        ) : label}
      </TooltipContent>
    </Tooltip>
  )
}
