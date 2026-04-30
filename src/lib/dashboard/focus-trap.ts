/** Minimal focus-trap utility for modals/drawers. No external deps. */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Activate a focus trap on `container`. Returns a cleanup function that
 *  removes the trap and restores focus to the previously-active element.
 *
 *  - Tab / Shift+Tab cycle within container
 *  - Escape calls `onEscape`
 *  - Body scroll is locked while trap is active
 *  - Initial focus is moved to `initialFocus` (or first focusable)
 */
export function trapFocus(
  container: HTMLElement,
  opts: { onEscape: () => void; initialFocus?: HTMLElement | null } = { onEscape: () => {} },
): () => void {
  const previouslyFocused =
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

  const previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const getFocusables = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
    );
  };

  const initial = opts.initialFocus ?? getFocusables()[0] ?? container;
  initial.focus({ preventScroll: true });

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      opts.onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = getFocusables();
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
  };

  container.addEventListener('keydown', handleKey);

  return () => {
    container.removeEventListener('keydown', handleKey);
    document.body.style.overflow = previousBodyOverflow;
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus({ preventScroll: true });
    }
  };
}
