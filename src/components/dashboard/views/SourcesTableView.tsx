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

type SortKey = 'source' | SourceMetricType;
type SortDir = 'asc' | 'desc';

/** v3 (2026-05-26): Wahrnehmung moves to the trailing slot so the
 *  more "active" search/trust/prevention metrics lead — same column
 *  order Informationsquellen 2 (SourcesSpannweiteView) uses. */
const METRIC_COLS: { key: SourceMetricType; label: string }[] = [
  { key: 'search', label: 'Suche' },
  { key: 'trust', label: 'Vertrauen' },
  { key: 'prevention', label: 'Prävention' },
  { key: 'perception', label: 'Wahrnehmung' },
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

    // Column hiding (Fedor 2026-05-25 PM, item E): mirror Mythen-Tabelle
    // — useHiddenColumns persists per-column visibility in localStorage.
    const allMetricIds = METRIC_COLS.map((c) => c.key as string);
    const { hide, show, isHidden } = useHiddenColumns(
      'carm.sources-table.hidden',
      allMetricIds,
    );
    const lang = state.lang;

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
      // by source.name case-insensitive before computing per-source
      // metric values.
      const searched = filterSourcesBySearch(topLevel, state.sourcesSearchQuery);
      return searched.map((src) => {
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
    }, [sourceData, selectedGroup, state.sourcesSearchQuery]);

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
    // Dynamic column widths — hidden columns collapse to 28 px;
    // visible columns share the remaining space evenly. Same pattern
    // as TableView.
    const hiddenCount = METRIC_COLS.filter((c) => isHidden(c.key)).length;
    const visibleCount = METRIC_COLS.length - hiddenCount;
    const visibleMetricWidth =
      visibleCount > 0
        ? `calc((${100 - MYTH_COL_PCT}% - 28px * ${hiddenCount}) / ${visibleCount})`
        : `${100 - MYTH_COL_PCT}%`;

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
              <col
                key={col.key}
                style={{
                  width: isHidden(col.key) ? '28px' : visibleMetricWidth,
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
              {METRIC_COLS.map((col) => {
                const Icon = SOURCE_METRIC_ICONS[col.key];
                if (isHidden(col.key)) {
                  // Closed-column header — chev on top + metric icon
                  // below + diagonal hatch body in tbody (item D).
                  return (
                    <th
                      key={col.key}
                      className="data-table__hidden-th"
                      onClick={() => show(col.key)}
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
                        hideLabel={`${t('column.hide', lang)} — ${col.label}`}
                        onHide={() => hide(col.key)}
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
                  {METRIC_COLS.map((col) => {
                    // Hidden-column body — empty cell with the
                    // diagonal hatch background. Same pattern as
                    // Mythen-Tabelle (.data-table__hidden-td uses
                    // the same striped background as the Spannweite
                    // hidden-body).
                    if (isHidden(col.key)) {
                      return (
                        <td
                          key={col.key}
                          className="data-table__hidden-td"
                          aria-hidden="true"
                        />
                      );
                    }
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
                    // Heatmap band + LesebeispielSource hover (Fedor
                    // 2026-05-25 PM): same 7-band tint and same
                    // Lesebeispiel-style hover that the popup table
                    // and the Mythen-Tabelle use, applied to the
                    // source-axis metrics.
                    const rounded = Math.round(val);
                    const band = bandIndex(rounded);
                    const bandLabel = sourceMetricUsesAnteil(col.key)
                      ? anteilLabel(rounded)
                      : niveauLabel(rounded);
                    // v3 (2026-05-26): hover content now mirrors the
                    // Quellen Balken/Spannweite tooltip — source name
                    // + per-category description + Lesebeispiel. The
                    // metric × group line is dropped because the
                    // Lesebeispiel sentence carries that context
                    // narratively. The 7-band tag stays as a quick
                    // magnitude marker.
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
                          metric={col.key}
                          value={val}
                          group={selectedGroup}
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
                      <HoverTooltip key={col.key} content={tooltipContent}>
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
