/**
 * FactsheetGroupBars — popup data table (transposed, sortable, heatmap).
 *
 * Rows are population groups, columns are indicators. Cells use a
 * 7-band blue→red heatmap drawn from the Lesebeispiel band
 * classification so the same colour and the same hover sentence agree.
 *
 *   ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
 *   │          │ [icon]   │ [icon]   │ [icon]   │ [icon]   │ [icon]   │
 *   │          │ Kennt.   │ Bedeut.  │ Richtig. │ Prävent. │ Bev. Rel.│
 *   ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
 *   │ [i] Erw. │   18     │   53     │   49     │   41     │   6      │
 *   │ [i] Min. │   21     │   …      │          │          │          │
 *   │ [i] Kons.│   33     │   …      │          │          │ k. A.    │
 *   │ [i] J.E. │   21     │   …      │          │          │ k. A.    │
 *   │ [i] Elt. │   21     │   …      │          │          │ k. A.    │
 *   └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
 *
 * History:
 *   - v1 (2026-05-22) — 5 horizontal bars + 5-pill indicator picker.
 *   - v2 (2026-05-23) — pills became a DataPicker dropdown.
 *   - v3 (2026-05-23) — bar+dropdown replaced by 5×5 matrix table.
 *   - v4 (2026-05-25) — matrix wrapped in 2 tabs (radar + clean table).
 *   - v5 (2026-05-25) — radar dropped, transposed sortable table with
 *     band heatmap + title= tooltips.
 *   - v6 (this file, 2026-05-25 PM) — column header stacks icon over
 *     ABBREVIATED label (Kennt., Bedeut., Richtig., Prävent., Bev. Rel.)
 *     so the table fits the wider 540 px popup without horizontal
 *     scroll; full labels move into the tooltip body. Row + column
 *     headers share `--color-text` (one table-header treatment).
 *     Tooltips upgraded from native title= (which silently failed on
 *     the button-wrapped col headers and felt unresponsive with the
 *     ~700 ms browser delay) to the new shared `<HoverTooltip>` portal
 *     primitive — instant hover, rich JSX, escapes the popup's
 *     overflow: auto. Cell tooltip body uses the team-approved
 *     `<Lesebeispiel>` React component directly so the value
 *     highlights render as `<strong>` JSX.
 *
 * Reuses:
 *   - bandIndex() from src/lib/dashboard/lesebeispiel-bands.ts (cell
 *     background tint).
 *   - `<Lesebeispiel>` (../dashboard/Lesebeispiel) for the cell hover
 *     sentence.
 *   - `<HoverTooltip>` (./HoverTooltip) for the portal/measurement
 *     wiring.
 *   - AUDIENCE_ICONS_BY_GROUP / INDICATOR_ICONS (header glyphs).
 *   - t('indicator.<key>.description', 'de') for column-header tooltips.
 */

import { useMemo, useState } from 'react';
import { ArrowDown01, ArrowDown10 } from 'lucide-react';
import type {
  CorrectnessClass,
  GroupId,
  Indicator,
  MythGroupMetrics,
} from '../../lib/dashboard/types';
import { POP_REL_INVALID_GROUPS } from '../../lib/dashboard/data';
import { t } from '../../lib/dashboard/translations';
import {
  AUDIENCE_ICONS_BY_GROUP,
  INDICATOR_ICONS,
} from '../../lib/icons/lookups';
import {
  bandIndex,
  anteilLabel,
  niveauLabel,
} from '../../lib/dashboard/lesebeispiel-bands';
import Lesebeispiel from '../dashboard/Lesebeispiel';
import HoverTooltip from './HoverTooltip';

interface Props {
  /** Pre-computed metrics for the open myth — one entry per Zielgruppe. */
  metrics: MythGroupMetrics;

  /** Verdict for the open myth. Passed through to the cell tooltips
   *  so the Spannweite-style hover card carries the myth's verdict
   *  accent (left border + tinted background) — same pattern
   *  GridHoverTooltip uses on the Spannweite view. Header tooltips
   *  (column / row) intentionally skip the verdict accent because
   *  they describe the indicator / group, not the open myth. */
  verdict?: CorrectnessClass;
}

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

/** Column-header text — abbreviated so 5 columns fit a 540 px popup
 *  without horizontal scroll. Full names live in the hover tooltip. */
const INDICATOR_LABELS_SHORT: Record<Indicator, string> = {
  awareness: 'Kennt.',
  significance: 'Bedeut.',
  correctness: 'Richtig.',
  prevention_significance: 'Prävent.',
  population_relevance: 'Bev. Rel.',
};

/** Full indicator names — rendered inside the hover tooltip body. */
const INDICATOR_LABELS_FULL: Record<Indicator, string> = {
  awareness: 'Kenntnis',
  significance: 'Bedeutung',
  correctness: 'Richtigkeit',
  prevention_significance: 'Prävention',
  population_relevance: 'Bevölkerungsrelevanz',
};

/** Whether an indicator is the Kenntnis %-share band ("…Anteil") or a
 *  point-score band ("…Niveau"). Mirrors the convention locked at the
 *  top of lesebeispiel-bands.ts. */
function indicatorUsesAnteil(indicator: Indicator): boolean {
  return indicator === 'awareness';
}

const GROUP_ORDER: GroupId[] = [
  'adults',
  'minors',
  'consumers',
  'young_adults',
  'parents',
];

const GROUP_FULL_LABELS: Record<GroupId, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

/** Visible label per Zielgruppe in the row header. Full natural
 *  German names (Fedor 2026-06-09) — no abbreviation periods. The
 *  parenthetical age ranges (e.g. "(18–70)") still live only in the
 *  hover tooltip via GROUP_FULL_LABELS. The popup widens to 620 px
 *  on desktop to accommodate "Junge Erwachsene" (the longest label)
 *  without horizontal scroll. */
const GROUP_SHORT_LABELS: Record<GroupId, string> = {
  adults: 'Erwachsene',
  minors: 'Minderjährige',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene',
  parents: 'Eltern',
};

/** Short definition surfaced in the row-header tooltip body. Mirrors the
 *  Daten-Explorer group definitions (src/content/dashboard-definitionen.json)
 *  so the factsheet popup and the dashboard read identically — BugHerd 4.3
 *  (2026-06-03, ISD): the prior wording diverged (Konsumierende said "im
 *  letzten Jahr" vs. the correct "letzten 30 Tagen"). The full group label is
 *  the tooltip title (GROUP_FULL_LABELS), so the body carries n + definition. */
const GROUP_DESCRIPTIONS: Record<GroupId, string> = {
  adults:
    'n = 2.097 — Stichprobe der Bevölkerung (18–70 J.), gewichtet nach Geschlecht, Alter, Bildung und Migrationshintergrund.',
  minors:
    'n = 555 — Stichprobe der 16–17-Jährigen aus dem Horizoom-Jugendpanel.',
  consumers:
    'n = 358 — Personen mit Cannabis-Konsum in den letzten 30 Tagen (30-Tage-Prävalenz).',
  young_adults:
    'n = 333 — Teilgruppe der Volljährigen im Alter von 18–26 Jahren.',
  parents:
    'n = 539 — Volljährige mit mindestens einem Kind unter 18 Jahren.',
};

type SortDir = 'desc' | 'asc';
interface SortState {
  column: Indicator | null; // null = canonical group order
  dir: SortDir;
}

export default function FactsheetGroupBars({ metrics, verdict }: Props) {
  const [sort, setSort] = useState<SortState>({ column: null, dir: 'desc' });

  // Quick lookup so we can render rows in any order without
  // re-scanning the metrics array per cell.
  const byGroup = useMemo(() => {
    const m = new Map<GroupId, MythGroupMetrics[number]>();
    for (const entry of metrics) m.set(entry.group_id, entry);
    return m;
  }, [metrics]);

  // Effective row order: canonical when sort.column === null, else
  // sorted by the active column's value (nulls last).
  const sortedGroups = useMemo<GroupId[]>(() => {
    if (sort.column === null) return GROUP_ORDER;
    const col = sort.column;
    const dir = sort.dir;
    const withValue = GROUP_ORDER.map((g) => {
      const entry = byGroup.get(g);
      const raw = entry ? (entry[col] as number | null) : null;
      const value =
        col === 'population_relevance' && POP_REL_INVALID_GROUPS.has(g)
          ? null
          : raw;
      return { g, value };
    });
    withValue.sort((a, b) => {
      // Nulls always last, regardless of direction.
      if (a.value === null && b.value === null) return 0;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return dir === 'desc' ? b.value - a.value : a.value - b.value;
    });
    return withValue.map((x) => x.g);
  }, [byGroup, sort]);

  // Click handler for indicator column headers: cycle desc → asc → off.
  // Click cycle (Fedor 2026-05-26): match the dashboard Tabelle —
  // ASC ↔ DESC toggle indefinitely. The corner ↺ button is the only
  // way back to canonical order.
  const handleSortClick = (col: Indicator) => {
    setSort((prev) => {
      if (prev.column !== col) return { column: col, dir: 'asc' };
      return { column: col, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  // Click handler for the corner / row-header column: reset to
  // canonical group order.
  const handleResetSort = () => {
    setSort({ column: null, dir: 'desc' });
  };

  return (
    <section
      className="factsheet-group-bars"
      aria-label="Daten nach Zielgruppen"
    >
      <div className="factsheet-group-bars__wrap">
        <table className="factsheet-group-bars__table" role="table">
          <thead>
            <tr>
              {/* Top-left corner — clickable ↺ resets sort. */}
              <th
                scope="col"
                className={
                  'factsheet-group-bars__corner' +
                  (sort.column === null
                    ? ' factsheet-group-bars__corner--active'
                    : '')
                }
              >
                <button
                  type="button"
                  className="factsheet-group-bars__corner-btn"
                  onClick={handleResetSort}
                  aria-label="Sortierung zurücksetzen"
                  title="Zur Standard-Reihenfolge zurückkehren"
                >
                  ↺
                </button>
              </th>
              {INDICATORS.map((indicator) => {
                const Icon = INDICATOR_ICONS[indicator];
                const isActive = sort.column === indicator;
                const dir = sort.dir;
                const tooltipContent = (
                  <div className="hover-tooltip__inner">
                    <div className="hover-tooltip__title">
                      {INDICATOR_LABELS_FULL[indicator]}
                    </div>
                    <p className="hover-tooltip__body">
                      {t(`indicator.${indicator}.description`, 'de')}
                    </p>
                    <div className="hover-tooltip__hint">
                      Klicken zum Sortieren
                    </div>
                  </div>
                );
                const isDesc = isActive && dir === 'desc';
                const sortTooltip = !isActive
                  ? `Nach ${INDICATOR_LABELS_FULL[indicator]} sortieren`
                  : isDesc
                  ? `${INDICATOR_LABELS_FULL[indicator]}: absteigend`
                  : `${INDICATOR_LABELS_FULL[indicator]}: aufsteigend`;
                return (
                  <HoverTooltip key={indicator} content={tooltipContent}>
                    <th
                      scope="col"
                      className={
                        'factsheet-group-bars__col-header' +
                        (isActive
                          ? ' factsheet-group-bars__col-header--active'
                          : '')
                      }
                      aria-sort={
                        isActive
                          ? dir === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                    >
                      {/* Tabelle-style sort button (Fedor 2026-05-26)
                          — small ArrowDown01/10 glyph absolutely
                          positioned at the top-left of the cell.
                          Always rendered; CSS controls its visibility
                          (hidden by default, hover reveals at low
                          opacity, .is-active brings it to full
                          opacity in the primary color). Matches
                          GridDataHeader's pattern in the dashboard
                          Tabelle (src/components/dashboard/grid/
                          GridDataHeader.tsx). */}
                      <button
                        type="button"
                        className={
                          'factsheet-group-bars__col-sort-btn' +
                          (isActive ? ' is-active' : '')
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSortClick(indicator);
                        }}
                        aria-pressed={isActive}
                        aria-label={sortTooltip}
                        title={sortTooltip}
                      >
                        {isDesc ? (
                          <ArrowDown10 size={12} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <ArrowDown01 size={12} strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="factsheet-group-bars__col-btn"
                        onClick={() => handleSortClick(indicator)}
                        aria-label={`Nach ${INDICATOR_LABELS_FULL[indicator]} sortieren`}
                      >
                        <span
                          className="factsheet-group-bars__col-icon"
                          aria-hidden="true"
                        >
                          <Icon size={16} strokeWidth={1.75} />
                        </span>
                        <span className="factsheet-group-bars__col-label">
                          {INDICATOR_LABELS_SHORT[indicator]}
                        </span>
                      </button>
                    </th>
                  </HoverTooltip>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map((g) => {
              const entry = byGroup.get(g);
              const GroupIcon = AUDIENCE_ICONS_BY_GROUP[g];
              const rowTooltipContent = (
                <div className="hover-tooltip__inner">
                  <div className="hover-tooltip__title">
                    {GROUP_FULL_LABELS[g]}
                  </div>
                  <p className="hover-tooltip__body">
                    {GROUP_DESCRIPTIONS[g]}
                  </p>
                </div>
              );
              return (
                <tr key={g}>
                  <HoverTooltip content={rowTooltipContent}>
                    <th
                      scope="row"
                      className="factsheet-group-bars__row-header"
                    >
                      <span
                        className="factsheet-group-bars__row-icon"
                        aria-hidden="true"
                      >
                        <GroupIcon size={16} strokeWidth={1.75} />
                      </span>
                      <span className="factsheet-group-bars__row-label">
                        {GROUP_SHORT_LABELS[g]}
                      </span>
                    </th>
                  </HoverTooltip>
                  {INDICATORS.map((indicator) => {
                    const raw = entry
                      ? (entry[indicator] as number | null)
                      : null;
                    const value =
                      indicator === 'population_relevance' &&
                      POP_REL_INVALID_GROUPS.has(g)
                        ? null
                        : raw;
                    const hasValue = typeof value === 'number';
                    if (!hasValue) {
                      return (
                        <td
                          key={indicator}
                          className="factsheet-group-bars__cell factsheet-group-bars__cell--na"
                          title="Dieser Indikator wurde nur für Erwachsene (18–70) und Minderjährige (16–17) erhoben."
                          aria-label={`${INDICATOR_LABELS_FULL[indicator]} für ${GROUP_FULL_LABELS[g]}: keine Daten`}
                        >
                          <span className="factsheet-group-bars__na">
                            k. A.
                          </span>
                        </td>
                      );
                    }
                    const rounded = Math.round(value!);
                    const band = bandIndex(rounded);
                    const bandLabel = indicatorUsesAnteil(indicator)
                      ? anteilLabel(rounded)
                      : niveauLabel(rounded);
                    const cellTooltipContent = (
                      <div className="hover-tooltip__inner">
                        <div className="hover-tooltip__title">
                          {INDICATOR_LABELS_FULL[indicator]} ·{' '}
                          {GROUP_FULL_LABELS[g]}
                        </div>
                        {entry ? (
                          <Lesebeispiel
                            metric={entry}
                            audience="adults"
                            group={g}
                            onlyIndicator={indicator}
                            compactHeading
                          />
                        ) : null}
                        <div
                          className={
                            'hover-tooltip__band ' +
                            `hover-tooltip__band--band-${band}`
                          }
                        >
                          {bandLabel}
                        </div>
                      </div>
                    );
                    return (
                      <HoverTooltip
                        key={indicator}
                        content={cellTooltipContent}
                        verdict={verdict ?? null}
                      >
                        <td
                          className={`factsheet-group-bars__cell factsheet-group-bars__cell--band-${band}`}
                          style={{
                            background: `var(--band-${band})`,
                          }}
                          aria-label={`${INDICATOR_LABELS_FULL[indicator]} für ${GROUP_FULL_LABELS[g]}: ${rounded} — ${bandLabel}`}
                        >
                          <span className="factsheet-group-bars__value">
                            {rounded}
                          </span>
                        </td>
                      </HoverTooltip>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
