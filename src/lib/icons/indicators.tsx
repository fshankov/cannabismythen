/**
 * Indicator icons — myth-data axis and source axis.
 *
 * Locked variants from Phase 2:
 *   • Kenntnis  → Eye
 *   • Bedeutung → Bookmark
 *   • Richtigkeit → Target
 *   • Prävention → ShieldCheck  (SHARED between myth + source axis)
 *   • Bevölkerungsbezug → Globe
 *   • Suche → Search   (source axis)
 *   • Wahrnehmung → custom antenna-with-waves   (source axis)
 *   • Vertrauen → BadgeCheck   (source axis)
 *
 * Five of eight are pure Lucide re-exports; one (Wahrnehmung) is custom.
 * Prävention appears only once and is consumed by both axes.
 */

import type { SVGProps } from 'react';
import { forwardRef } from 'react';
import {
  Eye,
  Bookmark,
  Target,
  ShieldCheck,
  Globe,
  Search,
  BadgeCheck,
} from 'lucide-react';

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

/* Myth-data axis ---------------------------------------------------- */

export const IconKenntnis = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Eye ref={ref as never} size={size} {...rest} />
  ),
);
IconKenntnis.displayName = 'IconKenntnis';

export const IconBedeutung = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Bookmark ref={ref as never} size={size} {...rest} />
  ),
);
IconBedeutung.displayName = 'IconBedeutung';

export const IconRichtigkeit = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Target ref={ref as never} size={size} {...rest} />
  ),
);
IconRichtigkeit.displayName = 'IconRichtigkeit';

/** Prävention — shared between myth-data axis and source axis. */
export const IconPraevention = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <ShieldCheck ref={ref as never} size={size} {...rest} />
  ),
);
IconPraevention.displayName = 'IconPraevention';

export const IconBevoelkerungsbezug = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Globe ref={ref as never} size={size} {...rest} />
  ),
);
IconBevoelkerungsbezug.displayName = 'IconBevoelkerungsbezug';

/* Source axis -------------------------------------------------------- */

export const IconSuche = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Search ref={ref as never} size={size} {...rest} />
  ),
);
IconSuche.displayName = 'IconSuche';

/** Wahrnehmung — antenna with broadcast waves. Custom SVG. */
export const IconWahrnehmung = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="12" cy="13" r="1.4" fill="currentColor" />
      <path d="M9 10a5 5 0 0 1 6 0" />
      <path d="M6.5 7.5a9 9 0 0 1 11 0" />
      <path d="M4 5a13 13 0 0 1 16 0" />
    </svg>
  ),
);
IconWahrnehmung.displayName = 'IconWahrnehmung';

export const IconVertrauen = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <BadgeCheck ref={ref as never} size={size} {...rest} />
  ),
);
IconVertrauen.displayName = 'IconVertrauen';
