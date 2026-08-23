#!/usr/bin/env bun

export {}

/**
 * Idempotently prepares the CoA Arena Ladder community server.
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
  { name: "Announcements", color: 0xf1c40f, mentionable: true },
  { name: "Looking for Team", color: 0x2ecc71, mentionable: true },
  { name: "1v1 Player", color: 0xe67e22, mentionable: false },
  { name: "2v2 Player", color: 0x3498db, mentionable: false },
  { name: "3v3 Player", color: 0x9b59b6, mentionable: false },
  { name: "Developer", color: 0x5865f2, mentionable: false },
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

async function ensureSupportChannel(parent: Channel): Promise<Channel> {
  const name = "support-and-feedback"
  const existing = channels.find((channel) => channel.name === name && channel.parent_id === parent.id)
  const communityEnabled = guild.features.includes("COMMUNITY")

  if (existing) {
    console.log(`  = channel #${name}`)
    return existing
  }

  if (!communityEnabled) {
    console.warn("  ! Community is disabled; creating support-and-feedback as a text channel instead of a forum")
    return ensureTextChannel(name, parent, {
      topic: "Website questions, bug reports, incorrect ladder data and suggestions.",
      slowmode: 10,
    })
  }

  const created = await discord<Channel>(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name,
      type: CHANNEL_TYPE.forum,
      parent_id: parent.id,
      topic: "Website questions, bug reports, incorrect ladder data and suggestions.",
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
const arena = await ensureCategory("COA ARENA")
const support = await ensureCategory("SUPPORT")
const staff = await ensureCategory("STAFF", true)

await ensureTextChannel("welcome-and-rules", info, {
  topic: "Welcome, server rules and the official CoA Arena Ladder link.",
  readOnly: true,
})
await ensureTextChannel("announcements", info, {
  topic: "CoA Arena Ladder releases, updates and important notices.",
  readOnly: true,
})
await ensureTextChannel("general", arena, { topic: "General Conquest of Azeroth community chat.", slowmode: 3 })
await ensureTextChannel("ladder-discussion", arena, {
  topic: "Discuss the 1v1, 2v2 and 3v3 ladders, ratings, classes and builds.",
  slowmode: 3,
})
await ensureTextChannel("looking-for-team", arena, {
  topic: "Find arena partners. Include bracket, class/spec, rating and play time.",
  slowmode: 10,
})
await ensureSupportChannel(support)
await ensureTextChannel("staff-chat", staff, { topic: "Private server management discussion." })
await ensureTextChannel("mod-log", staff, { topic: "Private moderation and bot audit log." })

console.log("\nDone. No existing roles or channels were deleted.")
console.log("Next: configure Onboarding/self-roles and point Dyno Action Log at #mod-log.")
