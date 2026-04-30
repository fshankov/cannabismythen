/**
 * SourcesStripsView — Streifen idiom for the Informationsquellen tab.
 *
 * This view is the single replacement for the legacy V1 (InformationSourcesView)
 * and V2 (InformationSourcesV2View) source tabs. It mirrors the Mythen Streifen
 * idiom (`StripsView.tsx`) so users recognise it immediately:
 *   - Vertical strips with a beeswarm of dots, 0..100% on Y.
 *   - Hover a dot → faint dashed polyline through every strip + a small label
 *     with the source name. Click a dot → solid polyline + value pills + a
 *     source card below the chart.
 *
 * One tab, two pivots (toggled via the top-left "Spalten" pills):
 *   - 'metric' pivot → 4 strips (Suche / Wahrnehmung / Vertrauen / Prävention),
 *     top picker selects a Bevölkerungsgruppe (one dot per source × group).
 *   - 'group'  pivot → 5 strips (Volljährige / Minderjährige / Konsument:innen /
 *     Junge Erwachsene / Eltern), top picker selects an Indikator
 *     (one dot per source × metric).
 *
 * Visuals & interactions intentionally identical to StripsView so we can reuse
 * every `.strips-*` CSS class without duplication. Differences from StripsView:
 *   - Dot colour = source category (institutional / internet / social_media /
 *     traditional_media / print_physical / personal) — sourced from the JSON.
 *   - Children render only when the global "Unterkategorien einblenden" toggle
 *     is on; when on they're smaller (× 0.7) and dimmer (opacity 0.55).
 *   - Category filter under the chart is a row of pills (doubles as legend).
 *   - No factsheet panel (sources have no factsheets) — the source card has
 *     "Unterkategorien zeigen" / "Zum Hauptthema" actions instead of "Mehr →".
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Search, Eye, EyeOff, Shield, Sparkles,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  AppState,
  DashboardDefinitions,
  InformationSource,
  InformationSourcesData,
  SourceCategory,
  SourceGroupId,
  SourceMetricType,
  SourcesStripsMode,
} from '../../../lib/dashboard/types';
import InfoTooltip from '../InfoTooltip';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
}

/** Order matters — drives strip order in 'metric' pivot. */
const METRICS: SourceMetricType[] = ['search', 'perception', 'trust', 'prevention'];

/** Order matters — drives strip order in 'group' pivot. */
const GROUPS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Prävention',
};

const METRIC_SHORT: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrn.',
  trust: 'Vertr.',
  prevention: 'Präv.',
};

const METRIC_ICONS: Record<SourceMetricType, LucideIcon> = {
  search: Search,
  perception: Eye,
  trust: Shield,
  prevention: Sparkles,
};

const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: 'Volljährige (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsument:innen',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

const GROUP_SHORT: Record<SourceGroupId, string> = {
  adults: 'Erw.',
  minors: 'Minderj.',
  consumers: 'Konsum.',
  young_adults: 'Junge Erw.',
  parents: 'Eltern',
};

const GROUP_ICONS: Record<SourceGroupId, LucideIcon> = {
  adults: Users,
  minors: Baby,
  consumers: Cannabis,
  young_adults: GraduationCap,
  parents: UsersRound,
};

type ColumnId = SourceMetricType | SourceGroupId;

interface BeeswarmNode {
  sourceId: number;
  source: InformationSource;
  isChild: boolean;
  value: number;
  y0: number;
  x: number;
  y: number;
}

interface ColumnData {
  id: ColumnId;
  label: string;
  shortLabel: string;
  Icon?: LucideIcon;
  defLabel?: string;
  defText?: string;
  scale?: string;
  sampleSize?: string;
  nodes: BeeswarmNode[];
  /** Parent dot radius. Children render at radius × 0.7. */
  radius: number;
  valueBySource: Map<number, number>;
}

function formatPillValue(value: number | null): string {
  if (value === null) return 'k. A.';
  return `${value.toFixed(1)}%`;
}

export default function SourcesStripsView({ state, update, definitions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const [viewportH, setViewportH] = useState(typeof window !== 'undefined' ? window.innerHeight : 720);

  // Source data is loaded lazily — same fetch pattern as the legacy views.
  const [sourceData, setSourceData] = useState<InformationSourcesData | null>(null);
  useEffect(() => {
    fetch('/data/information-sources.json')
      .then((r) => r.json())
      .then(setSourceData);
  }, []);

  // Highlight (selection) is local to this view — sources don't share the
  // global `selectedMythId` slot. Hover is also local; selection wins for the
  // polyline + value pills.
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [hoveredSourceId, setHoveredSourceId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Top picker (population group | indicator depending on pivot) — same
  // markup/state pattern as StripsView's top dropdown.
  const [topPickerOpen, setTopPickerOpen] = useState(false);
  const topPickerRef = useRef<HTMLDivElement>(null);
  const [topExpandedInfo, setTopExpandedInfo] = useState<string | null>(null);

  const mode: SourcesStripsMode = state.sourcesStripsMode;
  const showChildren = state.sourcesShowChildren;
  const categoryFilter = state.sourceCategoryFilter;
  const selectedGroup: SourceGroupId = state.sourceGroup;
  const selectedMetric: SourceMetricType = state.sourceMetric;

  // ── Resize observers (width + viewport height) ─────────────────────
  useEffect(() => {
    if (!contentRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(Math.floor(w));
    });
    obs.observe(contentRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close the top dropdown on outside click + Escape.
  useEffect(() => {
    if (!topPickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (topPickerRef.current && !topPickerRef.current.contains(e.target as Node)) {
        setTopPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTopPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [topPickerOpen]);

  // Click-anywhere-outside-the-card to deselect (matches StripsView behaviour).
  useEffect(() => {
    if (selectedSourceId === null) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      if (target.closest('.strips-myth-card')) return;
      setSelectedSourceId(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [selectedSourceId]);

  const isMobile = width < 640;
  const isNarrow = width < 480;

  const margin = isMobile
    ? { top: 8, right: 8, bottom: 28, left: 28 }
    : { top: 10, right: 20, bottom: 32, left: 36 };

  const headerH = isMobile ? 50 : 56;

  // Match StripsView's reservedH so the chart breathes the same way.
  const reservedH = isMobile ? 360 : 300;
  const height = Math.max(360, Math.min(820, viewportH - reservedH));

  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = Math.max(0, height - margin.top - margin.bottom - headerH);
  const colGap = isMobile ? 4 : 10;
  const numColumns = mode === 'metric' ? METRICS.length : GROUPS.length;
  const colW = (innerW - colGap * (numColumns - 1)) / Math.max(1, numColumns);

  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, 100]).range([headerH + innerH, headerH]),
    [innerH, headerH],
  );

  const colCenterX = useCallback(
    (i: number) => margin.left + colW / 2 + i * (colW + colGap),
    [margin.left, colW, colGap],
  );

  const ticks = [0, 20, 40, 60, 80, 100];

  // Map of category id → colour, taken straight from the JSON. The API of
  // SourceCategory says `color` is a hex string per category — we treat
  // anything missing as a fallback grey so a typo upstream doesn't crash.
  const categoryColorMap = useMemo(() => {
    if (!sourceData) return new Map<string, string>();
    return new Map(sourceData.sourceCategories.map((c) => [c.id, c.color]));
  }, [sourceData]);

  /** Filter sources by the active category-pill filter AND the show-children
   *  toggle. Returns parents (always) + children (only when toggle is on AND
   *  the parent passes the category filter). Returning an array preserves the
   *  display order from the JSON, which is alphabetised + grouped sensibly. */
  const visibleSources = useMemo(() => {
    if (!sourceData) return [] as InformationSource[];
    const filterByCat = (s: InformationSource) =>
      categoryFilter.length === 0 || categoryFilter.includes(s.category);
    const parents = sourceData.sources.filter((s) => s.parentId === null && filterByCat(s));
    if (!showChildren) return parents;
    const result: InformationSource[] = [];
    const parentIds = new Set(parents.map((p) => p.id));
    for (const s of sourceData.sources) {
      if (s.parentId === null) {
        if (filterByCat(s)) result.push(s);
      } else if (parentIds.has(s.parentId)) {
        result.push(s);
      }
    }
    return result;
  }, [sourceData, categoryFilter, showChildren]);

  /** Live count for the bottom-of-chart caption. Counts parents only — that
   *  is what users mean by "Quellen" (sub-categories are toggleable detail). */
  const parentCount = useMemo(
    () => visibleSources.filter((s) => s.parentId === null).length,
    [visibleSources],
  );

  // ── Build columns based on the active pivot ───────────────────────
  const columns = useMemo<ColumnData[]>(() => {
    if (!sourceData) return [];
    /** Same radius clamp as Mythen-Streifen so the two views feel identical.
     *  Children render at this × 0.7. */
    const radius = Math.max(3.5, Math.min(8, colW * 0.07));

    /** Run a force-simulated beeswarm for one strip's nodes. */
    const buildNodes = (
      sources: InformationSource[],
      getValue: (s: InformationSource) => number | null,
    ) => {
      const nodes: BeeswarmNode[] = [];
      const map = new Map<number, number>();
      for (const source of sources) {
        const v = getValue(source);
        if (v === null) continue;
        const isChild = source.parentId !== null;
        const y0 = yScale(v);
        nodes.push({
          sourceId: source.id,
          source,
          isChild,
          value: v,
          y0,
          x: 0,
          y: y0,
        });
        map.set(source.id, v);
      }
      const sim = d3
        .forceSimulation(nodes as any)
        .force('y', d3.forceY<BeeswarmNode>((d) => d.y0).strength(1))
        .force('x', d3.forceX<BeeswarmNode>(0).strength(0.18))
        .force(
          'collide',
          // Children are smaller, so use a per-node collision radius.
          d3.forceCollide<BeeswarmNode>((d) => (d.isChild ? radius * 0.7 : radius) + 0.6),
        )
        .stop();
      for (let i = 0; i < 140; i++) sim.tick();
      const halfW = Math.max(4, colW / 2 - radius - 2);
      const yMin = headerH + radius + 1;
      const yMax = headerH + innerH - radius - 1;
      for (const n of nodes) {
        if (n.x > halfW) n.x = halfW;
        if (n.x < -halfW) n.x = -halfW;
        if (n.y < yMin) n.y = yMin;
        if (n.y > yMax) n.y = yMax;
      }
      return { nodes, valueByMyth: map };
    };

    if (mode === 'metric') {
      // 4 strips, one per source metric — at the selected population group.
      return METRICS.map((m) => {
        const def = definitions?.sourcesIndicators?.[m];
        const data = sourceData.metrics[m]?.data[selectedGroup] || {};
        const { nodes, valueByMyth } = buildNodes(visibleSources, (s) => {
          const v = data[String(s.id)];
          return typeof v === 'number' ? v : null;
        });
        return {
          id: m as ColumnId,
          label: METRIC_LABELS[m],
          shortLabel: METRIC_SHORT[m],
          Icon: METRIC_ICONS[m],
          defLabel: def?.label,
          defText: def?.definition,
          scale: def?.scale,
          nodes,
          radius,
          valueBySource: valueByMyth,
        };
      });
    }

    // mode === 'group' — 5 strips, one per population group, at the selected metric.
    const metricData = sourceData.metrics[selectedMetric]?.data || ({} as Record<SourceGroupId, Record<string, number>>);
    return GROUPS.map((g) => {
      const def = definitions?.groups?.[g];
      const data = metricData[g] || {};
      const { nodes, valueByMyth } = buildNodes(visibleSources, (s) => {
        const v = data[String(s.id)];
        return typeof v === 'number' ? v : null;
      });
      return {
        id: g as ColumnId,
        label: GROUP_LABELS[g],
        shortLabel: GROUP_SHORT[g],
        Icon: GROUP_ICONS[g],
        defLabel: def?.label,
        defText: def?.definition,
        sampleSize: def?.sampleSize,
        nodes,
        radius,
        valueBySource: valueByMyth,
      };
    });
  }, [
    sourceData,
    mode,
    visibleSources,
    selectedGroup,
    selectedMetric,
    yScale,
    colW,
    headerH,
    innerH,
    definitions,
  ]);

  /** Click handler — toggles selection (matches StripsView). */
  const handleDotClick = useCallback((sourceId: number) => {
    setSelectedSourceId((prev) => (prev === sourceId ? null : sourceId));
  }, []);

  // Derive the focused source: selection wins, else hover.
  const selectedSource: InformationSource | null = useMemo(() => {
    if (!sourceData || selectedSourceId === null) return null;
    return sourceData.sources.find((s) => s.id === selectedSourceId) ?? null;
  }, [sourceData, selectedSourceId]);

  const hoveredSource: InformationSource | null = useMemo(() => {
    if (!sourceData || hoveredSourceId === null || hoveredSourceId === selectedSourceId) return null;
    return sourceData.sources.find((s) => s.id === hoveredSourceId) ?? null;
  }, [sourceData, hoveredSourceId, selectedSourceId]);

  const focusSourceId = selectedSourceId ?? hoveredSourceId;
  const focusSource = selectedSource || hoveredSource;

  // ── Top-row picker items (Bevölkerungsgruppe in 'metric' mode, Indikator
  //    in 'group' mode). Same RowItem shape as StripsView so the markup is
  //    drop-in. ─────────────────────────────────────────────────────────
  type RowItem = {
    id: string;
    Icon?: LucideIcon;
    label: string;
    shortLabel: string;
    active: boolean;
    onActivate: () => void;
    defLabel?: string;
    defText?: string;
    scale?: string;
    sampleSize?: string;
  };

  const groupRow: RowItem[] = useMemo(() => GROUPS.map((g) => {
    const def = definitions?.groups?.[g];
    return {
      id: g,
      Icon: GROUP_ICONS[g],
      label: GROUP_LABELS[g],
      shortLabel: GROUP_SHORT[g],
      active: state.sourceGroup === g,
      onActivate: () => update('sourceGroup', g),
      defLabel: def?.label,
      defText: def?.definition,
      sampleSize: def?.sampleSize,
    };
  }), [state.sourceGroup, definitions, update]);

  const metricRow: RowItem[] = useMemo(() => METRICS.map((m) => {
    const def = definitions?.sourcesIndicators?.[m];
    return {
      id: m,
      Icon: METRIC_ICONS[m],
      label: METRIC_LABELS[m],
      shortLabel: METRIC_SHORT[m],
      active: state.sourceMetric === m,
      onActivate: () => update('sourceMetric', m),
      defLabel: def?.label,
      defText: def?.definition,
      scale: def?.scale,
    };
  }), [state.sourceMetric, definitions, update]);

  const topRow: { items: RowItem[]; caption: string } = useMemo(() => {
    if (mode === 'metric') {
      return { items: groupRow, caption: 'Bevölkerungsgruppe' };
    }
    return { items: metricRow, caption: 'Indikator' };
  }, [mode, groupRow, metricRow]);

  // ── Source card content (selected state) ──────────────────────────
  // Computed regardless of `sourceData` so the JSX below can stay flat;
  // when the data hasn't loaded yet selectedSource is null and the whole
  // card block doesn't render.
  const selectedCategory: SourceCategory | undefined = selectedSource && sourceData
    ? sourceData.sourceCategories.find((c) => c.id === selectedSource.category)
    : undefined;
  const selectedHasChildren = selectedSource && sourceData
    ? sourceData.sources.some((s) => s.parentId === selectedSource.id)
    : false;
  const selectedParent: InformationSource | null = selectedSource && sourceData && selectedSource.parentId !== null
    ? sourceData.sources.find((s) => s.id === selectedSource.parentId) ?? null
    : null;

  // Hovered source's parent — used for the in-strip hover label so children
  // read like "↳ persönlich – Apotheke / Arztpraxis" rather than the
  // standalone "↳ persönlich" which is meaningless out of context.
  const hoveredParent: InformationSource | null = hoveredSource && sourceData && hoveredSource.parentId !== null
    ? sourceData.sources.find((s) => s.id === hoveredSource.parentId) ?? null
    : null;

  /** Strip the leading "  ↳ " marker from child names so they display cleanly
   *  inside the card and hover label. The marker is only useful in flat lists
   *  (the legacy V1/V2 views); here parent context is shown explicitly. */
  const cleanName = (name: string) => name.replace(/^\s*↳\s*/, '');

  return (
    <div className="strips-v3" ref={containerRef}>
      <div className={`strips-grid3 ${selectedSource ? 'has-selection' : ''}`}>
        {/*
          contentRef is bound on the very first render so the ResizeObserver
          can read the actual container width before sourceData arrives. Using
          an early-return for the loading state would null out contentRef on
          the first paint and leave `width` stuck at its default (this used to
          ship the strips at ~360px even on a 1400px viewport — felt cramped).
        */}
        <div className="strips-grid3__content" ref={contentRef}>

          {/*
            Three controls used to live on three separate rows. Collapsing
            them into a single flex-wrap row recovers ~80px of vertical space
            without compromising clarity — the labels keep the grouping
            obvious. On narrow viewports the row wraps naturally.
          */}
          <div className="sources-strips-controls">
            <div className="sources-strips-control">
              <span className="strips-picker__caption">Spalten:</span>
              <div className="strips-pivot-toggle" role="tablist" aria-label="Pivot wählen">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'metric'}
                  className={`strips-pivot-toggle__btn ${mode === 'metric' ? 'active' : ''}`}
                  onClick={() => update('sourcesStripsMode', 'metric')}
                >
                  Indikatoren
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'group'}
                  className={`strips-pivot-toggle__btn ${mode === 'group' ? 'active' : ''}`}
                  onClick={() => update('sourcesStripsMode', 'group')}
                >
                  Gruppen
                </button>
              </div>
            </div>

            {/* Top selector — same dropdown markup as StripsView so styling
                is reused verbatim. */}
            {(() => {
              const activeItem = topRow.items.find((it) => it.active) || topRow.items[0];
              return (
                <div className="sources-strips-control" ref={topPickerRef} style={{ position: 'relative' }}>
                  <span className="strips-picker__caption">{topRow.caption}:</span>
                  <button
                    type="button"
                    className="strips-picker__trigger"
                    aria-haspopup="listbox"
                    aria-expanded={topPickerOpen}
                    onClick={() => {
                      setTopPickerOpen((v) => !v);
                      setTopExpandedInfo(null);
                    }}
                  >
                    {activeItem?.Icon ? (
                      <activeItem.Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                    ) : null}
                    <span className="strips-picker__current">{activeItem?.label}</span>
                    <span className="strips-picker__chevron" aria-hidden="true">▾</span>
                  </button>
                  {topPickerOpen && (
                    <div className="strips-picker__menu" role="listbox">
                      {topRow.items.map((item) => {
                        const expanded = topExpandedInfo === item.id;
                        return (
                          <div key={item.id} className={`strips-picker__row ${expanded ? 'expanded' : ''}`}>
                            <div className="strips-picker__row-line">
                              <button
                                type="button"
                                role="option"
                                aria-selected={item.active}
                                className={`strips-picker__item-btn ${item.active ? 'active' : ''}`}
                                onClick={() => {
                                  item.onActivate();
                                  setTopPickerOpen(false);
                                  setTopExpandedInfo(null);
                                }}
                              >
                                {item.Icon ? (
                                  <item.Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                                ) : null}
                                <span className="strips-picker__item-label">{item.label}</span>
                              </button>
                              {item.defLabel && item.defText && (
                                <button
                                  type="button"
                                  className={`strips-picker__row-info ${expanded ? 'active' : ''}`}
                                  aria-expanded={expanded}
                                  aria-label="Definition anzeigen"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTopExpandedInfo(expanded ? null : item.id);
                                  }}
                                >
                                  <span aria-hidden="true">i</span>
                                </button>
                              )}
                            </div>
                            {expanded && item.defText && (
                              <div className="strips-picker__row-def">
                                <p className="strips-picker__row-def-title">{item.defLabel}</p>
                                {item.sampleSize && (
                                  <p className="strips-picker__row-def-sample">{item.sampleSize}</p>
                                )}
                                <p className="strips-picker__row-def-text">{item.defText}</p>
                                {item.scale && (
                                  <p className="strips-picker__row-def-scale">Skala: {item.scale}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Children toggle — Eye / EyeOff makes the binary state visible
                at a glance instead of hiding behind the same flat pill style
                as the active "Indikatoren" tab. */}
            <div className="sources-strips-control">
              <span className="strips-picker__caption">Detail:</span>
              <button
                type="button"
                className={`strips-pivot-toggle__btn strips-children-toggle ${showChildren ? 'active' : ''}`}
                aria-pressed={showChildren}
                onClick={() => update('sourcesShowChildren', !showChildren)}
              >
                {showChildren ? (
                  <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <EyeOff size={14} strokeWidth={1.75} aria-hidden="true" />
                )}
                <span>Unterkategorien</span>
              </button>
            </div>
          </div>

          {/* When the data hasn't arrived yet we still want contentRef bound
              (its width drives the SVG sizing), so the loading state takes
              the chart's slot inside the same wrapper. */}
          {!sourceData ? (
            <div className="carm-loading" style={{ minHeight: 360 }}>Daten werden geladen…</div>
          ) : (
          <>

          {/* Chart wrapper — same structure as StripsView so the absolute
              header overlay sits on top of the SVG strip rectangles. */}
          <div className="strips-svg-wrap" style={{ position: 'relative', width }}>
            <svg
              className="strips-svg-v3"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Streifen-Diagramm der Informationsquellen"
              onMouseLeave={() => { setHoveredSourceId(null); setHoverPos(null); }}
            >
              {/* Strip backgrounds + gridlines */}
              {columns.map((col, i) => {
                const cx = colCenterX(i);
                const stripLeft = cx - colW / 2;
                return (
                  <g key={`bg-${String(col.id)}`} transform={`translate(0, ${margin.top})`}>
                    <rect
                      x={stripLeft}
                      y={0}
                      width={colW}
                      height={headerH + innerH}
                      rx={10}
                      fill="#f8fafc"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />
                    <line
                      x1={stripLeft + 1}
                      x2={stripLeft + colW - 1}
                      y1={headerH}
                      y2={headerH}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />
                    {ticks.map((tk) => (
                      <g key={tk}>
                        <line
                          x1={stripLeft + 2}
                          x2={stripLeft + colW - 2}
                          y1={yScale(tk)}
                          y2={yScale(tk)}
                          stroke="#e5e7eb"
                          strokeDasharray="2 4"
                        />
                        {i === 0 && (
                          <text
                            x={margin.left - 6}
                            y={yScale(tk) + 3}
                            textAnchor="end"
                            fontSize={9}
                            fill="#94a3b8"
                          >
                            {tk}
                          </text>
                        )}
                      </g>
                    ))}
                    {col.nodes.length === 0 && (
                      <text
                        x={stripLeft + colW / 2}
                        y={headerH + innerH / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={11}
                        fill="#94a3b8"
                        style={{ fontStyle: 'italic' }}
                      >
                        k. A.
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Connecting polyline through the focused source */}
              {focusSource && (
                <g transform={`translate(0, ${margin.top})`} pointerEvents="none">
                  <path
                    d={(() => {
                      const pts: Array<{ x: number; y: number }> = [];
                      columns.forEach((col, i) => {
                        const node = col.nodes.find((n) => n.sourceId === focusSource.id);
                        if (!node) return;
                        pts.push({ x: colCenterX(i) + node.x, y: node.y });
                      });
                      if (pts.length < 2) return '';
                      return d3.line<{ x: number; y: number }>()
                        .x((p) => p.x).y((p) => p.y)
                        .curve(d3.curveMonotoneX)(pts) || '';
                    })()}
                    fill="none"
                    stroke={selectedSource ? '#0f172a' : '#475569'}
                    strokeOpacity={selectedSource ? 0.85 : 0.55}
                    strokeWidth={1.5}
                    strokeDasharray={selectedSource ? '4 3' : '2 4'}
                  />
                </g>
              )}

              {/* Dots — focused dot rendered last so its hit-area overlays neighbours */}
              {columns.map((col, i) => {
                const cx = colCenterX(i);
                const sortedNodes = focusSourceId === null
                  ? col.nodes
                  : [
                      ...col.nodes.filter((n) => n.sourceId !== focusSourceId),
                      ...col.nodes.filter((n) => n.sourceId === focusSourceId),
                    ];
                return (
                  <g key={`dots-${String(col.id)}`} transform={`translate(0, ${margin.top})`}>
                    {sortedNodes.map((n) => {
                      const isSel = n.sourceId === selectedSourceId;
                      const isHov = n.sourceId === hoveredSourceId && !isSel;
                      const dimmed = focusSourceId !== null && !(isSel || isHov);
                      const baseR = n.isChild ? col.radius * 0.7 : col.radius;
                      const r = isSel ? baseR + 2.5 : isHov ? baseR + 1.5 : baseR;
                      const hitR = isSel ? 22 : 14;
                      const dotX = cx + n.x;
                      const dotY = n.y;
                      const fill = categoryColorMap.get(n.source.category) || '#6B7280';
                      // Children: dimmer baseline opacity. Selection/hover always 1.
                      const baseOpacity = n.isChild ? 0.55 : 0.85;
                      return (
                        <g key={`${col.id}-${n.sourceId}`}>
                          <circle
                            cx={dotX}
                            cy={dotY}
                            r={r}
                            fill={fill}
                            fillOpacity={dimmed ? 0.15 : isSel ? 1 : isHov ? 1 : baseOpacity}
                            stroke={isSel ? '#0f172a' : isHov ? '#475569' : 'none'}
                            strokeWidth={isSel ? 1.5 : isHov ? 1 : 0}
                          />
                          <circle
                            cx={dotX}
                            cy={dotY}
                            r={hitR}
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleDotClick(n.sourceId); }}
                            onMouseEnter={() => {
                              setHoveredSourceId(n.sourceId);
                              setHoverPos({ x: dotX, y: dotY + margin.top });
                            }}
                            onMouseLeave={() => setHoveredSourceId(null)}
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Inline value pills next to highlighted dots */}
              {focusSource && (
                <g transform={`translate(0, ${margin.top})`} pointerEvents="none">
                  {columns.map((col, i) => {
                    const node = col.nodes.find((n) => n.sourceId === focusSource.id);
                    const v = col.valueBySource.get(focusSource.id) ?? null;
                    const valText = formatPillValue(v);
                    const cx = colCenterX(i);
                    let dotX = cx;
                    let dotY = innerH / 2;
                    if (node) {
                      dotX = cx + node.x;
                      dotY = node.y;
                    }
                    const pillW = Math.min(56, Math.max(28, valText.length * 6 + 12));
                    const padding = 4;
                    let pillX = dotX + 10;
                    let pillTextAnchor: 'start' | 'end' = 'start';
                    if (pillX + pillW > cx + colW / 2 - padding) {
                      pillX = dotX - 10 - pillW;
                      pillTextAnchor = 'end';
                    }
                    if (pillX < cx - colW / 2 + padding) pillX = cx - colW / 2 + padding;
                    return (
                      <g key={`pill-${String(col.id)}`}>
                        <rect
                          x={pillX}
                          y={dotY - 9}
                          width={pillW}
                          height={18}
                          rx={9}
                          fill="#0f172a"
                          fillOpacity={0.92}
                        />
                        <text
                          x={pillTextAnchor === 'start' ? pillX + 6 : pillX + pillW - 6}
                          y={dotY + 4}
                          textAnchor={pillTextAnchor}
                          fontSize={10}
                          fontWeight={600}
                          fill="white"
                        >
                          {valText}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Absolute-positioned HTML headers over the in-SVG header area */}
            <div className="strips-svg-headers" aria-hidden={false}>
              {columns.map((col, i) => {
                const cx = colCenterX(i);
                const left = cx - colW / 2;
                const top = margin.top;
                return (
                  <div
                    key={`hd-${String(col.id)}`}
                    className="strips-svg-header"
                    style={{ left, top, width: colW, height: headerH }}
                  >
                    <div className="strips-svg-header__inner">
                      {col.Icon ? (
                        <col.Icon size={isNarrow ? 16 : 18} strokeWidth={1.75} aria-hidden="true" />
                      ) : null}
                      <span className="strips-svg-header__label">
                        {isMobile ? col.shortLabel : col.label}
                      </span>
                    </div>
                    {col.defLabel && col.defText && (
                      <span className="strips-svg-header__info">
                        <InfoTooltip
                          title={col.defLabel}
                          definition={col.defText}
                          scale={col.scale}
                          sampleSize={col.sampleSize}
                        />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hover source label — paints over the strip headers via z-index.
                For child sources we prepend the parent so the hover text isn't
                a context-free "↳ persönlich" but reads "↳ persönlich · Apotheke /
                Arztpraxis", which is what the user actually needs to identify
                the dot. */}
            {hoveredSource && hoverPos && !selectedSource && (
              <div
                className="strips-hover-statement strips-hover-statement--abs"
                style={{
                  left: Math.max(8, Math.min(width - 260, hoverPos.x - 130)),
                  top: Math.max(8, hoverPos.y - 60),
                  width: 260,
                }}
              >
                {hoveredParent ? (
                  <>
                    {cleanName(hoveredSource.name)}
                    <span style={{ opacity: 0.7 }}> · {cleanName(hoveredParent.name)}</span>
                  </>
                ) : (
                  cleanName(hoveredSource.name)
                )}
              </div>
            )}
          </div> {/* /.strips-svg-wrap */}

          {/* Source card — appears below the chart on selection. Mirrors the
              Mythen card layout but tweaked for sources: the colour bar maps
              to the source category instead of correctness_class, and the
              actions are toggle-children / go-to-parent (sources have no
              factsheet to link out to). */}
          {selectedSource && (
            <div className="strips-myth-card" role="status">
              <button
                type="button"
                className="strips-myth-card__close"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSourceId(null);
                }}
                aria-label="Schließen"
                title="Schließen"
              >
                ×
              </button>
              <div
                className="strips-myth-card__bar"
                style={{ background: selectedCategory?.color || '#6B7280' }}
              >
                <span className="strips-myth-card__bar-label">
                  {selectedCategory?.name || 'Quelle'}
                </span>
              </div>
              <p className="strips-myth-card__statement">{cleanName(selectedSource.name)}</p>
              {selectedParent && (
                <p className="strips-myth-card__summary">
                  Unterkategorie von <strong>{cleanName(selectedParent.name)}</strong>
                </p>
              )}

              {/* All four (or five) values for the selected source in a single
                  glance — the floating SVG pills carry the same numbers but
                  this gives a static, screen-reader-friendly readout that
                  doesn't depend on dot positions. The label says exactly which
                  axis of the chart each number maps to. */}
              <div className="strips-myth-card__values">
                {columns.map((col) => {
                  const v = col.valueBySource.get(selectedSource.id) ?? null;
                  return (
                    <div key={`val-${String(col.id)}`} className="strips-myth-card__value">
                      <span className="strips-myth-card__value-label">{col.shortLabel}</span>
                      <span className="strips-myth-card__value-num">{formatPillValue(v)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="strips-myth-card__actions">
                {selectedHasChildren && !showChildren && (
                  <button
                    className="strips-myth-card__more"
                    onClick={(e) => {
                      e.stopPropagation();
                      update('sourcesShowChildren', true);
                    }}
                  >
                    Unterkategorien zeigen
                  </button>
                )}
                {selectedParent && (
                  <button
                    className="strips-myth-card__more"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSourceId(selectedParent.id);
                    }}
                  >
                    Zum Hauptthema
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Category-pill row — doubles as legend AND filter. There are only
              6 categories so pills are clearer than a dropdown (and each
              pill carries its own swatch, so users learn the colour map by
              looking at the same row that filters the chart). */}
          <div className="strips-cat-pills" role="group" aria-label="Quellen-Kategorien filtern">
            <button
              type="button"
              className={`strips-cat-pill ${categoryFilter.length === 0 ? 'active' : ''}`}
              onClick={() => update('sourceCategoryFilter', [])}
              aria-pressed={categoryFilter.length === 0}
            >
              <Layers size={13} strokeWidth={1.75} aria-hidden="true" />
              <span>Alle Quellen</span>
            </button>
            {sourceData.sourceCategories.map((cat) => {
              const active = categoryFilter.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`strips-cat-pill ${active ? 'active' : ''}`}
                  onClick={() => {
                    // Single-select-style toggle: clicking a pill replaces the
                    // filter with just that category, clicking it again clears
                    // the filter. (Multi-select would need shift-click — not
                    // worth the complexity for a 6-item list.)
                    if (active) update('sourceCategoryFilter', []);
                    else update('sourceCategoryFilter', [cat.id]);
                  }}
                  aria-pressed={active}
                  style={{
                    // Accent each pill with its category colour so the legend
                    // role is unambiguous even when the pill isn't selected.
                    borderColor: active ? cat.color : undefined,
                    color: active ? cat.color : undefined,
                  }}
                >
                  <span
                    className="strips-cat-pill__swatch"
                    style={{ background: cat.color }}
                    aria-hidden="true"
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
            <span className="strips-cat-pills__count" aria-live="polite">
              {parentCount} Quellen
            </span>
          </div>

          </> /* /sourceData loaded */ )}

        </div>
      </div>
    </div>
  );
}
