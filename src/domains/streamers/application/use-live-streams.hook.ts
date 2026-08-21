import { useCallback, useEffect, useMemo, useState } from "react"

import type { LiveStream, LiveStreamsResponse } from "../model/streamer.type"

const REFRESH_INTERVAL_MS = 2 * 60 * 1_000

export function useLiveStreams(channels: readonly string[], endpoint: string, enabled = true) {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const channelKey = channels.join(",")

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!enabled || !endpoint || !channelKey) {
      setStreams([])
      return
    }

    try {
      const url = new URL(endpoint)
      url.searchParams.set("channels", channelKey)
      const response = await fetch(url, { signal })
      if (!response.ok) throw new Error(`Stream status request failed (${response.status})`)
      const payload = (await response.json()) as LiveStreamsResponse
      setStreams(payload.streams)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.warn("Could not refresh Twitch live status", error)
      }
    }
  }, [channelKey, enabled, endpoint])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)

    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      controller.abort()
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [refresh])

  return useMemo(
    () => new Map(streams.map((stream) => [stream.channel.toLowerCase(), stream])),
    [streams],
  )
}
