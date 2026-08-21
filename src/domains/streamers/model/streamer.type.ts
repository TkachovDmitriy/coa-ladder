export interface Streamer {
  realmId: number
  characterName: string
  twitchChannel: string
}

export interface LiveStream {
  channel: string
  title: string
  viewerCount: number
  startedAt: string
  thumbnailUrl: string
}

export interface LiveStreamsResponse {
  streams: LiveStream[]
  checkedAt: string
}
