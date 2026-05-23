/**
 * SourcesSpannweiteView — Spannweite-style grid for the Informationsquellen
 * data set. Rows = parent sources (with optional expanded children at lower
 * opacity), columns = 4 metrics or 5 population groups (toggled via
 * `state.sourcesStripsMode`, shared with the legacy Sources tab).
 *
 * Each cell shows a single value, rendered as:
 *   - a category-tinted bar from 0 → value (opacity 0.22)
 *   - a filled 16-px circle in the same category colour at the value position
 *   - a small tabular-nums numeric label next to the circle
 *
 * Sources have no scientific verdict — no verdict-rank sort. The toolbar
 * exposes an A–Z toggle; per-column asc/desc sort lives in each column
 * header. When a column sort is active, children of an expanded parent sort
 * by the same column WITHIN that parent group (Fedor 2026-05-15).
 *
 * Filtering (sourceCategoryFilter / sourceSubFilter) is shared with the
 * legacy Sources view — no separate filter state.
 */

import {
  forwardRef, useImperativeHandle, useMemo, useRef, useState, useCallback, useEffect,
} from 'react';
import type { ReactNode } from 'react';
import {
  EyeOff, ArrowDown01, ArrowDown10, ArrowDownAZ, ChevronRight, ChevronDown,
} from 'lucide-react';
import {
  SOURCE_METRIC_ICONS,
  AUDIENCE_ICONS_BY_GROUP,
  IconCategoryRankAsc,
  IconCategoryRankDesc,
  type IconComponent,
} from '../../../lib/icons';
import type {
  AppState,
  DashboardDefinitions,
  InformationSource,
  InformationSourcesData,
  SourceGroupId,
  SourceMetricType,
  SourcesStripsMode,
  SourcesSpannweiteSort,
} from '../../../lib/dashboard/types';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import InfoTooltip from '../InfoTooltip';
import { useHiddenColumns } from '../hooks/useHiddenColumns';
import { renderSourcesSpannweiteSvg } from '../../../lib/dashboard/sources-spannweite-svg';
import LesebeispielSource from '../LesebeispielSource';

/** Column order for the new sources2 view (Fedor 2026-05-15): Wahrnehmung
 *  moves to the last slot so the more "active" search/trust/prevention
 *  columns lead. The legacy SourcesStripsView keeps the original
 *  ['search', 'perception', 'trust', 'prevention'] order intentionally. */
const METRICS: SourceMetricType[] = ['search', 'trust', 'prevention', 'perception'];
const GROUPS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Prävention',
};

const METRIC_ICONS: Record<SourceMetricType, IconComponent> = SOURCE_METRIC_ICONS;

const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: 'Volljährige (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsument:innen',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

const GROUP_ICONS: Record<SourceGroupId, IconComponent> = AUDIENCE_ICONS_BY_GROUP;

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
  sharedActions?: ReactNode;
}

export interface SourcesSpannweiteViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

interface ResolvedRow {
  source: InformationSource;
  categoryColor: string;
  isChild: boolean;
}

const FALLBACK_COLOR = '#94a3b8';

const SourcesSpannweiteView = forwardRef<SourcesSpannweiteViewHandle, Props>(
  function SourcesSpannweiteView({ state, update, definitions }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Data fetch (lazy, mirrors SourcesStripsView) ───────────────
    const [sourceData, setSourceData] = useState<InformationSourcesData | null>(null);
    useEffect(() => {
      fetch('/data/information-sources.json')
        .then((r) => r.json())
        .then(setSourceData);
    }, []);

    const mode: SourcesStripsMode = state.sourcesStripsMode;
    const sort: SourcesSpannweiteSort = state.sourcesSpannweiteSort ?? 'a-z';
    const sortColumn: string | null = state.sourcesSpannweiteSortColumn ?? null;
    const expanded = state.sourcesSpannweiteExpanded;
    const categoryFilter = state.sourceCategoryFilter;
    const subFilter = state.sourceSubFilter;
    const selectedGroup: SourceGroupId = state.sourceGroup;
    const selectedMetric: SourceMetricType = state.sourceMetric;
    const lang = state.lang;

    // ── Column definitions ────────────────────────────────────────
    const allColumnIds: string[] = mode === 'metric'
      ? (METRICS as string[])
      : (GROUPS as string[]);

    const { hide, show, isHidden } = useHiddenColumns(
      `carm.sources2.hidden.${mode}`,
      allColumnIds,
    );

    const columns = useMemo(() => {
      if (mode === 'metric') {
        return METRICS.map((m) => {
          const def = definitions?.sourcesIndicators?.[m];
          return {
            id: m as string,
            Icon: METRIC_ICONS[m],
            // Show the full indicator name on desktop (Fedor 2026-05-15).
            // The existing .carm-spannweite media-query stack shrinks the
            // font and finally hides the text entirely below 840 px, so
            // narrow viewports fall back to icon-only without overflow.
            label: METRIC_LABELS[m],
            fullLabel: METRIC_LABELS[m],
            defTitle: def?.label,
            defText: def?.definition,
            defScale: def?.scale,
            defSampleSize: undefined as string | undefined,
          };
        });
      }
      return GROUPS.map((g) => {
        const def = definitions?.groups?.[g];
        return {
          id: g as string,
          Icon: GROUP_ICONS[g],
          // Full group names on desktop (parentheticals included). Same
          // narrow-viewport fallback rationale as metrics above.
          label: GROUP_LABELS[g],
          fullLabel: GROUP_LABELS[g],
          defTitle: def?.label,
          defText: def?.definition,
          defScale: undefined as string | undefined,
          defSampleSize: def?.sampleSize,
        };
      });
    }, [mode, definitions]);

    // ── Filter compute (parents + children) ────────────────────────
    const categoryColorMap = useMemo(() => {
      if (!sourceData) return new Map<string, string>();
      return new Map(sourceData.sourceCategories.map((c) => [c.id, c.color]));
    }, [sourceData]);

    const { filteredParents, childrenByParent } = useMemo(() => {
      if (!sourceData) {
        return {
          filteredParents: [] as InformationSource[],
          childrenByParent: new Map<number, InformationSource[]>(),
        };
      }
      const filterByCat = (s: InformationSource) =>
        categoryFilter.length === 0 || categoryFilter.includes(s.category);
      const subSet = subFilter.length > 0 ? new Set(subFilter) : null;
      const filterBySub = (s: InformationSource) =>
        subSet === null || subSet.has(s.id);
      const parents = sourceData.sources.filter(
        (s) => s.parentId === null && filterByCat(s) && filterBySub(s),
      );
      const byParent = new Map<number, InformationSource[]>();
      for (const s of sourceData.sources) {
        if (s.parentId !== null && byParent.get(s.parentId) === undefined) {
          byParent.set(s.parentId, []);
        }
      }
      for (const s of sourceData.sources) {
        if (s.parentId !== null) {
          const arr = byParent.get(s.parentId);
          if (arr) arr.push(s);
        }
      }
      return { filteredParents: parents, childrenByParent: byParent };
    }, [sourceData, categoryFilter, subFilter]);

    // ── Cell value lookup ──────────────────────────────────────────
    const cellValue = useCallback(
      (sourceId: number, colId: string): number | null => {
        if (!sourceData) return null;
        if (mode === 'metric') {
          const m = colId as SourceMetricType;
          const data = sourceData.metrics[m]?.data[selectedGroup] || {};
          const v = data[String(sourceId)];
          return typeof v === 'number' ? v : null;
        }
        const g = colId as SourceGroupId;
        const data = sourceData.metrics[selectedMetric]?.data[g] || {};
        const v = data[String(sourceId)];
        return typeof v === 'number' ? v : null;
      },
      [sourceData, mode, selectedGroup, selectedMetric],
    );

    // ── Sort ───────────────────────────────────────────────────────
    // Canonical order for the new `category-asc` / `category-desc`
    // axes (2026-05-23). Mirrors the JSON taxonomy order in
    // `public/data/information-sources.json` so users see the source
    // categories in the same sequence ISD ranked them. Unknown
    // categories fall to the end (99) so a future taxonomy extension
    // doesn't crash the sort. Within a category, parents stay in
    // alphabetical order so the grouping is readable.
    const CATEGORY_ORDER: Record<string, number> = {
      institutional: 1,
      internet: 2,
      social_media: 3,
      traditional_media: 4,
      print_physical: 5,
      personal: 6,
    };
    const sortedParents = useMemo(() => {
      const arr = [...filteredParents];
      if (sort === 'category-asc' || sort === 'category-desc') {
        const dir = sort === 'category-asc' ? 1 : -1;
        return arr.sort((a, b) => {
          const oa = CATEGORY_ORDER[a.category] ?? 99;
          const ob = CATEGORY_ORDER[b.category] ?? 99;
          if (oa !== ob) return dir * (oa - ob);
          return a.name.localeCompare(b.name, 'de');
        });
      }
      if (sort === 'a-z' || !sortColumn || (sort !== 'value-asc' && sort !== 'value-desc')) {
        return arr.sort((a, b) => a.name.localeCompare(b.name, 'de'));
      }
      const dir = sort === 'value-desc' ? -1 : 1;
      return arr.sort((a, b) => {
        const va = cellValue(a.id, sortColumn);
        const vb = cellValue(b.id, sortColumn);
        if (va === null && vb === null) return a.name.localeCompare(b.name, 'de');
        if (va === null) return 1;   // nulls last
        if (vb === null) return -1;
        if (va !== vb) return dir * (va - vb);
        return a.name.localeCompare(b.name, 'de');
      });
    }, [filteredParents, sort, sortColumn, cellValue]);

    const sortedChildrenOf = useCallback(
      (parentId: number): InformationSource[] => {
        const kids = childrenByParent.get(parentId) ?? [];
        if (sort === 'a-z' || !sortColumn || (sort !== 'value-asc' && sort !== 'value-desc')) {
          return kids;
        }
        const dir = sort === 'value-desc' ? -1 : 1;
        return [...kids].sort((a, b) => {
          const va = cellValue(a.id, sortColumn);
          const vb = cellValue(b.id, sortColumn);
          if (va === null && vb === null) return 0;
          if (va === null) return 1;
          if (vb === null) return -1;
          if (va !== vb) return dir * (va - vb);
          return 0;
        });
      },
      [childrenByParent, sort, sortColumn, cellValue],
    );

    // ── Resolve the in-order row list (parents + expanded children) ─
    const resolvedRows: ResolvedRow[] = useMemo(() => {
      const expandedSet = new Set(expanded);
      const out: ResolvedRow[] = [];
      for (const parent of sortedParents) {
        const parentColor = categoryColorMap.get(parent.category) ?? FALLBACK_COLOR;
        out.push({ source: parent, categoryColor: parentColor, isChild: false });
        if (expandedSet.has(parent.id)) {
          for (const child of sortedChildrenOf(parent.id)) {
            out.push({ source: child, categoryColor: parentColor, isChild: true });
          }
        }
      }
      return out;
    }, [sortedParents, sortedChildrenOf, expanded, categoryColorMap]);

    // ── Per-column sort click handler ──────────────────────────────
    const handleColumnSortClick = useCallback(
      (colId: string) => {
        const isThisCol =
          (sort === 'value-asc' || sort === 'value-desc') && sortColumn === colId;
        if (isThisCol && sort === 'value-asc') {
          update('sourcesSpannweiteSort', 'value-desc');
        } else if (isThisCol && sort === 'value-desc') {
          update('sourcesSpannweiteSort', 'value-asc');
        } else {
          update('sourcesSpannweiteSort', 'value-asc');
          update('sourcesSpannweiteSortColumn', colId);
        }
      },
      [sort, sortColumn, update],
    );

    // ── Expand toggle ──────────────────────────────────────────────
    const toggleExpanded = useCallback(
      (parentId: number) => {
        const next = expanded.includes(parentId)
          ? expanded.filter((id) => id !== parentId)
          : [...expanded, parentId];
        update('sourcesSpannweiteExpanded', next);
      },
      [expanded, update],
    );

    // ── Hover tooltip ──────────────────────────────────────────────
    const [hovered, setHovered] = useState<{
      sourceId: number;
      colId: string | null;
    } | null>(null);
    const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

    const TOOLTIP_MAX_W = 320;
    const VIEWPORT_MARGIN = 12;

    const handleHover = useCallback(
      (sourceId: number, colId: string | null, e: React.MouseEvent) => {
        setHovered({ sourceId, colId });
        const halfW = TOOLTIP_MAX_W / 2;
        const minX = halfW + VIEWPORT_MARGIN;
        const maxX =
          (typeof window !== 'undefined' ? window.innerWidth : 1280) - halfW - VIEWPORT_MARGIN;
        const clampedX = Math.max(minX, Math.min(maxX, e.clientX));
        setHoverPos({ x: clampedX, y: e.clientY });
      },
      [],
    );
    const handleLeave = useCallback(() => {
      setHovered(null);
      setHoverPos(null);
    }, []);

    // ── Export SVG handle ──────────────────────────────────────────
    const renderDataRef = useRef<{
      rows: { sourceId: number; name: string; categoryColor: string; isChild: boolean }[];
      columns: { id: string; label: string }[];
      cellValue: (sourceId: number, colId: string) => number | null;
      lang: typeof lang;
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

    useEffect(() => {
      renderDataRef.current = {
        rows: resolvedRows.map((r) => ({
          sourceId: r.source.id,
          name: r.source.name,
          categoryColor: r.categoryColor,
          isChild: r.isChild,
        })),
        columns: columns
          .filter((c) => !isHidden(c.id))
          .map((c) => ({ id: c.id, label: c.fullLabel })),
        cellValue,
        lang,
      };
    });

    // ── Grid template (visible columns 1fr, hidden 28 px) ─────────
    const gridTemplate = useMemo(() => {
      const cols = columns
        .map((c) => (isHidden(c.id) ? '28px' : 'minmax(0, 1fr)'))
        .join(' ');
      return `var(--carm-spannweite-label-col) ${cols}`;
    }, [columns, isHidden]);

    // ── Hover tooltip resolved content ─────────────────────────────
    const hoveredSource: InformationSource | null = useMemo(() => {
      if (!hovered || !sourceData) return null;
      return sourceData.sources.find((s) => s.id === hovered.sourceId) ?? null;
    }, [hovered, sourceData]);

    const hoveredCategoryColor =
      hoveredSource ? categoryColorMap.get(hoveredSource.category) ?? FALLBACK_COLOR : FALLBACK_COLOR;
    const hoveredCategoryName =
      hoveredSource && sourceData
        ? sourceData.sourceCategories.find((c) => c.id === hoveredSource.category)?.name
            ?? hoveredSource.category
        : '';

    if (!sourceData) {
      return <div className="carm-loading" style={{ minHeight: 360 }}>Daten werden geladen…</div>;
    }

    return (
      <div className="carm-spannweite carm-sources-spannweite" ref={containerRef}>
        <div className="carm-spannweite__scroller">
          <div
            className="carm-spannweite__grid"
            style={{ gridTemplateColumns: gridTemplate }}
            role="grid"
          >
            {/* Header row — QUELLEN column carries two sort buttons:
                A-Z at upper-LEFT (existing) and category-rank at
                upper-RIGHT (added 2026-05-23 — mirrors the
                verdict-rank affordance on the myth views, but groups
                sources by their information-source category instead
                of by scientific verdict). */}
            <div
              className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--label"
              role="columnheader"
            >
              <button
                type="button"
                className={`carm-spannweite__col-sort-btn carm-spannweite__col-sort-btn--top-left${sort === 'a-z' ? ' is-active' : ''}`}
                onClick={() => {
                  update('sourcesSpannweiteSort', 'a-z');
                  update('sourcesSpannweiteSortColumn', null);
                }}
                aria-pressed={sort === 'a-z'}
                aria-label={t('sources.sort.alpha.tooltip', lang)}
                title={t('sources.sort.alpha.tooltip', lang)}
              >
                <ArrowDownAZ size={14} strokeWidth={2} aria-hidden="true" />
              </button>
              <span className="carm-spannweite__header-text">
                {lang === 'de' ? 'QUELLEN' : 'SOURCES'}
              </span>
              {(() => {
                const isCatActive = sort === 'category-asc' || sort === 'category-desc';
                const catTooltipKey: TranslationKey =
                  sort === 'category-asc'
                    ? 'sources.sort.category.asc.tooltip'
                    : sort === 'category-desc'
                      ? 'sources.sort.category.desc.tooltip'
                      : 'sources.sort.category.activate.tooltip';
                const catTooltip = t(catTooltipKey, lang);
                return (
                  <button
                    type="button"
                    className={`carm-spannweite__col-sort-btn carm-spannweite__col-sort-btn--top-right${isCatActive ? ' is-active' : ''}`}
                    onClick={() => {
                      if (sort === 'category-asc') {
                        update('sourcesSpannweiteSort', 'category-desc');
                      } else if (sort === 'category-desc') {
                        update('sourcesSpannweiteSort', 'category-asc');
                      } else {
                        update('sourcesSpannweiteSort', 'category-asc');
                        update('sourcesSpannweiteSortColumn', null);
                      }
                    }}
                    aria-pressed={isCatActive}
                    aria-label={catTooltip}
                    title={catTooltip}
                  >
                    {sort === 'category-desc' ? (
                      <IconCategoryRankDesc size={14} aria-hidden="true" />
                    ) : (
                      <IconCategoryRankAsc size={14} aria-hidden="true" />
                    )}
                  </button>
                );
              })()}
            </div>
            {columns.map((col) => {
              if (isHidden(col.id)) {
                return (
                  <button
                    key={`th-${col.id}`}
                    type="button"
                    className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--hidden"
                    onClick={() => show(col.id)}
                    aria-label={`${t('column.show', lang)} — ${col.fullLabel}`}
                    title={`${t('column.show', lang)} — ${col.fullLabel}`}
                  >
                    <span className="carm-spannweite__hidden-chev" aria-hidden="true">▸</span>
                  </button>
                );
              }
              const Icon = col.Icon;
              const isSortCol =
                (sort === 'value-asc' || sort === 'value-desc') && sortColumn === col.id;
              const isAsc = isSortCol && sort === 'value-asc';
              const isDesc = isSortCol && sort === 'value-desc';
              const colSortTooltipKey: TranslationKey = isAsc
                ? 'sources.sort.col.asc.tooltip'
                : isDesc
                ? 'sources.sort.col.desc.tooltip'
                : 'sources.sort.col.activate.tooltip';
              const colSortTooltip = t(colSortTooltipKey, lang).replace('{col}', col.fullLabel);
              return (
                <div
                  key={`th-${col.id}`}
                  className="carm-spannweite__cell carm-spannweite__cell--header"
                  role="columnheader"
                >
                  <button
                    type="button"
                    className="carm-spannweite__hide-btn"
                    onClick={() => hide(col.id)}
                    aria-label={`${t('column.hide', lang)} — ${col.fullLabel}`}
                    title={`${t('column.hide', lang)} — ${col.fullLabel}`}
                  >
                    <EyeOff size={11} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <span
                    className="carm-spannweite__header-inner"
                    title={col.defText ? `${col.fullLabel} — ${col.defText}` : col.fullLabel}
                  >
                    <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                    <span className="carm-spannweite__header-text">{col.label}</span>
                    {col.defTitle && col.defText && (
                      <span className="carm-spannweite__info-inline">
                        <InfoTooltip
                          title={col.defTitle}
                          definition={col.defText}
                          scale={col.defScale}
                          sampleSize={col.defSampleSize}
                        />
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className={`carm-spannweite__col-sort-btn${isSortCol ? ' is-active' : ''}`}
                    onClick={() => handleColumnSortClick(col.id)}
                    aria-pressed={isSortCol}
                    aria-label={colSortTooltip}
                    title={colSortTooltip}
                  >
                    {isDesc ? (
                      <ArrowDown10 size={14} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <ArrowDown01 size={14} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })}

            {/* Body rows */}
            {resolvedRows.map((row, rowIdx) => {
              const { source, categoryColor, isChild } = row;
              const isExpanded = expanded.includes(source.id);
              const hasChildren = !isChild && (childrenByParent.get(source.id)?.length ?? 0) > 0;
              return (
                <div
                  key={`row-${source.id}-${rowIdx}`}
                  className={`carm-spannweite__row${isChild ? ' carm-spannweite__row--child' : ''}${rowIdx % 2 === 0 ? '' : ' is-alt'}`}
                  role="row"
                  style={{
                    gridColumn: `1 / span ${columns.length + 1}`,
                    gridTemplateColumns: gridTemplate,
                  }}
                  onMouseLeave={handleLeave}
                >
                  <div
                    className="carm-spannweite__cell carm-spannweite__cell--label"
                    role="rowheader"
                    onMouseEnter={(e) => handleHover(source.id, null, e)}
                    onMouseMove={(e) => handleHover(source.id, null, e)}
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
                        title={
                          isExpanded
                            ? `Unterquellen einklappen`
                            : `Unterquellen anzeigen`
                        }
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
                    <span
                      className="carm-sources-spannweite__row-swatch"
                      style={{ background: categoryColor }}
                      aria-hidden="true"
                    />
                    <span className="carm-spannweite__row-text">{source.name}</span>
                  </div>
                  {columns.map((col) => {
                    if (isHidden(col.id)) {
                      return (
                        <div
                          key={`cell-${source.id}-${col.id}`}
                          className="carm-spannweite__cell carm-spannweite__cell--hidden-body"
                          role="gridcell"
                          aria-hidden="true"
                        />
                      );
                    }
                    const value = cellValue(source.id, col.id);
                    return (
                      <div
                        key={`cell-${source.id}-${col.id}`}
                        className="carm-spannweite__cell carm-spannweite__cell--plot"
                        role="gridcell"
                        aria-label={
                          value !== null
                            ? `${col.fullLabel}: ${Math.round(value)} %`
                            : `${col.fullLabel}: keine Daten`
                        }
                        onMouseEnter={(e) => handleHover(source.id, col.id, e)}
                        onMouseMove={(e) => handleHover(source.id, col.id, e)}
                      >
                        <div className="carm-spannweite__plot">
                          {value !== null ? (
                            <>
                              {/* 2px stem — same as Spannweite. */}
                              <div
                                className="carm-spannweite__bar"
                                style={{
                                  width: `${Math.max(0, Math.min(100, value))}%`,
                                  background: categoryColor,
                                }}
                                aria-hidden="true"
                              />
                              {/* 2026-05-23 Polish v7: dot is a plain
                                  filled circle (no text inside) — the
                                  value floats above as a sibling
                                  `.carm-spannweite__num` so the dot+
                                  number cluster mirrors the V3a-dot +
                                  V3b-num hybrid used by Spannweite/
                                  Balken via GridValueCell. Source
                                  category color drives both the dot
                                  fill and the number's text color so
                                  the cluster reads as one
                                  category-themed mark. */}
                              <div
                                className="carm-spannweite__dot carm-sources-spannweite__dot"
                                aria-hidden="true"
                                style={{
                                  left: `${Math.max(0, Math.min(100, value))}%`,
                                  background: categoryColor,
                                }}
                              />
                              <div
                                className="carm-spannweite__num"
                                aria-hidden="true"
                                style={{
                                  left: `${Math.max(0, Math.min(100, value))}%`,
                                  color: categoryColor,
                                }}
                              >
                                {Math.round(value)}
                              </div>
                            </>
                          ) : (
                            <span className="carm-spannweite__no-data" aria-hidden="true">
                              k. A.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Bottom axis removed 2026-05-22 — Fedor: "self-evident
                without it". */}
          </div>
        </div>

        {/* Hover card — category-tinted, viewport-clamped. v4: meta
            line dropped; a per-metric Lesebeispiel sentence is shown
            instead, adapted to the hovered cell's metric + group
            (mode='metric' → group = selectedGroup; mode='group' →
            metric = selectedMetric). Sentence templates are AI
            drafts marked in LesebeispielSource.tsx for ISD review
            on the live site. */}
        {hoveredSource && hoverPos && (() => {
          let lesebeispielMetric: SourceMetricType | null = null;
          let lesebeispielGroup: SourceGroupId = selectedGroup;
          let lesebeispielValue: number | null = null;
          if (hovered?.colId) {
            if (mode === 'metric') {
              lesebeispielMetric = hovered.colId as SourceMetricType;
              lesebeispielGroup = selectedGroup;
            } else {
              lesebeispielMetric = selectedMetric;
              lesebeispielGroup = hovered.colId as SourceGroupId;
            }
            lesebeispielValue = cellValue(hoveredSource.id, hovered.colId);
          }
          // Light category-tinted background via color-mix; fall back to white if unsupported.
          const bg = `color-mix(in srgb, ${hoveredCategoryColor} 14%, #ffffff)`;
          return (
            <div
              className="carm-spannweite__tooltip carm-sources-spannweite__tooltip"
              role="tooltip"
              style={{
                position: 'fixed',
                left: hoverPos.x,
                top: hoverPos.y,
                background: bg,
                borderLeft: `3px solid ${hoveredCategoryColor}`,
              }}
            >
              <div className="carm-spannweite__tooltip-row">
                <div className="carm-spannweite__tooltip-myth">
                  {hoveredSource.name}
                </div>
                <span
                  className="carm-sources-spannweite__tooltip-swatch"
                  style={{ background: hoveredCategoryColor }}
                  aria-hidden="true"
                />
              </div>
              <div
                className="carm-spannweite__tooltip-verdict"
                style={{ color: hoveredCategoryColor }}
              >
                {hoveredCategoryName}
              </div>
              {lesebeispielMetric && lesebeispielValue !== null && (
                <div className="carm-spannweite__tooltip-lesebeispiel">
                  <LesebeispielSource
                    metric={lesebeispielMetric}
                    value={lesebeispielValue}
                    group={lesebeispielGroup}
                    compactHeading
                  />
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  },
);

export default SourcesSpannweiteView;
