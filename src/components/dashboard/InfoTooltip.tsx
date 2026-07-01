import { Info } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFlipPosition } from "./hooks/useFlipPosition";

interface InfoTooltipProps {
  title: string;
  /** Optional decorative adornments rendered inside the title row, before /
   *  after the title text — e.g. the five verdict arrows (Mythen) or the
   *  signpost icon (Informationswege) on the dataset-toggle tooltips.
   *  Decorative only; keep them aria-hidden. The `title` string is still
   *  what drives the tooltip id + aria-label. */
  titlePrefix?: ReactNode;
  titleSuffix?: ReactNode;
  /** Accepts a plain string (column headers, pickers, …) OR rich content
   *  such as a <ul> list (the dataset-toggle tooltips). A string is a valid
   *  ReactNode, so all existing string callers are unaffected. */
  definition: ReactNode;
  scale?: string;
  sampleSize?: string;
  /** Optional extra class on the tooltip CARD (the portaled popover) — e.g.
   *  `info-tooltip-card--accent` to give just THIS tooltip the green focus
   *  ring. Lets one instance opt into a variant without restyling every
   *  other tooltip (which keep the default focus ring). */
  cardClassName?: string;
}

export default function InfoTooltip({
  title,
  titlePrefix,
  titleSuffix,
  definition,
  scale,
  sampleSize,
  cardClassName,
}: InfoTooltipProps) {
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
      (triggerRef.current?.closest(".carm-explorer") as HTMLElement | null) ??
        null,
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

  // Move focus to card when opened
  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open, cardRef]);

  const tooltipId = `tooltip-${title.replace(/\s+/g, "-").toLowerCase()}`;

  const card = (
    <div
      ref={cardRef}
      id={tooltipId}
      role="tooltip"
      tabIndex={-1}
      className={`info-tooltip-card info-tooltip-card--fixed${open ? " info-tooltip-card--open" : ""}${cardClassName ? ` ${cardClassName}` : ""}`}
      style={
        pos
          ? {
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxWidth: pos.width,
              transform: "none",
            }
          : undefined
      }
      onMouseEnter={handleOpen}
      onMouseLeave={() => setOpen(false)}
    >
      <p
        className={`info-tooltip-title${titlePrefix || titleSuffix ? " info-tooltip-title--adorned" : ""}`}
      >
        {titlePrefix}
        {title}
        {titleSuffix}
      </p>
      {sampleSize && <span className="info-tooltip-sample">{sampleSize}</span>}
      {/* <div> not <p>: `definition` may be a <ul>, which is invalid inside <p>. */}
      <div className="info-tooltip-desc">{definition}</div>
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
