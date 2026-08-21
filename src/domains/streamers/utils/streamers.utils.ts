import type { Streamer } from "../model/streamer.type"

export function findStreamer(streamers: readonly Streamer[], realmId: number, characterName: string) {
  const normalizedName = characterName.trim().toLowerCase()
  return streamers.find(
    (streamer) => streamer.realmId === realmId && streamer.characterName.trim().toLowerCase() === normalizedName,
  )
}

export function uniqueTwitchChannels(streamers: readonly Streamer[]) {
  return [...new Set(streamers.map((streamer) => streamer.twitchChannel.trim().toLowerCase()).filter(Boolean))].sort()
}
