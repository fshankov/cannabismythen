/**
 * FactsheetGroupBars — popup viz tab strip (radar + table).
 *
 * Replaces the "Daten nach Zielgruppen" markdown table that used to
 * live in every myth's `.mdoc` with an interactive 2-tab strip:
 *
 *   ┌─────────┬──────────┐
 *   │ Radar   │ Tabelle  │   ← reuses <TabsBar>, identical chrome to
 *   └─────────┴──────────┘     the Daten-Explorer's view tabs
 *
 * History (kept here so the next reader knows why the file is named
 * "GroupBars" but no longer renders bars):
 *   - 2026-05-22  v1 — 5 horizontal bars + 5-pill indicator picker.
 *   - 2026-05-23  v2 (Stage 4A) — pills became a DataPicker dropdown.
 *   - 2026-05-23  v3 (Stage 4D) — bar+dropdown replaced by a 5×5
 *                  indicator × audience matrix table with verdict-tinted
 *                  mini-bars per cell.
 *   - 2026-05-25  v4 (this file) — matrix replaced by a 2-tab strip:
 *                  Radar (default, lines-only polygon) + Tabelle (clean
 *                  6×6 number table, no per-cell bars).
 *
 * The component name + the import path + the surrounding popup section
 * heading ("Daten nach Zielgruppen") all stay the same so the 5
 * upstream callsites (daten-explorer, fakten-karten, quiz, the two
 * meine-interessen surfaces) don't churn. The actual visualisation
 * lives in two siblings: `<FactsheetGroupRadar>` and
 * `<FactsheetGroupTable>`.
 *
 * The tab strip itself is a thin wrapper around the shared
 * `<TabsBar>` primitive (the same one the Daten-Explorer's
 * `<ViewTabs>` uses internally). Future styling tweaks to `.tabs-bar` /
 * `.tab-btn` in `src/styles/dashboard.css` propagate to both surfaces.
 */

import { useState } from 'react';
import type {
  CorrectnessClass,
  MythGroupMetrics,
} from '../../lib/dashboard/types';
import TabsBar, { type TabDef } from './TabsBar';
import FactsheetGroupRadar from './FactsheetGroupRadar';
import FactsheetGroupTable from './FactsheetGroupTable';

interface Props {
  /** Pre-computed metrics for the open myth — one entry per Zielgruppe.
   *  Built at build-time from carm-data.json and passed through as a
   *  JSON prop on every popup surface. */
  metrics: MythGroupMetrics;

  /** Verdict for the open myth. Reserved for future radar tinting;
   *  the current radar uses audience-coded line colours instead. */
  verdict: CorrectnessClass;
}

type ViewKey = 'radar' | 'table';

const TABS: TabDef<ViewKey>[] = [
  { key: 'radar', label: 'Radar' },
  { key: 'table', label: 'Tabelle' },
];

export default function FactsheetGroupBars({ metrics, verdict }: Props) {
  const [view, setView] = useState<ViewKey>('radar');

  return (
    <section
      className="factsheet-group-bars"
      aria-labelledby="factsheet-group-bars-heading"
    >
      <h3
        id="factsheet-group-bars-heading"
        className="factsheet-panel__section-heading"
      >
        Daten nach Zielgruppen
      </h3>

      <div className="factsheet-group-bars__tabs">
        <TabsBar<ViewKey>
          tabs={TABS}
          activeKey={view}
          onChange={setView}
          ariaLabel="Visualisierung wählen"
        />
      </div>

      <div className="factsheet-group-bars__viz" role="tabpanel">
        {view === 'radar' ? (
          <FactsheetGroupRadar metrics={metrics} verdict={verdict} />
        ) : (
          <FactsheetGroupTable metrics={metrics} />
        )}
      </div>
    </section>
  );
}
