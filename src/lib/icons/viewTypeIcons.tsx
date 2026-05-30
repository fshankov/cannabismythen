/**
 * Daten-Explorer view-type icons (2026-05-30).
 *
 * The three data-view glyphs that sit left of each tab label in the
 * Daten-Explorer tab bar (`src/components/dashboard/ViewTabs.tsx`):
 *
 *   ChartBarIcon → Balken   (balken / sources)
 *   Grid3x3Icon  → Übersicht (spannweite / sources2)
 *   Table2Icon   → Tabelle  (table / sources_table)
 *
 * These specific glyphs are NOT part of the locked icon handoff
 * (`src/lib/icons/_handoff/`) — they're Lucide view-type glyphs Fedor
 * supplied directly. Drawn at stroke-width 2 (not the handoff's 1.75)
 * to match the existing Rundgang Compass that shares the same tab bar.
 *
 * Colour comes from CSS `color` via `currentColor`; ViewTabs passes the
 * group accent (emerald for Mythen, blue for Quellen) as an inline style.
 */

import type { SVGProps } from 'react';
import { forwardRef } from 'react';

export interface ViewTypeIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number | string;
}

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ─── Balken — Lucide chart-bar ────────────────────────────────── */
export const ChartBarIcon = forwardRef<SVGSVGElement, ViewTypeIconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 16h8" />
      <path d="M7 11h12" />
      <path d="M7 6h3" />
    </svg>
  ),
);
ChartBarIcon.displayName = 'ChartBarIcon';

/* ─── Übersicht — Lucide grid-3x3 ──────────────────────────────── */
export const Grid3x3Icon = forwardRef<SVGSVGElement, ViewTypeIconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  ),
);
Grid3x3Icon.displayName = 'Grid3x3Icon';

/* ─── Tabelle — Lucide table-2 ─────────────────────────────────── */
export const Table2Icon = forwardRef<SVGSVGElement, ViewTypeIconProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} {...baseProps} {...rest}>
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  ),
);
Table2Icon.displayName = 'Table2Icon';
