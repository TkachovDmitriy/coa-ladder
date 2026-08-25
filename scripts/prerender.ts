#!/usr/bin/env bun
/**
 * Post-build step: writes static HTML snapshots of each bracket's ladder
 * table into dist/ itself (the canonical 1v1 ladder), dist/2v2 and dist/3v3
 * so crawlers get real text instead of an empty #root — the app is a
 * client-only render (createRoot, not hydrateRoot), so React fully replaces
 * this markup on mount; no hydration mismatch. dist/1v1 is a redirect stub
 * that consolidates the old /1v1/ URL into the canonical root.
 *
 * Usage:  bun scripts/prerender.ts   (run after `vite build`)
 */

import { join } from "node:path"

const DIST_DIR = join(import.meta.dir, "..", "dist")
const SITE_URL = "https://tkachovdmitriy.github.io/coa-ladder"
const DEFAULT_REALM_ID = 40
const TOP_N = 50
const SITE_NAME = "CoA Arena Ladder"

type Bracket = "1v1" | "2v2" | "3v3"

const BRACKETS: Bracket[] = ["1v1", "2v2", "3v3"]

interface LadderEntry {
  place: number
  name: string
  rating: number
  wins: number
  losses: number
  className: string | null
  spec: string | null
}

interface RealmLadder {
  id: number
  name: string
  brackets: Record<Bracket, LadderEntry[]>
}

interface LadderDataset {
  generatedAt: string
  realms: RealmLadder[]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderTable(entries: LadderEntry[]): string {
  const rows = entries
    .slice(0, TOP_N)
    .map(
      (e) => `
      <tr>
        <td>${e.place}</td>
        <td>${escapeHtml(e.name)}</td>
        <td>${e.className ? escapeHtml(e.className) : "—"}</td>
        <td>${e.rating.toLocaleString("en-US")}</td>
        <td>${e.wins}–${e.losses}</td>
      </tr>`,
    )
    .join("")

  return `<table>
      <thead><tr><th>#</th><th>Player</th><th>Class</th><th>Rating</th><th>W–L</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

function renderPage(
  template: string,
  bracket: Bracket,
  entries: LadderEntry[],
  realmName: string,
  generatedAt: string,
  canonical = `${SITE_URL}/${bracket}/`,
): string {
  const title = `CoA ${bracket} Arena Ladder — ${realmName} Rankings`
  const description = `View the Conquest of Azeroth ${bracket} PvP ladder for ${realmName}, including player ratings, wins, losses, classes, and arena rankings.`
  const heading = `CoA Arena ${bracket} Ladder — ${realmName}`
  const intro = `This is the community Conquest of Azeroth ${bracket} PvP ladder for the ${realmName} realm. Rankings are ordered by rating and include player class, wins, and losses.`
  const escapedTitle = escapeHtml(title)
  const escapedDescription = escapeHtml(description)
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description,
        inLanguage: "en",
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "en",
      },
    ],
  }).replace(/</g, "\\u003c")

  return template
    .replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapedDescription}" />`)
    .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapedDescription}" />`)
    .replace(/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapedDescription}" />`)
    .replace(
      /<script\s+id="structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script id="structured-data" type="application/ld+json">${structuredData}</script>`,
    )
    .replace("</head>", `    <link rel="canonical" href="${canonical}" />\n  </head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root"><main>
      <style>
        #root main { max-width: 960px; margin: 2rem auto; padding: 0 1rem; font-family: ui-sans-serif, system-ui, sans-serif; }
        #root h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; color: hsl(var(--foreground)); }
        #root main > p { color: hsl(var(--muted-foreground)); font-size: 0.875rem; margin-bottom: 1rem; }
        #root table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        #root th, #root td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); }
        #root th { color: hsl(var(--muted-foreground)); font-weight: 500; }
      </style>
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(intro)}</p>
      <p>Data updated ${new Date(generatedAt).toUTCString()}</p>
      ${renderTable(entries)}
    </main></div>`,
    )
}

/**
 * `/1v1/` is consolidated into the canonical root (`/`): the SPA renders the
 * 1v1 ladder at `/`, so this URL becomes a redirect stub that points both
 * crawlers (rel=canonical + meta refresh) and users (JS + a visible link) at
 * the root, keeping ranking signals on a single URL.
 */
function renderRedirectStub(): string {
  const target = `${SITE_URL}/`
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CoA 1v1 Arena Ladder — ${SITE_NAME}</title>
    <link rel="canonical" href="${target}" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <meta name="description" content="The Conquest of Azeroth 1v1 arena ladder now lives on the ${SITE_NAME} homepage." />
    <script>location.replace(${JSON.stringify(target)})</script>
  </head>
  <body>
    <p>The 1v1 arena ladder has moved to <a href="${target}">${SITE_NAME}</a>.</p>
  </body>
</html>
`
}

function renderPrivacyPage(template: string): string {
  const canonical = `${SITE_URL}/privacy/`
  const title = "Privacy & Disclaimer — CoA Arena Ladder"
  const description =
    "Privacy information and legal disclaimer for the community-run Conquest of Azeroth Arena Ladder."
  const escapedTitle = escapeHtml(title)
  const escapedDescription = escapeHtml(description)
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "en",
  }).replace(/</g, "\\u003c")

  return template
    .replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapedDescription}" />`)
    .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapedDescription}" />`)
    .replace(/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapedDescription}" />`)
    .replace(
      /<script\s+id="structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script id="structured-data" type="application/ld+json">${structuredData}</script>`,
    )
    .replace("</head>", `    <link rel="canonical" href="${canonical}" />\n  </head>`)
}

const template = await Bun.file(join(DIST_DIR, "index.html")).text()
const dataset: LadderDataset = await Bun.file(join(DIST_DIR, "ladder.json")).json()

const realm = dataset.realms.find((r) => r.id === DEFAULT_REALM_ID)
if (!realm) throw new Error(`Realm ${DEFAULT_REALM_ID} missing from dist/ladder.json`)

for (const bracket of BRACKETS) {
  if (bracket === "1v1") {
    // The 1v1 ladder is canonical at `/`; `/1v1/` only redirects there.
    const rootHtml = renderPage(
      template,
      bracket,
      realm.brackets[bracket],
      realm.name,
      dataset.generatedAt,
      `${SITE_URL}/`,
    )
    await Bun.write(join(DIST_DIR, "index.html"), rootHtml)
    await Bun.write(join(DIST_DIR, bracket, "index.html"), renderRedirectStub())
    continue
  }
  const html = renderPage(template, bracket, realm.brackets[bracket], realm.name, dataset.generatedAt)
  await Bun.write(join(DIST_DIR, bracket, "index.html"), html)
}

await Bun.write(join(DIST_DIR, "privacy", "index.html"), renderPrivacyPage(template))

console.log(`Prerendered root (1v1), 2v2, 3v3 (+/1v1/ redirect) and privacy into ${DIST_DIR}/`)
