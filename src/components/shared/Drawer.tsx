import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { trapFocus } from '../../lib/dashboard/focus-trap';

export interface DrawerProps {
  /** Whether the drawer is mounted/visible. */
  open: boolean;
  /** Called when the user dismisses the drawer (X button, backdrop click, Escape). */
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
  variant?: 'side' | 'modal' | 'bottom-sheet';
  /** Side of the desktop slide-out. Ignored on mobile or when
   *  `variant !== 'side'`. */
  side?: 'right' | 'left';
  /** Width on desktop. Applies to `variant: 'side'`. */
  size?: 'sm' | 'md' | 'lg';
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
}

export default function Drawer({
  open,
  onClose,
  variant = 'side',
  side = 'right',
  size = 'md',
  title,
  description,
  initialFocusRef,
  children,
  footer,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

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

  if (!open) return null;

  // Variant flags drive the root layout (centered modal vs side
  // slide-out vs bottom-sheet). The same .carm-drawer__header / body /
  // footer markup is reused so child components don't need to know
  // which variant rendered them.
  const variantClass =
    variant === 'modal'
      ? 'carm-drawer-root--modal'
      : variant === 'bottom-sheet'
        ? 'carm-drawer-root--bottom-sheet'
        : '';
  const panelVariantClass =
    variant === 'modal'
      ? 'carm-drawer--modal'
      : variant === 'bottom-sheet'
        ? 'carm-drawer--bottom-sheet'
        : `carm-drawer--${side} carm-drawer--${size}`;

  return (
    <div
      className={`carm-drawer-root ${variantClass}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="carm-drawer-backdrop" aria-hidden="true" />
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
          <div>
            <h2 className="carm-drawer__title" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="carm-drawer__description" id={descId}>
                {description}
              </p>
            )}
          </div>
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
