import { Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface InfoTooltipProps {
  title: string;
  definition: string;
  scale?: string;
  sampleSize?: string;
}

export default function InfoTooltip({ title, definition, scale, sampleSize }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Decide whether to render above or below based on available space
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Card is ~140px tall at most; prefer top unless less than 160px above viewport
    setAbove(rect.top > 160);
  };

  const handleOpen = () => {
    updatePosition();
    setOpen(true);
  };

  // Close on outside click
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
  }, [open]);

  // Move focus to card when opened, return to trigger when closed
  useEffect(() => {
    if (open) {
      cardRef.current?.focus();
    }
  }, [open]);

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
          // Only close if focus leaves both trigger and card
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
        className={`info-tooltip-card${open ? ' info-tooltip-card--open' : ''}${above ? ' info-tooltip-card--above' : ' info-tooltip-card--below'}`}
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
