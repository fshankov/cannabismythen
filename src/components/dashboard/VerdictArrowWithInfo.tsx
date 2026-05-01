/**
 * VerdictArrowWithInfo — verdict arrow + hover/focus popover.
 *
 * Re-homes the explanation copy that used to live in the right-hand
 * `VerdictLegend` sidebar (deleted in PR #14). Wherever a myth's
 * verdict is rendered, hovering or focusing the arrow now shows the
 * canonical label ("Eher richtig") together with the wissenschaftlich-
 * Kenntnisstand-verdict explanation paragraph.
 *
 * Reuses `useFlipPosition` so the popover behaves identically to the
 * existing `<InfoTooltip>` — never clips, flips above/below as the
 * trigger nears the viewport edge, repositions on scroll/resize.
 *
 * Surfaces (Stage 1 of the follow-up plan):
 *   - TableView myth cell
 *   - StripsView (Punktwolke) myth card
 *   - MythosSearchChip autocomplete row
 *   - FilterDrawer myth list row
 *   - FactsheetPanel header
 *
 * Sources view dots colour by source-category, not verdict — they use
 * a native SVG <title> tooltip and do NOT use this component.
 */

import { useEffect } from 'react';
import type { CorrectnessClass } from '../../lib/dashboard/types';
import VerdictArrow from '../shared/VerdictArrow';
import { useFlipPosition } from './hooks/useFlipPosition';
import { t, type TranslationKey } from '../../lib/dashboard/translations';

interface Props {
  verdict: CorrectnessClass;
  /** Pixel size of the rendered SVG. Default 14 matches the legacy
   *  legend swatch dimensions. */
  size?: number;
  /** Stroke width passed to the Lucide icon. */
  strokeWidth?: number;
  /** Optional className applied to the trigger button so callers can
   *  position the popover trigger inside their own layout. */
  className?: string;
}

export default function VerdictArrowWithInfo({
  verdict,
  size = 14,
  strokeWidth = 2.25,
  className,
}: Props) {
  const { triggerRef, cardRef, pos, open, setOpen, updatePosition } =
    useFlipPosition<HTMLButtonElement, HTMLDivElement>();

  const handleOpen = () => {
    updatePosition();
    setOpen(true);
  };

  // Outside-click + Escape close handlers (only while open).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        cardRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen, triggerRef, cardRef]);

  // No info card for the "no_classification" sentinel — there is no
  // explanation copy registered for it; the arrow alone communicates
  // "no verdict possible". Render a bare <VerdictArrow>.
  if (verdict === 'no_classification') {
    return (
      <VerdictArrow
        verdict={verdict}
        size={size}
        strokeWidth={strokeWidth}
        className={className}
      />
    );
  }

  const labelKey: TranslationKey = `verdict.${verdict}` as TranslationKey;
  const explanationKey: TranslationKey =
    `verdict.legend.info.${verdict}` as TranslationKey;
  const label = t(labelKey, 'de');
  const explanation = t(explanationKey, 'de');
  const tooltipId = `verdict-tooltip-${verdict}`;

  return (
    <span className={`carm-verdict-arrow-info ${className ?? ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`carm-verdict-arrow-info__trigger classification--${verdict}`}
        aria-label={`${label} — Erklärung anzeigen`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setOpen(false)}
        onFocus={handleOpen}
        onBlur={(e) => {
          if (!cardRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
      >
        <VerdictArrow verdict={verdict} size={size} strokeWidth={strokeWidth} />
      </button>

      <div
        ref={cardRef}
        id={tooltipId}
        role="tooltip"
        tabIndex={-1}
        className={`info-tooltip-card info-tooltip-card--fixed${open ? ' info-tooltip-card--open' : ''}`}
        style={pos ? {
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: pos.width,
          maxWidth: pos.width,
          transform: 'none',
        } : undefined}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setOpen(false)}
      >
        <p className={`info-tooltip-title classification--${verdict}`}>
          {label}
        </p>
        <p className="info-tooltip-desc">{explanation}</p>
      </div>
    </span>
  );
}
