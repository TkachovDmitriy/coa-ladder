# Twitch status Worker

Small Cloudflare Worker used by the static GitHub Pages frontend. It keeps the
Twitch client secret server-side, batches all configured channels into one
Helix request, and caches public status responses for 90 seconds.

## Configure and deploy

1. Register an application in the Twitch developer console.
2. Review `TWITCH_CHANNELS` and `ALLOWED_ORIGINS` in `wrangler.toml`.
3. Add the two secrets and deploy:

```sh
bunx wrangler secret put TWITCH_CLIENT_ID
bunx wrangler secret put TWITCH_CLIENT_SECRET
bunx wrangler deploy
```

4. Add an Actions repository variable named `TWITCH_STATUS_URL` containing the
   full Worker endpoint. The Pages workflow exposes it to Vite as:

```text
VITE_TWITCH_STATUS_URL=https://coa-streamer-status.<account>.workers.dev/streamers
```

The frontend treats this variable as optional. When it is absent or the Worker
is unavailable, streamer cards still link to Twitch but show no LIVE state.
