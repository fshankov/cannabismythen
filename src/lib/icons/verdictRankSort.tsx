/**
 * Verdict-rank sort icons (added 2026-05-22).
 *
 * Two stacked filled circles in the verdict colors — green for
 * `richtig`, red for `falsch` — visually echoing the A-Z sort icon's
 * stacked-letters layout. Pairs with the existing `ArrowDownAZ`
 * (alphabetical) button in the MYTHEN column header so the two sort
 * affordances read as a matched set.
 *
 *   Asc   → top circle = richtig (green), bottom = falsch (red)
 *   Desc  → top circle = falsch (red),   bottom = richtig (green)
 *
 * Sized to match Lucide's 14 px sort glyphs at the call site:
 *   <IconVerdictRankAsc size={14} strokeWidth={2} />
 *
 * Implementation: pure SVG (no Lucide dependency) so we can fill the
 * dots with the canonical `--classification-richtig` / `-falsch`
 * tokens via inline `fill=` (CSS custom properties wouldn't apply
 * inside a `<symbol>` reference cleanly here).
 */
import type { SVGProps } from 'react';
import { forwardRef } from 'react';

const RICHTIG = '#047857';   // --classification-richtig (Emerald-700)
const FALSCH  = '#be123c';   // --classification-falsch  (Rose-700)
const SHADOW  = '#0f172a';   // dark hairline ring for contrast on white-ish bg

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number | string;
}

function StackedDots({
  topColor,
  bottomColor,
  size = 14,
  ...rest
}: IconProps & { topColor: string; bottomColor: string }) {
  // viewBox 24×24 — same as Lucide. Two filled dots stacked vertically
  // (centered on x=12), with the down-arrow chevron offset to the right
  // so the dot+arrow cluster reads as one icon (mirrors ArrowDownAZ).
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* Top dot */}
      <circle cx="8" cy="6" r="3" fill={topColor} stroke={SHADOW} strokeWidth="0.5" />
      {/* Bottom dot */}
      <circle cx="8" cy="18" r="3" fill={bottomColor} stroke={SHADOW} strokeWidth="0.5" />
      {/* Down-arrow chevron on the right (matches ArrowDownAZ layout) */}
      <path
        d="M16 6 v12 m-3 -3 l3 3 l3 -3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const IconVerdictRankAsc = forwardRef<SVGSVGElement, IconProps>(
  ({ ...rest }, ref) => (
    <StackedDots ref={ref as never} topColor={RICHTIG} bottomColor={FALSCH} {...rest} />
  ),
);
IconVerdictRankAsc.displayName = 'IconVerdictRankAsc';

export const IconVerdictRankDesc = forwardRef<SVGSVGElement, IconProps>(
  ({ ...rest }, ref) => (
    <StackedDots ref={ref as never} topColor={FALSCH} bottomColor={RICHTIG} {...rest} />
  ),
);
IconVerdictRankDesc.displayName = 'IconVerdictRankDesc';
