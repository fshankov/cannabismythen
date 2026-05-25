/**
 * FactsheetGroupTable — popup data table (Tab 2 of the viz strip).
 *
 * 6×6 grid (1 header row + 5 data rows; 1 header column + 5 data
 * columns) showing the full Bevölkerungsbefragung slice for a single
 * myth:
 *
 *   ┌──────────┬──────┬──────┬───────┬──────────┬───────┐
 *   │          │ Erw. │ Min. │ Kons. │ Junge E. │ Eltern│
 *   ├──────────┼──────┼──────┼───────┼──────────┼───────┤
 *   │ Kenntnis │  18  │  21  │  33   │   21     │  21   │
 *   │ Bedeutung│  …                                     │
 *   └──────────┘
 *
 * Header column: indicator icon + short label (Kenntnis / Bedeutung /
 *   Richtigkeit / Prävention / Bev. Relevanz).
 * Header row: audience icon + short label (Erw. / Min. / Kons. /
 *   Junge E. / Eltern). Full labels live in the `title` tooltip.
 * Cells: plain rounded integer ("k. A." italic for invalid combos —
 *   population_relevance × consumers/young_adults/parents).
 *
 * Visual difference from the previous matrix in `FactsheetGroupBars`:
 * no per-cell verdict-tinted mini-bar — just the numbers + the icons.
 * The radar tab carries the visual "shape" reading; this tab is the
 * exact, scannable lookup table.
 */

import type {
  GroupId,
  Indicator,
  MythGroupMetrics,
} from '../../lib/dashboard/types';
import { POP_REL_INVALID_GROUPS } from '../../lib/dashboard/data';
import {
  AUDIENCE_ICONS_BY_GROUP,
  INDICATOR_ICONS,
} from '../../lib/icons/lookups';

interface Props {
  /** Pre-computed per-group metrics for the open myth — same shape as
   *  the other two tabs of the viz strip. */
  metrics: MythGroupMetrics;
}

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

const INDICATOR_LABELS: Record<Indicator, string> = {
  awareness: 'Kenntnis',
  significance: 'Bedeutung',
  correctness: 'Richtigkeit',
  prevention_significance: 'Prävention',
  population_relevance: 'Bev. Relevanz',
};

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

const GROUP_SHORT_LABELS: Record<GroupId, string> = {
  adults: 'Erw.',
  minors: 'Min.',
  consumers: 'Kons.',
  young_adults: 'Junge E.',
  parents: 'Eltern',
};

export default function FactsheetGroupTable({ metrics }: Props) {
  const byGroup = new Map<GroupId, MythGroupMetrics[number]>();
  for (const m of metrics) byGroup.set(m.group_id, m);

  return (
    <div className="factsheet-group-table-wrap">
      <table
        className="factsheet-group-table"
        role="table"
        aria-label="5 Indikatoren × 5 Bevölkerungsgruppen"
      >
        <thead>
          <tr>
            <th
              className="factsheet-group-table__corner"
              scope="col"
              aria-label="Indikator"
            />
            {GROUP_ORDER.map((g) => {
              const GroupIcon = AUDIENCE_ICONS_BY_GROUP[g];
              return (
                <th
                  key={g}
                  scope="col"
                  className="factsheet-group-table__col-header"
                  title={GROUP_FULL_LABELS[g]}
                >
                  <span
                    className="factsheet-group-table__col-icon"
                    aria-hidden="true"
                  >
                    <GroupIcon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="factsheet-group-table__col-label">
                    {GROUP_SHORT_LABELS[g]}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {INDICATORS.map((indicator) => {
            const IndIcon = INDICATOR_ICONS[indicator];
            return (
              <tr key={indicator}>
                <th
                  scope="row"
                  className="factsheet-group-table__row-header"
                  title={INDICATOR_LABELS[indicator]}
                >
                  <span
                    className="factsheet-group-table__row-icon"
                    aria-hidden="true"
                  >
                    <IndIcon size={14} strokeWidth={1.75} />
                  </span>
                  <span className="factsheet-group-table__row-label">
                    {INDICATOR_LABELS[indicator]}
                  </span>
                </th>
                {GROUP_ORDER.map((g) => {
                  const entry = byGroup.get(g);
                  const rawValue = entry ? (entry[indicator] as number | null) : null;
                  // Force null for invalid pop_relevance combos so stray
                  // data values don't render as numbers.
                  const value =
                    indicator === 'population_relevance' &&
                    POP_REL_INVALID_GROUPS.has(g)
                      ? null
                      : rawValue;
                  const hasValue = typeof value === 'number';
                  return (
                    <td
                      key={g}
                      className={
                        hasValue
                          ? 'factsheet-group-table__cell'
                          : 'factsheet-group-table__cell factsheet-group-table__cell--na'
                      }
                      aria-label={
                        hasValue
                          ? `${INDICATOR_LABELS[indicator]} für ${GROUP_FULL_LABELS[g]}: ${Math.round(value!)}`
                          : `${INDICATOR_LABELS[indicator]} für ${GROUP_FULL_LABELS[g]}: keine Daten`
                      }
                    >
                      {hasValue ? (
                        Math.round(value!)
                      ) : (
                        <span
                          className="factsheet-group-table__na"
                          title="Dieser Indikator wurde nur für Erwachsene (18–70) und Minderjährige (16–17) erhoben."
                        >
                          k. A.
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
