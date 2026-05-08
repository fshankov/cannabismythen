# Scrollytelling v3 — Local Prototype

Standalone sandbox for the **research-process** scrollytelling page (v3).
Iterate here, port polished components back into `src/components/scrollytelling/`
once the design lands.

This directory is **not part of the Astro build**. The main site is unaffected.
The v3 narrative draft in `src/content/startseite/scrollytelling-v3.mdoc` keeps
`status: draft` and won't render publicly.

## Run it

```bash
cd prototypes/scrollytelling-v3
npm install                     # ~20s, isolated node_modules
npm run dev                     # vite at http://localhost:4327
npm run check                   # tsc --noEmit
```

The bottom-right debug panel has a **step jumper** (1–10), a scroll-progress bar,
viewport readout, active viz name, and a `reduced-motion` toggle.

## Step inventory (Iter-3, 10 steps)

| # | Heading | Viz | Notes |
|---|---|---|---|
| 1 | „Hand aufs Herz: …" | `VizTimeline` | Animated SVG timeline (5 milestones, drawn-on, highlight pulse on May 2026). |
| 2 | „Jede:r in Deutschland hat eine Meinung." | `VizPeopleVoices` | 28 voice cards, D3 force layout, size by myth-awareness weight. |
| 3 | „Aus tausenden Stimmen blieben 42 prüfbare Thesen." | `VizMythGrid` mode=`themed` | 42 cells colored by category. **Shared DOM with step 4 — no width pop.** |
| 4 | „Jede These wurde gegen die Forschungsliteratur geprüft." | `VizMythGrid` mode=`classified` | Same DOM as step 3; cells recolor + Lucide arrow icons fade in (↑ ↗ ↙ ↓ —). |
| 5 | „Dann fragten wir 2.795 Menschen …" | `VizSampleAndRanked` mode=`sample` | Sample-size icons + 5-indicator glossary. **Shared DOM with step 6.** |
| 6 | „Drei Fragen. Drei Befunde." | `VizSampleAndRanked` mode=`ranked-1/2/3` | Top-10 grouped bars; 3 phases (Kenntnis → Richtigkeit → Präventionsbedeutung) on internal scroll markers. Hover bars for full myth + value. Stichprobe-Chip stays compact at top. |
| 7 | „Wo wir suchen. Wem wir vertrauen." | `VizSourcesStrips` pair=`search-trust` | Two beeswarm strips (Aktive Suche × Vertrauen). Picker = Zielgruppe. Hover dot = polyline through both strips + value pill. |
| 8 | „Was uns nebenbei erreicht. Wo Aufklärung am meisten bewegt." | `VizSourcesStrips` pair=`perception-prevention` | Same DOM as step 7 — dots glide between metrics. Same picker, same idiom. |
| 9 | „Was wir daraus gemacht haben." | `VizCtaGrid` | 4 nav cards with stagger entry. |
| 10 | „Wer hinter der Studie steht." | `VizTeamRow` | 6 colored avatars with name on hover. Funder + date. No CTA — page IS the project intro. |

## Iter-3 highlights

**Animation kit (`tokens.css`):** uniform tokens for stagger (30ms/elem), entry
(400ms cubic-bezier), hover (200ms), color morph (600ms), bar grow (800ms),
step fade (500ms). All collapse to 0 under `prefers-reduced-motion: reduce`
or the debug panel's reduced-motion toggle.

**Three shared-DOM refactors** so adjacent same-idiom steps don't unmount:
- Steps 3 + 4 → one `<VizMythGrid mode={...} />`. Width unified at 620px;
  classification cells just recolor + arrow icons fade in.
- Steps 5 + 6 → one `<VizSampleAndRanked mode={...} />`. Sample panel
  (people-icons + glossary) collapses + ranked bars reveal via CSS opacity +
  max-height; the Stichprobe-Chip stays visible (compact in step 6) to anchor
  continuity.
- Steps 7 + 8 → one `<VizSourcesStrips pair={...} />`. D3 force-laid dots
  re-tween Y-position when the metric pair changes.

**Cross-fade for unrelated viz families.** The viewer wraps the right-column
viz in a keyed `.scrolly__viz-stage` whose key matches the viz family
(`mythGrid`, `sampleAndRanked`, `sourcesStrips`, etc.). Within a family the key
stays the same → DOM persists. Crossing families → key changes → CSS
`scrolly-stage-in` keyframes fade-up.

**Hover affordances on every interactive step:**
- Step 3/4 cells: outline + lift + full myth title in tooltip.
- Step 6 bars: pop-up tooltip with `myth · Zielgruppe · value`.
- Step 7/8 dots: polyline connecting the same source across both strips +
  value pill below the chart.
- Step 9 CTA cards: translate-up + border highlight.
- Step 10 avatars: scale + name reveal below.

## File tree

```
prototypes/scrollytelling-v3/
├── README.md
├── package.json                    vite, react, d3, lucide-react, ts
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   ├── carm-data.json              42 myths + 252 metrics
│   └── info-sources.json           44 sources (24 parents + 20 children),
│                                   4 metrics × 5 groups
└── src/
    ├── main.tsx
    ├── App.tsx                     loads both data files; renders viewer + debug
    ├── ScrollytellingViewerV3.tsx  IntersectionObserver + step-6 phase markers + keyed cross-fade
    ├── data/
    │   ├── types.ts                Myth, Metric, GroupId, Indicator,
    │   │                           InformationSourcesData, SourcesPair, ScrollyStep
    │   ├── carmData.ts             loadCarmData, loadInformationSources, helpers
    │   └── steps.ts                10-step content (DE)
    ├── styles/
    │   ├── tokens.css              theme + group + classification + --anim-*
    │   ├── viewer.css              two-column sticky + cross-fade stage
    │   └── viz.css                 per-viz styles (consolidated)
    ├── viz/
    │   ├── VizTimeline.tsx
    │   ├── VizPeopleVoices.tsx
    │   ├── VizMythGrid.tsx         step 3 + 4 (mode prop)
    │   ├── VizSampleAndRanked.tsx  step 5 + 6 (mode prop)
    │   ├── VizSourcesStrips.tsx    step 7 + 8 (pair prop)
    │   ├── VizCtaGrid.tsx
    │   └── VizTeamRow.tsx
    └── debug/
        └── DebugPanel.tsx
```

## Verification (manual)

1. Each of the 10 steps activates correctly via debug step-jumper.
2. Step 3 → 4: **no visible width change**; cells stay in place; only colors
   morph + arrows fade in.
3. Step 5 → 6: indicator-glossary collapses, ranked bars fade in, Stichprobe-Chip
   shrinks to a compact pill in the top-right.
4. Step 6 phase markers (1/3, 2/3, 3/3) flip the ranked bars with bar-grow
   animation between Kenntnis → Richtigkeit → Präventionsbedeutung.
5. Step 6 → 7: cross-fade only (different idioms).
6. Step 7 → 8: **dots glide between strips** without unmounting; picker selection
   persists across the boundary.
7. Hover affordances work on cells, bars, dots, cards, avatars.
8. `prefers-reduced-motion: reduce` (or debug toggle): all transitions snap to
   end state; no force layout in step 2.
9. Mobile (Chrome devtools 375px): no horizontal overflow; sticky-top viz works.

## Port-back instructions (future PR — not this one)

1. Extend `keystatic.config.ts` `vizType` enum with new values:
   `timeline | peopleVoices | mythGrid | sampleAndRanked | sourcesStrips | ctaGrid | teamRow`
   and the per-step mode/pair prop fields.
2. Move `src/viz/Viz*.tsx` → `src/components/scrollytelling/v3/`.
3. Move `src/styles/viz.css` rules into per-component `<style>` blocks (project convention).
4. Replace `src/data/types.ts` with re-imports from `src/lib/dashboard/types.ts`.
5. Build `src/components/scrollytelling/ScrollytellingViewerV3.tsx` (port from
   `prototypes/scrollytelling-v3/src/ScrollytellingViewerV3.tsx`).
6. Update `src/pages/startseite/[slug].astro` to dispatch on `versionLabel`.
7. Copy final step copy from `prototypes/scrollytelling-v3/src/data/steps.ts`
   into the `.mdoc` frontmatter.
8. Flip `status: draft` → `status: published`.
9. Drop `prototypes/scrollytelling-v3/`.

## Known cosmetic boot warning

```
▲ [WARNING] Cannot find base config file "astro/tsconfigs/strict" [tsconfig.json]
    ../../tsconfig.json:2:13
```

Vite's esbuild walks up looking for tsconfigs and picks up the main repo's
`tsconfig.json` (which extends an astro preset not installed inside this
isolated `node_modules`). The prototype's own `tsconfig.json` is fine and
strict-checks pass with `npm run check`. Safe to ignore.
