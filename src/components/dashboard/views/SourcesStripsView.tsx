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

import { useEffect, useImperativeHandle, useMemo, useRef, useState, useCallback, forwardRef } from 'react';
import * as d3 from 'd3';
import {
  Search, Eye, ShieldCheck, Sparkles,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
  Layers, Download,
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
import PivotToggle from '../controls/PivotToggle';
import DataPicker, { type DataPickerOption } from '../controls/DataPicker';
import ToolbarRow from '../controls/ToolbarRow';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
  /** Stage 3 — open the shared ExportDrawer. The chip lives in this
   *  view's ToolbarRow `actions` slot so every chart-bearing tab
   *  surfaces the same Exportieren control. */
  onOpenExport?: () => void;
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

/**
 * Information-source metric icons. Chosen so they read as "rhymes" of
 * the Mythen `INDICATOR_ICONS` (`StripsView.tsx`) without colliding —
 * a Sources strip and a Mythen strip never share the same glyph.
 *
 *   search     → Search       — "the user actively searches"
 *   perception → Eye          — "the user passively perceives"
 *                              (Mythen's `awareness` also uses Eye, but
 *                               those tabs never co-render and the verb
 *                               relationship is intentional)
 *   trust      → ShieldCheck  — replaces the older `Shield` so it
 *                              doesn't collide with Mythen's
 *                              `prevention_significance` = `Shield`
 *   prevention → Sparkles     — Mythen's `prevention_significance` is
 *                              Shield; Sources' synthetic prevention
 *                              metric uses Sparkles to read as "spark
 *                              of insight" rather than "armoured"
 */
const METRIC_ICONS: Record<SourceMetricType, LucideIcon> = {
  search: Search,
  perception: Eye,
  trust: ShieldCheck,
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

/** Imperative handle so MythenExplorer's ExportDrawer can grab the
 *  live `<svg>` for image export. Mirrors `StripsViewHandle`. */
export interface SourcesStripsViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

const SourcesStripsView = forwardRef<SourcesStripsViewHandle, Props>(
  function SourcesStripsView({ state, update, definitions, onOpenExport }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current,
  }));
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

  // (Stage 2 — top-picker open/close state lives inside <DataPicker>
  //  now; the previous topPickerOpen / topPickerRef / topExpandedInfo
  //  hooks were dropped along with the inline .strips-picker JSX.)

  const mode: SourcesStripsMode = state.sourcesStripsMode;
  // (`sourcesShowChildren` was dropped in Stage 4 — subcategories
  // always render as smaller, lower-opacity dots beneath their
  // parents. The dimming is handled per-dot in the SVG below.)
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

  // (Outside-click / Escape close handlers moved into <DataPicker>.)

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

  /** Filter sources by the active category-pill filter. Subcategories
   *  always render alongside their parents (Stage 4 of the
   *  Daten-Explorer refactor removed the user-facing toggle — the
   *  subcategories are always present, rendered as smaller, dimmer
   *  dots so the parent stripe stays the dominant signal). */
  const visibleSources = useMemo(() => {
    if (!sourceData) return [] as InformationSource[];
    const filterByCat = (s: InformationSource) =>
      categoryFilter.length === 0 || categoryFilter.includes(s.category);
    const parents = sourceData.sources.filter((s) => s.parentId === null && filterByCat(s));
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
  }, [sourceData, categoryFilter]);

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
  // (`selectedHasChildren` removed in Stage 4 — the "Unterkategorien
  //  zeigen" button it gated is gone now that subcategories always
  //  render.)
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
          {/* Stage 2 — toolbar via shared primitives. The "Detail:
              Unterkategorien" toggle stays as a custom action button
              for now; Stage 4 of the Daten-Explorer refactor removes
              it entirely (subcategories will always render). */}
          {(() => {
            const activeId = topRow.items.find((it) => it.active)?.id
              ?? topRow.items[0]?.id
              ?? '';
            const valuePickerOptions: DataPickerOption<string>[] = topRow.items.map(
              (item) => ({
                value: item.id,
                label: item.label,
                Icon: item.Icon,
                definition:
                  item.defLabel && item.defText
                    ? {
                        title: item.defLabel,
                        text: item.defText,
                        scale: item.scale,
                        sampleSize: item.sampleSize,
                      }
                    : undefined,
              }),
            );
            return (
              <ToolbarRow
                aria-label="Informationsquellen-Steuerung"
                pivot={
                  <PivotToggle<SourcesStripsMode>
                    aria-label="Pivot wählen"
                    value={mode}
                    onChange={(v) => update('sourcesStripsMode', v)}
                    options={[
                      { value: 'metric', label: 'Indikatoren' },
                      { value: 'group', label: 'Gruppen' },
                    ]}
                  />
                }
                pickers={[
                  <DataPicker<string>
                    key="value"
                    caption={topRow.caption}
                    value={activeId}
                    options={valuePickerOptions}
                    onChange={(next) => {
                      const item = topRow.items.find((it) => it.id === next);
                      item?.onActivate();
                    }}
                    aria-label={topRow.caption}
                    lang="de"
                  />,
                ]}
                actions={
                  onOpenExport ? (
                    <button
                      type="button"
                      className="carm-btn carm-btn--ghost"
                      onClick={onOpenExport}
                      aria-label="Exportieren"
                    >
                      <Download size={14} strokeWidth={2} aria-hidden="true" />
                      Exportieren
                    </button>
                  ) : undefined
                }
              />
            );
          })()}

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
              ref={svgRef}
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
                {/* Stage 4 — "Unterkategorien zeigen" button removed.
                    Subcategories now render unconditionally, so the
                    affordance has no work to do. */}
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

          {/* Stage 4 — bottom category-pill row replaced by a
              searchable <DataPicker>. The picker still doubles as a
              filter, but the legend role moved to the small swatch
              row directly below (so the colour map remains visible
              without a dropdown). */}
          {(() => {
            const allValue = '__all__';
            const pickerOptions: DataPickerOption<string>[] = [
              { value: allValue, label: 'Alle Quellen', Icon: Layers },
              ...sourceData.sourceCategories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
            ];
            const pickerValue =
              categoryFilter.length === 0 ? allValue : categoryFilter[0];
            return (
              <div className="strips-cat-picker">
                <DataPicker<string>
                  caption="Kategorie"
                  value={pickerValue}
                  options={pickerOptions}
                  onChange={(next) => {
                    if (next === allValue) update('sourceCategoryFilter', []);
                    else update('sourceCategoryFilter', [next]);
                  }}
                  aria-label="Quellen-Kategorie"
                  searchable
                  searchPlaceholder="Kategorie suchen…"
                  lang="de"
                />
                <span className="strips-cat-pills__count" aria-live="polite">
                  {parentCount} Quellen
                </span>
              </div>
            );
          })()}

          {/* Compact legend row beneath the picker — preserves the
              colour-map signal that the old pill row carried. Pure
              decoration, not interactive. */}
          <div className="strips-cat-legend" aria-hidden="true">
            {sourceData.sourceCategories.map((cat) => (
              <span key={cat.id} className="strips-cat-legend__item">
                <span
                  className="strips-cat-legend__swatch"
                  style={{ background: cat.color }}
                />
                {cat.name}
              </span>
            ))}
          </div>

          </> /* /sourceData loaded */ )}

        </div>
      </div>
    </div>
  );
});

export default SourcesStripsView;
