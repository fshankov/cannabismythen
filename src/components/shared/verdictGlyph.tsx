/**
 * verdictGlyph — single source of truth for the cannabismythen verdict
 * SVG glyph (chevron + vertical shaft + horizontal shadow line).
 *
 * Surfaces that consume this module:
 *   - VerdictArrow.tsx (the standalone <svg> component used by the
 *     daten-explorer, fakten-karten, and quiz factsheet panels)
 *   - VizSampleAndRanked.tsx (scrollytelling Step 6 — needs INNER SVG
 *     paths so paint order stays under control inside the parent
 *     <svg>: axis lines below, slope polylines mid, glyphs above)
 *
 * Edit the rotations/colors here and every verdict glyph on the site
 * updates: dashboard arrows, fakten-karten card glyphs, quiz factsheet
 * panels, scrollytelling step-4 grid, scrollytelling step-6 strips.
 *
 * The arrows provide a redundant non-color signal for deuteranopia
 * accessibility (color-blind users can read verdicts by tip direction
 * alone):
 *
 *   richtig           → rotate 180°   (tip up        ↑)
 *   eher_richtig      → rotate -135°  (tip up-right  ↗)
 *   eher_falsch       → rotate  45°   (tip down-left ↙)
 *   falsch            → rotate   0°   (tip down      ↓)
 *   no_classification →               (no arrow — shadow line only)
 *
 * Hex values track the `--classification-*` tokens in global.css.
 * Shadow colors are perceptual lighter shades (~50% blend toward the
 * bg tint) derived from the main color.
 */

import type { JSX } from 'react';
import type { CorrectnessClass } from '../../lib/dashboard/types';

interface GlyphSpec {
  /** Rotation around (12,12) in degrees inside a 24×24 viewBox. */
  rotation: number;
  /** Primary stroke color — chevron + vertical shaft. */
  main: string;
  /** Secondary stroke color — horizontal shadow line. */
  shadow: string;
}

export const VERDICT_GLYPHS: Record<
  Exclude<CorrectnessClass, 'no_classification'>,
  GlyphSpec
> = {
  richtig: { rotation: 180, main: '#047857', shadow: '#a7d3c5' },
  eher_richtig: { rotation: -135, main: '#4d7c0f', shadow: '#c2d3a3' },
  eher_falsch: { rotation: 45, main: '#b45309', shadow: '#e0b58d' },
  falsch: { rotation: 0, main: '#be123c', shadow: '#e9a8b9' },
};

/** Shadow line color used for the no-classification case. */
export const NO_CLASSIFICATION_COLOR = '#94a3b8';

/** Optional per-instance color override for the verdict glyph. When the
 *  glyph renders ON a verdict-colored background (e.g. the scrollytelling
 *  Step 4 grid cells whose `background-color` IS the verdict color), the
 *  inherent main/shadow palette becomes invisible. Callers can pass an
 *  override here — typically white-on-color, e.g.
 *  `{ main: '#ffffff', shadow: 'rgba(255,255,255,0.55)' }` — to keep
 *  the glyph legible while the card background carries the verdict
 *  signal. The verdict shape (rotation) is unchanged so deuteranopia
 *  accessibility still works. */
export interface VerdictColorOverride {
  main: string;
  shadow: string;
}

interface VerdictGlyphPathsProps {
  verdict: CorrectnessClass;
  /** Stroke width in SVG user units (24×24 user-space). Default 2. */
  strokeWidth?: number;
  colorOverride?: VerdictColorOverride;
}

/**
 * Inner SVG paths for a verdict glyph — NO outer <svg> wrapper.
 *
 * Use INSIDE a parent <svg> when paint-order matters (the
 * scrollytelling Step 6 strips need axis lines below, slope
 * polylines mid, glyphs above, all in one <svg>). The parent must
 * use a 24×24 user-space (matching the VerdictArrow viewBox), or
 * the caller must scale + translate at the call site (e.g.
 * `transform={\`translate(${x - 7},${y - 7}) scale(${14/24})\`}`
 * to render a 14 px glyph centered on (x, y)).
 *
 * For a standalone DOM glyph (button, factsheet panel header, etc.)
 * use <VerdictArrow> from the same folder — it wraps these paths in
 * a sized <svg> with the right viewBox.
 */
export function VerdictGlyphPaths({
  verdict,
  strokeWidth = 2,
  colorOverride,
}: VerdictGlyphPathsProps): JSX.Element {
  // Defensive lookup: a handful of older `.mdoc` entries still use the
  // legacy spelling `keine_aussage` instead of the canonical
  // `no_classification`, and FAQ uses `n_a` for meta questions. Any
  // verdict that isn't one of the four directional variants renders the
  // flat shadow-line glyph (= "no scientific verdict") rather than
  // crashing on `spec.rotation` when the lookup misses.
  const spec =
    verdict !== 'no_classification'
      ? VERDICT_GLYPHS[verdict as Exclude<CorrectnessClass, 'no_classification'>]
      : undefined;
  if (!spec) {
    return (
      <path
        d="M2 16h20"
        stroke={colorOverride?.shadow ?? NO_CLASSIFICATION_COLOR}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  const mainStroke = colorOverride?.main ?? spec.main;
  const shadowStroke = colorOverride?.shadow ?? spec.shadow;
  return (
    <g
      transform={`rotate(${spec.rotation} 12 12)`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      <path d="M2 16h20" stroke={shadowStroke} />
      <path d="M12 2v14" stroke={mainStroke} />
      <path d="m5 9 7 7 7-7" stroke={mainStroke} />
    </g>
  );
}
