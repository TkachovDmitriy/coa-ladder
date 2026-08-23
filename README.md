# CoA Arena Ladder

Static arena-ladder viewer for Conquest of Azeroth realms. The browser only
loads the generated `public/ladder.json`; the data collection and armory
enrichment run server-side in GitHub Actions, so browser CORS restrictions do
not affect the published app.

## GitHub Pages deployment

The refresh workflow runs every two hours at 17 minutes past the hour, stores
the generated files on the `ladder-data` branch, and deploys the site when the
public ladder changes. The branch retains 12 recovery checkpoints (about 24
hours), while `history.json` retains 96 snapshots (about eight days).

The `Deploy GitHub Pages` workflow also builds and deploys the site on pushes
to `main` or when started manually. It restores the latest durable ladder data
before building, so code-only deployments cannot publish the stale copy from
`main`.

To recover from bad generated data, run the `Roll back ladder data` workflow
from the Actions tab and supply the SHA of one of the retained `ladder-data`
commits. The workflow validates the checkpoint, records the rollback as a new
commit, and redeploys the restored site.

After pushing the repository to GitHub, open **Settings → Pages** and select
**GitHub Actions** as the build and deployment source. The action will publish
the site at `https://<owner>.github.io/<repository>/`. The Vite base path is
derived from the repository name during the Pages build, so no hard-coded URL
change is needed.

## Local commands

```sh
bun install
bun run data:refresh
bun run build
```

## Discord server setup

The repository includes an idempotent setup script for the CoA Arena Ladder
community server. It creates the roles, categories, channels, permissions and
support forum without deleting existing server resources. See the complete
[Discord server setup guide](docs/discord-server-setup.md) for role details,
Dyno configuration, security guidance, and troubleshooting.

1. Create an application and bot in the
   [Discord Developer Portal](https://discord.com/developers/applications).
2. On **Installation**, add the `bot` scope and grant **Manage Channels**,
   **Manage Roles**, **View Channels**, **Send Messages**, **Read Message
   History**, and **Manage Messages**. Do not grant Administrator.
3. Use the generated install link to add the bot to the server.
4. In Discord, enable **Developer Mode**, right-click the server, and copy its
   ID.
5. Copy `.env.discord.example` to `.env.discord`, add the bot token and server
   ID, then run:

```sh
bun --env-file=.env.discord run discord:setup
```

Treat the bot token like a password. Never paste it into chat or commit the
local `.env.discord` file. Enable Discord **Community** before running the
script if `#support-and-feedback` should be a forum; otherwise the script safely
creates it as a regular text channel.

For moderation and self-assignable roles, the recommended companion bot is
[Dyno](https://dyno.gg/bot). Its Action Log can use the private `#mod-log`
channel, while the bracket, LFG and announcement roles can be exposed through
Discord Onboarding or Dyno Reaction Roles.

## Rights

Copyright © 2026 Dmytro Tkachov. All rights reserved. See [LICENSE](LICENSE).
No permission is granted to reuse or redistribute this project's code or
design without written permission.
