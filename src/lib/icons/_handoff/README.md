# Handoff: Cannabis Mythen Icon System

## Overview
A single, consistent icon set for the **cannabismythen** website. 59 icons covering verdict
glyphs, audience/population segments, myth-data indicators, source axes & categories, quiz and
fact-card category badges, generic UI chrome, and quiz answer-feedback states. Every icon shares
one drawing system (24×24 viewBox, **1.75** stroke — **2** for verdict & feedback glyphs, round
caps & joins) so they read as one family. The task is to wire this set into the site and apply it
**consistently** everywhere these concepts appear.

## About the design files
These files are a **design reference**, not drop-in production code. The `.svg` files and the
React `Icon` component show the intended geometry, stroke system, colour mapping and naming.
**Recreate / integrate them in the cannabismythen codebase using its own conventions** — its
component patterns, its icon-loading approach (inline SVG, SVGR, sprite, `lucide-react`, etc.),
its theme tokens. If the project already uses **Lucide**, most of these are Lucide glyphs (noted
per icon in `manifest.json → usage`) and can be imported by name; the few custom ones
(`pop-*`, `myth-bedeutung`, `src-wahrnehmung`) must come from the bundled SVGs.

## Fidelity
**High-fidelity.** Geometry, stroke widths and the colour mapping are final. Reproduce them
exactly — do not re-letter, re-weight, or recolour without sign-off. The only intentionally open
question is the colour palette (see *Design tokens* → "Open question").

## What's in this bundle
```
design_handoff_icon_system/
├─ README.md                ← this file
├─ manifest.json            ← source of truth: every icon, group, usage, colour, stroke, raw paths
├─ tokens.css               ← CSS custom properties (--cmi-*) + .cmi / .cmi--<key> helpers
├─ tokens.json              ← same colour tokens as JSON
├─ icons/                   ← 59 standalone .svg files (32×32, viewBox 0 0 24 24, currentColor)
│   ├─ pop-lehrkraefte.svg
│   ├─ feedback-richtig.svg
│   └─ … (full list in manifest.json)
├─ react/
│   ├─ icons.data.ts        ← generated registry (key → {strokeWidth, color, body})
│   └─ Icon.tsx             ← <Icon name="…" /> component (TS + React)
└─ Locked Icons - Figma Export.html   ← visual ground-truth gallery (open in a browser)
```
Open the HTML file to see all icons rendered, with per-icon Copy-SVG / Download buttons.

## Colour model — IMPORTANT
SVGs are authored with `stroke="currentColor"` so they inherit CSS `color`. Colour is **not**
baked into most files. Apply colour one of two ways:

1. **Inherit (default).** Drop the icon anywhere; it takes the surrounding text colour. Use this
   for UI chrome (`ui-*`), myth-data indicators (`g3`), source-axis indicators (`g4`).
2. **Semantic.** For icons that carry a category colour (population, source categories, quiz &
   fact-card badges, feedback), set the colour from the token — `.cmi--<key>` class,
   `var(--cmi-<key>)`, or `<Icon name="…" semantic />`.

**Exception — verdict glyphs (`verdict-*`).** These are intentionally *two-tone* (a coloured
arrow over a paler "shadow" baseline) and have their colours baked into the paths. Render them
as-is; `currentColor` does not affect them. Do not tint them.

## Icon groups & where each is used

### g1 · Verdict glyphs — `verdict-*` (5) · stroke 2 · two-tone, fixed colours
The myth-rating scale on fact cards and quiz results. A vertical arrow rotated around a baseline:
| key | meaning | direction |
|---|---|---|
| `verdict-richtig` | true | arrow up (green #047857) |
| `verdict-eher-richtig` | mostly true | 45° (olive #4d7c0f) |
| `verdict-eher-falsch` | mostly false | 225° (amber #b45309) |
| `verdict-falsch` | false | down (red #be123c) |
| `verdict-keine-aussage` | no statement / N/A | baseline only (slate #94a3b8) |

### g2 · Population / audience — `pop-*` (7) · semantic colour
Use wherever an audience segment is labelled (filters, persona tags, target-group chips).
Lehrkräfte is **locked to Option B** (the only teacher glyph in the set).
| key | label | colour | rationale |
|---|---|---|---|
| `pop-volljaehrige` | Volljährige (adults) | `#475569` slate | neutral adult baseline |
| `pop-minderjaehrige` | Minderjährige (minors) | `#f59e0b` amber | caution / protected youth |
| `pop-junge-erwachsene` | Junge Erwachsene | `#14b8a6` teal | fresh / transitional |
| `pop-konsumierende` | Konsumierende | `#16a34a` green | the core consuming group |
| `pop-eltern` | Eltern (parents) | `#8b5cf6` violet | guardian / care |
| `pop-lehrkraefte` | Lehrkräfte (teachers) | `#3b82f6` blue | education / authority |
| `pop-fachkraefte` | Fachkräfte (specialists) | `#6366f1` indigo | expertise |

### g3 · Myth-data indicators — `myth-*` (5) · inherit
Metadata badges on a myth/fact entry. `myth-kenntnis` (Eye), `myth-bedeutung` (Flag),
`myth-richtigkeit` (LocateFixed), `myth-praevention` (ShieldCheck), `myth-bevoelkerungsbezug` (Globe).

### g4 · Source-axis indicators — `src-*` (4) · inherit
How a source was encountered/evaluated. `src-aktive-suche` (Search), `src-wahrnehmung` (custom
antenna), `src-vertrauen` (Handshake), `src-praeventionspotential` (ShieldCheck).

### g5 · Source categories — `srccat-*` (6) · semantic colour
Where information came from.
| key | label | colour |
|---|---|---|
| `srccat-institutionell` | Institutionell | `#475569` slate-blue |
| `srccat-internet` | Internet | `#06b6d4` cyan |
| `srccat-soziale-medien` | Soziale Medien | `#ec4899` pink |
| `srccat-traditionelle-medien` | Traditionelle Medien | `#6366f1` indigo |
| `srccat-print` | Print / Physisch | `#b45309` warm brown |
| `srccat-umfeld` | Persönliches Umfeld | `#14b8a6` teal |

### g6 · Quiz categories — `quiz-*` (6) · semantic colour
Category badges on quiz questions: medizin (blue), risiken (violet), stimmung (yellow),
soziales (indigo), gefaehrlichkeit (orange), schnellcheck (pink). See `manifest.json` for hexes.

### g7 · Fakten-Karten categories — `fk-*` (8) · semantic colour
Category badges on fact cards: medizin (blue), koerper (cyan), psyche (violet), stimmung (yellow),
soziales (pink), dosis (slate), gesetz (indigo), gefahr (orange).

### g8 · UI chrome — `ui-*` (14) · inherit
Navigation & utility: chevrons, search, x, filter, download, check, eye-off, sort arrows
(`ui-arrow-01/10/az`), map-pin, layers. Standard Lucide; inherit `currentColor`.

### g9 · Quiz answer feedback — `feedback-*` (4) · semantic colour
Shown after a user answers, as a correctness spectrum:
| key | state | colour |
|---|---|---|
| `feedback-falsch` | komplett falsch (CircleX) | `#dc2626` red |
| `feedback-fast-falsch` | fast falsch (CircleArrowOutDownLeft) | `#ea580c` orange |
| `feedback-fast-richtig` | fast richtig (CircleArrowOutUpRight) | `#65a30d` lime |
| `feedback-richtig` | richtig (CircleCheckBig) | `#16a34a` green |

## How to integrate (pick what matches the codebase)

**A. React + the bundled component**
```tsx
import { Icon } from '@/icons/Icon';
<Icon name="pop-lehrkraefte" size={20} semantic />   // semantic colour from manifest
<Icon name="ui-search" />                              // inherits currentColor
```

**B. Already using lucide-react?** Import the named glyph for the `ui-*`, `quiz-*`, `fk-*`,
`myth-*`, `g4`, and `feedback-*` icons (names are in `manifest.json → usage`), then apply the
colour token. Use the bundled SVGs only for the custom ones: all `pop-*`, `myth-bedeutung`,
`src-wahrnehmung`. Set stroke width to **1.75** (Lucide defaults to 2) so they match — verdict &
feedback stay at **2**.

**C. Inline / sprite / SVGR.** Consume `icons/*.svg` directly. They already declare
`width/height/viewBox` and use `currentColor`.

Include `tokens.css` once globally to get `--cmi-*` variables and the `.cmi--<key>` helpers.

## Consistency rules
- One concept → one icon, everywhere. Don't introduce ad-hoc alternatives.
- Stroke: **1.75** default; **2** for `verdict-*` and `feedback-*`. Round caps & joins always.
- Render at even sizes (16 / 20 / 24). Hit target ≥ 44px for tappable controls (pad around the icon).
- Audience / category / feedback icons use their semantic colour; chrome & indicators inherit.
- Never recolour verdict glyphs.

## Design tokens
All colours live in `tokens.css` (`--cmi-<key>`) and `tokens.json`. Distinct values used:
`#475569 #f59e0b #14b8a6 #16a34a #8b5cf6 #3b82f6 #6366f1` (population),
`#475569 #06b6d4 #ec4899 #6366f1 #b45309 #14b8a6` (source categories),
`#3b82f6 #8b5cf6 #eab308 #6366f1 #f97316 #ec4899` (quiz),
`#3b82f6 #06b6d4 #8b5cf6 #eab308 #ec4899 #64748b #6366f1 #f97316` (fact cards),
`#dc2626 #ea580c #65a30d #16a34a` (feedback),
verdict (baked): `#047857 #4d7c0f #b45309 #be123c #94a3b8` with paler shadow tints.

**Open question (needs sign-off):** `pop-konsumierende` and `feedback-richtig` both use green
`#16a34a`. Fine if they never appear together; if they can, shift one (e.g. consumers →
`#15803d` darker green, or feedback-richtig keeps `#16a34a`). Confirm before finalising.

## Assets
Icons are original drawings in the project's house style; most mirror **Lucide** geometry
(per-icon source noted in `manifest.json → usage`). Custom (non-Lucide): all `pop-*`,
`myth-bedeutung` (flag), `src-wahrnehmung` (antenna). No raster assets, no external fonts.

## Files to reference
- `manifest.json` — authoritative list: key, group, usage, colour, strokeWidth, twoTone, raw inner paths.
- `tokens.css` / `tokens.json` — colour tokens.
- `react/Icon.tsx` + `react/icons.data.ts` — ready component + registry.
- `icons/*.svg` — the 59 standalone files.
- `Locked Icons - Figma Export.html` — open in a browser to see everything rendered.
