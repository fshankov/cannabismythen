/**
 * useHiddenColumns — controlled per-view column visibility hook.
 *
 * Reads / writes a Set<string> of hidden column IDs to localStorage so
 * the user's hide choices survive page reloads on the same device. Not
 * synced to the URL on purpose: shared deep-links should show the
 * canonical (all-visible) chart so recipients aren't confused by a
 * half-empty view they didn't customise.
 *
 * Usage:
 *   const { hidden, hide, show, reset, isHidden, hiddenCount } =
 *     useHiddenColumns('carm.strips.hidden.indicator', allIds);
 *
 * Storage key namespacing convention (current callers):
 *   - 'carm.strips.hidden.indicator' / 'carm.strips.hidden.group'
 *   - 'carm.sources.hidden.metric' / 'carm.sources.hidden.group'
 *   - 'carm.table.hidden'
 *
 * The hook automatically prunes IDs from the saved set that are no
 * longer in `allIds` (e.g. after a pivot-mode change), so an older
 * hidden ID can't strand a column off-screen.
 *
 * Constraint: at least one column must remain visible. The `hide`
 * action is a no-op if it would leave the visible set empty.
 */

import { useCallback, useEffect, useState } from 'react';

interface UseHiddenColumnsResult {
  /** Set of hidden column IDs, intersected with `allIds`. */
  hidden: Set<string>;
  /** Number of hidden columns (convenience for badge / reset link). */
  hiddenCount: number;
  /** Hide a column. No-op if it would leave 0 visible. */
  hide: (id: string) => void;
  /** Reveal a hidden column. */
  show: (id: string) => void;
  /** Show every column. */
  reset: () => void;
  /** Lookup helper. */
  isHidden: (id: string) => boolean;
  /** Visible IDs in the same order as the input. */
  visible: string[];
}

function readStorage(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeStorage(key: string, set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* quota or privacy mode — silent fail */
  }
}

export function useHiddenColumns(
  storageKey: string,
  allIds: string[],
): UseHiddenColumnsResult {
  const [raw, setRaw] = useState<Set<string>>(() => readStorage(storageKey));

  // Re-read when the storage key changes (e.g. pivot mode switched). The
  // saved set for the new key may be different from the old one.
  useEffect(() => {
    setRaw(readStorage(storageKey));
  }, [storageKey]);

  // Prune any IDs that aren't in `allIds` anymore.
  const hidden = new Set([...raw].filter((id) => allIds.includes(id)));

  const persist = useCallback(
    (next: Set<string>) => {
      setRaw(next);
      writeStorage(storageKey, next);
    },
    [storageKey],
  );

  const hide = useCallback(
    (id: string) => {
      if (!allIds.includes(id)) return;
      const next = new Set(hidden);
      next.add(id);
      // Keep at least one column visible.
      if (next.size >= allIds.length) return;
      persist(next);
    },
    [allIds, hidden, persist],
  );

  const show = useCallback(
    (id: string) => {
      const next = new Set(hidden);
      next.delete(id);
      persist(next);
    },
    [hidden, persist],
  );

  const reset = useCallback(() => {
    persist(new Set());
  }, [persist]);

  const isHidden = useCallback((id: string) => hidden.has(id), [hidden]);

  const visible = allIds.filter((id) => !hidden.has(id));

  return {
    hidden,
    hiddenCount: hidden.size,
    hide,
    show,
    reset,
    isHidden,
    visible,
  };
}
