import type { Streamer } from "./streamer.type"

/**
 * Consented, manually verified character-to-Twitch mappings.
 * Add a streamer only after they opt in. One channel may be used by multiple characters.
 */
export const STREAMERS: readonly Streamer[] = [
  {
    realmId: 40, // Vol'Jin
    characterName: "Notarkaviun",
    twitchChannel: "arkaviun",
  },
  {
    realmId: 40, // Vol'Jin
    characterName: "Nidlich",
    twitchChannel: "nidlich",
  },
]
