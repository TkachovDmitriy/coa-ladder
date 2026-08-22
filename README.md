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

## Rights

Copyright © 2026 Dmytro Tkachov. All rights reserved. See [LICENSE](LICENSE).
No permission is granted to reuse or redistribute this project's code or
design without written permission.
