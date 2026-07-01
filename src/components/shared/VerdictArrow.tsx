/**
 * VerdictArrow — directional verdict glyph for the cannabismythen site.
 *
 * Renders a standalone <svg> (sized in pixels) wrapping the canonical
 * verdict paths from `./verdictGlyph`. The glyph itself (chevron +
 * vertical shaft in the verdict color, plus a horizontal shadow line
 * in a lighter shadow color, rotated by a per-verdict angle so the
 * tip points in the right direction) is THE site's canonical verdict
 * marker. All visible verdict surfaces (Daten-Explorer arrows,
 * Fakten-Karten card glyphs, Quiz factsheet panels, the /projekt/
 * scrollytelling step-4 grid and step-6 strips) inherit from one
 * source — change `VERDICT_GLYPHS` in `./verdictGlyph` and every
 * badge updates.
 *
 * For use INSIDE another <svg> (e.g. when paint order must be
 * controlled across multiple layers), import `<VerdictGlyphPaths>`
 * from `./verdictGlyph` directly — this component would otherwise
 * nest <svg> in <svg> which is awkward to scale and serialise.
 *
 * Deuteranopia accessibility: the four arrow directions provide a
 * redundant non-color signal — color-blind users can read verdicts
 * by tip direction alone.
 *
 * The legacy unicode `getCorrectnessIcon()` helper in
 * `src/lib/dashboard/colors.ts` is `@deprecated` and should not be used.
 */

import type { CorrectnessClass } from "../../lib/dashboard/types";
import { VerdictGlyphPaths, type VerdictColorOverride } from "./verdictGlyph";

interface VerdictArrowProps {
  verdict: CorrectnessClass;
  /** Pixel size of the rendered SVG. Default 14 matches the legend swatch. */
  size?: number;
  /** Stroke width in SVG user units (24×24 viewBox). Default 2. */
  strokeWidth?: number;
  /** Set to `false` if the icon is the only label for its meaning. Default `true`. */
  "aria-hidden"?: boolean;
  className?: string;
  /** Override the per-verdict main/shadow colors. Use when rendering ON a
   *  verdict-colored background (the scrollytelling Step 4 grid cells). */
  colorOverride?: VerdictColorOverride;
}

export default function VerdictArrow({
  verdict,
  size = 14,
  strokeWidth = 2,
  "aria-hidden": ariaHidden = true,
  className,
  colorOverride,
}: VerdictArrowProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      className={className}
    >
      <VerdictGlyphPaths
        verdict={verdict}
        strokeWidth={strokeWidth}
        colorOverride={colorOverride}
      />
    </svg>
  );
}
