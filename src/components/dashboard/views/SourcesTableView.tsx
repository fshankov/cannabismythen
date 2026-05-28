/**
 * SourcesTableView — 4-column metric table for information sources.
 *
 * Travel pipeline 2026-05-23 — Stage 3C. Mirrors the LEFT TableView's
 * shape (sortable headers, GridLabelHeader / GridDataHeader, A-Z + per-
 * column sort) but pivots to sources × the four SourceMetricType
 * columns (Suche / Wahrnehmung / Vertrauen / Prävention) for the
 * active SourceGroupId.
 *
 * Differences vs the LEFT TableView (myths × indicators):
 *   • Rows = top-level information sources (no children); category icon
 *     + name in the label cell.
 *   • Columns = 4 source metrics × the active SourceGroupId. The group
 *     is picked via the inline DataPicker at the top of the view (same
 *     pattern SourcesBalkenView uses); the indicator picker is absent
 *     because all 4 metrics render simultaneously.
 *   • No verdict-rank sort (sources have no verdict).
 *   • No InfoTooltip definitions yet — the metric labels are
 *     self-explanatory at MVP scope.
 *   • Sort: A-Z (label) or value (asc/desc) on each metric column.
 *
 * Designed for parity with TableView's table-layout chrome so the two
 * views feel like the same control set across the dashboard divider.
 */
import {
  forwardRef, useEffect, useImperativeHandle, useMemo, useState,
} from 'react';
import type {
  AppState, InformationSourcesData, SourceGroupId, SourceMetricType,
  SourcesStripsMode,
} from '../../../lib/dashboard/types';
import {
  GridDataHeader, GridLabelHeader,
} from '../grid';
import {
  AUDIENCE_ICONS_BY_GROUP,
  SOURCE_CATEGORY_ICONS, SOURCE_METRIC_ICONS,
  type SourceCategoryId,
} from '../../../lib/icons/lookups';
import {
  bandIndex,
  anteilLabel,
  niveauLabel,
} from '../../../lib/dashboard/lesebeispiel-bands';
import LesebeispielSource from '../LesebeispielSource';
import HoverTooltip from '../../shared/HoverTooltip';
import { useHiddenColumns } from '../hooks/useHiddenColumns';
import { t } from '../../../lib/dashboard/translations';
import { filterSourcesBySearch } from '../../../lib/dashboard/data';
import { getCategoryDescription } from '../../../lib/dashboard/source-descriptions';

/** Whether a source metric uses the %-share band ("…Anteil") or the
 *  point-score band ("…Niveau"). Mirrors the convention in
 *  LesebeispielSource. */
function sourceMetricUsesAnteil(metric: SourceMetricType): boolean {
  return metric === 'search' || metric === 'perception';
}

/* SOURCE_METRIC_LABELS_FULL and SOURCE_GROUP_FULL_LABELS were retired
   in v3 (2026-05-26) — the per-cell hover dropped the "{metric} · {group}"
   title line, so the maps are no longer consumed. Column headers use the
   short labels from `METRIC_COLS` below. */

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Prop-shape parity with SourcesBalkenView / SourcesStripsView. Not
   *  consumed in this view yet. */
  sharedActions?: unknown;
  definitions?: unknown;
}

export interface SourcesTableViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

/** Sort target: 'source' (the alpha row-label sort) plus a string for
 *  any data column ID (metric in 'metric' mode, group in 'group' mode). */
type SortKey = 'source' | string;
type SortDir = 'asc' | 'desc';

interface MetricCol { key: SourceMetricType; label: string; flavor: 'metric'; }
interface GroupCol { key: SourceGroupId; label: string; flavor: 'group'; }
type ColSpec = MetricCol | GroupCol;

/** v3 (2026-05-26): Wahrnehmung moves to the trailing slot so the
 *  more "active" search/trust/prevention metrics lead — same column
 *  order Informationsquellen 2 (SourcesSpannweiteView) uses. */
const METRIC_COLS: MetricCol[] = [
  { key: 'search', label: 'Suche', flavor: 'metric' },
  { key: 'trust', label: 'Vertrauen', flavor: 'metric' },
  { key: 'prevention', label: 'Prävention', flavor: 'metric' },
  { key: 'perception', label: 'Wahrnehmung', flavor: 'metric' },
];

/** v4 (2026-05-26): pivot to group columns. Same 5 Zielgruppen as
 *  Informationsquellen 2 (SourcesSpannweiteView). */
const GROUP_COLS: GroupCol[] = [
  { key: 'adults', label: 'Erwachsene (18–70)', flavor: 'group' },
  { key: 'minors', label: 'Minderjährige (16–17)', flavor: 'group' },
  { key: 'consumers', label: 'Konsumierende', flavor: 'group' },
  { key: 'young_adults', label: 'Junge Erwachsene (18–26)', flavor: 'group' },
  { key: 'parents', label: 'Eltern', flavor: 'group' },
];

const GROUP_FULL_LABELS_DE: Record<SourceGroupId, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

const METRIC_FULL_LABELS_DE: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Prävention',
};

const SourcesTableView = forwardRef<SourcesTableViewHandle, Props>(
  function SourcesTableView({ state, update }, ref) {
    void update;
    // v4 (2026-05-26): pivot mode from the shared SourcesSpannweiteToolbar.
    // `state.sourcesStripsMode === 'metric'` → columns = the 4 metrics,
    // off-axis dimension = `state.sourceGroup` (one group fills all cells).
    // `'group'` → columns = the 5 Zielgruppen, off-axis = `state.sourceMetric`.
    const mode: SourcesStripsMode = state.sourcesStripsMode ?? 'metric';
    const selectedGroup: SourceGroupId = state.sourceGroup;
    const selectedMetric: SourceMetricType = state.sourceMetric;

    useImperativeHandle(ref, () => ({ getSvgElement: () => null }));

    const [sourceData, setSourceData] = useState<InformationSourcesData | null>(null);
    useEffect(() => {
      let cancelled = false;
      fetch('/data/information-sources.json')
        .then((r) => r.json() as Promise<InformationSourcesData>)
        .then((d) => { if (!cancelled) setSourceData(d); })
        .catch(() => undefined);
      return () => { cancelled = true; };
    }, []);

    const [sortKey, setSortKey] = useState<SortKey>('source');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // v5 (2026-05-26) — swap so the toggle label names the PICKER
    // dimension. 'metric' pivot → picker = metric, columns = 5 groups.
    // 'group' pivot → picker = group, columns = 4 metrics.
    const cols: ColSpec[] = mode === 'metric' ? GROUP_COLS : METRIC_COLS;
    const allColIds = cols.map((c) => c.key as string);

    // Hidden-column state is scoped per-mode so flipping the pivot
    // preserves each mode's hidden columns separately.
    const { hide, show, isHidden } = useHiddenColumns(
      `carm.sources-table.hidden.${mode}`,
      allColIds,
    );
    const lang = state.lang;

    // When the pivot changes the column schema changes too — reset
    // any data-column sort to the alpha sort on the source-label column.
    useEffect(() => {
      if (sortKey !== 'source') {
        setSortKey('source');
        setSortDir('asc');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    /** Cycle: same column → flip direction; new column → asc. */
    const cycleColumnSort = (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    };

    const rows = useMemo(() => {
      if (!sourceData) return [];
      const topLevel = sourceData.sources.filter((s) => s.parentId === null);
      // Universal source search (Fedor 2026-05-25 PM, item F): filter
      // by source.name case-insensitive before computing values.
      const searched = filterSourcesBySearch(topLevel, state.sourcesSearchQuery);
      return searched.map((src) => {
        const sourceKey = String(src.id);
        // v5: pivot label names the picker dimension; columns are
        // the OTHER dimension. 'metric' mode → picker = metric, cols =
        // groups → cells = data[selectedMetric][colGroup][source].
        // 'group' mode → picker = group, cols = metrics → cells =
        // data[colMetric][selectedGroup][source].
        const values: Record<string, number | null> = {};
        if (mode === 'metric') {
          for (const g of GROUP_COLS) {
            const raw = sourceData.metrics[selectedMetric]?.data?.[g.key]?.[sourceKey];
            values[g.key] = typeof raw === 'number' ? raw : null;
          }
        } else {
          for (const m of METRIC_COLS) {
            const raw = sourceData.metrics[m.key]?.data?.[selectedGroup]?.[sourceKey];
            values[m.key] = typeof raw === 'number' ? raw : null;
          }
        }
        return {
          source: src,
          categoryId: src.category as SourceCategoryId,
          values,
        };
      });
    }, [sourceData, mode, selectedGroup, selectedMetric, state.sourcesSearchQuery]);

    const sortedRows = useMemo(() => {
      const arr = [...rows];
      const cmpAz = (a: typeof arr[number], b: typeof arr[number]) =>
        a.source.name.localeCompare(b.source.name, 'de');
      arr.sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'source') {
          cmp = cmpAz(a, b);
        } else {
          const va = a.values[sortKey];
          const vb = b.values[sortKey];
          if (va === null && vb === null) cmp = cmpAz(a, b);
          else if (va === null) cmp = 1;
          else if (vb === null) cmp = -1;
          else cmp = va - vb;
          if (cmp === 0) cmp = cmpAz(a, b);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
      return arr;
    }, [rows, sortKey, sortDir]);

    if (!sourceData) {
      return (
        <div className="data-table-container">
          <p className="carm-spannweite__no-data" role="status">
            Daten werden geladen…
          </p>
        </div>
      );
    }

    const isAzActive = sortKey === 'source';
    // v5: off-axis label = the picker's selection (the fixed value
    // for this view). 'metric' mode → picker = metric, so label =
    // metric. 'group' mode → picker = group, so label = group.
    const offAxisLabel =
      mode === 'metric'
        ? METRIC_FULL_LABELS_DE[selectedMetric]
        : GROUP_FULL_LABELS_DE[selectedGroup];
    const MYTH_COL_PCT = 32;
    // Dynamic column widths — hidden columns collapse to 28 px;
    // visible columns share the remaining space evenly. Same pattern
    // as TableView.
    const hiddenCount = cols.filter((c) => isHidden(c.key as string)).length;
    const visibleCount = cols.length - hiddenCount;
    const visibleColWidth =
      visibleCount > 0
        ? `calc((${100 - MYTH_COL_PCT}% - 28px * ${hiddenCount}) / ${visibleCount})`
        : `${100 - MYTH_COL_PCT}%`;

    return (
      <div className="data-table-container carm-sources-table">
        {/* v4: the pivot toggle + "Wert für" picker now live in the
            shared SourcesSpannweiteToolbar above this view (rendered
            by MythenExplorer when state.view === 'sources_table'). The
            inline group picker that used to live here is retired. */}

        <table className="data-table" role="table" aria-label={`Informationsquellen — ${offAxisLabel}`}>
          <colgroup>
            <col style={{ width: `${MYTH_COL_PCT}%` }} />
            {cols.map((col) => (
              <col
                key={col.key}
                style={{
                  width: isHidden(col.key as string) ? '28px' : visibleColWidth,
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
                    labelText="Informationsquellen"
                    isAzActive={isAzActive}
                    azTooltip="Alphabetisch sortieren"
                    onAzClick={() => { setSortKey('source'); setSortDir('asc'); }}
                  />
                </div>
              </th>
              {cols.map((col) => {
                const colKey = col.key as string;
                const Icon =
                  col.flavor === 'metric'
                    ? SOURCE_METRIC_ICONS[col.key]
                    : AUDIENCE_ICONS_BY_GROUP[col.key];
                if (isHidden(colKey)) {
                  // Closed-column header — chev on top + dimension
                  // icon below + diagonal hatch body in tbody.
                  return (
                    <th
                      key={colKey}
                      className="data-table__hidden-th"
                      onClick={() => show(colKey)}
                      title={`${t('column.show', lang)} — ${col.label}`}
                      aria-label={`${t('column.show', lang)} — ${col.label}`}
                    >
                      <div
                        className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--hidden data-table__hidden-wrap"
                        role="columnheader"
                      >
                        <span className="carm-spannweite__hidden-chev" aria-hidden="true">▸</span>
                        <span className="carm-spannweite__hidden-icon" aria-hidden="true">
                          <Icon size={16} strokeWidth={1.75} />
                        </span>
                      </div>
                    </th>
                  );
                }
                const isSortCol = sortKey === colKey;
                const isAsc = isSortCol && sortDir === 'asc';
                const isDesc = isSortCol && sortDir === 'desc';
                const fullLabel = `${col.label} — ${offAxisLabel}`;
                return (
                  <th key={colKey} className="data-table__th">
                    <div
                      className="carm-spannweite__cell carm-spannweite__cell--header data-table__th-wrap"
                      role="columnheader"
                    >
                      <GridDataHeader
                        Icon={Icon}
                        label={col.label}
                        fullLabel={fullLabel}
                        hideLabel={`${t('column.hide', lang)} — ${col.label}`}
                        onHide={() => hide(colKey)}
                        isSortActive={isSortCol}
                        sortDir={isDesc ? 'desc' : 'asc'}
                        sortTooltip={
                          !isSortCol
                            ? `Nach ${col.label} sortieren`
                            : isAsc
                            ? `${col.label}: aufsteigend`
                            : `${col.label}: absteigend`
                        }
                        onSortClick={() => cycleColumnSort(colKey)}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const CategoryIcon = SOURCE_CATEGORY_ICONS[row.categoryId];
              // v3 (2026-05-26): source-label row header gets a
              // HoverTooltip mirroring Mythen-Tabelle's myth-label
              // tooltip — source name + category description, no
              // Lesebeispiel (no metric × group is pinned at the
              // label). The wrapper's half-width clamp keeps the card
              // fully on screen at both edges.
              const categoryDescription = getCategoryDescription(row.categoryId);
              const labelTooltipContent = (
                <div className="hover-tooltip__inner">
                  <div className="hover-tooltip__title">{row.source.name}</div>
                  {categoryDescription && (
                    <div className="carm-sources-tooltip__desc">
                      {categoryDescription}
                    </div>
                  )}
                </div>
              );
              return (
                <tr key={row.source.id} role="row">
                  <HoverTooltip content={labelTooltipContent}>
                    <td className="myth-cell">
                      <div className="carm-spannweite__cell carm-spannweite__cell--label data-table__myth-wrap carm-sources-table__label">
                        {CategoryIcon && (
                          <span
                            className="carm-sources-table__cat-icon"
                            aria-hidden="true"
                            style={{ color: `var(--source-${row.categoryId.replace(/_/g, '-')}, #6b7280)` }}
                          >
                            <CategoryIcon size={16} strokeWidth={1.75} />
                          </span>
                        )}
                        <span className="carm-sources-table__name">{row.source.name}</span>
                      </div>
                    </td>
                  </HoverTooltip>
                  {cols.map((col) => {
                    const colKey = col.key as string;
                    if (isHidden(colKey)) {
                      return (
                        <td
                          key={colKey}
                          className="data-table__hidden-td"
                          aria-hidden="true"
                        />
                      );
                    }
                    const val = row.values[colKey];
                    if (val === null) {
                      return (
                        <td key={colKey} className="value-cell na-value">
                          <span className="carm-spannweite__no-data data-table__na">
                            k. A.
                          </span>
                        </td>
                      );
                    }
                    // v4: pivot-aware (metric × group) resolution.
                    // In metric mode the column IS the metric and the
                    // group is selectedGroup; in group mode the column
                    // IS the group and the metric is selectedMetric.
                    const cellMetric: SourceMetricType =
                      col.flavor === 'metric' ? col.key : selectedMetric;
                    const cellGroup: SourceGroupId =
                      col.flavor === 'group' ? col.key : selectedGroup;
                    // Heatmap band + LesebeispielSource hover.
                    const rounded = Math.round(val);
                    const band = bandIndex(rounded);
                    const bandLabel = sourceMetricUsesAnteil(cellMetric)
                      ? anteilLabel(rounded)
                      : niveauLabel(rounded);
                    const categoryDescription = getCategoryDescription(row.categoryId);
                    const tooltipContent = (
                      <div className="hover-tooltip__inner">
                        <div className="hover-tooltip__title">
                          {row.source.name}
                        </div>
                        {categoryDescription && (
                          <div className="carm-sources-tooltip__desc">
                            {categoryDescription}
                          </div>
                        )}
                        <LesebeispielSource
                          metric={cellMetric}
                          value={val}
                          group={cellGroup}
                          compactHeading
                        />
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
                      <HoverTooltip key={colKey} content={tooltipContent}>
                        <td className={`value-cell value-cell--band-${band}`}>
                          {Math.round(val)}
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
    );
  },
);

export default SourcesTableView;
