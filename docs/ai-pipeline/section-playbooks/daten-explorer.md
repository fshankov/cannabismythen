# Section playbook — Daten-Explorer

Path: `/daten-explorer/` (and `/daten-explorer/{slug}/`)
Code: `src/components/dashboard/`, `src/styles/dashboard.css`,
`src/lib/dashboard/`, `src/pages/daten-explorer/`

## Risk profile

- **High traffic from ISD** — every reviewer lands here first. Visual
  regressions are noticed immediately.
- **ECharts + D3 + filter state** — three independent systems share a
  layout. Most of the audit's "broken layout" findings hit this section.
- **Sticky filter bar** — interacts with the mobile tab bar (quirk #12).

## Known quirks live here

- #5 (ECharts chart re-layout < 480 px)
- #10 (`srcset`/`sizes` missing on preview thumbs)
- #12 (sticky filter bar overlap)
- #1 (ad-hoc breakpoints — `dashboard.css` is the worst offender)
- #9 (focus rings — `MythenExplorer` filter buttons)

## Visual-pass URL × viewport matrix

When `/visual-screenshot-pass` runs against this section, capture these:

| URL | Tier-1 viewports |
|---|---|
| `/daten-explorer/` (index) | 375, 412, 768, 1024, 1440 |
| `/daten-explorer/?audience=eltern` | 375, 1024 (filter state preserved) |
| `/daten-explorer/m01-cannabis-suchtgefahr/` | 375, 1024, 1440 |
| `/daten-explorer/m21-cannabis-fahrtuechtigkeit/` | 375, 1440 (long-form German for quirk #11 check) |

Trigger interactions before screenshotting: open the filter bar, scroll
to the second chart, hover over a verdict chip.

## Recommended skill workflow

1. `/cross-browser-audit daten-explorer` — read-only quirk hunt.
2. `/visual-screenshot-pass daten-explorer` — baseline capture.
3. `/responsive-tokens-sweep daten-explorer` — fixes quirks #1, #2, #3.
4. `/visual-screenshot-pass daten-explorer` — verify diff vs baseline.
5. Open Asana card → assign Fedor → `Needs review`.

## Forbidden edits

- `public/data/carm-data.json` — immutable upstream artifact.
- `src/content/zahlen-und-fakten/m*-*.mdoc` body copy — text changes go
  through Keystatic + ISD review, not through this pipeline.
- Renumbering `mythId` / `mythNumber` is forbidden site-wide.

## Verification gate

- `npx astro check --config astro.config.dev.mjs` — zero new errors.
- Manual: confirm dashboard sidebar appears at 1024 px and the mobile
  tab bar disappears, with no overlap.
