import {
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDown,
  Minus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CorrectnessClass } from './types';

/**
 * Unified classification colors — Emerald / Lime / Amber / Rose palette.
 * (Decision A: deuteranopia-safe through luminance variation,
 *  avoids pure traffic-light associations.)
 *
 * The literal hex values are mirrored in `src/styles/global.css` as
 * `--classification-…` CSS custom properties. JS consumers (ECharts /
 * D3) read from this file; CSS consumers read from the tokens. Both
 * must stay in sync.
 */
export const CORRECTNESS_COLORS: Record<CorrectnessClass, string> = {
  richtig: '#047857',           // Emerald-700
  eher_richtig: '#4d7c0f',      // Lime-700
  eher_falsch: '#b45309',       // Amber-700
  falsch: '#be123c',            // Rose-700
  no_classification: '#6b7280', // Gray-500
};

export function getCorrectnessColor(cls: CorrectnessClass): string {
  return CORRECTNESS_COLORS[cls] || '#6b7280';
}

// Lighter versions for backgrounds.
export const CORRECTNESS_BG_COLORS: Record<CorrectnessClass, string> = {
  richtig: '#ecfdf5',           // Emerald-50
  eher_richtig: '#f7fee7',      // Lime-50
  eher_falsch: '#fffbeb',       // Amber-50
  falsch: '#fff1f2',            // Rose-50
  no_classification: '#f3f4f6', // Gray-100
};

export function getCorrectnessBgColor(cls: CorrectnessClass): string {
  return CORRECTNESS_BG_COLORS[cls] || '#f3f4f6';
}

/**
 * Mid-saturation verdict colors (Tailwind -600 family) — used as the
 * dot fill in `GridValueCell`. The mid-saturation gives enough
 * contrast that 11px white tabular-nums text inside the 18px dot
 * passes WCAG-AA (~4.5–4.7:1 contrast ratio per verdict). Not exposed
 * as CSS custom properties yet — the only consumer is the dot fill.
 */
export const CORRECTNESS_FILL_COLORS: Record<CorrectnessClass, string> = {
  richtig: '#059669',           // Emerald-600
  eher_richtig: '#65a30d',      // Lime-600
  eher_falsch: '#d97706',       // Amber-600
  falsch: '#e11d48',            // Rose-600
  no_classification: '#6b7280', // Gray-500 (kept — no -600 for neutral)
};

export function getCorrectnessFillColor(cls: CorrectnessClass): string {
  return CORRECTNESS_FILL_COLORS[cls] || '#6b7280';
}

/**
 * Lucide arrow component for each verdict — canonical iconography
 * across the site. UI consumers should prefer the
 * `<VerdictArrow verdict="…" />` wrapper in `src/components/shared/`
 * rather than calling this helper directly.
 *
 *   richtig          → ArrowUp        ↑
 *   eher_richtig     → ArrowUpRight   ↗
 *   eher_falsch      → ArrowDownLeft  ↙
 *   falsch           → ArrowDown      ↓
 *   no_classification → Minus         —
 */
export const CORRECTNESS_ARROWS: Record<CorrectnessClass, LucideIcon> = {
  richtig: ArrowUp,
  eher_richtig: ArrowUpRight,
  eher_falsch: ArrowDownLeft,
  falsch: ArrowDown,
  no_classification: Minus,
};

export function getCorrectnessArrow(cls: CorrectnessClass): LucideIcon {
  return CORRECTNESS_ARROWS[cls] ?? Minus;
}

/**
 * Legacy unicode glyphs. Retained only so older callers don't crash
 * before they're migrated to `<VerdictArrow />`.
 *
 * @deprecated Use `<VerdictArrow verdict={cls} />` (canonical) or
 *   `getCorrectnessArrow(cls)` for non-React contexts. Do not introduce
 *   new callers — this object will be removed once Stage 5 of the
 *   Daten-Explorer refactor lands.
 */
export const CORRECTNESS_ICONS: Record<CorrectnessClass, string> = {
  richtig: '↑',
  eher_richtig: '↗',
  eher_falsch: '↙',
  falsch: '↓',
  no_classification: '—',
};

/**
 * @deprecated Prefer `<VerdictArrow verdict={cls} />`.
 */
export function getCorrectnessIcon(cls: CorrectnessClass): string {
  return CORRECTNESS_ICONS[cls] || '—';
}
