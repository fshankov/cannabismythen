/**
 * usePointerSwipe — pointer-driven horizontal swipe on a single element.
 *
 * Tracks horizontal drag distance and writes `--swipe-x` and `--swipe-rot`
 * CSS custom properties on the target so consumers can compose the swipe
 * transform with their own (e.g. an idle tilt). Past `threshold` the hook
 * animates the element off-screen and calls `onCommit`; otherwise it springs
 * back to 0.
 *
 * The hook is no-op when `enabled` is false (no listeners attached) so callers
 * can gate it on coarse-pointer / non-reduced-motion detection.
 */

import { useEffect, useRef } from "react";

export interface UsePointerSwipeOptions {
  /** When false, no listeners are attached. */
  enabled: boolean;
  /** Pixels of horizontal travel required to commit. Default: min(140, 35vw). */
  threshold?: number;
  /** Called once the swipe past threshold finishes its off-screen animation. */
  onCommit: () => void;
}

export function usePointerSwipe(
  ref: React.RefObject<HTMLElement | null>,
  { enabled, threshold, onCommit }: UsePointerSwipeOptions,
): void {
  // Latest onCommit captured in a ref so we don't re-attach listeners every render.
  const onCommitRef = useRef(onCommit);
  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const SLOP = 8; // pixels of movement before the gesture engages
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let captured = false;
    let abandoned = false; // vertical scroll detected → ignore

    const computedThreshold =
      threshold ??
      Math.min(140, Math.round(window.innerWidth * 0.35));

    const setVars = (x: number) => {
      el.style.setProperty("--swipe-x", `${x}px`);
      el.style.setProperty("--swipe-rot", `${x / 20}deg`);
    };

    const reset = (animate: boolean) => {
      el.style.transition = animate
        ? "transform var(--dur-slide) var(--ease-card)"
        : "";
      setVars(0);
      if (animate) {
        const cleanup = () => {
          el.style.transition = "";
          el.removeEventListener("transitionend", cleanup);
        };
        el.addEventListener("transitionend", cleanup);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      captured = false;
      abandoned = false;
      el.style.transition = "";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId || abandoned) return;
      const newDx = e.clientX - startX;
      const newDy = e.clientY - startY;

      if (!captured) {
        // Decide direction once movement clears the slop.
        if (Math.abs(newDy) > Math.abs(newDx) && Math.abs(newDy) > SLOP) {
          // Vertical scroll wins — never engage swipe for this gesture.
          abandoned = true;
          return;
        }
        if (Math.abs(newDx) <= SLOP) return;
        captured = true;
        try {
          el.setPointerCapture(pointerId);
        } catch {
          // Element no longer in DOM — bail out.
          abandoned = true;
          return;
        }
      }

      dx = newDx;
      setVars(dx);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const finalDx = dx;
      const wasCaptured = captured;
      pointerId = null;
      captured = false;

      if (wasCaptured) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }

      if (wasCaptured && Math.abs(finalDx) >= computedThreshold) {
        const direction = finalDx < 0 ? -1 : 1;
        const offscreen = direction * window.innerWidth * 1.1;
        el.style.transition = "transform var(--dur-slide) var(--ease-card)";
        setVars(offscreen);
        const commit = () => {
          el.removeEventListener("transitionend", commit);
          onCommitRef.current();
        };
        el.addEventListener("transitionend", commit);
      } else if (wasCaptured) {
        reset(true);
      }
    };

    const onPointerCancel = () => {
      pointerId = null;
      if (captured) reset(true);
      captured = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      reset(false);
    };
  }, [enabled, ref, threshold]);
}

/** True when the device exposes a coarse, hover-less primary pointer. */
export function useIsCoarsePointer(): boolean {
  const ref = useRef(false);
  if (typeof window !== "undefined" && !ref.current) {
    ref.current = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  }
  return ref.current;
}

/** True when the user has requested reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const ref = useRef(false);
  if (typeof window !== "undefined" && !ref.current) {
    ref.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return ref.current;
}
