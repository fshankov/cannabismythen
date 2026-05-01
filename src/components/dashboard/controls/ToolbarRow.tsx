/**
 * ToolbarRow — layout primitive that arranges the dashboard chrome
 * above each tab's chart.
 *
 * Slots (left → right):
 *   1. `pivot`    — optional `<PivotToggle>`. Streifen + Sources use it.
 *                   Balken + Tabelle leave it null.
 *   2. `pickers`  — zero-or-more `<DataPicker>` instances.
 *   3. `actions`  — right-aligned action chips (Filter, Exportieren).
 *
 * Visual modes:
 *   - Compact (≤640px): stack vertically, full-width pickers, action
 *     chips wrap below.
 *   - Inline (>640px): one row, pickers flush left, actions flush
 *     right via `margin-left: auto`.
 *
 * The Rundgang chip stays in the tabs row (Stage 1 of the
 * Daten-Explorer refactor) — do NOT move it back into ToolbarRow.
 */

import type { ReactNode } from 'react';

interface ToolbarRowProps {
  pivot?: ReactNode;
  pickers?: ReactNode[];
  actions?: ReactNode;
  /** Optional className hook, used by per-tab style overrides. */
  className?: string;
  'aria-label'?: string;
}

export default function ToolbarRow({
  pivot,
  pickers,
  actions,
  className,
  'aria-label': ariaLabel = 'Dashboard-Steuerung',
}: ToolbarRowProps) {
  const hasPickers = pickers && pickers.length > 0;
  return (
    <div
      className={`carm-toolbar-row${className ? ` ${className}` : ''}`}
      role="toolbar"
      aria-label={ariaLabel}
    >
      {pivot && <div className="carm-toolbar-row__pivot">{pivot}</div>}
      {hasPickers && (
        <div className="carm-toolbar-row__pickers">
          {pickers!.map((p, i) => (
            <div key={i} className="carm-toolbar-row__picker">
              {p}
            </div>
          ))}
        </div>
      )}
      {actions && <div className="carm-toolbar-row__actions">{actions}</div>}
    </div>
  );
}
