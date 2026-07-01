import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupId } from "../types";

/**
 * useAutoCycleGroup — auto-rotate the active Bevölkerungsgruppe
 * (population group) on a fixed interval. Used by VizSampleAndRanked
 * (steps 6+7) and VizSourcesStrips (steps 8+9) so first-time readers
 * see how the data shifts across the 5 audiences without having to
 * discover the tab picker.
 *
 * UX rules (CAR-?? 2026-05-30, revised after first round wasn't
 * visually obvious):
 *   - On mount, the cycle starts after a brief `firstTickDelayMs`
 *     pause so the user sees the initial group ("Volljährige") before
 *     the picker starts rotating. Then it advances every
 *     `intervalMs`.
 *   - Hover over the viz PAUSES the cycle (temporary). Leaving
 *     resumes from a fresh interval.
 *   - A manual click on a tab STOPS the cycle permanently for the
 *     lifetime of the component — the user has made their choice.
 *   - When `enabled` flips false (e.g. step 5 sample mode) the cycle
 *     pauses. Re-enabling resumes from a fresh interval.
 *
 * The `intervalMs` is exposed back to the caller so the picker can
 * render a visible CSS-animated progress bar with the matching
 * duration. The progress bar is keyed by `activeGroup`, so it
 * restarts on every auto-tick AND on every manual selection.
 *
 * Implementation notes:
 *   - The interval ID is held in a ref (not a state) so React 18
 *     StrictMode's double-effect doesn't leave a stale interval
 *     running. The cleanup path always clears via the same ref.
 *   - `groupsRef` keeps the latest list visible inside the interval
 *     closure so the cycle can never reference a stale array.
 */
export interface UseAutoCycleGroupResult {
  activeGroup: GroupId;
  /** Manual setter — pauses auto-cycling permanently for this mount. */
  selectGroup: (g: GroupId) => void;
  /** Spread onto the viz container to pause on hover. */
  hoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  /** True when the timer is actively counting. Drives the progress
   *  bar's `animation-play-state` and visibility. */
  isAutoCycling: boolean;
  /** Resolved interval in ms — exported so the picker can render a
   *  progress bar whose animation duration matches the cycle. */
  intervalMs: number;
}

export function useAutoCycleGroup(
  groups: ReadonlyArray<GroupId>,
  options: {
    intervalMs?: number;
    enabled?: boolean;
    /** Delay before the FIRST auto-cycle fires after mount or
     *  re-enable. Default `intervalMs` so the user sees the starting
     *  group for the full interval before it changes. */
    firstTickDelayMs?: number;
  } = {},
): UseAutoCycleGroupResult {
  const {
    intervalMs = 4000,
    enabled = true,
    firstTickDelayMs = intervalMs,
  } = options;

  const [activeGroup, setActiveGroupState] = useState<GroupId>(
    groups[0] ?? "adults",
  );
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Refs keep the latest values reachable from inside the interval
  // closure even after the hook re-renders. Avoids the classic stale-
  // closure bug where setInterval captures the first render's state.
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const timerRef = useRef<number | null>(null);
  const firstTickRef = useRef<number | null>(null);

  const selectGroup = useCallback((g: GroupId) => {
    setActiveGroupState(g);
    setManuallyPaused(true);
  }, []);

  const onMouseEnter = useCallback(() => setHovering(true), []);
  const onMouseLeave = useCallback(() => setHovering(false), []);

  const isAutoCycling = enabled && !manuallyPaused && !hovering;

  useEffect(() => {
    if (!isAutoCycling) return;

    const advance = () => {
      setActiveGroupState((current) => {
        const list = groupsRef.current;
        if (list.length === 0) return current;
        const idx = list.indexOf(current);
        return list[(idx + 1) % list.length] ?? current;
      });
    };

    // First tick after `firstTickDelayMs` (default = intervalMs), then
    // every `intervalMs` thereafter. Using setTimeout for the first
    // tick + setInterval for the steady state keeps the cadence
    // predictable when the hook resumes from a hover-pause.
    firstTickRef.current = window.setTimeout(() => {
      advance();
      timerRef.current = window.setInterval(advance, intervalMs);
    }, firstTickDelayMs);

    return () => {
      if (firstTickRef.current !== null) {
        window.clearTimeout(firstTickRef.current);
        firstTickRef.current = null;
      }
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAutoCycling, intervalMs, firstTickDelayMs]);

  return {
    activeGroup,
    selectGroup,
    hoverHandlers: { onMouseEnter, onMouseLeave },
    isAutoCycling,
    intervalMs,
  };
}
