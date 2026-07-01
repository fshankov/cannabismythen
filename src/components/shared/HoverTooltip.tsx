/**
 * HoverTooltip — generic hover-card primitive.
 *
 * Wraps any single trigger element (`<th>`, `<td>`, `<button>`, …) and
 * renders a `position: fixed` tooltip via a portal into `document.body`
 * on hover / focus. The portal escapes any `overflow: auto` parent
 * (specifically the popup body, which clips a CSS-only `:hover`
 * tooltip).
 *
 * Used by:
 *   - popup table column / row headers + cells in
 *     `src/components/shared/FactsheetGroupBars.tsx`
 *   - dashboard Mythen-Tabelle + Quellen-Tabelle cells in
 *     `src/components/dashboard/views/TableView.tsx` and
 *     `…/SourcesTableView.tsx`
 *
 * Patterned after `src/components/dashboard/grid/GridHoverTooltip.tsx`
 * (which serves the Spannweite view's bar+glyph cells) — same fixed-
 * positioned hover-card with viewport-aware placement, but generic over
 * the trigger element and the content node so any caller can drop one
 * in without bespoke wiring.
 *
 * Usage:
 *   <HoverTooltip content={<>… JSX …</>}>
 *     <th className="…">…</th>
 *   </HoverTooltip>
 *
 * The trigger element receives `onMouseEnter` / `onMouseLeave` /
 * `onFocus` / `onBlur` handlers via `cloneElement`; any existing
 * handlers on the trigger are preserved and called after the tooltip
 * state updates.
 */

import {
  cloneElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { CorrectnessClass } from "../../lib/dashboard/types";
import {
  getCorrectnessColor,
  getCorrectnessBgColor,
} from "../../lib/dashboard/colors";

interface Props {
  /** Tooltip body. Any React node — including `<strong>` for the
   *  Lesebeispiel value highlights, or a full `<Lesebeispiel>` component. */
  content: ReactNode;

  /** Preferred placement. `'auto'` (default) picks `top` when there's
   *  room above the trigger in the viewport, else flips to `bottom`. */
  placement?: "top" | "bottom" | "auto";

  /** Optional class name appended to the `.hover-tooltip` wrapper. */
  className?: string;

  /** Optional verdict accent. When supplied, the tooltip background
   *  uses the verdict's --classification-*-bg color and the left
   *  border uses the verdict's --classification-* color. Matches the
   *  Spannweite GridHoverTooltip chrome so myth-context tooltips
   *  carry the same verdict signal across surfaces. Omit (or set
   *  null) for neutral white-card chrome. */
  verdict?: CorrectnessClass | null;

  /** The single trigger element. */
  children: ReactElement;
}

interface Coords {
  x: number;
  y: number;
  place: "top" | "bottom";
}

/** Matches the `.hover-tooltip { max-width }` declared in global.css.
 *  Used as the initial estimate for the half-width clamp before the
 *  tooltip has mounted and reported its real width. */
const TOOLTIP_MAX_W = 420;
/** v3 (2026-05-26): bumped from 12 → 24 so the tooltip has visible
 *  breathing room from the viewport edge on right-column hovers,
 *  matching the visual comfort Spannweite already had. */
const VIEWPORT_MARGIN = 24;

export default function HoverTooltip({
  content,
  placement = "auto",
  className,
  verdict,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<Coords>({ x: 0, y: 0, place: "top" });

  const measure = useCallback(() => {
    const tr = triggerRef.current?.getBoundingClientRect();
    if (!tr) return;
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipH = tooltipRect?.height ?? 80;
    // Use the measured tooltip width once the tooltip has mounted; the
    // first measurement runs before the DOM exists, so fall back to the
    // declared max-width.
    const tooltipW = tooltipRect?.width ?? TOOLTIP_MAX_W;
    let place: "top" | "bottom";
    if (placement === "top") place = "top";
    else if (placement === "bottom") place = "bottom";
    else place = tr.top - tooltipH - 10 > 8 ? "top" : "bottom";
    // Half-width-aware horizontal clamp — keep the ENTIRE tooltip on
    // screen, not just its center. The v1 clamp only constrained the
    // center, which let the right half (up to ~210 px) spill past the
    // viewport on right-column triggers (notably the Tabelle right
    // edge). Mirrors `GridHoverTooltip`'s pattern.
    const halfW = tooltipW / 2;
    const minX = halfW + VIEWPORT_MARGIN;
    const maxX = window.innerWidth - halfW - VIEWPORT_MARGIN;
    const naturalX = tr.left + tr.width / 2;
    // Degenerate viewport (narrower than tooltip + margins) → center
    // on screen. CSS `max-width: min(420px, calc(100vw - 24px))` on
    // `.hover-tooltip` shrinks the card to fit at that point, so the
    // clamp falls back gracefully.
    const x =
      minX > maxX
        ? window.innerWidth / 2
        : Math.max(minX, Math.min(maxX, naturalX));
    const y = place === "top" ? tr.top - 8 : tr.bottom + 8;
    setCoords({ x, y, place });
  }, [placement]);

  useEffect(() => {
    if (!open) return;
    measure();
    // Re-measure once the tooltip mounts and reports its real height —
    // first measure uses an 80 px default before the DOM exists.
    const id = requestAnimationFrame(measure);
    const onScrollOrResize = () => measure();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, measure]);

  // Merge our internal trigger ref with any ref the consumer's child
  // already has. Function refs + object refs both supported.
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as ReactElement & { ref?: unknown }).ref;
      if (typeof childRef === "function") {
        (childRef as (n: HTMLElement | null) => void)(node);
      } else if (childRef && typeof childRef === "object") {
        (childRef as { current: HTMLElement | null }).current = node;
      }
    },
    [children],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childProps = children.props as any;

  const enhancedChild = cloneElement(children, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: setRef as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMouseEnter: (e: any) => {
      setOpen(true);
      childProps.onMouseEnter?.(e);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMouseLeave: (e: any) => {
      setOpen(false);
      childProps.onMouseLeave?.(e);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFocus: (e: any) => {
      setOpen(true);
      childProps.onFocus?.(e);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onBlur: (e: any) => {
      setOpen(false);
      childProps.onBlur?.(e);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  return (
    <>
      {enhancedChild}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={tooltipRef}
              role="tooltip"
              className={
                "hover-tooltip hover-tooltip--" +
                coords.place +
                (verdict ? " hover-tooltip--verdict" : "") +
                (className ? " " + className : "")
              }
              style={{
                position: "fixed",
                left: coords.x,
                top: coords.y,
                transform:
                  coords.place === "top"
                    ? "translate(-50%, -100%)"
                    : "translate(-50%, 0)",
                zIndex: 10000,
                pointerEvents: "none",
                // Apply verdict-tinted background + left border via
                // inline styles — matches the GridHoverTooltip
                // pattern in `src/components/dashboard/grid/`. When
                // no verdict is supplied, the .hover-tooltip CSS in
                // global.css provides the neutral white default.
                ...(verdict
                  ? {
                      background: getCorrectnessBgColor(verdict),
                      borderLeft: `3px solid ${getCorrectnessColor(verdict)}`,
                    }
                  : {}),
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
