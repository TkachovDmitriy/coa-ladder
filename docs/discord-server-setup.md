# Discord server setup

This guide prepares the Discord community for CoA Arena Ladder. The included
script creates the agreed roles, categories, channels, permissions, and support
area through Discord's API. It can be run more than once: it updates known
resources without deleting existing roles or channels.

## What the script creates

Roles:

- `Member`
- `Announcements`
- `Looking for Team`
- `1v1 Player`
- `2v2 Player`
- `3v3 Player`
- `Developer`
- `Moderator`

Server structure:

```text
START HERE
  #welcome-and-rules
  #announcements

COA ARENA
  #general
  #ladder-discussion
  #looking-for-team

SUPPORT
  #support-and-feedback

STAFF
  #staff-chat
  #mod-log
```

`START HERE` announcement channels are read-only for regular members. `STAFF`
is private to the server owner and the setup bot. If Discord Community is
enabled, `#support-and-feedback` is a forum with `Bug`, `Incorrect data`,
`Suggestion`, `Question`, and moderator-only `Resolved` tags. Otherwise it is
created as a regular text channel.

## 1. Create the Discord application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select **New Application** and name it `CoA Arena Ladder`.
3. Open **Bot** and create the bot user if Discord has not created it already.
4. Keep **Public Bot** disabled if this bot should only be installable by the
   application owner.
5. Select **Reset Token**, copy the generated token, and store it privately.

The token is a password for the bot. Never paste it into chat, screenshots,
issues, or commits. Reset it immediately in the Developer Portal if it is ever
exposed.

## 2. Configure installation and permissions

Open **Installation** in the Developer Portal and configure a server install
with the `bot` scope. Grant only these permissions:

- Manage Channels
- Manage Roles
- View Channels
- Send Messages
- Read Message History
- Manage Messages

Do not grant Administrator. Use the generated install link to add the bot to
the CoA Arena Ladder Discord server.

If roles are later managed by this bot, keep its Discord role above every role
it needs to assign. Discord bots cannot manage roles above their own highest
role.

## 3. Copy the server ID

1. In Discord, open **User Settings → Advanced**.
2. Enable **Developer Mode**.
3. Right-click the CoA Arena Ladder server icon.
4. Select **Copy Server ID**.

## 4. Enable Community (recommended)

Before the first script run, open **Server Settings → Enable Community** and
complete Discord's setup. This allows the script to create the support area as
a forum rather than a plain text channel.

Community also provides native Onboarding and AutoMod. Use Onboarding later to
let members select bracket and notification roles without manual assignment.

## 5. Configure local secrets

From the repository root, copy the committed example file:

```sh
cp .env.discord.example .env.discord
```

Edit `.env.discord` locally:

```dotenv
DISCORD_BOT_TOKEN=the_private_bot_token
DISCORD_GUILD_ID=the_copied_server_id
```

`.env.discord` is ignored by Git. Confirm that it is not shown by
`git status` before committing any future changes.

## 6. Run the setup

Install project dependencies if needed, then execute:

```sh
bun install
bun --env-file=.env.discord run discord:setup
```

The command prints `+` for newly created resources and `=` for resources that
already exist. It never deletes server resources. Review the server after the
command finishes and move channels visually if a different ordering is wanted.

## 7. Add and configure Dyno (optional)

[Dyno](https://dyno.gg/bot) is the recommended single companion bot for this
server. It provides moderation, Action Log, welcome messages, AutoMod,
self-assignable roles, forms, and support tickets from one dashboard.

After adding Dyno:

1. Place the `Dyno` role above `Member`, `Announcements`, `Looking for Team`,
   and the three bracket roles. It does not need to be above `Developer` or
   `Moderator`.
2. Set Dyno **Action Log** to the private `#mod-log` channel.
3. Configure a welcome message pointing members to `#welcome-and-rules`.
4. Use Reaction Roles or Discord Onboarding for `1v1 Player`, `2v2 Player`,
   `3v3 Player`, `Looking for Team`, and `Announcements`.
5. Keep Discord's native AutoMod enabled. Add Dyno rules only for moderation
   behavior that Discord does not already cover.
6. Use Dyno Tickets only if support requests need to be private. Public bugs,
   incorrect ladder data, suggestions, and questions belong in the support
   forum so other users can find the answers.

Avoid giving Dyno Administrator. Grant only the permissions required by the
modules that are actually enabled.

## Troubleshooting

### `401 Unauthorized`

The bot token is invalid or was reset. Copy the current token from the
Developer Portal into `.env.discord` and run the command again.

### `403 Missing Permissions`

Check that the bot is installed in the correct server and has Manage Channels
and Manage Roles. Ensure its Discord role is high enough in the role list.

### Support was created as a text channel

Community was not enabled at the time of the first run. Enable Community,
manually remove or rename the empty text support channel, and run the script
again to create the forum. Do not remove a channel containing real support
history without preserving it first.

### A role or channel already exists

The script matches resources by their configured names and reuses them. Avoid
creating duplicate resources with the same name in different places. The
script does not delete duplicates automatically.

### The secret was accidentally committed

Reset the token immediately in the Developer Portal. Removing it from the
latest file is not sufficient because it may remain in Git history.
