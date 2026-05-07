# Scrollytelling v3 — Local Prototype

Standalone sandbox for the **research-process** scrollytelling page (v3).
Iterate here, port polished components back into `src/components/scrollytelling/`
once the design lands.

This directory is **not part of the Astro build**. The main site at
`/startseite/scrollytelling-v2/` is unaffected. The Phase-A v3 narrative draft
in `src/content/startseite/scrollytelling-v3.mdoc` keeps `status: draft` and
won't render publicly.

## Run it

```bash
cd prototypes/scrollytelling-v3
npm install                     # ~20s, isolated node_modules
npm run dev                     # vite at http://localhost:4327
```

Open `http://localhost:4327/`. Scroll. The right column (sticky on desktop ≥1024px,
sticky-top on mobile <1024px) shows one viz per step. The bottom-right debug
panel has:

- **Step jumper** (1–9) — click to scroll to that step.
- **Scroll-progress bar** — % through the page.
- **Viewport readout** — width × height + responsive bucket.
- **Active viz name** — confirms the dispatcher fired.
- **reduced-motion checkbox** — toggles `[data-reduced-motion="true"]` on `<html>`;
  every viz honors it (no transitions, no force layout, end-state only).

## What's in here

```
prototypes/scrollytelling-v3/
├── README.md
├── package.json                    vite, react, react-dom, d3, lucide-react, ts
├── tsconfig.json                   strict mode, no astro extends (hermetic)
├── vite.config.ts                  bare vite + react plugin, port 4327
├── index.html
├── public/
│   └── carm-data.json              copy of /public/data/carm-data.json
└── src/
    ├── main.tsx                    ReactDOM mount
    ├── App.tsx                     loads carm-data, renders viewer + debug panel
    ├── ScrollytellingViewerV3.tsx  IntersectionObserver-driven 9-step viewer
    ├── data/
    │   ├── types.ts                Myth, Metric, GroupId, Indicator, ScrollyStep
    │   ├── carmData.ts             loadCarmData(), getMetric(), getIndicatorValue()
    │   └── steps.ts                9-step German content (source of truth here)
    ├── styles/
    │   ├── tokens.css              CSS custom properties (theme + group colors)
    │   ├── viewer.css              two-column sticky layout, mobile sticky-top
    │   └── viz.css                 per-viz styles
    ├── viz/
    │   ├── VizLawDateBadge.tsx           step 1 — "April 2024" + KCanG + sponsors
    │   ├── VizPeopleVoices.tsx           step 2 — D3 force layout, 12 quote cards
    │   ├── VizMythGrid.tsx               steps 3 + 4 shared — 7×6 cells, themed/classified
    │   ├── VizClassificationReveal.tsx   re-export of VizMythGrid (kept for plan parity)
    │   ├── VizIndicatorStrip.tsx         steps 5 + 6 — 5×42 heatmap, phase-colored
    │   ├── VizTrustGap.tsx               step 7 — dumbbell (ported from v2 lock-stock)
    │   ├── VizCtaGrid.tsx                step 8 — four nav cards
    │   └── VizTeamRow.tsx                step 9 — initials + funder
    └── debug/
        └── DebugPanel.tsx          dev-only convenience panel
```

## Narrative tightenings already applied

These edits are baked into `src/data/steps.ts` and differ from the Phase-A
`.mdoc` (`src/content/startseite/scrollytelling-v3.mdoc`) — applied per the
review-and-improve plan:

1. **Step 1.** Heading reversed: opens with "Hand aufs Herz: Wie viel von dem,
   was du über Cannabis weißt, stimmt eigentlich?" (the gap, not the law).
2. **Step 2.** "30+ silhouettes" replaced with **12 voice cards**, each a
   stylized quote glyph + a realistic everyday Aussage.
3. **Step 3.** Grid cells background-colored by `category_id` (themed pastels)
   instead of grey, so the thematic categorization is legible.
4. **Step 6.** One step, ~280vh tall (`min-height` on `.scrolly__step[data-step="6"]`),
   three internal `.scrolly__phase-marker` divs at the 1/3 / 2/3 / 3/3 marks
   that flip the heatmap's indicator from awareness → correctness →
   prevention_significance via separate IntersectionObservers.
5. **Step 9.** Tightened to one short paragraph + initial avatars + funder line.

When the design is approved, copy the final headings/body from `steps.ts` back
into the `.mdoc`'s frontmatter.

## Visual / data-design tweaks already applied

- **Heatmap color rule.** Same hue-per-indicator (Kenntnis = blue 218°,
  Richtigkeit = green 152°, Präventionsbedeutung = amber 32°), magnitude drives
  saturation 10→95% and lightness 18→55%. No "high is good vs. high is bad"
  flip — saturation always means magnitude.
- **Theme pastels.** 7 dark-tinted cell backgrounds (`--theme-1`..`--theme-9`)
  in `tokens.css`, mapped from `category_id`.
- **Step 4 reveal.** Cells stay in place from step 3, only `background-color`
  transitions left-to-right at ~35ms per cell.
- **Reduced motion.** Both `@media (prefers-reduced-motion: reduce)` and the
  `[data-reduced-motion]` attribute disable transitions; force layout in
  `VizPeopleVoices` falls back to a deterministic 4×3 grid.

## Not yet built (deferred to port-back PR)

- **Mobile-rotated heatmap.** Currently rows = myths even on mobile;
  the 42-col × 5-row mobile rotation is in `viz.css` as a TODO comment but
  not switched.
- **Real influencer / soziale-Medien percentages for minors.** `VizTrustGap`
  carries v2's hard-coded values; verify against report Tab. 4.12/4.13 in port-back.
- **Phase-progress dot strip stickiness.** Dots stick at the top inside step 6
  but on very long viewports they could float as a fixed mini-nav; not done.
- **D3 transition between step 2 → 3.** Voice cards "drain" into the grid
  is currently a hard cut, not a layout-morph animation.

## Port-back instructions (future PR — not this one)

1. Extend `keystatic.config.ts` `vizType` enum with the new values:
   `lawDateBadge | peopleVoices | mythGrid | classificationReveal |
   indicatorStrip | indicatorStripLive | trustGap | ctaGrid | teamRow`.
   Schema-extension confirmation per CLAUDE.md path-safety.
2. Move `src/viz/Viz*.tsx` files into `src/components/scrollytelling/v3/`.
3. Move `src/styles/viz.css` rules into per-component `<style>` blocks
   (project convention).
4. Replace `src/data/types.ts` with re-imports from `src/lib/dashboard/types.ts`.
5. Build `src/components/scrollytelling/ScrollytellingViewerV3.tsx` (port from
   `prototypes/scrollytelling-v3/src/ScrollytellingViewerV3.tsx`).
6. Update `src/pages/startseite/[slug].astro` to dispatch on `versionLabel` and
   choose between `<ScrollytellingViewer>` and `<ScrollytellingViewerV3>`.
7. Copy the final step copy from `prototypes/scrollytelling-v3/src/data/steps.ts`
   back into the frontmatter of `src/content/startseite/scrollytelling-v3.mdoc`.
8. Flip `status: draft` → `status: published` in the `.mdoc`.
9. Drop `prototypes/scrollytelling-v3/` (or keep for future v4 work).

## Type-check

```bash
npm run check                   # tsc --noEmit
```

## Known cosmetic warning at boot

```
▲ [WARNING] Cannot find base config file "astro/tsconfigs/strict" [tsconfig.json]
    ../../tsconfig.json:2:13
```

Vite's esbuild walks up looking for tsconfigs and picks up the main repo's
`tsconfig.json` (which extends an astro preset not installed inside this
isolated `node_modules`). The prototype's own `tsconfig.json` is fine and
strict-checks pass with `npm run check`. Safe to ignore.
