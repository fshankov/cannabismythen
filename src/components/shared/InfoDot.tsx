/**
 * InfoDot — small "i" hover ring with a viewport-clamped popover.
 *
 * Lighter sibling of cannabismythen's `InfoTooltip` — keeps the same
 * `useFlipPosition`-driven flip-above-or-below behaviour, but renders a
 * dark-tuned card body (no scale / no sample-size split; just a title
 * + a short body). Used by the new viz column headers / row labels in
 * Steps 6, 7, 8, 9.
 */
import { Info } from "lucide-react";
import { useEffect } from "react";
import { useFlipPosition } from "../dashboard/hooks/useFlipPosition";

interface InfoDotProps {
  /** Short label rendered as the popover heading. */
  title: string;
  /** One-paragraph definition. Plain text. */
  body: string;
  /** Optional unit / sample-size hint rendered as a muted footnote. */
  meta?: string;
  /** Optional aria-label override for the trigger; defaults to
   *  "Erklärung: {title}". */
  ariaLabel?: string;
}

export default function InfoDot({
  title,
  body,
  meta,
  ariaLabel,
}: InfoDotProps) {
  const { triggerRef, cardRef, pos, open, setOpen, updatePosition } =
    useFlipPosition<HTMLButtonElement, HTMLDivElement>({
      maxWidth: 280,
      gap: 6,
    });

  const handleOpen = () => {
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        cardRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen, triggerRef, cardRef]);

  const tooltipId = `infodot-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <span className="info-dot-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="info-dot-trigger"
        aria-label={ariaLabel ?? `Erklärung: ${title}`}
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
        <Info size={12} aria-hidden="true" />
      </button>

      <div
        ref={cardRef}
        id={tooltipId}
        role="tooltip"
        tabIndex={-1}
        className={`info-dot-card${open ? " info-dot-card--open" : ""}`}
        style={
          pos
            ? {
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxWidth: pos.width,
              }
            : undefined
        }
        onMouseEnter={handleOpen}
        onMouseLeave={() => setOpen(false)}
      >
        <p className="info-dot-title">{title}</p>
        <p className="info-dot-body">{body}</p>
        {meta && <p className="info-dot-meta">{meta}</p>}
      </div>
    </span>
  );
}
