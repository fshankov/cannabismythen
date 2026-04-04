import type { CorrectnessClass } from './types';

/**
 * Unified classification colors — Emerald/Lime/Amber/Rose palette.
 * (Decision A: deuteranopia-safe through luminance variation,
 *  avoids pure traffic-light associations)
 */
export const CORRECTNESS_COLORS: Record<CorrectnessClass, string> = {
  richtig: '#047857',        // Emerald-700
  eher_richtig: '#4d7c0f',   // Lime-700
  eher_falsch: '#b45309',    // Amber-700
  falsch: '#be123c',         // Rose-700
  no_classification: '#6b7280', // Gray-500
};

export function getCorrectnessColor(cls: CorrectnessClass): string {
  return CORRECTNESS_COLORS[cls] || '#6b7280';
}

// Lighter versions for backgrounds
export const CORRECTNESS_BG_COLORS: Record<CorrectnessClass, string> = {
  richtig: '#ecfdf5',        // Emerald-50
  eher_richtig: '#f7fee7',   // Lime-50
  eher_falsch: '#fffbeb',    // Amber-50
  falsch: '#fff1f2',         // Rose-50
  no_classification: '#f3f4f6', // Gray-100
};

export function getCorrectnessBgColor(cls: CorrectnessClass): string {
  return CORRECTNESS_BG_COLORS[cls] || '#f3f4f6';
}

/** Unicode icon for each classification (icon-based redundancy for colorblind users) */
export const CORRECTNESS_ICONS: Record<CorrectnessClass, string> = {
  richtig: '✓',
  eher_richtig: '◐',
  eher_falsch: '◑',
  falsch: '✗',
  no_classification: '—',
};

export function getCorrectnessIcon(cls: CorrectnessClass): string {
  return CORRECTNESS_ICONS[cls] || '—';
}
