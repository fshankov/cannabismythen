import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFlipPosition } from './hooks/useFlipPosition';

interface InfoTooltipProps {
  title: string;
  definition: string;
  scale?: string;
  sampleSize?: string;
}

export default function InfoTooltip({ title, definition, scale, sampleSize }: InfoTooltipProps) {
  const { triggerRef, cardRef, pos, open, setOpen, updatePosition } =
    useFlipPosition<HTMLButtonElement, HTMLDivElement>();

  // Portal the card up to the dashboard root so it escapes the sticky table
  // header's stacking context. A `position: sticky` <th> with `z-index: 2`
  // creates a stacking context, which traps the card's `z-index: 9999` at the
  // header's level — so a neighbouring sticky cell (e.g. the Prävention column)
  // painted over the card's edge (BugHerd 4.13, 2026-06-04). No CSS escapes an
  // ancestor stacking context; the card must leave the <th> in the DOM. We
  // portal to `.carm-explorer` (NOT document.body) because that root is not a
  // stacking context AND keeps the scoped `.carm-explorer .info-tooltip-card`
  // styles applied. Falls back to inline render outside the dashboard
  // (scrolly / quiz), where the trap doesn't exist and the styles are global.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(
      (triggerRef.current?.closest('.carm-explorer') as HTMLElement | null) ?? null,
    );
  }, [triggerRef]);

  const handleOpen = () => {
    updatePosition();
    setOpen(true);
  };

  // Close on outside click + Escape
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

  // Move focus to card when opened
  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open, cardRef]);

  const tooltipId = `tooltip-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const card = (
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
      <p className="info-tooltip-title">{title}</p>
      {sampleSize && <span className="info-tooltip-sample">{sampleSize}</span>}
      <p className="info-tooltip-desc">{definition}</p>
      {scale && <p className="info-tooltip-scale">Skala: {scale}</p>}
    </div>
  );

  return (
    <span className="info-tooltip-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="info-tooltip-trigger"
        aria-label={`Erklärung: ${title}`}
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
        <Info size={13} aria-hidden="true" />
      </button>

      {/* Portal the card out of the sticky <th> so it can't be covered by a
          neighbouring sticky cell (see portalTarget note above). */}
      {portalTarget ? createPortal(card, portalTarget) : card}
    </span>
  );
}
