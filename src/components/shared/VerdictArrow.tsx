/**
 * VerdictArrow — directional Lucide-arrow icon paired with each
 * scientific verdict on the cannabismythen site.
 *
 * Mapping (deuteranopia-safe; redundant with the verdict color tokens
 * in `src/styles/global.css` so users can read verdicts without color):
 *
 *   richtig          → ArrowUp        ↑
 *   eher_richtig     → ArrowUpRight   ↗
 *   eher_falsch      → ArrowDownLeft  ↙
 *   falsch           → ArrowDown      ↓
 *   no_classification → Minus         —
 *
 * Renders inline as `currentColor`, so the parent's `color` rule
 * (e.g. `var(--classification-richtig)`) cascades into the stroke.
 *
 * This is the canonical verdict glyph for the entire site. The legacy
 * unicode `getCorrectnessIcon()` helper in `src/lib/dashboard/colors.ts`
 * is `@deprecated` and should not be used in new code.
 */

import {
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDown,
  Minus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CorrectnessClass } from '../../lib/dashboard/types';

interface VerdictArrowProps {
  verdict: CorrectnessClass;
  /** Pixel size of the rendered SVG. Default 14 matches the legend swatch. */
  size?: number;
  /** Stroke width passed to the Lucide icon. Default 2.25. */
  strokeWidth?: number;
  /** Set to `false` if the icon is the only label for its meaning. Default `true`. */
  'aria-hidden'?: boolean;
  className?: string;
}

const ICONS: Record<CorrectnessClass, LucideIcon> = {
  richtig: ArrowUp,
  eher_richtig: ArrowUpRight,
  eher_falsch: ArrowDownLeft,
  falsch: ArrowDown,
  no_classification: Minus,
};

export default function VerdictArrow({
  verdict,
  size = 14,
  strokeWidth = 2.25,
  'aria-hidden': ariaHidden = true,
  className,
}: VerdictArrowProps) {
  const Icon = ICONS[verdict] ?? Minus;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={ariaHidden}
      className={className}
    />
  );
}
