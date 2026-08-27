# Discord server setup

This guide prepares a personal creator community for gaming and programming
streams, development discussions, and open-source projects. CoA Arena Ladder
is one supported project inside the community, not the identity of the entire
server. The included script creates roles, categories, channels, permissions,
and support areas through Discord's API. It can be run more than once: it
updates known resources without deleting existing roles or channels.

## What the script creates

Roles:

- `Member`
- `Stream Viewer`
- `Live Notifications`
- `Gaming`
- `Development`
- `Open Source`
- `Support Updates`
- `Contributor`
- `Support Helper`
- `Moderator`

`Member` is the shared base role. The interest roles do not split the server
into isolated audiences: they help people describe why they joined and choose
relevant content. `Live Notifications` and `Support Updates` are opt-in ping
roles. Give `Contributor` and `Support Helper` manually to trusted people who
actively help a project or answer support questions.

The script does not create an `Admin` role. The server owner already has full
access, and creating an extra privileged role before another administrator is
needed increases the risk of granting dangerous permissions accidentally.

Server structure:

```text
START HERE
  #welcome-and-rules
  #announcements
  #stream-schedule

COMMUNITY
  #general
  #stream-chat
  #clips-and-creations
  #interesting-finds

GAMING
  #gaming-chat
  #looking-for-group

DEVELOPMENT
  #dev-chat
  #dev-tools
  #show-and-tell

PROJECTS & SUPPORT
  #open-source
  #coa-ladder-support

STAFF
  #staff-chat
  #mod-log
```

The three `START HERE` channels are read-only for regular members. `STAFF` is
private to the server owner and the setup bot. If Discord Community is enabled,
`#coa-ladder-support` is a forum with `Bug`, `Incorrect data`, `Suggestion`,
`Question`, and moderator-only `Resolved` tags. Otherwise it is created as a
regular text channel.

`#dev-tools` is also read-only: the owner curates useful tools, libraries, and
resources there while members suggest candidates in `#dev-chat`.
`#interesting-finds` is open to everyone for articles, videos, podcasts, games,
websites, and other discoveries; its 30-second slowmode discourages link spam.

When another open-source project needs dedicated support, add a channel or
forum named after that project under `PROJECTS & SUPPORT`. Keep general coding
conversation in `#dev-chat`; this prevents support requests from getting lost
in day-to-day discussion.

## 1. Create the Discord application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select **New Application** and give it a neutral name such as
   `<your name> Community Setup`.
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
3. Right-click your community server icon.
4. Select **Copy Server ID**.

## 4. Enable Community (recommended)

Before the first script run, open **Server Settings → Enable Community** and
complete Discord's setup. This allows the script to create the support area as
a forum rather than a plain text channel.

Community also provides native Onboarding and AutoMod. Use Onboarding later to
let members choose `Gaming`, `Development`, `Open Source`, and `Stream Viewer`
without manual assignment. Ask separately whether they want
the opt-in `Live Notifications` and `Support Updates` pings.

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

1. Place the `Dyno` role above the self-assignable interest and notification
   roles. It does not need to be above `Contributor`, `Support Helper`, or
   `Moderator`.
2. Set Dyno **Action Log** to the private `#mod-log` channel.
3. Configure a welcome message pointing members to `#welcome-and-rules`.
4. Use Reaction Roles or Discord Onboarding for the interest roles and
   notification roles. Do not expose `Contributor`, `Support Helper`, or
   `Moderator` as self-assignable roles.
5. Keep Discord's native AutoMod enabled. Add Dyno rules only for moderation
   behavior that Discord does not already cover.
6. Use Dyno Tickets only for private requests. Public CoA Ladder bugs,
   incorrect data, suggestions, and questions belong in its support forum so
   other users can find the answers.

For automatic Twitch or YouTube live alerts, connect one streaming integration
only after the basic server is active and point it at `#announcements`. Mention
only the opt-in `Live Notifications` role to avoid notifying everyone.

## Migrating from the earlier CoA-only layout

The script never deletes or renames resources. If the earlier version was run,
the old `COA ARENA` and `SUPPORT` categories and old roles remain intact while
the new structure is added. After moving any useful messages or channels,
archive or delete the obsolete resources manually in Discord. This deliberate
manual step prevents accidental loss of community history.

Avoid giving Dyno Administrator. Grant only the permissions required by the
modules that are actually enabled.

## Troubleshooting

### `401 Unauthorized`

The bot token is invalid or was reset. Copy the current token from the
Developer Portal into `.env.discord` and run the command again.

### `403 Missing Permissions`

Check that the bot is installed in the correct server and has Manage Channels
and Manage Roles. Ensure its Discord role is high enough in the role list.

### Project support was created as a text channel

Community was not enabled at the time of the first run. Enable Community,
manually remove or rename the empty support channel, and run the script
again to create the forum. Do not remove a channel containing real support
history without preserving it first.

### A role or channel already exists

The script matches resources by their configured names and reuses them. Avoid
creating duplicate resources with the same name in different places. The
script does not delete duplicates automatically.

### The secret was accidentally committed

Reset the token immediately in the Developer Portal. Removing it from the
latest file is not sufficient because it may remain in Git history.
