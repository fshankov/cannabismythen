/**
 * Indicator icons — myth-data axis and source axis.
 *
 * Locked variants (synced to the icon handoff, src/lib/icons/_handoff/):
 *   • Kenntnis  → Eye
 *   • Bedeutung → custom Flag   (myth-bedeutung — pennant with notch)
 *   • Richtigkeit → LocateFixed
 *   • Prävention → ShieldCheck  (SHARED between myth + source axis)
 *   • Bevölkerungsbezug → Globe
 *   • Suche → Search   (source axis)
 *   • Wahrnehmung → custom antenna-with-waves   (source axis)
 *   • Vertrauen → Handshake   (source axis — handoff swap from BadgeCheck)
 *
 * Most are pure Lucide re-exports; Bedeutung + Wahrnehmung are custom SVGs.
 * Prävention appears only once and is consumed by both axes.
 */

import type { SVGProps } from "react";
import { forwardRef } from "react";
import {
  Eye,
  LocateFixed,
  ShieldCheck,
  Globe,
  Search,
  Handshake,
} from "lucide-react";

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

/* Myth-data axis ---------------------------------------------------- */

export const IconKenntnis = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Eye ref={ref as never} size={size} {...rest} />
  ),
);
IconKenntnis.displayName = "IconKenntnis";

/** Bedeutung — custom flag/pennant (handoff `myth-bedeutung`, variant B). */
export const IconBedeutung = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M5 21 V4 H17 L14.5 8 L17 12 H5" />
    </svg>
  ),
);
IconBedeutung.displayName = "IconBedeutung";

export const IconRichtigkeit = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <LocateFixed ref={ref as never} size={size} {...rest} />
  ),
);
IconRichtigkeit.displayName = "IconRichtigkeit";

/** Prävention — shared between myth-data axis and source axis. */
export const IconPraevention = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <ShieldCheck ref={ref as never} size={size} {...rest} />
  ),
);
IconPraevention.displayName = "IconPraevention";

export const IconBevoelkerungsbezug = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Globe ref={ref as never} size={size} {...rest} />
  ),
);
IconBevoelkerungsbezug.displayName = "IconBevoelkerungsbezug";

/* Source axis -------------------------------------------------------- */

export const IconSuche = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Search ref={ref as never} size={size} {...rest} />
  ),
);
IconSuche.displayName = "IconSuche";

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
IconWahrnehmung.displayName = "IconWahrnehmung";

export const IconVertrauen = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...rest }, ref) => (
    <Handshake ref={ref as never} size={size} {...rest} />
  ),
);
IconVertrauen.displayName = "IconVertrauen";
