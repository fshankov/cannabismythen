import { useState, useMemo } from 'react';
import { Eye, TrendingUp, Target, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Myth, Metric, AppState, Indicator } from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText, formatValue } from '../../../lib/dashboard/data';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import VerdictArrow from '../../shared/VerdictArrow';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  /** Kept for parent-API compatibility; the verdict-filter dropdown
   *  inside this component was removed in Stage 2 of the
   *  Daten-Explorer refactor — the filter now lives in the shared
   *  toolbar above the chart. */
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onSelectMyth: (id: number) => void;
}

type SortKey = 'myth' | 'verdict' | 'awareness' | 'significance' | 'correctness' | 'prevention_significance' | 'population_relevance';
type SortDir = 'asc' | 'desc';

const INDICATOR_COLS: { key: Indicator; Icon: LucideIcon }[] = [
  { key: 'awareness', Icon: Eye },
  { key: 'significance', Icon: TrendingUp },
  { key: 'correctness', Icon: Target },
  { key: 'prevention_significance', Icon: Shield },
];

// VERDICT_OPTIONS lived here for the inline header `<select>` — moved
// into MythenExplorer's <ToolbarRow> in Stage 2.

export default function TableView({ myths, metrics, state, update, onSelectMyth }: Props) {
  // The Tabelle still owns its own column-click sort affordance —
  // header clicks override the toolbar SortToggle for that single tab
  // (each click toggles the column's direction). The toolbar's
  // SortToggle initialises the default sort: indicator-column +
  // direction tracked in `state.balkenSort`.
  void update;
  const initialDir: SortDir = state.balkenSort === 'value-asc' ? 'asc' : 'desc';
  const [sortKey, setSortKey] = useState<SortKey>(state.indicator as SortKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);
  const groupId = state.groupIds[0] || 'adults';

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'myth' ? 'asc' : 'desc');
    }
  };

  const sortedMyths = useMemo(() => {
    const arr = [...myths];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'myth':
          cmp = getMythShortText(a, state.lang).localeCompare(getMythShortText(b, state.lang));
          break;
        case 'verdict': {
          const order: Record<string, number> = { richtig: 1, eher_richtig: 2, eher_falsch: 3, falsch: 4, no_classification: 5 };
          cmp = (order[a.correctness_class] || 5) - (order[b.correctness_class] || 5);
          break;
        }
        default: {
          const ind = sortKey as Indicator;
          const ma = getMythMetric(metrics, a.id, groupId);
          const mb = getMythMetric(metrics, b.id, groupId);
          const va = getIndicatorValue(ma, ind) ?? -1;
          const vb = getIndicatorValue(mb, ind) ?? -1;
          cmp = va - vb;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [myths, sortKey, sortDir, state.lang, groupId, metrics]);

  const renderSortArrow = (key: SortKey) => {
    const isActive = sortKey === key;
    const arrow = sortDir === 'asc' ? '▲' : '▼';
    return (
      <span className={`sort-arrow ${isActive ? 'active' : ''}`}>
        {isActive ? arrow : '▲'}
      </span>
    );
  };

  return (
    <div className="data-table-container">
      <table className="data-table" role="table">
        <thead>
          <tr>
            <th style={{ minWidth: 160 }}>
              {/* Stage 2 — verdict filter moved out of the table header
                  into the shared <ToolbarRow> above. The header is now
                  just a sort affordance. */}
              <span
                className="myth-header-label"
                onClick={() => toggleSort('myth')}
              >
                {t('table.myth', state.lang)} {renderSortArrow('myth')}
              </span>
            </th>
            {INDICATOR_COLS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{ textAlign: 'right' }}
              >
                <span className="th-icon"><col.Icon size={14} strokeWidth={1.75} aria-hidden="true" /></span>{' '}
                {t(`indicator.${col.key}.short` as any, state.lang)} {renderSortArrow(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedMyths.map((myth) => {
            const metric = getMythMetric(metrics, myth.id, groupId);
            const textColor = getCorrectnessColor(myth.correctness_class);

            return (
              <tr
                key={myth.id}
                onClick={() => onSelectMyth(myth.id)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelectMyth(myth.id); }}
                role="row"
              >
                <td
                  className={`myth-cell statement--${myth.correctness_class}`}
                  style={{ color: textColor, fontWeight: 600 }}
                >
                  <span
                    className={`carm-myth-label__arrow classification--${myth.correctness_class}`}
                    aria-hidden="true"
                    style={{ marginRight: 6, verticalAlign: 'middle' }}
                  >
                    <VerdictArrow
                      verdict={myth.correctness_class}
                      size={13}
                      strokeWidth={2.25}
                    />
                  </span>
                  {getMythShortText(myth, state.lang)}
                </td>
                {INDICATOR_COLS.map((col) => {
                  const val = getIndicatorValue(metric, col.key);
                  return (
                    <td key={col.key} className={`value-cell ${val === null ? 'na-value' : ''}`}>
                      {formatValue(val, col.key)}
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
