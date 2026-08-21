import type { Streamer } from "../model/streamer.type"

export function findStreamer(streamers: readonly Streamer[], realmId: number, characterName: string) {
  const normalizedName = characterName.trim().toLowerCase()
  return streamers.find(
    (streamer) => streamer.realmId === realmId && streamer.characterName.trim().toLowerCase() === normalizedName,
  )
}
