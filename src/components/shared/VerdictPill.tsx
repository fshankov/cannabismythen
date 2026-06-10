/**
 * VerdictPill — the unified verdict marker for the v3 system.
 *
 * One pill containing the canonical <VerdictArrow> icon (chevron +
 * shadow line) and the canonical German verdict label, sharing a single
 * tinted background. Used everywhere on the site where there's no myth
 * statement available to carry the verdict color directly:
 *
 *   - Quiz reveal chips ("Ihre Antwort" / "Wissenschaftlich")
 *   - Dashboard verdict tags (myth-card detail header)
 *   - Legend entries
 *   - Filter buttons (via VerdictFilterButton wrapper)
 *   - Anywhere a stand-alone verdict label is needed
 *
 * For myth statements (where the title itself carries the verdict
 * color), use <VerdictStatement> instead.
 *
 * Renders as a server-side React component — usable from both `.tsx`
 * and `.astro` files (Astro will SSR it without a client directive).
 */

import type { CorrectnessClass } from '../../lib/dashboard/types';
import VerdictArrow from './VerdictArrow';

/** Canonical German labels — mirrors `verdict.*` in
 *  `src/lib/dashboard/translations.ts` and `classification.*` in
 *  `src/components/quiz/i18n.ts`. */
export const DEFAULT_LABEL: Record<CorrectnessClass, string> = {
  richtig: 'Richtig',
  eher_richtig: 'Eher richtig',
  eher_falsch: 'Eher falsch',
  falsch: 'Falsch',
  keine_aussage_moeglich: 'Keine Aussage möglich',
};

interface VerdictPillProps {
  verdict: CorrectnessClass;
  /** Override the canonical German label (e.g. "Keine Aussage möglich"). */
  label?: string;
  /** Pill size: `sm` for inline / dense lists, `md` (default), `lg` for hero placements. */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant:
   *   - `pill` (default): rounded-rect with tinted bg, icon + label
   *   - `puck`: small verdict-colored CIRCLE with WHITE arrow inside,
   *     no label. Used in the /ueber-uns/ scrollytelling for inline
   *     verdict markers in body text + the Step 4 tally list. */
  variant?: 'pill' | 'puck';
  /** When `true`, renders as a `<button>` (use VerdictFilterButton for the full button pattern). */
  as?: 'span' | 'button';
  /** Extra class names appended to the pill. */
  className?: string;
  /** Forwarded to <button> when `as="button"`. */
  onClick?: () => void;
  /** Forwarded to <button> when `as="button"`. */
  'aria-pressed'?: boolean;
  /** Forwarded to <button> when `as="button"`. */
  'aria-label'?: string;
  /** Forwarded to <button> when `as="button"`. */
  type?: 'button' | 'submit' | 'reset';
}

const ICON_SIZE: Record<NonNullable<VerdictPillProps['size']>, number> = {
  sm: 11,
  md: 13,
  lg: 15,
};

/** Puck variant: same size keys but tuned to read at the smaller
 *  glyph-only footprint (no label sitting next to it). */
const PUCK_ICON_SIZE: Record<NonNullable<VerdictPillProps['size']>, number> = {
  sm: 12,
  md: 14,
  lg: 18,
};

const WHITE_GLYPH = {
  main: '#ffffff',
  shadow: 'rgba(255, 255, 255, 0.55)',
} as const;

export default function VerdictPill({
  verdict,
  label,
  size = 'md',
  variant = 'pill',
  as = 'span',
  className,
  onClick,
  'aria-pressed': ariaPressed,
  'aria-label': ariaLabel,
  type,
}: VerdictPillProps) {
  const text = label ?? DEFAULT_LABEL[verdict];

  // Puck variant — colored circle + white arrow, no label.
  if (variant === 'puck') {
    const puckClasses = [
      'verdict-puck',
      `verdict-puck--${size}`,
      `verdict-puck--${verdict}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');
    const a11yLabel = ariaLabel ?? text;
    const glyph = (
      <VerdictArrow
        verdict={verdict}
        size={PUCK_ICON_SIZE[size]}
        strokeWidth={2.5}
        colorOverride={WHITE_GLYPH}
      />
    );
    if (as === 'button') {
      return (
        <button
          type={type ?? 'button'}
          className={puckClasses}
          onClick={onClick}
          aria-pressed={ariaPressed}
          aria-label={a11yLabel}
        >
          {glyph}
        </button>
      );
    }
    return (
      <span className={puckClasses} role="img" aria-label={a11yLabel}>
        {glyph}
      </span>
    );
  }

  // Pill variant — default.
  const sizeClass = size === 'md' ? '' : `pill--${size}`;
  const classes = ['pill', `pill--${verdict}`, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <>
      <span className="pill__icon" aria-hidden="true">
        <VerdictArrow verdict={verdict} size={ICON_SIZE[size]} strokeWidth={2} />
      </span>
      <span className="pill__label">{text}</span>
    </>
  );

  if (as === 'button') {
    return (
      <button
        type={type ?? 'button'}
        className={classes}
        onClick={onClick}
        aria-pressed={ariaPressed}
        aria-label={ariaLabel}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={classes} aria-label={ariaLabel}>
      {inner}
    </span>
  );
}
