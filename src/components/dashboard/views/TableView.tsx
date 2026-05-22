/**
 * TableView — five-column indicator table for the Daten-Explorer.
 *
 * Stage 2026-05-21 rebuild: aligns the header chrome and myth-identity
 * cell with Spannweite so all three myth-data views (Balken, Spannweite,
 * Tabelle) read as the same product:
 *   - Header cells use the shared `GridDataHeader` (EyeOff + icon +
 *     label + InfoTooltip + ArrowDown01/10 sort button) and
 *     `GridLabelHeader` (A-Z + verdict-rank) primitives.
 *   - Myth-identity cell uses `GridMythCell` (verdict-colored arrow +
 *     plain short text, no background tint).
 *   - Value cells render `k. A.` (italic muted) for nulls, matching
 *     Spannweite's missing-data treatment.
 *   - `population_relevance` is included as the 5th column, with
 *     Bev.-Relevanz-invalid groups (consumers / young_adults / parents)
 *     rendering `k. A.` automatically via `getIndicatorValueChecked`.
 *   - Sort state extended to support verdict-rank (asc/desc) via the
 *     stacked-circles button in the MYTHEN column header.
 */
import { useMemo, useState } from 'react';
import type {
  Myth, Metric, AppState, Indicator,
  DashboardDefinitions,
} from '../../../lib/dashboard/types';
import {
  getMythMetric,
  getIndicatorValueChecked,
  getMythShortText,
  formatValue,
} from '../../../lib/dashboard/data';
import {
  INDICATOR_ICONS,
  type IconComponent,
} from '../../../lib/icons';
import VerdictArrowSymbols from './verdictArrowSymbols';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import { useHiddenColumns } from '../hooks/useHiddenColumns';
import {
  GridDataHeader,
  GridLabelHeader,
  GridMythCell,
} from '../grid';

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
  /** Optional dashboard definitions used for the InfoTooltip popovers
   *  on each indicator column header. */
  definitions?: DashboardDefinitions | null;
}

type SortKey =
  | 'myth'
  | 'verdict'
  | 'awareness'
  | 'significance'
  | 'correctness'
  | 'prevention_significance'
  | 'population_relevance';

type SortDir = 'asc' | 'desc';

interface ColSpec {
  key: Indicator;
  Icon: IconComponent;
}

const INDICATOR_COLS: ColSpec[] = [
  { key: 'awareness', Icon: INDICATOR_ICONS.awareness },
  { key: 'significance', Icon: INDICATOR_ICONS.significance },
  { key: 'correctness', Icon: INDICATOR_ICONS.correctness },
  { key: 'prevention_significance', Icon: INDICATOR_ICONS.prevention_significance },
  { key: 'population_relevance', Icon: INDICATOR_ICONS.population_relevance },
];

export default function TableView({ myths, metrics, state, update, onSelectMyth, definitions }: Props) {
  void update;
  const [sortKey, setSortKey] = useState<SortKey>('myth');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const lang = state.lang;
  const groupId = state.groupIds[0] || 'adults';

  const allIndicatorIds = INDICATOR_COLS.map((c) => c.key as string);
  const { hide, show, isHidden } = useHiddenColumns(
    'carm.table.hidden',
    allIndicatorIds,
  );

  /** Click cycle: same column → flip direction; new column → asc. */
  const cycleColumnSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedMyths = useMemo(() => {
    const arr = [...myths];
    const cmpAz = (a: Myth, b: Myth) =>
      getMythShortText(a, lang).localeCompare(getMythShortText(b, lang), 'de');
    const verdictOrder: Record<string, number> = {
      richtig: 1, eher_richtig: 2, eher_falsch: 3, falsch: 4, no_classification: 5,
    };
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'myth') {
        cmp = cmpAz(a, b);
      } else if (sortKey === 'verdict') {
        const oa = verdictOrder[a.correctness_class] ?? 5;
        const ob = verdictOrder[b.correctness_class] ?? 5;
        cmp = oa - ob;
        if (cmp === 0) cmp = cmpAz(a, b);
      } else {
        const ind = sortKey as Indicator;
        const ma = getMythMetric(metrics, a.id, groupId);
        const mb = getMythMetric(metrics, b.id, groupId);
        const va = getIndicatorValueChecked(ma, ind, groupId);
        const vb = getIndicatorValueChecked(mb, ind, groupId);
        if (va === null && vb === null) cmp = 0;
        else if (va === null) cmp = 1;
        else if (vb === null) cmp = -1;
        else cmp = va - vb;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [myths, sortKey, sortDir, lang, groupId, metrics]);

  const columnMeta = useMemo(() => {
    return INDICATOR_COLS.map((col) => {
      const rawLabel = t(`indicator.${col.key}.short` as TranslationKey, lang);
      const label = rawLabel.replace(/\s*%\s*$/, '');
      const def = definitions?.mythIndicators?.[col.key];
      return {
        key: col.key,
        Icon: col.Icon,
        label,
        fullLabel: t(`indicator.${col.key}` as TranslationKey, lang),
        defTitle: def?.label,
        defText: def?.definition,
        defScale: def?.scale,
        defSampleSize: def?.sampleSize,
      };
    });
  }, [definitions, lang]);

  const isAzActive = sortKey === 'myth';
  const azTooltip = t('spannweite.sort.alpha.tooltip', lang);

  // Dynamic column widths — myth column is narrower (28%); hidden
  // columns collapse to 28px; visible indicator columns share the
  // remaining space evenly via calc(). Pairs with `table-layout: fixed`.
  const hiddenCount = columnMeta.filter((c) => isHidden(c.key)).length;
  const visibleCount = columnMeta.length - hiddenCount;
  const MYTH_COL_PCT = 28;
  const visibleIndicatorWidth =
    visibleCount > 0
      ? `calc((${100 - MYTH_COL_PCT}% - 28px * ${hiddenCount}) / ${visibleCount})`
      : `${100 - MYTH_COL_PCT}%`;

  return (
    <div className="data-table-container">
      <table className="data-table" role="table">
        <colgroup>
          <col style={{ width: `${MYTH_COL_PCT}%` }} />
          {columnMeta.map((col) => (
            <col
              key={col.key}
              style={{
                width: isHidden(col.key) ? '28px' : visibleIndicatorWidth,
              }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>
              <div
                className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--label data-table__th-wrap"
                role="columnheader"
              >
                <GridLabelHeader
                  labelText={t('misc.myths', lang)}
                  isAzActive={isAzActive}
                  azTooltip={azTooltip}
                  onAzClick={() => {
                    setSortKey('myth');
                    setSortDir('asc');
                  }}
                  verdictRank={{
                    isActive: sortKey === 'verdict',
                    direction: sortKey === 'verdict' && sortDir === 'desc' ? 'desc' : 'asc',
                    tooltip: t(
                      sortKey !== 'verdict'
                        ? 'spannweite.sort.verdict.activate.tooltip'
                        : sortDir === 'asc'
                        ? 'spannweite.sort.verdict.asc.tooltip'
                        : 'spannweite.sort.verdict.desc.tooltip',
                      lang,
                    ),
                    onClick: () => {
                      if (sortKey === 'verdict') {
                        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortKey('verdict');
                        setSortDir('asc');
                      }
                    },
                  }}
                />
              </div>
            </th>
            {columnMeta.map((col) => {
              const colHidden = isHidden(col.key);
              if (colHidden) {
                return (
                  <th
                    key={col.key}
                    className="data-table__hidden-th"
                    onClick={() => show(col.key)}
                    title={`${t('column.show', lang)} — ${col.fullLabel}`}
                    aria-label={`${t('column.show', lang)} — ${col.fullLabel}`}
                  >
                    <div
                      className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--hidden data-table__hidden-wrap"
                      role="columnheader"
                    >
                      <span className="carm-spannweite__hidden-chev" aria-hidden="true">▸</span>
                    </div>
                  </th>
                );
              }
              const isSortCol = sortKey === col.key;
              const isAsc = isSortCol && sortDir === 'asc';
              const isDesc = isSortCol && sortDir === 'desc';
              const colSortTooltipKey: TranslationKey = isAsc
                ? 'spannweite.sort.col.asc.tooltip'
                : isDesc
                ? 'spannweite.sort.col.desc.tooltip'
                : 'spannweite.sort.col.activate.tooltip';
              const colSortTooltip = t(colSortTooltipKey, lang).replace('{col}', col.fullLabel);
              return (
                <th key={col.key} className="data-table__th">
                  <div
                    className="carm-spannweite__cell carm-spannweite__cell--header data-table__th-wrap"
                    role="columnheader"
                  >
                    <GridDataHeader
                      Icon={col.Icon}
                      label={col.label}
                      fullLabel={col.fullLabel}
                      defTitle={col.defTitle}
                      defText={col.defText}
                      defScale={col.defScale}
                      defSampleSize={col.defSampleSize}
                      hideLabel={`${t('column.hide', lang)} — ${col.fullLabel}`}
                      onHide={() => hide(col.key)}
                      isSortActive={isSortCol}
                      sortDir={isDesc ? 'desc' : 'asc'}
                      sortTooltip={colSortTooltip}
                      onSortClick={() => cycleColumnSort(col.key)}
                    />
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedMyths.map((myth) => {
            const metric = getMythMetric(metrics, myth.id, groupId);
            return (
              <tr
                key={myth.id}
                onClick={() => onSelectMyth(myth.id)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelectMyth(myth.id); }}
                role="row"
              >
                <td className="myth-cell">
                  <div className="carm-spannweite__cell carm-spannweite__cell--label data-table__myth-wrap">
                    <GridMythCell
                      verdict={myth.correctness_class}
                      shortText={getMythShortText(myth, lang)}
                    />
                  </div>
                </td>
                {columnMeta.map((col) => {
                  if (isHidden(col.key)) {
                    return (
                      <td
                        key={col.key}
                        className="data-table__hidden-td"
                        aria-hidden="true"
                      />
                    );
                  }
                  const val = getIndicatorValueChecked(metric, col.key, groupId);
                  if (val === null) {
                    return (
                      <td key={col.key} className="value-cell na-value">
                        <span className="carm-spannweite__no-data data-table__na">
                          k. A.
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} className="value-cell">
                      {formatValue(val, col.key)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Verdict-arrow symbol library — Tabelle's GridMythCell uses
          the same `#strips-arrow-{verdict}` symbol references that
          Spannweite + Balken use. Mount once here so the <use href>
          references resolve. */}
      <svg
        className="carm-spannweite__symbols"
        width={0}
        height={0}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <VerdictArrowSymbols />
        </defs>
      </svg>
    </div>
  );
}
