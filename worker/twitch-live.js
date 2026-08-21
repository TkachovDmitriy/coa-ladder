const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
const TWITCH_STREAMS_URL = "https://api.twitch.tv/helix/streams"
const TOKEN_CACHE_URL = "https://cache.internal/twitch-token"

export default {
  async fetch(request, env, context) {
    const origin = request.headers.get("Origin")
    const corsHeaders = cors(origin, env.ALLOWED_ORIGIN)

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, corsHeaders)
    if (origin && origin !== env.ALLOWED_ORIGIN) return json({ error: "Origin not allowed" }, 403, corsHeaders)

    const requested = new URL(request.url).searchParams.get("channels")?.split(",") ?? []
    const allowed = new Set((env.TWITCH_CHANNELS ?? "").split(",").map(normalize).filter(Boolean))
    const channels = [...new Set(requested.map(normalize).filter((channel) => allowed.has(channel)))].slice(0, 100)
    if (channels.length === 0) return json({ streams: [], checkedAt: new Date().toISOString() }, 200, corsHeaders)

    const cache = caches.default
    const cacheKey = new Request(`https://cache.internal/live?channels=${channels.sort().join(",")}`)
    const cached = await cache.match(cacheKey)
    if (cached) return withCors(cached, corsHeaders)

    const token = await getAppToken(env, cache)
    const twitchUrl = new URL(TWITCH_STREAMS_URL)
    for (const channel of channels) twitchUrl.searchParams.append("user_login", channel)
    const twitchResponse = await fetch(twitchUrl, {
      headers: { Authorization: `Bearer ${token}`, "Client-Id": env.TWITCH_CLIENT_ID },
    })
    if (!twitchResponse.ok) return json({ error: "Twitch request failed" }, 502, corsHeaders)

    const payload = await twitchResponse.json()
    const body = JSON.stringify({
      streams: payload.data.map((stream) => ({
        channel: stream.user_login,
        title: stream.title,
        viewerCount: stream.viewer_count,
        startedAt: stream.started_at,
        thumbnailUrl: stream.thumbnail_url,
      })),
      checkedAt: new Date().toISOString(),
    })
    const response = new Response(body, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    })
    context.waitUntil(cache.put(cacheKey, response.clone()))
    return withCors(response, corsHeaders)
  },
}

async function getAppToken(env, cache) {
  const tokenKey = new Request(TOKEN_CACHE_URL)
  const cached = await cache.match(tokenKey)
  if (cached) return cached.text()

  const url = new URL(TWITCH_TOKEN_URL)
  url.searchParams.set("client_id", env.TWITCH_CLIENT_ID)
  url.searchParams.set("client_secret", env.TWITCH_CLIENT_SECRET)
  url.searchParams.set("grant_type", "client_credentials")
  const response = await fetch(url, { method: "POST" })
  if (!response.ok) throw new Error("Could not obtain Twitch app token")
  const payload = await response.json()
  const tokenResponse = new Response(payload.access_token, {
    headers: { "Cache-Control": `max-age=${Math.max(60, payload.expires_in - 60)}` },
  })
  await cache.put(tokenKey, tokenResponse)
  return payload.access_token
}

function normalize(value) {
  return value.trim().toLowerCase()
}

function cors(origin, allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? origin : allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  }
}

function json(value, status, extraHeaders) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  })
}

function withCors(response, corsHeaders) {
  const result = new Response(response.body, response)
  for (const [key, value] of Object.entries(corsHeaders)) result.headers.set(key, value)
  return result
}
