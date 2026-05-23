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
} from '../../../lib/dashboard/types';
import {
  GridDataHeader, GridLabelHeader,
} from '../grid';
import DataPicker, { type DataPickerOption } from '../controls/DataPicker';
import {
  AUDIENCE_ICONS_BY_GROUP,
  SOURCE_CATEGORY_ICONS, SOURCE_METRIC_ICONS,
  type SourceCategoryId,
} from '../../../lib/icons/lookups';

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

type SortKey = 'source' | SourceMetricType;
type SortDir = 'asc' | 'desc';

const METRIC_COLS: { key: SourceMetricType; label: string }[] = [
  { key: 'search', label: 'Suche' },
  { key: 'perception', label: 'Wahrnehmung' },
  { key: 'trust', label: 'Vertrauen' },
  { key: 'prevention', label: 'Prävention' },
];

const GROUP_OPTIONS: DataPickerOption<SourceGroupId>[] = [
  { value: 'adults', label: 'Erwachsene (18–70)', Icon: AUDIENCE_ICONS_BY_GROUP.adults },
  { value: 'minors', label: 'Minderjährige (16–17)', Icon: AUDIENCE_ICONS_BY_GROUP.minors },
  { value: 'consumers', label: 'Konsumierende', Icon: AUDIENCE_ICONS_BY_GROUP.consumers },
  { value: 'young_adults', label: 'Junge Erwachsene (18–26)', Icon: AUDIENCE_ICONS_BY_GROUP.young_adults },
  { value: 'parents', label: 'Eltern', Icon: AUDIENCE_ICONS_BY_GROUP.parents },
];

const SourcesTableView = forwardRef<SourcesTableViewHandle, Props>(
  function SourcesTableView({ state, update }, ref) {
    const selectedGroup: SourceGroupId = state.sourceGroup;

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
      return sourceData.sources
        .filter((s) => s.parentId === null)
        .map((src) => {
          const values: Record<SourceMetricType, number | null> = {
            search: null, perception: null, trust: null, prevention: null,
          };
          for (const m of METRIC_COLS) {
            const raw = sourceData.metrics[m.key]?.data?.[selectedGroup]?.[String(src.id)];
            values[m.key] = typeof raw === 'number' ? raw : null;
          }
          return {
            source: src,
            categoryId: src.category as SourceCategoryId,
            values,
          };
        });
    }, [sourceData, selectedGroup]);

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
    const groupLabel =
      GROUP_OPTIONS.find((o) => o.value === selectedGroup)?.label ?? selectedGroup;
    const MYTH_COL_PCT = 32;
    const metricColWidth = `calc((${100 - MYTH_COL_PCT}%) / ${METRIC_COLS.length})`;

    return (
      <div className="data-table-container carm-sources-table">
        {/* Top picker row — group only (all 4 metrics render side-by-side). */}
        <div className="carm-toolbar-row carm-sources-table__toolbar">
          <div className="carm-toolbar-row__pickers">
            <div className="carm-toolbar-row__picker">
              <DataPicker
                caption="Bevölkerungsgruppe"
                value={selectedGroup}
                options={GROUP_OPTIONS}
                onChange={(v) => update('sourceGroup', v)}
                aria-label="Bevölkerungsgruppe auswählen"
              />
            </div>
          </div>
        </div>

        <table className="data-table" role="table" aria-label={`Informationsquellen — ${groupLabel}`}>
          <colgroup>
            <col style={{ width: `${MYTH_COL_PCT}%` }} />
            {METRIC_COLS.map((col) => (
              <col key={col.key} style={{ width: metricColWidth }} />
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
              {METRIC_COLS.map((col) => {
                const Icon = SOURCE_METRIC_ICONS[col.key];
                const isSortCol = sortKey === col.key;
                const isAsc = isSortCol && sortDir === 'asc';
                const isDesc = isSortCol && sortDir === 'desc';
                const fullLabel = `${col.label} — ${groupLabel}`;
                return (
                  <th key={col.key} className="data-table__th">
                    <div
                      className="carm-spannweite__cell carm-spannweite__cell--header data-table__th-wrap"
                      role="columnheader"
                    >
                      <GridDataHeader
                        Icon={Icon}
                        label={col.label}
                        fullLabel={fullLabel}
                        hideLabel=""
                        onHide={() => undefined}
                        isSortActive={isSortCol}
                        sortDir={isDesc ? 'desc' : 'asc'}
                        sortTooltip={
                          !isSortCol
                            ? `Nach ${col.label} sortieren`
                            : isAsc
                            ? `${col.label}: aufsteigend`
                            : `${col.label}: absteigend`
                        }
                        onSortClick={() => cycleColumnSort(col.key)}
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
              return (
                <tr key={row.source.id} role="row">
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
                  {METRIC_COLS.map((col) => {
                    const val = row.values[col.key];
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
                        {Math.round(val)}
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
  },
);

export default SourcesTableView;
