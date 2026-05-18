/**
 * Source-category icons — 6 channels from CaRM Tab. 4.12/4.13.
 *
 * Locked variants from Phase 2:
 *   • Institutionell     → Lucide Building2
 *   • Internet           → Lucide AppWindow      (browser-window read)
 *   • Soziale Medien     → Lucide MessageCircle
 *   • Traditionelle      → Lucide Tv
 *   • Print / Physisch   → Lucide FileText       (sheet of paper, NOT building)
 *   • Persönliches Umfeld → custom: two figures side by side, no connecting line
 *
 * Persönliches Umfeld is custom because Lucide Users / UsersRound are
 * already in use elsewhere (Volljährige uses UsersRound) and would visually
 * collide if reused here.
 */

import type { SVGProps } from 'react';
import { forwardRef } from 'react';
import {
  Building2,
  AppWindow,
  MessageCircle,
  Tv,
  FileText,
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
    <Building2 ref={ref as never} size={size} {...rest} />
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

/** Persönliches Umfeld — custom: two figures, no line. Distinct from
 *  Volljährige (UsersRound = asymmetric 1+partial) by composition. */
export const IconSrcPersoenlich = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <circle cx="8" cy="8" r="2.4" />
      <circle cx="16" cy="8" r="2.4" />
      <path d="M3 20a4.5 4.5 0 0 1 9 0" />
      <path d="M12 20a4.5 4.5 0 0 1 9 0" />
    </svg>
  ),
);
IconSrcPersoenlich.displayName = 'IconSrcPersoenlich';
