# Section playbook — Über das Projekt

Path: `/projekt/` (and `/ueber-uns/` 301s here)
Code: `src/pages/projekt/`, content in `src/content/ueber-uns/`,
singleton `src/content/ueber-uns-scrolly.yaml`

## Risk profile

- **Low traffic, but high editorial visibility.** Reviewers from ISD
  cross-reference the methodology page when checking myth pages.
- **Mostly long-form prose + a scrolly module.** Mild risk: the
  scrolly module shares mechanics with the main scrollytelling section
  but with a more constrained layout.
- **The `/projekt/` rename is recent (2026-05-14).** Confirm
  `/ueber-uns/...` legacy URLs still 301 after any edge or netlify
  changes.

## Known quirks live here

- #1 (ad-hoc breakpoints in scrolly module CSS)
- #6 (scroll-snap interaction — milder than the main scrollytelling)
- #9 (focus rings on team-member cards)

## Visual-pass URL × viewport matrix

| URL | Viewports |
|---|---|
| `/projekt/` | 375, 1024, 1440 |
| `/ueber-uns/` | 375 | must 301 to `/projekt/` |
| `/projekt/methodik/` | 375, 1440 (long-form, table for quirk #11) |
| `/projekt/klassifikation/` | 375, 1440 |
| `/projekt/team/` | 375 (team-card grid wrap behaviour) |

## Recommended skill workflow

1. `/cross-browser-audit projekt`
2. `/visual-screenshot-pass projekt`
3. `/responsive-tokens-sweep projekt` — typography pass.

## Forbidden edits

- Any methodology body copy in `src/content/ueber-uns/methodik.mdoc` —
  ISD-gated; editorial-only changes go through Keystatic.
- The classification taxonomy text in `klassifikation.mdoc`.

## Verification gate

- `npx astro check --config astro.config.dev.mjs` — zero new errors.
- Manual: confirm `/ueber-uns/` 301s to `/projekt/` from an
  unauthenticated session (the redirect fires before the password gate).
