/**
 * Per-tab Rundgang (tutorial) script registry.
 *
 * The Daten-Explorer's onboarding flow runs a single 4-step Driver.js tour
 * anchored to the Streifen view's DOM. The plan is to give each tab its own
 * tour with copy tailored to that view. Until ISD-approved scripts land,
 * every entry stays `null` and `<DashboardOnboarding>` falls back to its
 * built-in tour — i.e. the visible behaviour is unchanged.
 *
 * Schema deliberately matches Driver.js's step shape (`element` selector +
 * `popover.title` + `popover.description`) so swapping a registry entry in
 * is a copy-only change.
 */

import type { ViewTab } from './types';

export interface TourStep {
  /** CSS selector pointing at the DOM node the popover anchors to. */
  element: string;
  popover: {
    title: string;
    /** HTML allowed; rendered into Driver.js's popover via `description`. */
    description: string;
  };
}

export interface RundgangScript {
  steps: TourStep[];
}

/**
 * `null` = no per-tab script available; `<DashboardOnboarding>` falls back
 * to its hardcoded Streifen tour. Retired views are listed for
 * exhaustiveness against the `ViewTab` union but never reached at runtime.
 */
export const RUNDGANG_SCRIPTS: Record<ViewTab, RundgangScript | null> = {
  balken: null,
  spannweite: null,
  table: null,
  sources: null,
  sources2: null,
  sources_table: null,
  strips: null,
  bar: null,
  scatter: null,
  lollipop: null,
  overview: null,
  circular: null,
  ladder: null,
};
