/**
 * Audience / population-group icons.
 *
 * Single source of truth for the visual representation of each CaRM audience.
 * Edit a path here and every surface (dashboard, Meine Interessen, scrollytelling,
 * "Über das Projekt") updates.
 *
 * Design conventions (locked in Phase 2 brainstorm):
 *   - viewBox 24×24, stroke="currentColor", fill="none" (default)
 *   - stroke-width 1.75 default, round caps/joins
 *   - shared person base: head circle cx=12 cy=7 r=3, U-shaped torso
 *   - Konsumierende reuses the verdict-falsch arrow paths (scaled 0.36), recoloured green
 *   - Jugendliche ALIASES Minderjährige (same SVG, same colour token)
 *   - Volljährige = Lucide UsersRound (asymmetric main + partial behind)
 *
 * Consumers should import via `@/lib/icons` (the central index), not from
 * this file directly, so future re-organisation stays a one-line change.
 */

import type { SVGProps } from 'react';
import { forwardRef } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number | string;
}

/** Default SVG props for every custom icon in this module. */
const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Shared person-base paths used inside most audience icons. */
const BasePerson = () => (
  <g>
    <circle cx="12" cy="7" r="3" />
    <path d="M7 21v-4.3c0-2.8 2-4.7 5-4.7s5 1.9 5 4.7V21" />
    <path d="M7.7 21h8.6" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Volljährige — custom group of 3 (locked v5).
 * Main figure (base proportions) + back-left and back-right figures
 * with smaller heads at cy=9.2 r=2.2 and diagonal shoulder strokes
 * ending at each back head's bottom. Back partial bodies sit outside
 * the main body U so there's no stroke conflict.
 */
/* ------------------------------------------------------------------ */
export const IconVolljaehrige = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="12" cy="7" r="3" />
      <path d="M7 21v-4.3c0-2.8 2-4.7 5-4.7s5 1.9 5 4.7V21" />
      <path d="M7.7 21h8.6" />
      <circle cx="5.8" cy="9.2" r="2.2" />
      <path d="M2.4 20v-2.4c0-2 1.3-3.4 3.4-3.4" />
      <circle cx="18.2" cy="9.2" r="2.2" />
      <path d="M21.6 20v-2.4c0-2-1.3-3.4-3.4-3.4" />
    </svg>
  ),
);
IconVolljaehrige.displayName = 'IconVolljaehrige';

/* ------------------------------------------------------------------ */
/* Minderjährige — smaller solo figure + filled baseball cap (brim right) */
/* ------------------------------------------------------------------ */
export const IconMinderjaehrige = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="12" cy="8" r="2.5" />
      <path d="M8 21v-3.7c0-2.4 1.7-4 4-4s4 1.6 4 4V21" />
      <path d="M8.5 21h7" />
      {/* cap dome (front-half filled) */}
      <path d="M9.7 5.5 Q12 3 14.3 5.5 Z" fill="currentColor" />
      <path d="M9.7 5.5 Q12 3 14.3 5.5" />
      {/* brim — RIGHT */}
      <path d="M14.3 6 H18.5" />
    </svg>
  ),
);
IconMinderjaehrige.displayName = 'IconMinderjaehrige';

/* ------------------------------------------------------------------ */
/* Jugendliche — aliases Minderjährige (same SVG + same colour token).
 * Exposed under a separate name so the FAQ audience side has a stable
 * import; future divergence becomes a single-file edit here.            */
/* ------------------------------------------------------------------ */
export const IconJugendliche = IconMinderjaehrige;

/* ------------------------------------------------------------------ */
/* Junge Erwachsene — base + headphones + smartphone in torso          */
/* ------------------------------------------------------------------ */
export const IconJungeErwachsene = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <BasePerson />
      {/* headphones */}
      <path d="M8.8 5 Q12 1.5 15.2 5" />
      <rect x="8.2" y="5.4" width="1.6" height="2.6" rx="0.6" />
      <rect x="14.2" y="5.4" width="1.6" height="2.6" rx="0.6" />
      {/* smartphone inside torso, lighter stroke */}
      <g strokeWidth={1.3}>
        <rect x="10.5" y="14.5" width="3" height="5" rx="0.5" />
        <path d="M11.2 18.4 H12.8" />
      </g>
    </svg>
  ),
);
IconJungeErwachsene.displayName = 'IconJungeErwachsene';

/* ------------------------------------------------------------------ */
/* Konsumierende — base + verdict-falsch arrow (scaled 0.36) recoloured green */
/* ------------------------------------------------------------------ */
export const IconKonsumierende = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <BasePerson />
      {/* Verdict-falsch exact paths — translate+scale to fit torso interior.
       *  Colour is forced green-600 (--classification-richtig is too dark,
       *  --audience-konsumierende is the audience accent). We use the
       *  emerald green family to read as "leaf". */}
      <g
        transform="translate(7.68 11.68) scale(0.36)"
        stroke="#16a34a"
        strokeWidth={4.2}
      >
        <path d="M2 16h20" />
        <path d="M12 2v14" />
        <path d="m5 9 7 7 7-7" />
      </g>
    </svg>
  ),
);
IconKonsumierende.displayName = 'IconKonsumierende';

/* ------------------------------------------------------------------ */
/* Eltern — adult base + filled (no-stroke) child silhouette (locked v5).
 * Child scaled up: head r=2.2, body bottom flush on y=21 (baseline).
 * Fill-only (no stroke) so the rounded-linejoin from baseProps doesn't
 * carve corners off the bottom edge — the child appears to stand on
 * the baseline without a floating gap.                                */
/* ------------------------------------------------------------------ */
export const IconEltern = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <BasePerson />
      <g fill="currentColor" stroke="none">
        <circle cx="8" cy="14" r="2.2" />
        <path d="M4.7 21v-3C4.7 16.2 6.1 15.2 8 15.2c1.9 0 3.3 1 3.3 2.8V21Z" />
      </g>
    </svg>
  ),
);
IconEltern.displayName = 'IconEltern';

/* ------------------------------------------------------------------ */
/* Lehrkräfte — locked v5 (Fedor's custom paths).
 * Head r=3.2 (slightly bigger than base), circle glasses r=1.9 with
 * temples sticking out beyond the head edges so the lenses read at
 * 16 px. Pointer stick diagonal from hand to upper right.            */
/* ------------------------------------------------------------------ */
export const IconLehrkraefte = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="12" cy="7.2" r="3.2" />
      <circle cx="9.2" cy="7.2" r="1.9" />
      <circle cx="14.8" cy="7.2" r="1.9" />
      <path d="M11.1 7.2h1.8" />
      <path d="M7.3 7.2H6.2" />
      <path d="M17.8 7.2h-1.1" />
      <path d="M7 21v-4.1c0-2.8 2-4.7 5-4.7s5 1.9 5 4.7V21" />
      <path d="M7.7 21h8.6" />
      <path d="M16.9 13.1 20.8 9.2" />
    </svg>
  ),
);
IconLehrkraefte.displayName = 'IconLehrkraefte';

/* ------------------------------------------------------------------ */
/* Fachkräfte — locked v5 (variant B from brainstorm).
 * Bigger clipboard inside body (3.6 × 5.2, three text lines, clip at
 * top) + magnifier on right with handle pointing back toward body.    */
/* ------------------------------------------------------------------ */
export const IconFachkraefte = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <BasePerson />
      {/* bigger clipboard inside torso */}
      <g strokeWidth={1.3}>
        <rect x="7.7" y="13" width="3.6" height="5.2" rx="0.4" />
        <path d="M8.6 13V12H10.4V13" />
        <path d="M8.4 14.6H10.6" />
        <path d="M8.4 16H10.6" />
        <path d="M8.4 17.3H10.6" />
      </g>
      {/* magnifier outside on right, handle pointing toward body */}
      <g strokeWidth={1.6}>
        <circle cx="19.3" cy="11.5" r="2.1" />
        <path d="M17.9 12.9 L15.6 15.2" />
      </g>
    </svg>
  ),
);
IconFachkraefte.displayName = 'IconFachkraefte';
