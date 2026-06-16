/**
 * SourcesBalkenView — Balken-style overview of information sources.
 *
 * Travel pipeline 2026-05-23 — Stage 3B. Replaces SourcesStripsView in the
 * right-side first tab so Mythen and Quellen share the same visual idiom
 * (grid + lollipop bar + sortable column headers).
 *
 * Differences from the LEFT BalkenView (which renders Myth × indicator):
 *   - rows are top-level information sources (parentId === null)
 *   - one value column = active SourceMetricType × active SourceGroupId
 *   - bar/dot colored via the source's category accent (no verdict)
 *   - label cell shows source category icon + name (no verdict arrow)
 *   - sort = A-Z (default) or value-asc / value-desc
 *   - getSvgElement() returns null — export route still hooks the ref
 *     but produces no chart image for this view (a follow-up sub-PR
 *     wires the export pipeline if needed).
 *
 * Toolbar pickers (metric + group) are owned by the existing
 * dashboard ToolbarRow when rendered for the sources tab — this
 * view reads state.sourceMetric / state.sourceGroup directly.
 */
import {
  forwardRef, useCallback, useImperativeHandle, useMemo,
  useRef, useState,
} from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type {
  AppState, DashboardDefinitions, InformationSource, InformationSourcesData,
  SourceGroupId, SourceMetricType,
} from '../../../lib/dashboard/types';
import {
  GridDataHeader, GridLabelHeader,
  BalkenBar, SourcesHoverTooltip,
} from '../grid';
import {
  SOURCE_CATEGORY_ICONS, SOURCE_METRIC_ICONS,
  type SourceCategoryId,
} from '../../../lib/icons/lookups';
import { filterSourcesBySearch } from '../../../lib/dashboard/data';
import { getCategoryColor } from '../../../lib/dashboard/colors';
import { renderSourcesSpannweiteSvg } from '../../../lib/dashboard/sources-spannweite-svg';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Definitions singleton — supplies the ℹ️ metric tooltip on the data
   *  column header (BugHerd 4.13, 2026-06-03). Source-metric defs live in
   *  src/content/dashboard-definitionen.json (sourcesIndicators). */
  definitions?: DashboardDefinitions | null;
  /** Informationswege dataset, loaded once by MythenExplorer. */
  sourceData: InformationSourcesData | null;
}

export interface SourcesBalkenViewHandle {
  /** Synthetic export SVG (numbered circles) built on demand from the
   *  current render data — mirrors SourcesSpannweiteView. */
  getSvgElement: () => SVGSVGElement | null;
}

type SortMode = 'a-z' | 'value-asc' | 'value-desc' | 'category-asc' | 'category-desc';

/** Canonical category order for the category sort — mirrors
 *  SourcesSpannweiteView's CATEGORY_ORDER so Quellen-Balken /
 *  -Übersicht / -Tabelle all rank categories the same way (Fedor
 *  2026-05-29: add the category sort to Balken + Tabelle too). */
const CATEGORY_ORDER: Record<string, number> = {
  institutional: 1,
  internet: 2,
  social_media: 3,
  traditional_media: 4,
  print_physical: 5,
  personal: 6,
};

/** Label for the active source metric — shows in the data column header. */
const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Prävention',
};

/** Label for the active group — used inside the column header tooltip
 *  and the value-cell aria-label. */
const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

/** Category color now lives in `src/lib/dashboard/colors.ts`
 *  (`SOURCE_CATEGORY_COLORS` + `getCategoryColor`) so the BalkenBar
 *  primitive and the SourcesHoverTooltip share a single source of
 *  truth with the CSS-side `--source-*` tokens in global.css. */

// (METRIC_OPTIONS / GROUP_OPTIONS moved to SourcesBalkenToolbar.tsx on
//  2026-05-29 — the picker UI now lives in the panel-level toolbar.)

const SourcesBalkenView = forwardRef<SourcesBalkenViewHandle, Props>(
  function SourcesBalkenView({ state, update, definitions, sourceData }, ref) {
    const selectedMetric: SourceMetricType = state.sourceMetric;
    const selectedGroup: SourceGroupId = state.sourceGroup;

    // Export SVG handle — built on demand from `renderDataRef`, which is
    // synced to the on-screen rows every render (mirrors SourcesSpannweiteView).
    const renderDataRef = useRef<{
      rows: { sourceId: number; name: string; categoryColor: string; isChild: boolean }[];
      columns: { id: string; label: string }[];
      cellValue: (sourceId: number, colId: string) => number | null;
      lang: typeof state.lang;
    } | null>(null);
    useImperativeHandle(ref, () => ({
      getSvgElement: () => {
        if (!renderDataRef.current) return null;
        try {
          return renderSourcesSpannweiteSvg(renderDataRef.current);
        } catch {
          return null;
        }
      },
    }));

    // Sort lives locally in this view — no URL state hook needed for the
    // first iteration. (URL persistence can ride atop a future sub-PR.)
    const [sort, setSort] = useState<SortMode>('a-z');

    // 2026-05-29: expandable parent/child source rows — same pattern as
    // Quellen-Übersicht (SourcesSpannweiteView). Reuses the shared
    // `sourcesSpannweiteExpanded` state so expand/collapse is consistent
    // across both Quellen views.
    const expanded = state.sourcesSpannweiteExpanded;
    const toggleExpanded = useCallback(
      (parentId: number) => {
        const next = expanded.includes(parentId)
          ? expanded.filter((id) => id !== parentId)
          : [...expanded, parentId];
        update('sourcesSpannweiteExpanded', next);
      },
      [expanded, update],
    );

    /** Resolved rows: parent sources (filtered by search + sorted), each
     *  followed by its child sub-sources when the parent is expanded.
     *  Children carry `isChild` so the row indents + dims (matching
     *  Quellen-Übersicht). Each row's bar value comes from its own id. */
    type SrcRow = {
      source: InformationSource;
      value: number | null;
      categoryId: SourceCategoryId;
      isChild: boolean;
      hasChildren: boolean;
    };
    const resolvedRows = useMemo<SrcRow[]>(() => {
      if (!sourceData) return [];
      const metricDef = sourceData.metrics[selectedMetric];
      if (!metricDef) return [];
      const valueMap = metricDef.data[selectedGroup] ?? {};
      const valueOf = (src: InformationSource): number | null => {
        const raw = valueMap[String(src.id)];
        return typeof raw === 'number' ? raw : null;
      };

      // Group children by parent id.
      const childrenByParent = new Map<number, InformationSource[]>();
      for (const s of sourceData.sources) {
        if (s.parentId !== null) {
          const arr = childrenByParent.get(s.parentId) ?? [];
          arr.push(s);
          childrenByParent.set(s.parentId, arr);
        }
      }

      const topLevel = sourceData.sources.filter((s) => s.parentId === null);
      const searched = filterSourcesBySearch(topLevel, state.sourcesSearchQuery);

      const cmpAz = (a: SrcRow, b: SrcRow) =>
        a.source.name.localeCompare(b.source.name, 'de');
      const cmpVal = (dir: number) => (a: SrcRow, b: SrcRow) => {
        if (a.value === null && b.value === null) return cmpAz(a, b);
        if (a.value === null) return 1;
        if (b.value === null) return -1;
        if (a.value !== b.value) return dir * (a.value - b.value);
        return cmpAz(a, b);
      };
      const cmpCat = (dir: number) => (a: SrcRow, b: SrcRow) => {
        const oa = CATEGORY_ORDER[a.source.category] ?? 99;
        const ob = CATEGORY_ORDER[b.source.category] ?? 99;
        if (oa !== ob) return dir * (oa - ob);
        return cmpAz(a, b);
      };
      // Parents honour every sort mode; children only ever sort by value
      // or A-Z (category grouping applies at the parent level).
      const parentSorter =
        sort === 'value-asc' ? cmpVal(1)
        : sort === 'value-desc' ? cmpVal(-1)
        : sort === 'category-asc' ? cmpCat(1)
        : sort === 'category-desc' ? cmpCat(-1)
        : cmpAz;
      const childSorter =
        sort === 'value-asc' ? cmpVal(1) : sort === 'value-desc' ? cmpVal(-1) : cmpAz;

      const parentRows: SrcRow[] = searched.map((src) => ({
        source: src,
        value: valueOf(src),
        categoryId: src.category as SourceCategoryId,
        isChild: false,
        hasChildren: (childrenByParent.get(src.id)?.length ?? 0) > 0,
      }));
      parentRows.sort(parentSorter);

      const expandedSet = new Set(expanded);
      const out: SrcRow[] = [];
      for (const p of parentRows) {
        out.push(p);
        if (p.hasChildren && expandedSet.has(p.source.id)) {
          const kids: SrcRow[] = (childrenByParent.get(p.source.id) ?? []).map((src) => ({
            source: src,
            value: valueOf(src),
            categoryId: src.category as SourceCategoryId,
            isChild: true,
            hasChildren: false,
          }));
          kids.sort(childSorter);
          out.push(...kids);
        }
      }
      return out;
    }, [sourceData, selectedMetric, selectedGroup, state.sourcesSearchQuery, sort, expanded]);

    const handleValueSortClick = useCallback(() => {
      if (sort === 'value-asc') setSort('value-desc');
      else if (sort === 'value-desc') setSort('value-asc');
      else setSort('value-asc');
    }, [sort]);

    // ── Hover state (Spannweite-style rich card via SourcesHoverTooltip,
    //    2026-05-26). Mirrors BalkenView's handleHover pattern: clamp
    //    the X position so the 360 px-wide card never extends past the
    //    viewport edge near the left/right gutter. ─────────────────────
    const [hoveredSourceId, setHoveredSourceId] = useState<number | null>(null);
    const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // v3 (2026-05-26): width bumped from 360 → 420 to match the
    // actual `.carm-spannweite__tooltip { max-width: 420px }` CSS rule.
    // The old 360 underestimate caused the left half of the tooltip
    // to spill past the viewport on long source names ("Fernsehen
    // (Info- / Diskussionssendungen)") when hovering near the left
    // edge. Margin 12 → 24 matches BalkenView's breathing room.
    const TOOLTIP_MAX_W = 420;
    const VIEWPORT_MARGIN = 24;
    const handleHover = useCallback(
      (sourceId: number, e: React.MouseEvent) => {
        setHoveredSourceId(sourceId);
        const halfW = TOOLTIP_MAX_W / 2;
        const minX = halfW + VIEWPORT_MARGIN;
        const maxX =
          (typeof window !== 'undefined' ? window.innerWidth : 1280) -
          halfW -
          VIEWPORT_MARGIN;
        const clampedX = Math.max(minX, Math.min(maxX, e.clientX));
        setHoverPos({ x: clampedX, y: e.clientY });
      },
      [],
    );
    const handleLeave = useCallback(() => {
      setHoveredSourceId(null);
      setHoverPos(null);
    }, []);

    // Sync the export render-data DURING render (not in a useEffect) so the
    // export handle is never stale/null when ExportDrawer reads it — the
    // effect timing was why the Quellen-Balken PNG/SVG buttons never appeared.
    renderDataRef.current = sourceData
      ? {
          rows: resolvedRows.map((r) => ({
            sourceId: r.source.id,
            name: r.source.name,
            categoryColor: getCategoryColor(r.categoryId),
            isChild: r.isChild,
          })),
          columns: [{ id: selectedMetric, label: METRIC_LABELS[selectedMetric] }],
          cellValue: (sourceId: number) => {
            const raw = sourceData.metrics[selectedMetric]?.data[selectedGroup]?.[String(sourceId)];
            return typeof raw === 'number' ? raw : null;
          },
          lang: state.lang,
        }
      : null;

    if (!sourceData) {
      return (
        <div className="carm-balken-view">
          <p className="carm-spannweite__no-data" role="status">
            Daten werden geladen…
          </p>
        </div>
      );
    }

    if (resolvedRows.length === 0) {
      return (
        <div className="carm-balken-view">
          <p className="carm-spannweite__no-data" role="status">
            Keine Informationsquellen für die aktuelle Auswahl.
          </p>
        </div>
      );
    }

    const isAzActive = sort === 'a-z';
    const isSortCol = sort === 'value-asc' || sort === 'value-desc';
    const isAsc = sort === 'value-asc';
    // Category sort (2026-05-29) — same control as Quellen-Übersicht.
    const isCatActive = sort === 'category-asc' || sort === 'category-desc';
    const catTooltip =
      sort === 'category-asc'
        ? 'Reihenfolge umkehren (Persönlich → Institutionell)'
        : sort === 'category-desc'
          ? 'Reihenfolge umkehren (Institutionell → Persönlich)'
          : 'Nach Informationswege-Kategorie sortieren (Institutionell → Persönlich)';
    const MetricIcon = SOURCE_METRIC_ICONS[selectedMetric];
    const metricLabel = METRIC_LABELS[selectedMetric];
    const groupLabel = GROUP_LABELS[selectedGroup];
    const fullLabel = `${metricLabel} — ${groupLabel}`;

    const gridTemplate = `var(--carm-spannweite-label-col) minmax(0, 1fr)`;

    return (
      <div className="carm-spannweite carm-balken-view carm-sources-balken" ref={wrapperRef}>
        {/* 2026-05-29: the metric + group pickers (+ search / Exportieren /
            Rundgang) now render at the panel level via
            <SourcesBalkenToolbar> in MythenExplorer — same structure as
            every other tab. This view renders only the grid. No inner-
            scroll cap — the page scrolls (overflow-x stays via the
            scroller CSS rule). */}
        <div className="carm-spannweite__scroller">
          <div
            className="carm-spannweite__grid"
            style={{ gridTemplateColumns: gridTemplate }}
            role="grid"
          >
            {/* Label header — A-Z only (no verdict-rank, sources have no verdict). */}
            <div
              className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--label"
              role="columnheader"
            >
              <GridLabelHeader
                labelText="Informationswege"
                isAzActive={isAzActive}
                azTooltip="Alphabetisch sortieren"
                onAzClick={() => setSort('a-z')}
                categoryRank={{
                  isActive: isCatActive,
                  direction: sort === 'category-desc' ? 'desc' : 'asc',
                  tooltip: catTooltip,
                  onClick: () =>
                    setSort(
                      sort === 'category-asc'
                        ? 'category-desc'
                        : 'category-asc',
                    ),
                }}
              />
            </div>

            {/* Data column header — value-asc / value-desc sort. */}
            <div
              className="carm-spannweite__cell carm-spannweite__cell--header"
              role="columnheader"
            >
              <GridDataHeader
                Icon={MetricIcon}
                label={metricLabel}
                fullLabel={fullLabel}
                defTitle={definitions?.sourcesIndicators?.[selectedMetric]?.label}
                defText={definitions?.sourcesIndicators?.[selectedMetric]?.definition}
                defScale={definitions?.sourcesIndicators?.[selectedMetric]?.scale}
                isSortActive={isSortCol}
                sortDir={isAsc ? 'asc' : 'desc'}
                sortTooltip={
                  !isSortCol
                    ? `Nach ${metricLabel} sortieren`
                    : isAsc
                    ? `${metricLabel}: aufsteigend`
                    : `${metricLabel}: absteigend`
                }
                onSortClick={handleValueSortClick}
              />
            </div>

            {/* Body rows. */}
            {resolvedRows.map((row, rowIdx) => {
              const { source, value, categoryId, isChild, hasChildren } = row;
              const isHover = hoveredSourceId === source.id;
              const isExpanded = expanded.includes(source.id);
              const accent = getCategoryColor(categoryId);
              const CategoryIcon = SOURCE_CATEGORY_ICONS[categoryId];
              return (
                <div
                  key={`row-${source.id}`}
                  className={`carm-spannweite__row${isHover ? ' is-hover' : ''}${isChild ? ' carm-spannweite__row--child' : ''}${rowIdx % 2 === 0 ? '' : ' is-alt'}`}
                  role="row"
                  style={{ gridColumn: `1 / span 2`, gridTemplateColumns: gridTemplate }}
                  onMouseLeave={handleLeave}
                  tabIndex={0}
                >
                  <div
                    className="carm-spannweite__cell carm-spannweite__cell--label carm-sources-balken__label"
                    role="rowheader"
                    onMouseEnter={(e) => handleHover(source.id, e)}
                    onMouseMove={(e) => handleHover(source.id, e)}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        className="carm-sources-spannweite__chev"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(source.id);
                        }}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? `Unterquellen von ${source.name} einklappen`
                            : `Unterquellen von ${source.name} anzeigen`
                        }
                        title={isExpanded ? 'Unterquellen einklappen' : 'Unterquellen anzeigen'}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span className="carm-sources-spannweite__chev-spacer" aria-hidden="true" />
                    )}
                    {CategoryIcon && (
                      <span
                        className="carm-sources-balken__cat-icon"
                        aria-hidden="true"
                        style={{ color: accent }}
                      >
                        <CategoryIcon size={16} strokeWidth={1.75} />
                      </span>
                    )}
                    <span className="carm-sources-balken__name">{source.name}</span>
                  </div>
                  <div
                    className="carm-spannweite__cell carm-spannweite__cell--plot"
                    role="gridcell"
                    aria-label={
                      value !== null
                        ? `${metricLabel} — ${source.name}: ${Math.round(value)} %`
                        : `${metricLabel} — ${source.name}: keine Daten`
                    }
                    onMouseEnter={(e) => handleHover(source.id, e)}
                    onMouseMove={(e) => handleHover(source.id, e)}
                  >
                    <BalkenBar value={value} accent={accent} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spannweite-style rich hover card. Replaces the previous
            native title= attribute so Quellen Balken now matches the
            hover quality of Mythen Balken / Spannweite. */}
        {hoveredSourceId !== null && hoverPos && (() => {
          const hovered = resolvedRows.find((r) => r.source.id === hoveredSourceId);
          if (!hovered) return null;
          return (
            <SourcesHoverTooltip
              source={hovered.source}
              sourceData={sourceData}
              metric={selectedMetric}
              group={selectedGroup}
              x={hoverPos.x}
              y={hoverPos.y}
            />
          );
        })()}
      </div>
    );
  },
);

export default SourcesBalkenView;
