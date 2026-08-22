# Monthly ladder statistics — future improvement

## Status

Backlog only. Keep the current production retention unchanged at 96 snapshots,
which is approximately eight days when the ladder refreshes every two hours.

## Goal

Retain 30 days of ladder history and expose useful monthly player trends
without introducing a database or sending the complete internal history file
to browsers.

## Proposed approach

- Increase `MAX_HISTORY_SNAPSHOTS` from 96 to 360 (12 snapshots per day for
  30 days).
- Continue storing the internal `history.json` only on the `ladder-data`
  branch.
- Keep Git recovery retention independent at 12 commits (approximately 24
  hours); each retained commit contains the complete rolling history file.
- Generate a compact frontend-oriented statistics dataset during the build
  instead of publishing the full internal history.
- Prefer daily/downsampled chart points and precomputed 7-day/30-day changes
  to minimize browser download and rendering work.

## Expected performance

The current real data uses approximately 552 KB for 16 snapshots, or roughly
34 KB per snapshot. At the same ladder size, 360 snapshots should produce a
`history.json` around 12–15 MB. Bun and GitHub Actions can comfortably process
that volume every two hours, while visitors continue downloading only the
small generated public datasets.

A database is not expected to be necessary for the 30-day scope. Reconsider
storage or data partitioning only if retention grows toward a year, the player
registry grows substantially, or the product requires arbitrary server-side
historical queries.

## Candidate monthly metrics

- rating and ladder-place change over 7 and 30 days;
- wins, losses, games, and win rate between snapshots;
- minimum, maximum, and current rating;
- compact rating trend;
- leading gainers and fallers per realm and bracket;
- snapshot coverage with clear partial-data indicators.

## Before implementation

- Measure the actual size and refresh duration after the eight-day history is
  fully populated.
- Define the compact public dataset and an acceptable browser payload budget.
- Add tests for missed refreshes, new or dropped players, duplicate timestamps,
  and season resets.
