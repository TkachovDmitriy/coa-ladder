# Twitch live-status Worker

This endpoint keeps Twitch credentials out of the static GitHub Pages app and
returns live status only for manually allowed channels.

Configure these Worker values:

- secret `TWITCH_CLIENT_ID`
- secret `TWITCH_CLIENT_SECRET`
- variable `TWITCH_CHANNELS`: comma-separated Twitch channel logins (`arkaviun` initially)
- variable `ALLOWED_ORIGIN`: the ladder origin, without a trailing slash

The initial channel and site origin are already present in `wrangler.jsonc`.
Store the two credentials and deploy with Wrangler:

```sh
bunx wrangler secret put TWITCH_CLIENT_ID
bunx wrangler secret put TWITCH_CLIENT_SECRET
bunx wrangler deploy
```

Deploy `twitch-live.js`, then add its public URL as the GitHub Actions repository
variable `TWITCH_STATUS_URL`. The Pages workflow exposes that value to Vite at
build time. Keep `TWITCH_CHANNELS` aligned with the channels in
`src/domains/streamers/model/streamers.constants.ts`.
