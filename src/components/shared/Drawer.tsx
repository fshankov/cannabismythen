import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { trapFocus } from '../../lib/dashboard/focus-trap';

export interface DrawerProps {
  /** Whether the drawer is mounted/visible. */
  open: boolean;
  /** Called when the user dismisses the drawer (X button, backdrop click, Escape). */
  onClose: () => void;
  /** Side of the desktop slide-out. Ignored on mobile (always bottom-sheet). */
  side?: 'right' | 'left';
  /** Width on desktop. */
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

  return (
    <div
      className="carm-drawer-root"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="carm-drawer-backdrop" aria-hidden="true" />
      <div
        ref={panelRef}
        className={`carm-drawer carm-drawer--${side} carm-drawer--${size}`}
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
