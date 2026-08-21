import { Radio } from "lucide-react"

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
            ? "inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-red-600 hover:bg-red-500/25 dark:text-red-400"
            : "inline-flex text-[#9146ff] transition-colors hover:text-[#772ce8]"}
          aria-label={label}
        >
          <Radio className={liveStream ? "size-3 animate-pulse" : "size-3.5"} aria-hidden="true" />
          {liveStream ? "Live" : <span className="sr-only">Twitch</span>}
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
