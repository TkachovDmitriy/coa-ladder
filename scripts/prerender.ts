#!/usr/bin/env bun
/**
 * Post-build step: writes static HTML snapshots of each bracket's ladder
 * table into dist/1v1, dist/2v2, dist/3v3 (and dist/ itself, which mirrors
 * the default bracket) so crawlers get real text instead of an empty
 * #root — the app is a client-only render (createRoot, not hydrateRoot),
 * so React fully replaces this markup on mount; no hydration mismatch.
 *
 * Usage:  bun scripts/prerender.ts   (run after `vite build`)
 */

import { join } from "node:path"

const DIST_DIR = join(import.meta.dir, "..", "dist")
const SITE_URL = "https://tkachovdmitriy.github.io/coa-ladder"
const DEFAULT_REALM_ID = 40
const TOP_N = 50

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

function renderPage(template: string, bracket: Bracket, entries: LadderEntry[], realmName: string, generatedAt: string): string {
  const title = `CoA Arena ${bracket} Ladder — ${realmName} (Realm 40)`
  const description = `Live ${bracket} arena ladder for Conquest of Azeroth realm 40 (${realmName}): top ${Math.min(TOP_N, entries.length)} players by rating, class and win rate.`
  const canonical = `${SITE_URL}/${bracket}`

  const escapedTitle = escapeHtml(title)
  const escapedDescription = escapeHtml(description)

  return template
    .replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapedDescription}" />`)
    .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapedDescription}" />`)
    .replace(/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${escapedTitle}" />`)
    .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapedDescription}" />`)
    .replace("</head>", `    <link rel="canonical" href="${canonical}" />\n  </head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root"><main>
      <h1>${escapeHtml(title)}</h1>
      <p>Data updated ${new Date(generatedAt).toUTCString()}</p>
      ${renderTable(entries)}
    </main></div>`,
    )
}

const template = await Bun.file(join(DIST_DIR, "index.html")).text()
const dataset: LadderDataset = await Bun.file(join(DIST_DIR, "ladder.json")).json()

const realm = dataset.realms.find((r) => r.id === DEFAULT_REALM_ID)
if (!realm) throw new Error(`Realm ${DEFAULT_REALM_ID} missing from dist/ladder.json`)

for (const bracket of BRACKETS) {
  const html = renderPage(template, bracket, realm.brackets[bracket], realm.name, dataset.generatedAt)
  await Bun.write(join(DIST_DIR, bracket, "index.html"), html)
  if (bracket === "1v1") await Bun.write(join(DIST_DIR, "index.html"), html)
}

console.log(`Prerendered ${BRACKETS.join(", ")} into ${DIST_DIR}/`)
