/**
 * Audience / population-group icons (Iter-15 sync 2026-05-29).
 *
 * Locked SVG paths shipped by Fedor on 2026-05-29 to match the
 * production cannabismythen Über-Uns icons. The stroke colour was
 * `#1a1a18` in the source SVGs (light-theme); rewritten here to
 * `stroke="currentColor"` so the dark scrolly cascade renders them in
 * the local accent (group-* tokens passed via the `color` style).
 *
 * The Konsumierende icon keeps its hardcoded `#16a34a` green arrow —
 * the green is the brand "leaf" cue rather than the audience accent.
 *
 * Single source of truth: a path edit here propagates to dashboard,
 * scrollytelling, Meine Interessen, etc.
 */

import type { SVGProps } from 'react';
import { forwardRef } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number | string;
}

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ─── Erwachsene (Volljährige) — Lucide UsersRound family ───────── */
export const IconVolljaehrige = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </svg>
  ),
);
IconVolljaehrige.displayName = 'IconVolljaehrige';

/* ─── Minderjährige — head + body + headphones + phone ──────────── */
export const IconMinderjaehrige = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      {/* head */}
      <circle cx="10" cy="9.3" r="4" />
      {/* body */}
      <path d="M3 21a7 7 0 0 1 9.5-6.6" />
      {/* beanie / rounded top */}
      <path d="M6.2 7.4 C6.9 5.5 8.2 4.5 10 4.5 C11.8 4.5 13.1 5.5 13.8 7.4" />
      {/* headphones band */}
      <path d="M5.7 8.7 C6.0 6.2 7.7 4.7 10 4.7 C12.3 4.7 14.0 6.2 14.3 8.7" />
      {/* left headphone pad */}
      <rect
        x="4.9"
        y="8.5"
        width="1.6"
        height="2.8"
        rx="0.5"
        fill="currentColor"
        stroke="currentColor"
      />
      {/* right headphone pad */}
      <rect
        x="13.5"
        y="8.5"
        width="1.6"
        height="2.8"
        rx="0.5"
        fill="currentColor"
        stroke="currentColor"
      />
      {/* phone / tablet */}
      <rect x="14.5" y="14.5" width="4.5" height="6.5" rx="0.6" />
    </svg>
  ),
);
IconMinderjaehrige.displayName = 'IconMinderjaehrige';

/** Alias: FAQ surface uses `IconJugendliche` for the same Minderjährige
 *  visual. Future divergence becomes a single-file edit here. */
export const IconJugendliche = IconMinderjaehrige;

/* ─── Junge Erwachsene — head + minimal cap + cup ───────────────── */
export const IconJungeErwachsene = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      {/* head */}
      <circle cx="10" cy="8" r="5" />
      {/* minimal cap outline */}
      <path
        d="M5.8 6.8 C6.7 4.8 8.2 3.8 10.2 3.8 C12.0 3.8 13.4 4.8 14.1 6.8"
        fill="none"
      />
      {/* filled cap band */}
      <path
        d="M5.8 6.8 C8.1 6.2 11.9 6.2 14.1 6.8 C11.9 7.3 8.1 7.3 5.8 6.8Z"
        fill="currentColor"
        stroke="none"
      />
      {/* small visor */}
      <path
        d="M14.0 6.8 C15.1 6.8 16.0 7.0 16.7 7.4 C15.8 7.7 14.8 7.7 13.9 7.3"
        fill="currentColor"
        stroke="none"
      />
      {/* body */}
      <path d="M2 21a8 8 0 0 1 10.434-7.62" />
      {/* cup */}
      <path d="M14.5 14 H20 V19 a1.5 1.5 0 0 1 -1.5 1.5 H16 a1.5 1.5 0 0 1 -1.5 -1.5 Z" />
      {/* cup handle */}
      <path d="M20 15.5 a1.4 1.4 0 0 1 0 3" />
      {/* steam */}
      <path d="M16.6 13 V11.5 M19 13 V12" />
    </svg>
  ),
);
IconJungeErwachsene.displayName = 'IconJungeErwachsene';

/* ─── Konsumierende — head + body + green check-down arrow ──────── */
export const IconKonsumierende = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="10" cy="8" r="5" />
      <path d="M2 21a8 8 0 0 1 10.434-7.62" />
      {/* leaf-green check-down — brand cue, not the audience accent */}
      <g stroke="#16a34a">
        <path d="M14 22 H23" />
        <path d="M18.5 14 V22" />
        <path d="M14.5 18 L18.5 22 L22.5 18" />
      </g>
    </svg>
  ),
);
IconKonsumierende.displayName = 'IconKonsumierende';

/* ─── Eltern — parent + smaller child silhouette ────────────────── */
export const IconEltern = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="10" cy="8" r="5" />
      <path d="M2 21a8 8 0 0 1 12.8-6.4" />
      <circle cx="18" cy="14" r="2.5" />
      <path d="M22 21a4 4 0 0 0-8 0" />
    </svg>
  ),
);
IconEltern.displayName = 'IconEltern';

/* ─── Lehrkräfte — kept from Iter-7 (Lucide-Glasses-style spectacles).
 *      Not part of the 2026-05-29 update; FAQ surface only. */
export const IconLehrkraefte = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="12" cy="7.2" r="3.2" />
      <circle cx="9.2" cy="7.5" r="1.6" />
      <circle cx="14.8" cy="7.5" r="1.6" />
      <path d="M13.2 7.5 a1 1 0 0 0 -1.2 -0.8 a1 1 0 0 0 -1.2 0.8" />
      <path d="M7.6 7 6.2 5.4 c-0.35 -0.4 -0.7 -0.6 -1.2 -0.6" />
      <path d="M16.4 7 17.8 5.4 c0.35 -0.4 0.7 -0.6 1.2 -0.6" />
      <path d="M7 21v-4.1c0-2.8 2-4.7 5-4.7s5 1.9 5 4.7V21" />
      <path d="M7.7 21h8.6" />
      <path d="M16.9 13.1 20.8 9.2" />
    </svg>
  ),
);
IconLehrkraefte.displayName = 'IconLehrkraefte';

/* ─── Fachkräfte — kept from Iter-7 (clipboard + magnifier).
 *      Not part of the 2026-05-29 update; FAQ surface only. */
export const IconFachkraefte = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="12" cy="7" r="3" />
      <path d="M7 21v-4.3c0-2.8 2-4.7 5-4.7s5 1.9 5 4.7V21" />
      <path d="M7.7 21h8.6" />
      <g strokeWidth={1.3}>
        <rect x="7.7" y="13" width="3.6" height="5.2" rx="0.4" />
        <path d="M8.6 13V12H10.4V13" />
        <path d="M8.4 14.6H10.6" />
        <path d="M8.4 16H10.6" />
        <path d="M8.4 17.3H10.6" />
      </g>
      <g strokeWidth={1.6}>
        <circle cx="19.3" cy="11.5" r="2.1" />
        <path d="M17.9 12.9 L15.6 15.2" />
      </g>
    </svg>
  ),
);
IconFachkraefte.displayName = 'IconFachkraefte';
