# Homepage Hero — Pendel-Lupe-Ring (design spec)

**Date:** 2026-05-31 · **Status:** approved (locked via live prototype) · **Owner:** Fedor

Replaces the current cursor-glow hero (`HeroBlock.tsx`). The verified reference
implementation is the prototype at `_local/hero-prototypes/pendulum.html`.

## Concept

All **42 myth statements** sit blurred on a raised **oval ring** around the central
question. Motion is a gentle **pendulum sway + breathing** (no full rotation). Myths are
**unreadable by default** (blurred, faintly tinted in their verdict colour). A myth becomes
**readable in place** (no positional jump — only sharpen + scale-up + brighten) when:

- **the visitor hovers it** (desktop) — a single nearest myth is selected, or
- the **auto-spotlight** selects it (when idle / on touch) — cycling one myth at a time
  (~3.4 s) so all 42 get a turn.

A **magnifying-glass indicator (lupe)** sits **stably under the headline**. Its own colour
never changes (neutral glass: light ring + handle, pale lens). Inside the lens it shows the
**site's canonical verdict glyph** (`VerdictArrow` / `verdictGlyph`) for **whichever myth is
active** (hovered or auto-spotlit): ↑ richtig · ↗ eher richtig · ↙ eher falsch · ↓ falsch ·
— keine Aussage. No verdict text word.

## Elements (all approved)

| Element | Behaviour |
|---|---|
| Oval ring | 42 myths, even angular spacing, raised so the title sits in the free centre. Y-squashed circle (`scaleY`), text un-squashed + kept upright. |
| Motion | Pendulum sway (~12°, ~22 s) + breathe (~1.8 %, ~16 s). `prefers-reduced-motion` → static. |
| Resting myth | blurred (~3 px), opacity .30, faint verdict tint, weight 600. |
| Active myth | sharpen (blur→0), opacity→1, scale up (~1.42), bold, verdict-colour glow. **In place — no jump.** |
| Reveal source | hover = single nearest (≤ ~190 px); else auto-spotlight cycles by index. |
| Lupe | fixed under the title; neutral glass; site verdict glyph inside; reflects active myth. |
| Eyebrow | one line on desktop; wraps on small screens. |

## Data

42 statements come from the **real myth content** (`src/content/zahlen-und-fakten/m01..m42`):
the `title` with the `Mythos N:` prefix and trailing period stripped, plus `classification`.
Built in `index.astro` from published entries (accurate, data-driven) and passed to
`<HeroBlock>`. No hardcoded copy; no curated positions (positions are computed).

## Implementation notes

- Rewrite `src/components/home/HeroBlock.tsx`: imperative DOM build of 42 myth nodes + one
  `requestAnimationFrame` loop (sway/breathe via CSS vars, reveal painting on the few active
  nodes). Mirrors the existing imperative+rAF pattern. Lupe verdict via React state (updates
  only when the active myth changes, not per frame) rendering `<VerdictArrow>`.
- `HeroMyth` prop becomes `{ text, classification }` (drop `position`/`id`).
- `index.astro`: build the 42 `heroMyths` from published `zahlenUndFakten` (sorted m01→m42);
  drop the `HERO_MYTHS` seed import. `mythPositions.ts` becomes unused (leave in place).
- Verdict colours: lighter dark-bg variants for myth **text/glow**; the **lupe glyph** uses
  the canonical site colours via `VerdictArrow`.
- Performance: motion is compositor transforms; only the few active nodes get per-frame style
  writes (matches the current hero's proven approach). Works on old/low-power devices.

## Known accepted rough edge

The few very long statements (esp. m3, ~4 lines) can overlap the title on small screens —
left as-is per Fedor (chose not to shorten). Revisit if it reads poorly live.
