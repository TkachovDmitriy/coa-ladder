#!/usr/bin/env bun

export {}

/**
 * Idempotently prepares a creator community server for streams, gaming,
 * development, and open-source project support.
 *
 * The script only creates or updates resources it owns. It never deletes
 * channels or roles, so it is safe to run again after changing this config.
 *
 * Usage: bun run discord:setup
 */

const API_BASE = "https://discord.com/api/v10"
const token = process.env.DISCORD_BOT_TOKEN?.trim()
const guildId = process.env.DISCORD_GUILD_ID?.trim()

if (!token || !guildId) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID. Copy .env.discord.example to .env.discord first.")
  process.exit(1)
}

const PERMISSION = {
  viewChannel: 1n << 10n,
  sendMessages: 1n << 11n,
  readMessageHistory: 1n << 16n,
}

const CHANNEL_TYPE = {
  text: 0,
  category: 4,
  forum: 15,
} as const

type Snowflake = string

type Guild = {
  id: Snowflake
  name: string
  owner_id: Snowflake
  features: string[]
}

type CurrentUser = {
  id: Snowflake
  username: string
}

type Role = {
  id: Snowflake
  name: string
}

type Channel = {
  id: Snowflake
  name: string
  type: number
  parent_id: Snowflake | null
}

type ApiError = {
  message?: string
  code?: number
}

async function discord<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot (https://github.com/TkachovDmitriy/coa-ladder, 1.0)",
      ...init.headers,
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(`Discord API ${response.status} ${path}: ${error.message ?? response.statusText}`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

const guild = await discord<Guild>(`/guilds/${guildId}`)
const bot = await discord<CurrentUser>("/users/@me")
console.log(`Setting up ${guild.name} (${guild.id}) as ${bot.username}`)

let roles = await discord<Role[]>(`/guilds/${guildId}/roles`)

const roleDefinitions = [
  { name: "Member", color: 0x95a5a6, mentionable: false },
  { name: "Stream Viewer", color: 0x9b59b6, mentionable: false },
  { name: "Live Notifications", color: 0xe91e63, mentionable: true },
  { name: "Gaming", color: 0x2ecc71, mentionable: false },
  { name: "Development", color: 0x5865f2, mentionable: false },
  { name: "Open Source", color: 0x3498db, mentionable: false },
  { name: "Support Updates", color: 0x1abc9c, mentionable: true },
  { name: "Contributor", color: 0xf1c40f, mentionable: false },
  { name: "Support Helper", color: 0x00b0f4, mentionable: false },
  { name: "Moderator", color: 0xe74c3c, mentionable: false },
] as const

for (const definition of roleDefinitions) {
  const existing = roles.find((role) => role.name === definition.name)
  if (existing) {
    console.log(`  = role ${definition.name}`)
    continue
  }

  const created = await discord<Role>(`/guilds/${guildId}/roles`, {
    method: "POST",
    body: JSON.stringify({ ...definition, hoist: false, permissions: "0" }),
  })
  roles.push(created)
  console.log(`  + role ${definition.name}`)
}

let channels = await discord<Channel[]>(`/guilds/${guildId}/channels`)
const everyoneId = guild.id

async function ensureCategory(name: string, privateToOwner = false): Promise<Channel> {
  const existing = channels.find((channel) => channel.type === CHANNEL_TYPE.category && channel.name === name)
  const fullChannelAccess = (PERMISSION.viewChannel | PERMISSION.sendMessages | PERMISSION.readMessageHistory).toString()
  const permissionOverwrites = privateToOwner
    ? [
        { id: everyoneId, type: 0, allow: "0", deny: PERMISSION.viewChannel.toString() },
        { id: guild.owner_id, type: 1, allow: fullChannelAccess, deny: "0" },
        { id: bot.id, type: 1, allow: fullChannelAccess, deny: "0" },
      ]
    : undefined

  if (existing) {
    if (permissionOverwrites) {
      for (const overwrite of permissionOverwrites) {
        await discord(`/channels/${existing.id}/permissions/${overwrite.id}`, {
          method: "PUT",
          body: JSON.stringify({ type: overwrite.type, allow: overwrite.allow, deny: overwrite.deny }),
        })
      }
    }
    console.log(`  = category ${name}`)
    return existing
  }

  const created = await discord<Channel>(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({ name, type: CHANNEL_TYPE.category, permission_overwrites: permissionOverwrites }),
  })
  channels.push(created)
  console.log(`  + category ${name}`)
  return created
}

type TextChannelOptions = {
  topic: string
  readOnly?: boolean
  slowmode?: number
}

async function ensureTextChannel(name: string, parent: Channel, options: TextChannelOptions): Promise<Channel> {
  const existing = channels.find(
    (channel) => channel.type === CHANNEL_TYPE.text && channel.name === name && channel.parent_id === parent.id,
  )
  const permissionOverwrites = options.readOnly
    ? [
        { id: everyoneId, type: 0, allow: "0", deny: PERMISSION.sendMessages.toString() },
        {
          id: bot.id,
          type: 1,
          allow: (PERMISSION.viewChannel | PERMISSION.sendMessages | PERMISSION.readMessageHistory).toString(),
          deny: "0",
        },
      ]
    : undefined
  const payload = {
    name,
    type: CHANNEL_TYPE.text,
    parent_id: parent.id,
    topic: options.topic,
    rate_limit_per_user: options.slowmode ?? 0,
    permission_overwrites: permissionOverwrites,
  }

  if (existing) {
    const { permission_overwrites: _permissionOverwrites, ...safePayload } = payload
    await discord(`/channels/${existing.id}`, { method: "PATCH", body: JSON.stringify(safePayload) })
    if (permissionOverwrites) {
      for (const overwrite of permissionOverwrites) {
        await discord(`/channels/${existing.id}/permissions/${overwrite.id}`, {
          method: "PUT",
          body: JSON.stringify({ type: overwrite.type, allow: overwrite.allow, deny: overwrite.deny }),
        })
      }
    }
    console.log(`  = channel #${name}`)
    return existing
  }

  const created = await discord<Channel>(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  channels.push(created)
  console.log(`  + channel #${name}`)
  return created
}

async function ensureProjectSupportChannel(parent: Channel): Promise<Channel> {
  const name = "coa-ladder-support"
  const existing = channels.find((channel) => channel.name === name && channel.parent_id === parent.id)
  const communityEnabled = guild.features.includes("COMMUNITY")

  if (existing) {
    console.log(`  = channel #${name}`)
    return existing
  }

  if (!communityEnabled) {
    console.warn("  ! Community is disabled; creating coa-ladder-support as a text channel instead of a forum")
    return ensureTextChannel(name, parent, {
      topic: "Support for the CoA Arena Ladder website: questions, bugs, incorrect data and suggestions.",
      slowmode: 10,
    })
  }

  const created = await discord<Channel>(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name,
      type: CHANNEL_TYPE.forum,
      parent_id: parent.id,
      topic: "Support for the CoA Arena Ladder website: questions, bugs, incorrect data and suggestions.",
      available_tags: [
        { name: "Bug", emoji_name: "🐛" },
        { name: "Incorrect data", emoji_name: "📊" },
        { name: "Suggestion", emoji_name: "💡" },
        { name: "Question", emoji_name: "❓" },
        { name: "Resolved", emoji_name: "✅", moderated: true },
      ],
      default_sort_order: 0,
      default_forum_layout: 1,
      default_auto_archive_duration: 10080,
    }),
  })
  channels.push(created)
  console.log(`  + forum #${name}`)
  return created
}

const info = await ensureCategory("START HERE")
const community = await ensureCategory("COMMUNITY")
const gaming = await ensureCategory("GAMING")
const development = await ensureCategory("DEVELOPMENT")
const projects = await ensureCategory("PROJECTS & SUPPORT")
const staff = await ensureCategory("STAFF", true)

await ensureTextChannel("welcome-and-rules", info, {
  topic: "Welcome, community rules, useful links and where to start.",
  readOnly: true,
})
await ensureTextChannel("announcements", info, {
  topic: "Stream announcements, community news and important project updates.",
  readOnly: true,
})
await ensureTextChannel("stream-schedule", info, {
  topic: "Upcoming gaming and programming streams.",
  readOnly: true,
})
await ensureTextChannel("general", community, { topic: "General community chat and introductions.", slowmode: 3 })
await ensureTextChannel("stream-chat", community, {
  topic: "Continue stream discussions, share moments and talk between broadcasts.",
  slowmode: 3,
})
await ensureTextChannel("clips-and-creations", community, {
  topic: "Share clips, screenshots, projects, art and other community creations.",
  slowmode: 5,
})
await ensureTextChannel("interesting-finds", community, {
  topic: "Share interesting articles, videos, podcasts, games, websites and open-source discoveries.",
  slowmode: 30,
})
await ensureTextChannel("gaming-chat", gaming, {
  topic: "Games from the streams, recommendations, builds and general gaming discussion.",
  slowmode: 3,
})
await ensureTextChannel("looking-for-group", gaming, {
  topic: "Find people to play with. Include the game, region and usual play time.",
  slowmode: 10,
})
await ensureTextChannel("dev-chat", development, {
  topic: "Programming, tools, architecture, learning and live-coding discussions.",
  slowmode: 3,
})
await ensureTextChannel("dev-tools", development, {
  topic: "A curated, read-only collection of useful development tools, libraries and resources.",
  readOnly: true,
})
await ensureTextChannel("show-and-tell", development, {
  topic: "Share what you are building, ask for feedback and celebrate progress.",
  slowmode: 5,
})
await ensureTextChannel("open-source", projects, {
  topic: "Open-source releases, contribution opportunities and discussions about current projects.",
  slowmode: 3,
})
await ensureProjectSupportChannel(projects)
await ensureTextChannel("staff-chat", staff, { topic: "Private server management discussion." })
await ensureTextChannel("mod-log", staff, { topic: "Private moderation and bot audit log." })

console.log("\nDone. No existing roles or channels were deleted.")
console.log("Next: configure Onboarding/self-roles, stream notifications, and Dyno Action Log at #mod-log.")
