import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function MehrPopover({
  open,
  onClose,
  title,
  subtitle,
  children,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => closeBtnRef.current?.focus());

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="mehr-popover__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="mehr-popover"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mehr-popover-title"
      >
        <header className="mehr-popover__header">
          <div className="mehr-popover__titles">
            <h2 id="mehr-popover-title" className="mehr-popover__title">
              {title}
            </h2>
            {subtitle && <p className="mehr-popover__subtitle">{subtitle}</p>}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="mehr-popover__close"
            aria-label="Schließen"
            onClick={onClose}
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </header>
        <div className="mehr-popover__body">{children}</div>
      </div>
    </div>
  );
}
