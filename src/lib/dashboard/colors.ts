import type { CorrectnessClass } from './types';

export const CORRECTNESS_COLORS: Record<CorrectnessClass, string> = {
  richtig: '#047857',
  eher_richtig: '#a16207',
  eher_falsch: '#c2410c',
  falsch: '#be123c',
  no_classification: '#6b7280',
};

export function getCorrectnessColor(cls: CorrectnessClass): string {
  return CORRECTNESS_COLORS[cls] || '#6b7280';
}

// Lighter versions for backgrounds
export const CORRECTNESS_BG_COLORS: Record<CorrectnessClass, string> = {
  richtig: '#ecfdf5',
  eher_richtig: '#fefce8',
  eher_falsch: '#fff7ed',
  falsch: '#fff1f2',
  no_classification: '#f3f4f6',
};

export function getCorrectnessBgColor(cls: CorrectnessClass): string {
  return CORRECTNESS_BG_COLORS[cls] || '#f3f4f6';
}
