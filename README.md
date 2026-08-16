# CoA Arena Ladder

Static arena-ladder viewer for Conquest of Azeroth realms. The browser only
loads the generated `public/ladder.json`; the data collection and armory
enrichment run server-side in GitHub Actions, so browser CORS restrictions do
not affect the published app.

## GitHub Pages deployment

The workflow in `.github/workflows/pages.yml` builds and deploys the site on
pushes to `main`, manually from the Actions tab, and every day at 03:17 UTC.
It also commits changed ladder data back to the repository.

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

## Rights

Copyright © 2026 Dmytro Tkachov. All rights reserved. See [LICENSE](LICENSE).
No permission is granted to reuse or redistribute this project's code or
design without written permission.
