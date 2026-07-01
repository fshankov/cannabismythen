/**
 * Verdict-rank sort icons (added 2026-05-22, rebuilt 2026-05-23 to
 * match Lucide's ArrowDownAZ skeleton).
 *
 * Two stacked filled circles in the verdict colors — green for
 * `richtig`, red for `falsch` — sitting where the A/Z letters would
 * sit in Lucide's ArrowDownAZ. The chevron stem + arrow geometry is
 * lifted verbatim from `node_modules/lucide-react/dist/esm/icons/
 * arrow-down-a-z.js` so the four sort glyphs (ArrowDownAZ, ArrowDown01,
 * ArrowDown10, IconVerdictRank*) read as a matched Lucide family at
 * the same `size={14}`.
 *
 *   Asc   → top circle = richtig (green), bottom = falsch (red)
 *   Desc  → top circle = falsch (red),   bottom = richtig (green)
 *
 * Standard call site:
 *   <IconVerdictRankAsc size={14} strokeWidth={2} />
 *
 * The chevron strokes with `currentColor` so the host button's color
 * (default / hover / .is-active accent) propagates the same way it does
 * for the Lucide siblings. Dots use hardcoded hexes (instead of CSS
 * custom properties) because referencing CSS vars inside an inline SVG
 * fill is fragile across browsers — Safari sometimes drops the
 * resolution when the SVG is generated outside a <style> context.
 */
import type { SVGProps } from "react";
import { forwardRef } from "react";

const RICHTIG = "#047857"; // --classification-richtig (Emerald-700)
const FALSCH = "#be123c"; // --classification-falsch  (Rose-700)
const SHADOW = "#0f172a"; // dark hairline ring so the colored dots
// stay legible on near-white header backgrounds

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number | string;
}

function StackedDots({
  topColor,
  bottomColor,
  size = 14,
  strokeWidth = 2,
  ...rest
}: IconProps & { topColor: string; bottomColor: string }) {
  // viewBox 24×24 — same as every Lucide icon. The chevron paths are
  // copied byte-for-byte from Lucide's arrow-down-a-z.js so the visual
  // family stays consistent. The dots replace the A/Z letter glyphs
  // on the right side of the icon, with cy=7 / cy=17 chosen so they
  // align with the top and bottom of the chevron stem (y=4..20).
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {/* Lucide ArrowDownAZ chevron, verbatim from
          node_modules/lucide-react/dist/esm/icons/arrow-down-a-z.js */}
      <path d="M7 20V4" />
      <path d="m3 16 4 4 4-4" />
      {/* Two stacked dots on the RIGHT (where the A/Z letters sit in
          Lucide's ArrowDownAZ). cx=17 keeps the dots inside the 24-unit
          viewBox with breathing room from the chevron at x=11. */}
      <circle
        cx="17"
        cy="7"
        r="3"
        fill={topColor}
        stroke={SHADOW}
        strokeWidth="0.5"
      />
      <circle
        cx="17"
        cy="17"
        r="3"
        fill={bottomColor}
        stroke={SHADOW}
        strokeWidth="0.5"
      />
    </svg>
  );
}

export const IconVerdictRankAsc = forwardRef<SVGSVGElement, IconProps>(
  ({ ...rest }, ref) => (
    <StackedDots
      ref={ref as never}
      topColor={RICHTIG}
      bottomColor={FALSCH}
      {...rest}
    />
  ),
);
IconVerdictRankAsc.displayName = "IconVerdictRankAsc";

export const IconVerdictRankDesc = forwardRef<SVGSVGElement, IconProps>(
  ({ ...rest }, ref) => (
    <StackedDots
      ref={ref as never}
      topColor={FALSCH}
      bottomColor={RICHTIG}
      {...rest}
    />
  ),
);
IconVerdictRankDesc.displayName = "IconVerdictRankDesc";

/**
 * Category-rank sort icons — sibling of the verdict-rank pair, but
 * tinted with the Information-Source category colors. Used in
 * Informationsquellen 2 (SourcesSpannweiteView) where the equivalent
 * "rank" sort groups sources by their information-source category
 * (institutional first, personal last).
 *
 *   Asc   → top = institutional (blue), bottom = personal (gray)
 *   Desc  → top = personal (gray),      bottom = institutional (blue)
 *
 * Colors mirror `--source-cat-institutional` (#2563eb) and
 * `--source-cat-personal` (#6b7280) defined in
 * `src/styles/scrollytelling.css`. We inline the hexes for the same
 * cross-browser reason as the verdict variant.
 */
const SRC_INSTITUTIONAL = "#2563eb"; // first category in canonical order
const SRC_PERSONAL = "#6b7280"; // last category in canonical order

export const IconCategoryRankAsc = forwardRef<SVGSVGElement, IconProps>(
  ({ ...rest }, ref) => (
    <StackedDots
      ref={ref as never}
      topColor={SRC_INSTITUTIONAL}
      bottomColor={SRC_PERSONAL}
      {...rest}
    />
  ),
);
IconCategoryRankAsc.displayName = "IconCategoryRankAsc";

export const IconCategoryRankDesc = forwardRef<SVGSVGElement, IconProps>(
  ({ ...rest }, ref) => (
    <StackedDots
      ref={ref as never}
      topColor={SRC_PERSONAL}
      bottomColor={SRC_INSTITUTIONAL}
      {...rest}
    />
  ),
);
IconCategoryRankDesc.displayName = "IconCategoryRankDesc";
