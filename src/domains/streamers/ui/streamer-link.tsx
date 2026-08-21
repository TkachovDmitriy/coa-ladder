import { Twitch } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"

import type { Streamer } from "../model/streamer.type"

interface StreamerLinkProps {
  streamer: Streamer
}

export function StreamerLink({ streamer }: StreamerLinkProps) {
  const channelUrl = `https://www.twitch.tv/${encodeURIComponent(streamer.twitchChannel)}`
  const label = `Watch ${streamer.twitchChannel} on Twitch`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex size-7 items-center justify-center rounded-md bg-secondary text-muted-foreground transition-colors hover:bg-[#9146ff]/15 hover:text-[#9146ff]"
          aria-label={label}
        >
          <Twitch className="size-4" aria-hidden="true" />
          <span className="sr-only">Twitch</span>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
