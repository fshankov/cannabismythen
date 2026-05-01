import { Info } from 'lucide-react';
import { useEffect } from 'react';
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
    </span>
  );
}
