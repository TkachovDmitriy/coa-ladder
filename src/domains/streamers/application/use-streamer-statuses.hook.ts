import { useEffect, useState } from "react"

import { fetchStreamerStatuses } from "../api/streamers.api"
import type { StreamerLiveStatus } from "../model/streamer.type"

const REFRESH_INTERVAL_MS = 120_000

export function useStreamerStatuses() {
  const [statuses, setStatuses] = useState<ReadonlyMap<string, StreamerLiveStatus>>(new Map())

  useEffect(() => {
    let active = true
    let controller: AbortController | undefined

    const refresh = async () => {
      controller?.abort()
      controller = new AbortController()

      try {
        const response = await fetchStreamerStatuses(controller.signal)
        if (!active || !response) return

        setStatuses(new Map(response.streamers.map((status) => [status.channel.toLowerCase(), status])))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        // Keep the last successful result. Streamer cards remain useful when the status service is unavailable.
      }
    }

    void refresh()
    const intervalId = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS)

    return () => {
      active = false
      controller?.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  return statuses
}
