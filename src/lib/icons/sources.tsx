/**
 * Source-category icons — 6 channels from CaRM Tab. 4.12/4.13.
 *
 * Iter-15 sync (2026-05-29): swapped from the Lucide-component
 * wrappers to inline custom paths matching the production
 * cannabismythen Über-Uns icons. The source SVGs had stroke
 * `#1a1a18` (light theme); rewritten here to `currentColor` so the
 * dark scrolly inherits the local accent token.
 *
 * Variants — paths shipped by Fedor 2026-05-29:
 *   • Institutionell      → building with floor lines
 *   • Internet            → wifi arc stack
 *   • Soziale Medien      → speech bubble with three dots
 *   • Traditionelle Medien → envelope with polyline tab (mail-style)
 *   • Print / Physisch    → printer with paper tray
 *   • Persönliches Umfeld → person + speech swoop (interpersonal cue)
 */

import type { SVGProps } from "react";
import { forwardRef } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number | string;
}

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ─── Institutionell — building with floor markings ───────────────── */
export const IconSrcInstitutionell = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M12 6v4" />
      <path d="M14 14h-4" />
      <path d="M14 18h-4" />
      <path d="M14 8h-4" />
      <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2" />
      <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
    </svg>
  ),
);
IconSrcInstitutionell.displayName = "IconSrcInstitutionell";

/* ─── Internet — wifi arc stack ──────────────────────────────────── */
export const IconSrcInternet = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M12 20h.01" />
      <path d="M2 8.82a15 15 0 0 1 20 0" />
      <path d="M5 12.859a10 10 0 0 1 14 0" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" />
    </svg>
  ),
);
IconSrcInternet.displayName = "IconSrcInternet";

/* ─── Soziale Medien — speech bubble with three dots ─────────────── */
export const IconSrcSozialeMedien = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  ),
);
IconSrcSozialeMedien.displayName = "IconSrcSozialeMedien";

/* ─── Traditionelle Medien — envelope (mail icon) ─────────────────── */
export const IconSrcTraditionelleMedien = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  ),
);
IconSrcTraditionelleMedien.displayName = "IconSrcTraditionelleMedien";

/* ─── Print / Physisch — printer with paper tray ─────────────────── */
export const IconSrcPrintPhysisch = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
      <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
    </svg>
  ),
);
IconSrcPrintPhysisch.displayName = "IconSrcPrintPhysisch";

/* ─── Persönliches Umfeld — person + speech swoop ─────────────────── */
export const IconSrcPersoenlich = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 20" />
      <path d="M19.8 17.8a7.5 7.5 0 0 0 .003-10.603" />
      <path d="M17 15a3.5 3.5 0 0 0-.025-4.975" />
    </svg>
  ),
);
IconSrcPersoenlich.displayName = "IconSrcPersoenlich";
