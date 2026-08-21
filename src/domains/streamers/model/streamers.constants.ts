import type { Streamer } from "./streamer.type"

/**
 * Manually verified character-to-Twitch mappings.
 * Add one entry per character; a channel may be used by multiple characters.
 */
export const STREAMERS: readonly Streamer[] = [
  {
    realmId: 40, // Vol'Jin
    characterName: "Notarkaviun",
    twitchChannel: "arkaviun",
  },
]

export const TWITCH_STATUS_URL = import.meta.env.VITE_TWITCH_STATUS_URL?.trim() ?? ""
