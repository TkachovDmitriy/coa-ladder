import type { StreamersStatusResponse } from "../model/streamer.type"

const statusUrl = import.meta.env.VITE_TWITCH_STATUS_URL?.trim()

export async function fetchStreamerStatuses(signal: AbortSignal): Promise<StreamersStatusResponse | null> {
  if (!statusUrl) return null

  const response = await fetch(statusUrl, { signal })
  if (!response.ok) throw new Error(`Streamer status request failed (${response.status})`)

  const payload: unknown = await response.json()
  return isStatusResponse(payload) ? payload : null
}

function isStatusResponse(value: unknown): value is StreamersStatusResponse {
  if (!value || typeof value !== "object") return false

  const response = value as Partial<StreamersStatusResponse>
  return (
    typeof response.updatedAt === "string" &&
    Array.isArray(response.streamers) &&
    response.streamers.every(
      (streamer) =>
        streamer &&
        typeof streamer.channel === "string" &&
        typeof streamer.isLive === "boolean" &&
        (streamer.title === undefined || typeof streamer.title === "string") &&
        (streamer.viewerCount === undefined || typeof streamer.viewerCount === "number"),
    )
  )
}
