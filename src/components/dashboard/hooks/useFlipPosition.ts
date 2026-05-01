/**
 * useFlipPosition — viewport-aware popover positioning.
 *
 * Extracted from `InfoTooltip.tsx` so multiple popover variants
 * (definition tooltips, verdict-explanation tooltips, future hover
 * cards) can share one positioning algorithm. The result is
 * `position: fixed`-friendly so the popover escapes any parent
 * stacking context (e.g. an absolutely-positioned wrapper).
 *
 * Behaviour:
 *   - Prefers above the trigger.
 *   - Flips below when there isn't enough vertical room above.
 *   - Clamps horizontally so the card never bleeds past the viewport.
 *   - Re-measures on scroll, resize, and right after mount (so the
 *     real card height — not the 160 px fallback — drives the flip
 *     decision).
 *
 * Returns:
 *   - `triggerRef`: attach to the trigger element.
 *   - `cardRef`: attach to the card; height is read from this ref.
 *   - `pos`: viewport-relative {top,left,width,below} or null.
 *   - `setOpen`: toggles the popover (also kicks off a re-measure on open).
 *   - `open`: current open state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FlipPosition {
  top: number;
  left: number;
  width: number;
  below: boolean;
}

interface Options {
  /** Maximum card width in px before viewport-edge clamping. */
  maxWidth?: number;
  /** Vertical gap between trigger and card. */
  gap?: number;
  /** Min/max horizontal padding from the viewport edge. */
  edgePadding?: number;
}

export function useFlipPosition<
  TriggerEl extends HTMLElement = HTMLButtonElement,
  CardEl extends HTMLElement = HTMLDivElement,
>(opts: Options = {}) {
  const { maxWidth = 280, gap = 6, edgePadding = 8 } = opts;
  const triggerRef = useRef<TriggerEl>(null);
  const cardRef = useRef<CardEl>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<FlipPosition | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(maxWidth, vw - 2 * edgePadding);
    const measuredH = cardRef.current?.offsetHeight || 160;
    const aboveSpace = r.top - edgePadding;
    const belowSpace = vh - r.bottom - edgePadding;
    const below = aboveSpace < measuredH + (gap + 6) && belowSpace > aboveSpace;
    const top = below ? r.bottom + gap : r.top - gap - measuredH;
    let left = r.left + r.width / 2 - width / 2;
    if (left < edgePadding) left = edgePadding;
    if (left + width > vw - edgePadding) left = vw - edgePadding - width;
    setPos({ top, left, width, below });
  }, [maxWidth, gap, edgePadding]);

  // Re-measure immediately after mount so the real card height drives
  // the above/below flip decision.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [open, updatePosition]);

  // Reposition on scroll/resize while open — the trigger may have moved.
  useEffect(() => {
    if (!open) return;
    const onChange = () => updatePosition();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [open, updatePosition]);

  return {
    triggerRef,
    cardRef,
    pos,
    open,
    setOpen,
    updatePosition,
  };
}
