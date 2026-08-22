const STATUS_CACHE_SECONDS = 90
const TOKEN_EXPIRY_MARGIN_SECONDS = 300
const TOKEN_CACHE_URL = "https://worker.internal/twitch-app-token"

export default {
  async fetch(request, env, context) {
    const origin = request.headers.get("Origin")
    const corsHeaders = cors(origin, env.ALLOWED_ORIGINS)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const url = new URL(request.url)
    if (request.method !== "GET" || url.pathname !== "/streamers") {
      return json({ error: "Not found" }, 404, corsHeaders)
    }

    if (origin && !corsHeaders.has("Access-Control-Allow-Origin")) {
      return json({ error: "Origin not allowed" }, 403, corsHeaders)
    }

    const cache = caches.default
    const cacheKey = new Request(url.toString(), { method: "GET" })
    const cached = await cache.match(cacheKey)
    if (cached) return withCors(cached, corsHeaders)

    try {
      const channels = parseChannels(env.TWITCH_CHANNELS)
      const token = await getAppToken(env, cache, context)
      const statuses = await getStreamStatuses(channels, token, env.TWITCH_CLIENT_ID)
      const response = json(
        { updatedAt: new Date().toISOString(), streamers: statuses },
        200,
        new Headers({ "Cache-Control": `public, max-age=${STATUS_CACHE_SECONDS}` }),
      )

      context.waitUntil(cache.put(cacheKey, response.clone()))
      return withCors(response, corsHeaders)
    } catch (error) {
      console.error("Unable to load Twitch statuses", error)
      return json({ error: "Streamer status is temporarily unavailable" }, 503, corsHeaders)
    }
  },
}

async function getAppToken(env, cache, context) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    throw new Error("Twitch credentials are not configured")
  }

  const tokenCacheKey = new Request(TOKEN_CACHE_URL)
  const cached = await cache.match(tokenCacheKey)
  if (cached) return cached.text()

  const body = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  })
  const response = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", body })
  if (!response.ok) throw new Error(`Twitch authentication failed (${response.status})`)

  const payload = await response.json()
  if (typeof payload.access_token !== "string" || typeof payload.expires_in !== "number") {
    throw new Error("Twitch returned an invalid token response")
  }

  const maxAge = Math.max(60, payload.expires_in - TOKEN_EXPIRY_MARGIN_SECONDS)
  const cachedToken = new Response(payload.access_token, {
    // This synthetic cache key is never routed publicly; `public` only allows Cache API storage.
    headers: { "Cache-Control": `public, max-age=${maxAge}` },
  })
  context.waitUntil(cache.put(tokenCacheKey, cachedToken))
  return payload.access_token
}

async function getStreamStatuses(channels, token, clientId) {
  if (channels.length === 0) return []

  const streamsUrl = new URL("https://api.twitch.tv/helix/streams")
  for (const channel of channels) streamsUrl.searchParams.append("user_login", channel)

  const response = await fetch(streamsUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": clientId,
    },
  })
  if (!response.ok) throw new Error(`Twitch streams request failed (${response.status})`)

  const payload = await response.json()
  const liveByChannel = new Map(
    (Array.isArray(payload.data) ? payload.data : []).map((stream) => [stream.user_login.toLowerCase(), stream]),
  )

  return channels.map((channel) => {
    const stream = liveByChannel.get(channel)
    return stream
      ? {
          channel,
          isLive: true,
          title: typeof stream.title === "string" ? stream.title : "",
          viewerCount: typeof stream.viewer_count === "number" ? stream.viewer_count : 0,
        }
      : { channel, isLive: false }
  })
}

function parseChannels(value) {
  return [...new Set(String(value ?? "").split(",").map((channel) => channel.trim().toLowerCase()).filter(Boolean))].slice(0, 100)
}

function cors(origin, configuredOrigins) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  })
  const allowed = String(configuredOrigins ?? "").split(",").map((value) => value.trim())
  if (origin && allowed.includes(origin)) headers.set("Access-Control-Allow-Origin", origin)
  return headers
}

function withCors(response, corsHeaders) {
  const headers = new Headers(response.headers)
  corsHeaders.forEach((value, key) => headers.set(key, value))
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function json(body, status, extraHeaders = new Headers()) {
  const headers = new Headers(extraHeaders)
  headers.set("Content-Type", "application/json; charset=utf-8")
  headers.set("X-Content-Type-Options", "nosniff")
  return new Response(JSON.stringify(body), { status, headers })
}
