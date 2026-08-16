#!/usr/bin/env bun
/**
 * Ladder statistics for enriched COA arena data.
 *
 * Reads one or more *.enriched.json files and prints per-class analysis:
 * player count, share of the resolved ladder, average / best rating,
 * average win-rate, and how many land in the top 10 / top 25.
 *
 * Usage:
 *   bun stats.ts data.enriched.json data-2v2.enriched.json
 *   bun stats.ts *.enriched.json --csv stats.csv
 */

type Entry = {
  name: string;
  rating: number;
  season_wins: number;
  season_losses: number;
  place: number;
  class: string | null;
  spec?: string | null;
  armory_status?: string;
};

type ClassStat = {
  cls: string;
  players: number;
  avgRating: number;
  topRating: number;
  avgWinRate: number;
  top10: number;
  top25: number;
  bestName: string;
  bestPlace: number;
};

const args = process.argv.slice(2);
let csvPath = "";
const files: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--csv") csvPath = args[++i] ?? "stats.csv";
  else files.push(args[i]);
}
if (files.length === 0) {
  files.push("data.enriched.json", "data-2v2.enriched.json");
}

function bracketLabel(file: string): string {
  if (/2v2/i.test(file)) return "2v2";
  if (/3v3/i.test(file)) return "3v3";
  return file.replace(/\.enriched\.json$/i, "");
}

function analyze(entries: Entry[]): {
  stats: ClassStat[];
  resolved: number;
  total: number;
} {
  const total = entries.length;
  const resolved = entries.filter((e) => e.class);
  const groups = new Map<string, Entry[]>();
  for (const e of resolved) {
    const arr = groups.get(e.class!) ?? [];
    arr.push(e);
    groups.set(e.class!, arr);
  }

  const stats: ClassStat[] = [];
  for (const [cls, arr] of groups) {
    const ratings = arr.map((e) => e.rating);
    const avgRating = Math.round(ratings.reduce((a, b) => a + b, 0) / arr.length);
    const topRating = Math.max(...ratings);
    const winRates = arr.map((e) => {
      const g = e.season_wins + e.season_losses;
      return g ? (e.season_wins / g) * 100 : 0;
    });
    const avgWinRate = winRates.reduce((a, b) => a + b, 0) / arr.length;
    const best = arr.reduce((a, b) => (a.place < b.place ? a : b));
    stats.push({
      cls,
      players: arr.length,
      avgRating,
      topRating,
      avgWinRate: Math.round(avgWinRate * 10) / 10,
      top10: arr.filter((e) => e.place <= 10).length,
      top25: arr.filter((e) => e.place <= 25).length,
      bestName: best.name,
      bestPlace: best.place,
    });
  }

  stats.sort((a, b) => b.players - a.players || b.avgRating - a.avgRating);
  return { stats, resolved: resolved.length, total };
}

function printSpecs(label: string, entries: Entry[]) {
  const withSpec = entries.filter((e) => e.spec);
  const groups = new Map<string, { n: number; ratings: number[] }>();
  for (const e of withSpec) {
    const key = `${e.class} — ${e.spec}`;
    const g = groups.get(key) ?? { n: 0, ratings: [] };
    g.n++;
    g.ratings.push(e.rating);
    groups.set(key, g);
  }
  const rows = [...groups.entries()]
    .map(([k, g]) => ({
      k,
      n: g.n,
      avg: Math.round(g.ratings.reduce((a, b) => a + b, 0) / g.n),
    }))
    .sort((a, b) => b.n - a.n || b.avg - a.avg);

  console.log(`\n  ${label.toUpperCase()} specs — ${withSpec.length}/${entries.length} have armory data (only ~1 in 5 players)`);
  console.log("  " + "-".repeat(52));
  console.log("  " + pad("Class — Spec", 34) + pad("Players", 9, true) + pad("AvgRtg", 8, true));
  for (const r of rows) {
    console.log("  " + pad(r.k, 34) + pad(r.n, 9, true) + pad(r.avg, 8, true));
  }
}

function pad(s: string | number, n: number, left = false): string {
  const str = String(s);
  return left ? str.padStart(n) : str.padEnd(n);
}

function printBracket(label: string, entries: Entry[]): ClassStat[] {
  const { stats, resolved, total } = analyze(entries);
  console.log(`\n========================================================================`);
  console.log(`  ${label.toUpperCase()} ladder — ${resolved}/${total} players resolved (${Math.round((resolved / total) * 100)}%)`);
  console.log(`========================================================================`);
  console.log(
    pad("Class", 18) +
      pad("Players", 9, true) +
      pad("Share", 8, true) +
      pad("AvgRtg", 8, true) +
      pad("TopRtg", 8, true) +
      pad("AvgWin%", 9, true) +
      pad("Top10", 7, true) +
      pad("Top25", 7, true) +
      "  Best (place)",
  );
  console.log("-".repeat(96));
  for (const s of stats) {
    const share = ((s.players / resolved) * 100).toFixed(1) + "%";
    console.log(
      pad(s.cls, 18) +
        pad(s.players, 9, true) +
        pad(share, 8, true) +
        pad(s.avgRating, 8, true) +
        pad(s.topRating, 8, true) +
        pad(s.avgWinRate.toFixed(1), 9, true) +
        pad(s.top10, 7, true) +
        pad(s.top25, 7, true) +
        `  ${s.bestName} (#${s.bestPlace})`,
    );
  }
  return stats;
}

// ---- Run -------------------------------------------------------------------

const loaded: { label: string; entries: Entry[] }[] = [];
for (const f of files) {
  const file = Bun.file(f);
  if (!(await file.exists())) {
    console.error(`skip: ${f} not found`);
    continue;
  }
  loaded.push({ label: bracketLabel(f), entries: await file.json() });
}

const csvRows: string[] = ["bracket,class,players,share_pct,avg_rating,top_rating,avg_winrate,top10,top25,best_name,best_place"];

for (const { label, entries } of loaded) {
  const stats = printBracket(label, entries);
  printSpecs(label, entries);
  const resolved = entries.filter((e) => e.class).length;
  for (const s of stats) {
    csvRows.push(
      [
        label,
        `"${s.cls}"`,
        s.players,
        ((s.players / resolved) * 100).toFixed(1),
        s.avgRating,
        s.topRating,
        s.avgWinRate.toFixed(1),
        s.top10,
        s.top25,
        `"${s.bestName}"`,
        s.bestPlace,
      ].join(","),
    );
  }
}

// ---- Combined (both brackets pooled) ---------------------------------------

if (loaded.length > 1) {
  const all = loaded.flatMap((l) => l.entries);
  const combined = analyze(all);
  console.log(`\n========================================================================`);
  console.log(`  COMBINED (all brackets pooled) — ${combined.resolved}/${combined.total} resolved`);
  console.log(`========================================================================`);
  console.log(pad("Class", 18) + pad("Entries", 9, true) + pad("Share", 8, true) + pad("AvgRtg", 8, true));
  console.log("-".repeat(43));
  for (const s of combined.stats) {
    const share = ((s.players / combined.resolved) * 100).toFixed(1) + "%";
    console.log(pad(s.cls, 18) + pad(s.players, 9, true) + pad(share, 8, true) + pad(s.avgRating, 8, true));
  }
}

if (csvPath) {
  await Bun.write(csvPath, csvRows.join("\n") + "\n");
  console.log(`\nWrote ${csvPath}`);
}
