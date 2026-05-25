/**
 * TabsBar — generic, prop-driven tab strip primitive.
 *
 * Extracted from the Daten-Explorer's `<ViewTabs>` so the popup viz-tabs
 * (radar vs. table) reuse the *exact same* DOM + CSS chrome the dashboard
 * uses. A single styling change to `.tabs-bar` / `.tab-btn` in
 * `src/styles/dashboard.css` now ripples through both surfaces.
 *
 * Pure & prop-driven — no internal state, no translation coupling, no
 * URL/router awareness. Callers pass already-localised labels and own
 * the active key.
 *
 * Slot in extras after the tab buttons via `endSlot` (e.g. dashboard's
 * Rundgang chip). Insert a visual divider before any tab by setting
 * `dividerBeforeKey` so the dashboard's "after-divider" gap between the
 * myth tabs and the source tabs is preserved.
 */

import type { ReactNode } from 'react';

export interface TabDef<K extends string> {
  /** Stable identifier for the tab. Passed back to `onChange`. */
  key: K;
  /** Already-localised text shown inside the tab button. */
  label: string;
}

interface Props<K extends string> {
  /** Ordered list of tabs to render. */
  tabs: TabDef<K>[];

  /** Key of the currently active tab. Sets the `.active` class +
   *  `aria-selected="true"` on the matching button. */
  activeKey: K;

  /** Click handler. Receives the clicked tab's key. */
  onChange: (key: K) => void;

  /** aria-label for the wrapping `<nav role="tablist">`. Defaults to a
   *  generic German label suitable for most surfaces. */
  ariaLabel?: string;

  /** Optional key whose button should be preceded by a visual divider
   *  (24 px left margin). The Daten-Explorer uses this between the myth
   *  views and the source views; the popup tabs don't need it. */
  dividerBeforeKey?: K;

  /** Optional right-aligned content (e.g. the dashboard's Rundgang
   *  chip). Rendered inside the same `<nav>` after the buttons so it
   *  inherits sticky-row behaviour. */
  endSlot?: ReactNode;
}

export default function TabsBar<K extends string>({
  tabs,
  activeKey,
  onChange,
  ariaLabel = 'Ansicht wählen',
  dividerBeforeKey,
  endSlot,
}: Props<K>) {
  return (
    <nav className="tabs-bar" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const hasDivider = dividerBeforeKey === tab.key;
        const classes = [
          'tab-btn',
          isActive ? 'active' : '',
          hasDivider ? 'tab-btn--after-divider' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={tab.key}
            type="button"
            className={classes}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
      {endSlot}
    </nav>
  );
}
