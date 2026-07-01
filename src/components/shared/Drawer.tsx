import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { trapFocus } from "../../lib/dashboard/focus-trap";

export interface DrawerProps {
  /** Whether the drawer is mounted/visible. */
  open: boolean;
  /** Called when the user dismisses the drawer (X button, backdrop click, Escape, or browser back). */
  onClose: () => void;
  /**
   * Layout variant.
   *  - `'side'` (default): slides in from the right/left on desktop,
   *    bottom-sheet on mobile (<1024px). Used by FilterDrawer.
   *  - `'modal'`: centered modal on desktop (max-width 720px),
   *    bottom-sheet on mobile. Used by ExportDrawer (Stage 3 of the
   *    Daten-Explorer refactor matched the OWID grapher dialog).
   *  - `'bottom-sheet'`: forced bottom-sheet at every breakpoint.
   */
  variant?: "side" | "modal" | "bottom-sheet";
  /** Side of the desktop slide-out. Ignored on mobile or when
   *  `variant !== 'side'`. */
  side?: "right" | "left";
  /** Width on desktop. Applies to `variant: 'side'`. */
  size?: "sm" | "md" | "lg";
  /** Title rendered in the header and used as the dialog's accessible label. */
  title: string;
  /** Optional secondary line below the title. */
  description?: string;
  /** If provided, focus moves to this element when the drawer opens.
   *  Otherwise the first focusable inside the drawer receives focus. */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Body content. */
  children: React.ReactNode;
  /** Sticky footer slot — typically Reset / Apply buttons. */
  footer?: React.ReactNode;
  /** Optional content rendered to the right of the title block (before
   *  the close button). Use this for a small selection-count badge or
   *  similar status indicator that should track the title rather than
   *  pushing the body content around. */
  headerEnd?: React.ReactNode;
}

export default function Drawer({
  open,
  onClose,
  variant = "side",
  side = "right",
  size = "md",
  title,
  description,
  initialFocusRef,
  children,
  footer,
  headerEnd,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  // Keep a stable ref to onClose so the popstate handler never becomes stale
  // even if the parent recreates the callback on re-renders.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus trap + Escape key (handled by trapFocus's onEscape callback).
  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;
    const cleanup = trapFocus(node, {
      onEscape: onClose,
      initialFocus: initialFocusRef?.current ?? null,
    });
    return cleanup;
  }, [open, onClose, initialFocusRef]);

  // Scroll lock + browser back-button support.
  // Mirrors FactsheetPanel: run whenever `open` changes, guard on !open so
  // setup only executes when the drawer is visible.
  useEffect(() => {
    if (!open) return;

    // Lock body scroll — overflow:hidden on <html> preserves scroll position
    // so there is no layout jump on close (same approach as FactsheetPanel).
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (scrollbarW > 0) {
      document.documentElement.style.paddingRight = `${scrollbarW}px`;
    }

    // Push a sentinel history entry so the browser back button closes the
    // drawer instead of navigating away from the page.
    window.history.pushState({ drawerOpen: true }, "");
    const handlePopState = () => onCloseRef.current();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      // If the drawer was closed by the X / Escape / backdrop (not by the
      // browser back button), the sentinel state is still in history — pop it
      // so the user doesn't need two presses of Back to leave the page.
      if (window.history.state?.drawerOpen) {
        window.history.back();
      }

      // Restore scroll.
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    };
  }, [open]); // Re-runs when open changes; guard above means setup runs only while open.

  if (!open) return null;

  // Variant flags drive the root layout (centered modal vs side
  // slide-out vs bottom-sheet). The same .carm-drawer__header / body /
  // footer markup is reused so child components don't need to know
  // which variant rendered them.
  const variantClass =
    variant === "modal"
      ? "carm-drawer-root--modal"
      : variant === "bottom-sheet"
        ? "carm-drawer-root--bottom-sheet"
        : "";
  const panelVariantClass =
    variant === "modal"
      ? "carm-drawer--modal"
      : variant === "bottom-sheet"
        ? "carm-drawer--bottom-sheet"
        : `carm-drawer--${side} carm-drawer--${size}`;

  // Stage 6 v3: clicking the dim backdrop closes the drawer (matches
  // OWID grapher + Notion modals). Previously only the X button worked
  // because the backdrop was a separate child div the click handler
  // didn't recognise. We accept clicks on either the root div OR the
  // backdrop element so users can dismiss naturally.
  const handleBackdropClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      e.target === e.currentTarget ||
      target.classList?.contains("carm-drawer-backdrop")
    ) {
      onClose();
    }
  };

  return (
    <div
      className={`carm-drawer-root ${variantClass}`}
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="carm-drawer-backdrop"
        aria-hidden="true"
        onMouseDown={handleBackdropClick}
      />
      <div
        ref={panelRef}
        className={`carm-drawer ${panelVariantClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
      >
        <header className="carm-drawer__header">
          <div className="carm-drawer__header-titles">
            <h2 className="carm-drawer__title" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="carm-drawer__description" id={descId}>
                {description}
              </p>
            )}
          </div>
          {headerEnd && (
            <div className="carm-drawer__header-end">{headerEnd}</div>
          )}
          <button
            type="button"
            className="carm-drawer__close"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        <div className="carm-drawer__body">{children}</div>
        {footer && <footer className="carm-drawer__footer">{footer}</footer>}
      </div>
    </div>
  );
}
