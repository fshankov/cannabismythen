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
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  AppState,
  DashboardDefinitions,
  InformationSource,
  InformationSourcesData,
  SourceGroupId,
  SourceMetricType,
  SourcesStripsMode,
} from "../../../lib/dashboard/types";
import { GridDataHeader, GridLabelHeader } from "../grid";
import {
  AUDIENCE_ICONS_BY_GROUP,
  SOURCE_CATEGORY_ICONS,
  SOURCE_METRIC_ICONS,
  type SourceCategoryId,
} from "../../../lib/icons/lookups";
import {
  bandIndex,
  anteilLabel,
  niveauLabel,
} from "../../../lib/dashboard/lesebeispiel-bands";
import LesebeispielSource from "../LesebeispielSource";
import HoverTooltip from "../../shared/HoverTooltip";
import { useHiddenColumns } from "../hooks/useHiddenColumns";
import { t } from "../../../lib/dashboard/translations";
import { filterSourcesBySearch } from "../../../lib/dashboard/data";
import { getCategoryDescription } from "../../../lib/dashboard/source-descriptions";
import { getCategoryColor } from "../../../lib/dashboard/colors";
import {
  renderTableSvg,
  type TableRenderOpts,
} from "../../../lib/dashboard/table-svg";

/** Whether a source metric uses the %-share band ("…Anteil") or the
 *  point-score band ("…Niveau"). Mirrors the convention in
 *  LesebeispielSource. */
function sourceMetricUsesAnteil(metric: SourceMetricType): boolean {
  return metric === "search" || metric === "perception";
}

/* SOURCE_METRIC_LABELS_FULL and SOURCE_GROUP_FULL_LABELS were retired
   in v3 (2026-05-26) — the per-cell hover dropped the "{metric} · {group}"
   title line, so the maps are no longer consumed. Column headers use the
   short labels from `METRIC_COLS` below. */

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Prop-shape parity with SourcesBalkenView / SourcesSpannweiteView. Not
   *  consumed in this view yet. */
  sharedActions?: unknown;
  definitions?: DashboardDefinitions | null;
  /** Informationswege dataset, loaded once by MythenExplorer. */
  sourceData: InformationSourcesData | null;
}

export interface SourcesTableViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

/** Sort target: 'source' (the alpha row-label sort) plus a string for
 *  any data column ID (metric in 'metric' mode, group in 'group' mode). */
type SortKey = "source" | string;
type SortDir = "asc" | "desc";

interface MetricCol {
  key: SourceMetricType;
  label: string;
  short?: string;
  flavor: "metric";
}
interface GroupCol {
  key: SourceGroupId;
  label: string;
  short?: string;
  flavor: "group";
}
type ColSpec = MetricCol | GroupCol;

/** v3 (2026-05-26): Wahrnehmung moves to the trailing slot so the
 *  more "active" search/trust/prevention metrics lead — same column
 *  order Informationsquellen 2 (SourcesSpannweiteView) uses. */
// Column order (Fedor 2026-05-29): Suche · Wahrnehmung · Vertrauen ·
// Prävention — matches SourcesSpannweiteView's METRICS so Tabelle and
// Übersicht read the same left→right.
const METRIC_COLS: MetricCol[] = [
  { key: "search", label: "Suche", flavor: "metric" },
  { key: "perception", label: "Wahrnehmung", flavor: "metric" },
  { key: "trust", label: "Vertrauen", flavor: "metric" },
  { key: "prevention", label: "Prävention", flavor: "metric" },
];

/** v4 (2026-05-26): pivot to group columns. Same 5 Zielgruppen as
 *  Informationsquellen 2 (SourcesSpannweiteView). */
// `short` = column-header label (Erw./Minderj./…, matching
// Mythen-Übersicht); `label` stays the full form for tooltips + aria
// (Fedor 2026-05-29).
const GROUP_COLS: GroupCol[] = [
  {
    key: "adults",
    label: "Erwachsene (18–70)",
    short: "Erw.",
    flavor: "group",
  },
  {
    key: "minors",
    label: "Minderjährige (16–17)",
    short: "Minderj.",
    flavor: "group",
  },
  {
    key: "consumers",
    label: "Konsumierende",
    short: "Konsum.",
    flavor: "group",
  },
  {
    key: "young_adults",
    label: "Junge Erwachsene (18–26)",
    short: "Junge Erw.",
    flavor: "group",
  },
  { key: "parents", label: "Eltern", short: "Eltern", flavor: "group" },
];

/** Canonical category order for the category sort — mirrors
 *  SourcesSpannweiteView so all three Quellen tabs rank categories
 *  identically (Fedor 2026-05-29). */
const CATEGORY_ORDER: Record<string, number> = {
  institutional: 1,
  internet: 2,
  social_media: 3,
  traditional_media: 4,
  print_physical: 5,
  personal: 6,
};

const GROUP_FULL_LABELS_DE: Record<SourceGroupId, string> = {
  adults: "Erwachsene (18–70)",
  minors: "Minderjährige (16–17)",
  consumers: "Konsumierende",
  young_adults: "Junge Erwachsene (18–26)",
  parents: "Eltern",
};

const METRIC_FULL_LABELS_DE: Record<SourceMetricType, string> = {
  search: "Suche",
  perception: "Wahrnehmung",
  trust: "Vertrauen",
  prevention: "Prävention",
};

const SourcesTableView = forwardRef<SourcesTableViewHandle, Props>(
  function SourcesTableView({ state, update, definitions, sourceData }, ref) {
    // 2026-05-29: expandable parent/child source rows, reusing the shared
    // `sourcesSpannweiteExpanded` state (consistent across all Quellen tabs).
    const expanded = state.sourcesSpannweiteExpanded;
    const toggleExpanded = (parentId: number) => {
      const next = expanded.includes(parentId)
        ? expanded.filter((id) => id !== parentId)
        : [...expanded, parentId];
      update("sourcesSpannweiteExpanded", next);
    };
    // v4 (2026-05-26): pivot mode from the shared SourcesSpannweiteToolbar.
    // `state.sourcesStripsMode === 'metric'` → columns = the 4 metrics,
    // off-axis dimension = `state.sourceGroup` (one group fills all cells).
    // `'group'` → columns = the 5 Zielgruppen, off-axis = `state.sourceMetric`.
    const mode: SourcesStripsMode = state.sourcesStripsMode ?? "metric";
    const selectedGroup: SourceGroupId = state.sourceGroup;
    const selectedMetric: SourceMetricType = state.sourceMetric;

    const renderDataRef = useRef<TableRenderOpts | null>(null);
    useImperativeHandle(ref, () => ({
      getSvgElement: () => {
        if (!renderDataRef.current || renderDataRef.current.rows.length === 0)
          return null;
        try {
          return renderTableSvg(renderDataRef.current);
        } catch {
          return null;
        }
      },
    }));

    const [sortKey, setSortKey] = useState<SortKey>("source");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // v5 (2026-05-26) — swap so the toggle label names the PICKER
    // dimension. 'metric' pivot → picker = metric, columns = 5 groups.
    // 'group' pivot → picker = group, columns = 4 metrics.
    const cols: ColSpec[] = mode === "metric" ? GROUP_COLS : METRIC_COLS;
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
      if (sortKey !== "source") {
        setSortKey("source");
        setSortDir("asc");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    /** Cycle: same column → flip direction; new column → asc. */
    const cycleColumnSort = (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    };

    // Per-column value record for any source (v5 pivot logic).
    const computeValues = useMemo(() => {
      return (src: InformationSource): Record<string, number | null> => {
        const sourceKey = String(src.id);
        const values: Record<string, number | null> = {};
        if (!sourceData) return values;
        if (mode === "metric") {
          for (const g of GROUP_COLS) {
            const raw =
              sourceData.metrics[selectedMetric]?.data?.[g.key]?.[sourceKey];
            values[g.key] = typeof raw === "number" ? raw : null;
          }
        } else {
          for (const m of METRIC_COLS) {
            const raw =
              sourceData.metrics[m.key]?.data?.[selectedGroup]?.[sourceKey];
            values[m.key] = typeof raw === "number" ? raw : null;
          }
        }
        return values;
      };
    }, [sourceData, mode, selectedGroup, selectedMetric]);

    // Children grouped by parent id (2026-05-29 subcategories).
    const childrenByParent = useMemo(() => {
      const m = new Map<number, InformationSource[]>();
      if (!sourceData) return m;
      for (const s of sourceData.sources) {
        if (s.parentId !== null) {
          const arr = m.get(s.parentId) ?? [];
          arr.push(s);
          m.set(s.parentId, arr);
        }
      }
      return m;
    }, [sourceData]);

    type SrcTableRow = {
      source: InformationSource;
      categoryId: SourceCategoryId;
      values: Record<string, number | null>;
      isChild: boolean;
      hasChildren: boolean;
    };
    const rows = useMemo<SrcTableRow[]>(() => {
      if (!sourceData) return [];
      const topLevel = sourceData.sources.filter((s) => s.parentId === null);
      // Universal source search (Fedor 2026-05-25 PM, item F).
      const searched = filterSourcesBySearch(
        topLevel,
        state.sourcesSearchQuery,
      );
      return searched.map((src) => ({
        source: src,
        categoryId: src.category as SourceCategoryId,
        values: computeValues(src),
        isChild: false,
        hasChildren: (childrenByParent.get(src.id)?.length ?? 0) > 0,
      }));
    }, [sourceData, state.sourcesSearchQuery, computeValues, childrenByParent]);

    const sortedRows = useMemo(() => {
      const arr = [...rows];
      const cmpAz = (a: SrcTableRow, b: SrcTableRow) =>
        a.source.name.localeCompare(b.source.name, "de");
      arr.sort((a, b) => {
        let cmp = 0;
        if (sortKey === "source") {
          cmp = cmpAz(a, b);
        } else if (sortKey === "category") {
          // 2026-05-29: category sort (same control as Quellen-Übersicht).
          const oa = CATEGORY_ORDER[a.source.category] ?? 99;
          const ob = CATEGORY_ORDER[b.source.category] ?? 99;
          cmp = oa !== ob ? oa - ob : cmpAz(a, b);
        } else {
          const va = a.values[sortKey];
          const vb = b.values[sortKey];
          if (va === null && vb === null) cmp = cmpAz(a, b);
          else if (va === null) cmp = 1;
          else if (vb === null) cmp = -1;
          else cmp = va - vb;
          if (cmp === 0) cmp = cmpAz(a, b);
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
      return arr;
    }, [rows, sortKey, sortDir]);

    // Interleave child sub-source rows under each expanded parent.
    const displayRows = useMemo<SrcTableRow[]>(() => {
      const expandedSet = new Set(expanded);
      const out: SrcTableRow[] = [];
      for (const p of sortedRows) {
        out.push(p);
        if (p.hasChildren && expandedSet.has(p.source.id)) {
          const kids: SrcTableRow[] = (childrenByParent.get(p.source.id) ?? [])
            .map((src) => ({
              source: src,
              categoryId: src.category as SourceCategoryId,
              values: computeValues(src),
              isChild: true,
              hasChildren: false,
            }))
            .sort((a, b) => a.source.name.localeCompare(b.source.name, "de"));
          out.push(...kids);
        }
      }
      return out;
    }, [sortedRows, expanded, childrenByParent, computeValues]);

    // Export SVG payload — built DURING render so the handle is never
    // stale/null when ExportDrawer reads it.
    const visExportCols = cols.filter((c) => !isHidden(c.key as string));
    renderDataRef.current = {
      labelHeader: lang === "de" ? "INFORMATIONSWEGE" : "SOURCES",
      columns: visExportCols.map((c) => ({ label: c.short ?? c.label })),
      lang,
      rows: displayRows.map((row) => {
        const cells: string[] = [];
        const naMask: boolean[] = [];
        for (const c of visExportCols) {
          const v = row.values[c.key as string];
          naMask.push(v == null);
          cells.push(v == null ? "" : String(Math.round(v)));
        }
        return {
          label: row.source.name,
          accent: getCategoryColor(row.categoryId),
          isChild: row.isChild,
          cells,
          naMask,
        };
      }),
    };

    if (!sourceData) {
      return (
        <div className="data-table-container">
          <p className="carm-spannweite__no-data" role="status">
            Daten werden geladen…
          </p>
        </div>
      );
    }

    const isAzActive = sortKey === "source";
    // Category sort (2026-05-29) — same control as Quellen-Übersicht.
    const isCatActive = sortKey === "category";
    const catTooltip = isCatActive
      ? sortDir === "asc"
        ? t("sources.sort.category.asc.tooltip", lang)
        : t("sources.sort.category.desc.tooltip", lang)
      : t("sources.sort.category.activate.tooltip", lang);
    // v5: off-axis label = the picker's selection (the fixed value
    // for this view). 'metric' mode → picker = metric, so label =
    // metric. 'group' mode → picker = group, so label = group.
    const offAxisLabel =
      mode === "metric"
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

        <table
          className="data-table"
          role="table"
          aria-label={`Informationsquellen — ${offAxisLabel}`}
        >
          <colgroup>
            <col style={{ width: `${MYTH_COL_PCT}%` }} />
            {cols.map((col) => (
              <col
                key={col.key}
                style={{
                  width: isHidden(col.key as string) ? "28px" : visibleColWidth,
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
                    labelText="Informationswege"
                    isAzActive={isAzActive}
                    azTooltip="Alphabetisch sortieren"
                    onAzClick={() => {
                      setSortKey("source");
                      setSortDir("asc");
                    }}
                    categoryRank={{
                      isActive: isCatActive,
                      direction:
                        isCatActive && sortDir === "desc" ? "desc" : "asc",
                      tooltip: catTooltip,
                      onClick: () => {
                        if (sortKey !== "category") {
                          setSortKey("category");
                          setSortDir("asc");
                        } else {
                          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        }
                      },
                    }}
                  />
                </div>
              </th>
              {cols.map((col) => {
                const colKey = col.key as string;
                const Icon =
                  col.flavor === "metric"
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
                      title={`${t("column.show", lang)} — ${col.label}`}
                      aria-label={`${t("column.show", lang)} — ${col.label}`}
                    >
                      <div
                        className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--hidden data-table__hidden-wrap"
                        role="columnheader"
                      >
                        <span
                          className="carm-spannweite__hidden-chev"
                          aria-hidden="true"
                        >
                          ▸
                        </span>
                        <span
                          className="carm-spannweite__hidden-icon"
                          aria-hidden="true"
                        >
                          <Icon size={16} strokeWidth={1.75} />
                        </span>
                      </div>
                    </th>
                  );
                }
                const isSortCol = sortKey === colKey;
                const isAsc = isSortCol && sortDir === "asc";
                const isDesc = isSortCol && sortDir === "desc";
                const fullLabel = `${col.label} — ${offAxisLabel}`;
                // BugHerd 4.13 (2026-06-03, ISD): wire the ℹ️ definition tooltip
                // onto Quellen-Tabelle headers, mirroring the Mythen Tabelle.
                // Metric columns pull from sourcesIndicators, group columns from
                // groups (src/content/dashboard-definitionen.json). Group columns
                // also surface the sample-size badge (n = …) so the (i) tooltip
                // matches Quellen-Übersicht exactly (Fedor 2026-06-15).
                const colDef =
                  col.flavor === "metric"
                    ? definitions?.sourcesIndicators?.[colKey]
                    : definitions?.groups?.[colKey];
                return (
                  <th key={colKey} className="data-table__th">
                    <div
                      className="carm-spannweite__cell carm-spannweite__cell--header data-table__th-wrap"
                      role="columnheader"
                    >
                      <GridDataHeader
                        Icon={Icon}
                        label={col.short ?? col.label}
                        fullLabel={fullLabel}
                        defTitle={colDef?.label}
                        defText={colDef?.definition}
                        defScale={colDef?.scale}
                        defSampleSize={
                          col.flavor === "group"
                            ? colDef?.sampleSize
                            : undefined
                        }
                        hideLabel={`${t("column.hide", lang)} — ${col.label}`}
                        onHide={() => hide(colKey)}
                        isSortActive={isSortCol}
                        sortDir={isDesc ? "desc" : "asc"}
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
            {displayRows.map((row) => {
              const CategoryIcon = SOURCE_CATEGORY_ICONS[row.categoryId];
              const isExpanded = expanded.includes(row.source.id);
              // v3 (2026-05-26): source-label row header gets a
              // HoverTooltip mirroring Mythen-Tabelle's myth-label
              // tooltip — source name + category description, no
              // Lesebeispiel (no metric × group is pinned at the
              // label). The wrapper's half-width clamp keeps the card
              // fully on screen at both edges.
              const categoryDescription = getCategoryDescription(
                row.categoryId,
              );
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
                <tr
                  key={row.source.id}
                  role="row"
                  className={
                    row.isChild ? "carm-sources-table__row--child" : undefined
                  }
                >
                  <HoverTooltip content={labelTooltipContent}>
                    <td className="myth-cell">
                      <div className="carm-spannweite__cell carm-spannweite__cell--label data-table__myth-wrap carm-sources-table__label">
                        {row.hasChildren ? (
                          <button
                            type="button"
                            className="carm-sources-spannweite__chev"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(row.source.id);
                            }}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? `Unterquellen von ${row.source.name} einklappen`
                                : `Unterquellen von ${row.source.name} anzeigen`
                            }
                            title={
                              isExpanded
                                ? "Unterquellen einklappen"
                                : "Unterquellen anzeigen"
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown
                                size={14}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronRight
                                size={14}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        ) : (
                          <span
                            className="carm-sources-spannweite__chev-spacer"
                            aria-hidden="true"
                          />
                        )}
                        {CategoryIcon && (
                          <span
                            className="carm-sources-table__cat-icon"
                            aria-hidden="true"
                            /* 2026-05-29: use getCategoryColor (the
                               Quellen-Balken palette) so icons match the
                               other two Quellen tabs. */
                            style={{ color: getCategoryColor(row.categoryId) }}
                          >
                            <CategoryIcon size={16} strokeWidth={1.75} />
                          </span>
                        )}
                        <span className="carm-sources-table__name">
                          {row.source.name}
                        </span>
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
                      col.flavor === "metric" ? col.key : selectedMetric;
                    const cellGroup: SourceGroupId =
                      col.flavor === "group" ? col.key : selectedGroup;
                    // Heatmap band + LesebeispielSource hover.
                    const rounded = Math.round(val);
                    const band = bandIndex(rounded);
                    const bandLabel = sourceMetricUsesAnteil(cellMetric)
                      ? anteilLabel(rounded)
                      : niveauLabel(rounded);
                    const categoryDescription = getCategoryDescription(
                      row.categoryId,
                    );
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
                            "hover-tooltip__band " +
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
