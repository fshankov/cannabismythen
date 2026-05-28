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
import { useEffect, useMemo, useState } from 'react';
import type {
  Myth, Metric, AppState, Indicator, GroupId, StripsMode,
  DashboardDefinitions,
} from '../../../lib/dashboard/types';
import {
  getMythMetric,
  getIndicatorValueChecked,
  getMythShortText,
  getMythText,
  formatValue,
} from '../../../lib/dashboard/data';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import {
  INDICATOR_ICONS,
  AUDIENCE_ICONS_BY_GROUP,
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
import {
  bandIndex,
  anteilLabel,
  niveauLabel,
} from '../../../lib/dashboard/lesebeispiel-bands';
import Lesebeispiel from '../Lesebeispiel';
import HoverTooltip from '../../shared/HoverTooltip';

/** Compact label set used by the cell-hover tooltip title bar. The
 *  in-table column header already has its own label via GridDataHeader;
 *  this set is just for "indicator · group" composition in the
 *  tooltip. */
const INDICATOR_LABELS_FULL: Record<Indicator, string> = {
  awareness: 'Kenntnis',
  significance: 'Bedeutung',
  correctness: 'Richtigkeit',
  prevention_significance: 'Prävention',
  population_relevance: 'Bevölkerungsrelevanz',
};

const GROUP_FULL_LABELS: Record<string, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

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

/** Sort target: the two label-column sorts ('myth' alpha, 'verdict' rank)
 *  stay constant across the pivot; the data-column sort key is just the
 *  active column ID (an Indicator in 'indicator' mode, a GroupId in
 *  'group' mode). Stored as a string so both flavors fit. */
type SortKey = 'myth' | 'verdict' | string;

type SortDir = 'asc' | 'desc';

interface ColSpec {
  /** Indicator key (in 'indicator' mode) or GroupId (in 'group' mode). */
  key: string;
  Icon: IconComponent;
}

const INDICATOR_COLS: ColSpec[] = [
  { key: 'awareness', Icon: INDICATOR_ICONS.awareness },
  { key: 'significance', Icon: INDICATOR_ICONS.significance },
  { key: 'correctness', Icon: INDICATOR_ICONS.correctness },
  { key: 'prevention_significance', Icon: INDICATOR_ICONS.prevention_significance },
  { key: 'population_relevance', Icon: INDICATOR_ICONS.population_relevance },
];

/** v4 (2026-05-26): when `state.stripsMode === 'group'`, columns become
 *  the 5 Zielgruppen and each cell shows `state.indicator`'s value for
 *  that column's group. */
const GROUP_COLS: ColSpec[] = [
  { key: 'adults', Icon: AUDIENCE_ICONS_BY_GROUP.adults },
  { key: 'minors', Icon: AUDIENCE_ICONS_BY_GROUP.minors },
  { key: 'consumers', Icon: AUDIENCE_ICONS_BY_GROUP.consumers },
  { key: 'young_adults', Icon: AUDIENCE_ICONS_BY_GROUP.young_adults },
  { key: 'parents', Icon: AUDIENCE_ICONS_BY_GROUP.parents },
];

export default function TableView({ myths, metrics, state, update, onSelectMyth, definitions }: Props) {
  void update;
  const [sortKey, setSortKey] = useState<SortKey>('myth');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const lang = state.lang;
  // v4: state from the SpannweiteToolbar's PivotToggle + "Wert für"
  // picker. The "off-axis" dimension comes from state.groupIds[0]
  // (when columns = indicators) or state.indicator (when columns =
  // groups), matching SpannweiteToolbar's onPickerChange wiring.
  const mode: StripsMode = state.stripsMode ?? 'indicator';
  const groupId: GroupId = (state.groupIds[0] as GroupId) || 'adults';
  const pickedIndicator: Indicator = state.indicator;

  // v5 (2026-05-26) — swap so the toggle label names the PICKER
  // dimension and the columns become the OTHER dimension. "Indikatoren"
  // mode → picker = indicator, columns = 5 groups. "Gruppen" mode →
  // picker = group, columns = 5 indicators.
  const cols: ColSpec[] = mode === 'indicator' ? GROUP_COLS : INDICATOR_COLS;
  const allColIds = cols.map((c) => c.key);

  // Hidden-column state is scoped per-mode so the user's hidden
  // selections survive flipping back and forth (mirrors SpannweiteView).
  const { hide, show, isHidden } = useHiddenColumns(
    `carm.table.hidden.${mode}`,
    allColIds,
  );

  // When the pivot changes the column schema changes too — any
  // data-column sort instantly becomes meaningless. Reset to the alpha
  // sort on the myth-label column so the table stays coherent.
  useEffect(() => {
    if (sortKey !== 'myth' && sortKey !== 'verdict') {
      setSortKey('myth');
      setSortDir('asc');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /** Click cycle: same column → flip direction; new column → asc. */
  const cycleColumnSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /** v5 pivot-aware cell value. The toggle name = picker dimension.
   *  'indicator' mode: picker = indicator, columns = groups → cell uses
   *  pickedIndicator and colKey-as-GroupId. 'group' mode: picker =
   *  group, columns = indicators → cell uses pickedGroup and
   *  colKey-as-Indicator. */
  const cellValueFor = (mythId: number, colKey: string): number | null => {
    if (mode === 'indicator') {
      return getIndicatorValueChecked(
        getMythMetric(metrics, mythId, colKey as GroupId),
        pickedIndicator,
        colKey as GroupId,
      );
    }
    return getIndicatorValueChecked(
      getMythMetric(metrics, mythId, groupId),
      colKey as Indicator,
      groupId,
    );
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
        // Data-column sort — colKey is whichever dimension is on the
        // columns in the active pivot.
        const va = cellValueFor(a.id, sortKey);
        const vb = cellValueFor(b.id, sortKey);
        if (va === null && vb === null) cmp = 0;
        else if (va === null) cmp = 1;
        else if (vb === null) cmp = -1;
        else cmp = va - vb;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myths, sortKey, sortDir, lang, groupId, pickedIndicator, mode, metrics]);

  const columnMeta = useMemo(() => {
    return cols.map((col) => {
      // v5: 'indicator' pivot mode → cols are groups; 'group' pivot
      // mode → cols are indicators. Pick the metadata accordingly.
      if (mode === 'group') {
        const ind = col.key as Indicator;
        const rawLabel = t(`indicator.${ind}.short` as TranslationKey, lang);
        const label = rawLabel.replace(/\s*%\s*$/, '');
        const def = definitions?.mythIndicators?.[ind];
        return {
          key: col.key,
          Icon: col.Icon,
          label,
          fullLabel: t(`indicator.${ind}` as TranslationKey, lang),
          defTitle: def?.label,
          defText: def?.definition,
          defScale: def?.scale,
          defSampleSize: def?.sampleSize,
        };
      }
      // 'indicator' mode — column is a Zielgruppe.
      const gid = col.key as GroupId;
      const label = t(`igs.group.${gid}` as TranslationKey, lang);
      const def = definitions?.groups?.[gid];
      return {
        key: col.key,
        Icon: col.Icon,
        label,
        fullLabel: GROUP_FULL_LABELS[gid] ?? label,
        defTitle: def?.label,
        defText: def?.definition,
        defScale: undefined as string | undefined,
        defSampleSize: def?.sampleSize,
      };
    });
  }, [cols, mode, definitions, lang]);

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
                const ColIcon = col.Icon;
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
                      {/* Closed-column layout (Fedor 2026-05-25 PM):
                          chev on top + indicator icon below. Matches
                          Spannweite's redesign. */}
                      <span className="carm-spannweite__hidden-chev" aria-hidden="true">▸</span>
                      <span className="carm-spannweite__hidden-icon" aria-hidden="true">
                        <ColIcon size={16} strokeWidth={1.75} />
                      </span>
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
            // Myth-cell (first-column row label) hover. Statement +
            // "Wissenschaftlich:…" verdict line only — no Lesebeispiel
            // (pinned to data cells, which know their own metric × group).
            const verdictKey = myth.correctness_class;
            const verdictLabelDe = t(
              `verdict.${verdictKey}` as TranslationKey,
              lang,
            ).toLowerCase();
            const verdictColor = getCorrectnessColor(verdictKey);
            const mythTooltipContent = (
              <div className="hover-tooltip__inner">
                <div className="hover-tooltip__title">
                  {getMythText(myth, lang)}
                </div>
                <div
                  className="hover-tooltip__body"
                  style={{ color: verdictColor, fontWeight: 600 }}
                >
                  {lang === 'de' ? 'Wissenschaftlich' : 'Scientifically'}:{' '}
                  {verdictLabelDe}
                </div>
              </div>
            );
            return (
              <tr
                key={myth.id}
                onClick={() => onSelectMyth(myth.id)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelectMyth(myth.id); }}
                role="row"
              >
                <HoverTooltip content={mythTooltipContent} verdict={verdictKey}>
                  <td className="myth-cell">
                    <div className="carm-spannweite__cell carm-spannweite__cell--label data-table__myth-wrap">
                      <GridMythCell
                        verdict={myth.correctness_class}
                        shortText={getMythShortText(myth, lang)}
                      />
                    </div>
                  </td>
                </HoverTooltip>
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
                  // v5: pivot-aware (cell-row) values + Lesebeispiel
                  // context. Toggle label names the picker dimension;
                  // columns are the OTHER dimension. So in 'indicator'
                  // mode the column IS the group (off-axis) and the
                  // indicator is fixed = pickedIndicator. In 'group'
                  // mode it's the other way around.
                  const cellIndicator: Indicator =
                    mode === 'indicator'
                      ? pickedIndicator
                      : (col.key as Indicator);
                  const cellGroupId: GroupId =
                    mode === 'indicator'
                      ? (col.key as GroupId)
                      : groupId;
                  const cellMetric = getMythMetric(metrics, myth.id, cellGroupId);
                  const val = cellValueFor(myth.id, col.key);
                  if (val === null) {
                    return (
                      <td key={col.key} className="value-cell na-value">
                        <span className="carm-spannweite__no-data data-table__na">
                          k. A.
                        </span>
                      </td>
                    );
                  }
                  // Heatmap band + Lesebeispiel hover. The band is
                  // computed on the rounded value regardless of pivot.
                  const rounded = Math.round(val);
                  const band = bandIndex(rounded);
                  const usesAnteil = cellIndicator === 'awareness';
                  const bandLabel = usesAnteil
                    ? anteilLabel(rounded)
                    : niveauLabel(rounded);
                  const tooltipContent = (
                    <div className="hover-tooltip__inner">
                      <div className="hover-tooltip__title">
                        {INDICATOR_LABELS_FULL[cellIndicator]} ·{' '}
                        {GROUP_FULL_LABELS[cellGroupId] ?? cellGroupId}
                      </div>
                      {cellMetric ? (
                        <Lesebeispiel
                          metric={cellMetric}
                          audience="adults"
                          group={cellGroupId}
                          onlyIndicator={cellIndicator}
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
                      key={col.key}
                      content={tooltipContent}
                      verdict={verdictKey}
                    >
                      <td
                        className={`value-cell value-cell--band-${band}`}
                      >
                        {formatValue(val, cellIndicator)}
                      </td>
                    </HoverTooltip>
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
