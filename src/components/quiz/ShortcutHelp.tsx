/**
 * ShortcutHelp — small popover that lists the keyboard shortcuts.
 *
 * Triggered by `?` and dismissed by Esc / backdrop click. Mounted via
 * portal so it floats above the QuizPlayer without inheriting its
 * stacking context.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { t } from "./i18n";

interface ShortcutHelpProps {
  onClose: () => void;
}

const ROWS = [
  "ui.shortcuts.row.answer",
  "ui.shortcuts.row.next",
  "ui.shortcuts.row.prev",
  "ui.shortcuts.row.advance",
  "ui.shortcuts.row.factsheet",
  "ui.shortcuts.row.help",
  "ui.shortcuts.row.close",
] as const;

export default function ShortcutHelp({ onClose }: ShortcutHelpProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) panelRef.current.focus();
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="shortcut-help"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-help-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="shortcut-help__panel"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="shortcut-help__header">
          <h3
            id="shortcut-help-title"
            className="shortcut-help__title"
          >
            {t("ui.shortcuts.title")}
          </h3>
          <button
            type="button"
            className="shortcut-help__close"
            onClick={onClose}
            aria-label={t("ui.close")}
          >
            ×
          </button>
        </div>
        <ul className="shortcut-help__list">
          {ROWS.map((k) => (
            <li key={k} className="shortcut-help__row">
              {t(k)}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
