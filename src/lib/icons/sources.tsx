/**
 * Source-category icons — 6 channels from CaRM Tab. 4.12/4.13.
 *
 * Locked variants (Phase 3h, Fedor 2026-05-16):
 *   • Institutionell     → Lucide Hospital   (was Building2; Hospital is
 *                                             health-coded — better fit for
 *                                             Arzt/Apotheke/Krankenkasse)
 *   • Internet           → Lucide AppWindow
 *   • Soziale Medien     → Lucide MessageCircle
 *   • Traditionelle      → Lucide Tv
 *   • Print / Physisch   → Lucide FileText
 *   • Persönliches Umfeld → Lucide Handshake (was custom two-figures; Handshake
 *                                             reads as "interpersonal" + no
 *                                             collision with Volljährige group)
 */

import type { SVGProps } from 'react';
import { forwardRef } from 'react';
import {
  Hospital,
  AppWindow,
  MessageCircle,
  Tv,
  FileText,
  Handshake,
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

export const IconSrcInstitutionell = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Hospital ref={ref as never} size={size} {...rest} />
  ),
);
IconSrcInstitutionell.displayName = 'IconSrcInstitutionell';

export const IconSrcInternet = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <AppWindow ref={ref as never} size={size} {...rest} />
  ),
);
IconSrcInternet.displayName = 'IconSrcInternet';

export const IconSrcSozialeMedien = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <MessageCircle ref={ref as never} size={size} {...rest} />
  ),
);
IconSrcSozialeMedien.displayName = 'IconSrcSozialeMedien';

export const IconSrcTraditionelleMedien = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Tv ref={ref as never} size={size} {...rest} />
  ),
);
IconSrcTraditionelleMedien.displayName = 'IconSrcTraditionelleMedien';

export const IconSrcPrintPhysisch = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <FileText ref={ref as never} size={size} {...rest} />
  ),
);
IconSrcPrintPhysisch.displayName = 'IconSrcPrintPhysisch';

/** Persönliches Umfeld — Lucide Handshake. Reads as "interpersonal /
 *  relational" (Angehörige + person-side of Arzt/Apotheke/Beratung).
 *  No collision with Volljährige's group composition. */
export const IconSrcPersoenlich = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Handshake ref={ref as never} size={size} {...rest} />
  ),
);
IconSrcPersoenlich.displayName = 'IconSrcPersoenlich';
