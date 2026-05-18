# Section playbook — Scrollytelling

Path: `/startseite/` (and embedded snippets on `/`)
Code: `src/components/scrollytelling/ScrollytellingViewer.tsx`,
content in `src/content/startseite/`

## Risk profile

- **The most visually fragile section on the site.** D3 + scroll-snap
  + sticky positioning is a triple-axis interaction that breaks
  differently per browser.
- **iOS Safari is the dominant failure mode.** Quirk #6 (mandatory
  scroll-snap rubber-banding) is the highest-severity scroll quirk in
  the audit.
- **Performance.** D3 transitions on scroll need to stay 60 fps on
  mid-range Android. Don't pile filters on the SVG without measuring.

## Known quirks live here

- #6 (scroll-snap mandatory jitter on iOS)
- #2 (`100vh` in the full-height frames — pre-existing dvh fix recommended)
- #1 (ad-hoc breakpoints around the narrative bands)
- #9 (focus rings on the keyboard-skip control)

## Visual-pass URL × viewport matrix

| URL | Viewports | Interaction |
|---|---|---|
| `/startseite/` | 375, 1024, 1440 | scroll to frame 2, then frame 5 |
| `/` (homepage hero) | 375, 1440 | first paint only (no scroll) |

For Safari iOS specifically, use the WebKit engine in Playwright MCP
and capture the in-scroll state where the rubber-band breaks the snap.

## Recommended skill workflow

1. `/cross-browser-audit scrollytelling` — focus on quirk #6.
2. `/visual-screenshot-pass scrollytelling` — capture WebKit-specific
   states.
3. Future `/adapt-scrollytelling` — replace mandatory snap with
   intersection-observer-driven frame swap (JS change, not CSS).
4. `/visual-screenshot-pass scrollytelling` — verify on Chromium +
   WebKit.

## Forbidden edits

- Narrative content in `src/content/startseite/` — editorial, ISD-gated.
- D3 data shape (the JSON / TypeScript inputs to the chart components).

## Verification gate

- `npx astro check --config astro.config.dev.mjs` — zero new errors.
- Manual: scroll through all narrative bands on iPhone (real device or
  WebKit Playwright) and on a desktop Chrome; confirm no frame skips
  and 60 fps on the transitions.
