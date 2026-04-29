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
  /** Viewport-relative pixel position of the card while open. Positioned with
   *  `position: fixed` so the popup escapes any parent stacking context (e.g. an
   *  absolute-positioned wrapper around the trigger). This guarantees the card
   *  always renders on top of neighbouring `i` triggers. */
  const [pos, setPos] = useState<{ top: number; left: number; width: number; below: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Compute viewport-relative position. Prefers above the trigger; if there
  // isn't enough room (e.g. the trigger sits near the top of the screen on
  // mobile), flips below.
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 8;
    const width = Math.min(280, vw - 2 * padding);
    const measuredH = cardRef.current?.offsetHeight || 160;
    const aboveSpace = r.top - padding;
    const belowSpace = vh - r.bottom - padding;
    // Prefer above when there's room; otherwise below if below has more space
    const below = aboveSpace < measuredH + 12 && belowSpace > aboveSpace;
    const top = below ? r.bottom + 6 : r.top - 6 - measuredH;
    let left = r.left + r.width / 2 - width / 2;
    if (left < padding) left = padding;
    if (left + width > vw - padding) left = vw - padding - width;
    setPos({ top, left, width, below });
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
      // Re-measure once the card is mounted so above/below is based on real height
      const id = requestAnimationFrame(() => updatePosition());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Reposition on scroll / resize while open (the trigger may move)
  useEffect(() => {
    if (!open) return;
    const onChange = () => updatePosition();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
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
