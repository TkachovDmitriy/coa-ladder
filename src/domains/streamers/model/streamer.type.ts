export interface Streamer {
  realmId: number
  characterName: string
  twitchChannel: string
}

export interface StreamerLiveStatus {
  channel: string
  isLive: boolean
  title?: string
  viewerCount?: number
}

export interface StreamersStatusResponse {
  updatedAt: string
  streamers: StreamerLiveStatus[]
}
