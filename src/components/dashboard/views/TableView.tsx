import { useState, useMemo } from 'react';
import type { Myth, Metric, AppState, Indicator, VerdictFilter, CorrectnessClass } from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText, formatValue } from '../../../lib/dashboard/data';
import { getCorrectnessColor, getCorrectnessBgColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onSelectMyth: (id: number) => void;
}

type SortKey = 'myth' | 'verdict' | 'awareness' | 'significance' | 'correctness' | 'prevention_significance';
type SortDir = 'asc' | 'desc';

const INDICATOR_COLS: { key: Indicator; icon: string }[] = [
  { key: 'awareness', icon: '👁️' },
  { key: 'significance', icon: '⚖️' },
  { key: 'correctness', icon: '✅' },
  { key: 'prevention_significance', icon: '🛡️' },
];

const VERDICT_OPTIONS: { key: VerdictFilter; tKey: string }[] = [
  { key: 'all', tKey: 'verdict.all' },
  { key: 'richtig', tKey: 'verdict.richtig' },
  { key: 'eher_richtig', tKey: 'verdict.eher_richtig' },
  { key: 'eher_falsch', tKey: 'verdict.eher_falsch' },
  { key: 'falsch', tKey: 'verdict.falsch' },
  { key: 'no_classification', tKey: 'verdict.no_classification' },
];

export default function TableView({ myths, metrics, state, update, onSelectMyth }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('verdict');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
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
              <div className="myth-header-row">
                <span className="myth-header-label" onClick={() => toggleSort('myth')}>
                  {t('table.myth', state.lang)} {renderSortArrow('myth')}
                </span>
                <select
                  className="verdict-header-select"
                  value={state.verdictFilter}
                  onChange={(e) => update('verdictFilter', e.target.value as VerdictFilter)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {VERDICT_OPTIONS.map((v) => (
                    <option key={v.key} value={v.key}>{t(v.tKey as any, state.lang)}</option>
                  ))}
                </select>
              </div>
            </th>
            {INDICATOR_COLS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{ textAlign: 'right' }}
              >
                <span className="th-icon">{col.icon}</span>{' '}
                {t(`indicator.${col.key}.short` as any, state.lang)} {renderSortArrow(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedMyths.map((myth) => {
            const metric = getMythMetric(metrics, myth.id, groupId);
            const bgColor = getCorrectnessBgColor(myth.correctness_class);
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
                  className="myth-cell"
                  style={{ backgroundColor: bgColor, color: textColor, fontWeight: 600 }}
                >
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
