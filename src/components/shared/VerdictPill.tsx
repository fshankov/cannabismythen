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
const DEFAULT_LABEL: Record<CorrectnessClass, string> = {
  richtig: 'Richtig',
  eher_richtig: 'Eher richtig',
  eher_falsch: 'Eher falsch',
  falsch: 'Falsch',
  no_classification: 'Keine Aussage',
};

interface VerdictPillProps {
  verdict: CorrectnessClass;
  /** Override the canonical German label (e.g. "Keine Aussage möglich"). */
  label?: string;
  /** Pill size: `sm` for inline / dense lists, `md` (default), `lg` for hero placements. */
  size?: 'sm' | 'md' | 'lg';
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

export default function VerdictPill({
  verdict,
  label,
  size = 'md',
  as = 'span',
  className,
  onClick,
  'aria-pressed': ariaPressed,
  'aria-label': ariaLabel,
  type,
}: VerdictPillProps) {
  const text = label ?? DEFAULT_LABEL[verdict];
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
