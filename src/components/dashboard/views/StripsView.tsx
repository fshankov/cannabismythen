/**
 * StripsView v3 — vertical strips with three pivot modes.
 *
 * Layout:
 *   - Left rail: 3 vertical pills, one per pivot mode (Themen / Gruppen /
 *     Indikatoren), text rotated 90°. The active pill marks which row's items
 *     become the SVG strips (the chart's X-axis).
 *   - Three rows of icon-blocks above the chart:
 *       Row 1: 5 Quiz themes
 *       Row 2: 5 population groups
 *       Row 3: 5 indicators
 *     One row corresponds to the active pivot — its blocks visually align with
 *     the SVG strips below. The other two rows behave as filters/selectors.
 *   - SVG: 5 strips. A small "↓ Indikatoren / Gruppen / Themen" badge sits at
 *     the top of the chart pointing down at the strips.
 *
 * Interaction:
 *   - Hover a dot → faint dashed polyline through strips + statement label
 *     near the cursor. Card-free.
 *   - Tap a dot → highlight (Stage 1). Top rows collapse and a fakten-karten-
 *     style myth card replaces them with statement + verdict + cardSummary +
 *     "Mehr" button. Each highlighted dot gets a numeric value pill anchored
 *     beside it (no separate readout panel needed).
 *   - "Mehr" → opens the factsheet.
 *   - Tap anywhere outside dot/card → deselect.
 */

import { useEffect, useImperativeHandle, useMemo, useRef, useState, useCallback, forwardRef } from 'react';
import type { ReactNode } from 'react';
import * as d3 from 'd3';
import {
  Eye, TrendingUp, Target, Shield, Globe,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  Myth, Metric, Group, GroupId, AppState, Indicator,
  StripsMode, QuizThemeSlug, DashboardDefinitions,
} from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText, getMythText } from '../../../lib/dashboard/data';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import InfoTooltip from '../InfoTooltip';
import VerdictArrowWithInfo from '../VerdictArrowWithInfo';
import PivotToggle from '../controls/PivotToggle';
import DataPicker, { type DataPickerOption } from '../controls/DataPicker';
import ToolbarRow from '../controls/ToolbarRow';
import type { CorrectnessClass } from '../../../lib/dashboard/types';
import type { MythContentEntry } from '../FactsheetPanel';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  groups: Group[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Opens the factsheet panel. */
  onSelectMyth: (id: number) => void;
  definitions?: DashboardDefinitions | null;
  /** mythId → Quiz theme slug (kept for future use — unused in current UI). */
  mythThemes?: Record<number, string>;
  /** Pre-rendered factsheet HTML, keyed by myth id. Used here to pull the
   *  fakten-karten-style summary for the in-view myth card. */
  mythContentMap?: Record<number, MythContentEntry>;
  /** Shared toolbar actions (Mythos-Suche, Filter, Exportieren) rendered
   *  on the right of every tab's toolbar so the bar reads identically
   *  across views. */
  sharedActions?: ReactNode;
}

const INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance', 'population_relevance'];
const STRIP_GROUP_IDS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

const INDICATOR_ICONS: Record<Indicator, LucideIcon> = {
  awareness: Eye,
  significance: TrendingUp,
  correctness: Target,
  prevention_significance: Shield,
  population_relevance: Globe,
};

const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  adults: Users,
  minors: Baby,
  consumers: Cannabis,
  young_adults: GraduationCap,
  parents: UsersRound,
};

/** Short aliases for population groups on narrow viewports. */
const GROUP_SHORT_DE: Record<GroupId, string> = {
  adults: 'Erw.',
  minors: 'Minderj.',
  consumers: 'Konsum.',
  young_adults: 'Junge Erw.',
  parents: 'Eltern',
};
const GROUP_SHORT_EN: Record<GroupId, string> = {
  adults: 'Adults',
  minors: 'Minors',
  consumers: 'Cons.',
  young_adults: 'Y. Adults',
  parents: 'Parents',
};

type ColumnId = Indicator | GroupId | QuizThemeSlug;

interface BeeswarmNode {
  mythId: number;
  myth: Myth;
  value: number;
  y0: number;
  x: number;
  y: number;
}

interface ColumnData {
  id: ColumnId;
  label: string;
  shortLabel: string;
  /** Either a Lucide icon (groups / indicators) or an emoji string (themes). */
  Icon?: LucideIcon;
  emoji?: string;
  defLabel?: string;
  defText?: string;
  scale?: string;
  sampleSize?: string;
  nodes: BeeswarmNode[];
  radius: number;
  valueByMyth: Map<number, number>;
}

/** Format a metric value for display in a value pill. */
function formatPillValue(value: number | null, isAwareness: boolean, lang: 'de' | 'en'): string {
  if (value === null) return t('strips.na', lang);
  return `${value.toFixed(1)}${isAwareness ? '%' : ''}`;
}

/** Imperative handle exposed via forwardRef so MythenExplorer's
 *  ExportDrawer can grab the live `<svg>` for PNG / SVG export.
 *  Stage 3 of the Daten-Explorer refactor wires this ref through every
 *  chart-bearing tab (Balken uses the BalkenView ECharts handle, the
 *  D3-rendered Streifen + Sources views expose their raw SVG via
 *  this interface). */
export interface StripsViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

const StripsView = forwardRef<StripsViewHandle, Props>(function StripsView(
  { myths, metrics, groups, state, update, onSelectMyth, definitions, mythContentMap, sharedActions },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current,
  }));
  const [width, setWidth] = useState(360);
  /** Available viewport height — drives the SVG's strip-rectangle height so
   *  the grey boxes always fill the chart area regardless of screen size. */
  const [viewportH, setViewportH] = useState(typeof window !== 'undefined' ? window.innerHeight : 720);
  /** Hover state — separate from selection. Drives the polyline + statement label. */
  const [hoveredMythId, setHoveredMythId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  // Open/close + inline-definition expansion is encapsulated by
  // <DataPicker> in Stage 2 of the Daten-Explorer refactor — we no
  // longer need topPickerOpen / catPickerOpen / topExpandedInfo /
  // ref<HTMLDivElement> here.

  const selectedMythId = state.selectedMythId;
  const mode: StripsMode = state.stripsMode;
  const selectedGroup: GroupId = state.groupIds[0] || 'adults';
  const selectedIndicator: Indicator = state.indicator;

  useEffect(() => {
    if (!contentRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(Math.floor(w));
    });
    obs.observe(contentRef.current);
    return () => obs.disconnect();
  }, []);

  // Track viewport height so the SVG can scale to fill the available area.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // (Outside-click + Escape close handlers were moved into <DataPicker>
  //  during Stage 2 — each picker manages its own state internally.)

  const isMobile = width < 640;
  const isNarrow = width < 480;

  // SVG layout — small top margin since the strip rect itself contains a
  // header area at the top (drawn directly inside the rect with a divider line).
  const margin = isMobile
    ? { top: 8, right: 8, bottom: 28, left: 28 }
    : { top: 10, right: 20, bottom: 32, left: 36 };

  /** Height of the in-strip header area (icon + label + i tooltip), drawn at
   *  the top of each strip rectangle inside the SVG. */
  const headerH = isMobile ? 50 : 56;

  /**
   * Chart height: scales with the viewport. Reserves space for: tabs, filter
   * bar / utility, howto microcopy, the 1 row above SVG, the categories pill
   * row below SVG, mobile tab-bar (56px), and breathing room.
   */
  const reservedH = isMobile ? 360 : 300;
  const height = Math.max(360, Math.min(820, viewportH - reservedH));

  const innerW = Math.max(0, width - margin.left - margin.right);
  /** Dot area height (excludes the in-strip header area). */
  const innerH = Math.max(0, height - margin.top - margin.bottom - headerH);
  const colGap = isMobile ? 4 : 10;
  const numColumns = 5;
  const colW = (innerW - colGap * (numColumns - 1)) / Math.max(1, numColumns);

  /** Y is fixed: 0 at bottom, 100 at top. The output range is shifted by
   *  headerH so dots/ticks are placed inside the dot area, below the header. */
  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, 100]).range([headerH + innerH, headerH]),
    [innerH, headerH],
  );

  const colCenterX = useCallback(
    (i: number) => margin.left + colW / 2 + i * (colW + colGap),
    [margin.left, colW, colGap],
  );

  const ticks = [0, 20, 40, 60, 80, 100];

  // The myths prop is already filtered by the FilterBar's category logic
  // (state.categoryIds), so the chart consumes it directly.
  const visibleMyths = myths;

  // Build columns based on the active pivot
  const columns = useMemo<ColumnData[]>(() => {
    /** Dot radius scales linearly with column width so the beeswarm fills the
     *  available horizontal space comfortably across screen sizes. Clamped
     *  3.5–8 px to keep dots tappable on phones and not absurd on big screens. */
    const radius = Math.max(3.5, Math.min(8, colW * 0.07));
    const buildNodes = (mythsForCol: Myth[], getValue: (myth: Myth) => number | null) => {
      const nodes: BeeswarmNode[] = [];
      const map = new Map<number, number>();
      for (const myth of mythsForCol) {
        const v = getValue(myth);
        if (v === null) continue;
        const y0 = yScale(v);
        nodes.push({ mythId: myth.id, myth, value: v, y0, x: 0, y: y0 });
        map.set(myth.id, v);
      }
      const sim = d3
        .forceSimulation(nodes as any)
        .force('y', d3.forceY<BeeswarmNode>((d) => d.y0).strength(1))
        .force('x', d3.forceX<BeeswarmNode>(0).strength(0.18))
        .force('collide', d3.forceCollide<BeeswarmNode>(radius + 0.6))
        .stop();
      for (let i = 0; i < 140; i++) sim.tick();
      // Clamp x within the column half-width AND y within the dot area so
      // dots never spill above y=100 or below y=0 when the beeswarm is dense.
      const halfW = Math.max(4, colW / 2 - radius - 2);
      const yMin = headerH + radius + 1;          // top edge of dot area
      const yMax = headerH + innerH - radius - 1; // bottom edge of dot area
      for (const n of nodes) {
        if (n.x > halfW) n.x = halfW;
        if (n.x < -halfW) n.x = -halfW;
        if (n.y < yMin) n.y = yMin;
        if (n.y > yMax) n.y = yMax;
      }
      return { nodes, valueByMyth: map };
    };

    if (mode === 'indicator') {
      return INDICATORS.map((ind) => {
        const def = definitions?.mythIndicators?.[ind];
        const { nodes, valueByMyth } = buildNodes(visibleMyths, (m) => {
          const metric = getMythMetric(metrics, m.id, selectedGroup);
          return getIndicatorValue(metric, ind);
        });
        const label = t(`indicator.${ind}.short` as any, state.lang);
        return {
          id: ind as ColumnId,
          label,
          shortLabel: label,
          Icon: INDICATOR_ICONS[ind],
          defLabel: def?.label,
          defText: def?.definition,
          scale: def?.scale,
          nodes, radius, valueByMyth,
        };
      });
    }
    if (mode === 'group') {
      return STRIP_GROUP_IDS.map((gid) => {
        const g = groups.find((x) => x.id === gid);
        const def = definitions?.groups?.[gid];
        const { nodes, valueByMyth } = buildNodes(visibleMyths, (m) => {
          const metric = getMythMetric(metrics, m.id, gid);
          return getIndicatorValue(metric, selectedIndicator);
        });
        const fullLabel = g ? (state.lang === 'de' ? g.name_de : g.name_en) : gid;
        const shortLabel = state.lang === 'de' ? GROUP_SHORT_DE[gid] : GROUP_SHORT_EN[gid];
        return {
          id: gid as ColumnId,
          label: fullLabel,
          shortLabel,
          Icon: GROUP_ICONS[gid],
          defLabel: def?.label,
          defText: def?.definition,
          sampleSize: def?.sampleSize,
          nodes, radius, valueByMyth,
        };
      });
    }
    // mode is exhaustively handled above ('indicator' or 'group').
    // (Themen no longer pivots — it stays as a filter row only.)
    return [];
  }, [mode, myths, visibleMyths, metrics, groups, selectedGroup, selectedIndicator, yScale, isMobile, state.lang, definitions, colW]);

  // Stage 1 — tap a dot to highlight
  const handleDotClick = useCallback(
    (mythId: number) => {
      if (mythId === selectedMythId) {
        update('selectedMythId', null);
      } else {
        update('selectedMythId', mythId);
      }
    },
    [selectedMythId, update],
  );

  // Global click-to-deselect
  useEffect(() => {
    if (selectedMythId === null) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      if (target.closest('.strips-myth-card')) return;
      if (target.closest('.factsheet-panel') || target.closest('.factsheet-panel__backdrop')) return;
      update('selectedMythId', null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [selectedMythId, update]);

  const selectedMyth = selectedMythId !== null ? myths.find((m) => m.id === selectedMythId) : null;
  const hoveredMyth = hoveredMythId !== null && hoveredMythId !== selectedMythId
    ? myths.find((m) => m.id === hoveredMythId) ?? null
    : null;

  // The myth whose connecting line + value pills we draw — selection wins, else hover.
  const focusMythId = selectedMythId ?? hoveredMythId;
  const focusMyth = selectedMyth || hoveredMyth;

  // ── Three rows: Themen / Gruppen / Indikatoren ───────────────────
  type RowItem = {
    id: string;
    Icon?: LucideIcon;
    emoji?: string;
    label: string;
    shortLabel: string;
    active: boolean;
    onActivate: () => void;
    defLabel?: string;
    defText?: string;
    scale?: string;
    sampleSize?: string;
  };

  // Themen filter row removed — replaced by the category pill row below the SVG.

  const groupRow: RowItem[] = useMemo(() => STRIP_GROUP_IDS.map((gid) => {
    const g = groups.find((x) => x.id === gid);
    const def = definitions?.groups?.[gid];
    const fullLabel = g ? (state.lang === 'de' ? g.name_de : g.name_en) : gid;
    const shortLabel = state.lang === 'de' ? GROUP_SHORT_DE[gid] : GROUP_SHORT_EN[gid];
    return {
      id: gid,
      Icon: GROUP_ICONS[gid],
      label: fullLabel,
      shortLabel,
      active: state.groupIds[0] === gid,
      onActivate: () => update('groupIds', [gid]),
      defLabel: def?.label,
      defText: def?.definition,
      sampleSize: def?.sampleSize,
    };
  }), [groups, state.groupIds, state.lang, definitions, update]);

  const indicatorRow: RowItem[] = useMemo(() => INDICATORS.map((ind) => {
    const def = definitions?.mythIndicators?.[ind];
    const label = t(`indicator.${ind}.short` as any, state.lang);
    return {
      id: ind,
      Icon: INDICATOR_ICONS[ind],
      label,
      shortLabel: label,
      active: state.indicator === ind,
      onActivate: () => update('indicator', ind),
      defLabel: def?.label,
      defText: def?.definition,
      scale: def?.scale,
    };
  }), [state.indicator, state.lang, definitions, update]);

  /**
   * Above the SVG: ONE row only — the non-active dimension. The active row
   * is rendered INSIDE the SVG as merged strip headers (see below).
   *
   * Below the SVG: a horizontal pill row with [Alle] + 7 carm-data categories.
   */
  type RowKey = 'indicator' | 'group';
  const topRow: { key: RowKey; items: RowItem[] } = useMemo(() => {
    if (mode === 'indicator') return { key: 'group', items: groupRow };
    return { key: 'indicator', items: indicatorRow };
  }, [mode, indicatorRow, groupRow]);

  // The earlier `renderRow` / `activeRow` helpers rendered the
  // top-of-chart filter rows that lived above the SVG. The toolbar
  // consolidation moved that affordance into the shared ToolbarRow
  // (the "Wert für" picker), so the helpers are gone.

  // ── Myth card content (selected state) ────────────────────────────
  const selectedMythContent = selectedMyth ? mythContentMap?.[selectedMyth.id] : null;
  const cardTitle = selectedMyth
    ? (selectedMythContent?.title || getMythText(selectedMyth, state.lang))
    : '';
  const cardSummary = selectedMyth ? extractCardSummary(selectedMythContent, selectedMyth, state.lang) : '';
  // Canonical verdict label (matches verdict.* in translations.ts) — the
  // conversational classificationLabel from `.mdoc` is intentionally bypassed
  // so the Streifen card matches the rest of the verdict surfaces.
  const cardClassification = selectedMyth
    ? t(`verdict.${selectedMyth.correctness_class}` as TranslationKey, state.lang)
    : '';

  return (
    <div className="strips-v3" ref={containerRef}>
      <div className={`strips-grid3 ${selectedMyth ? 'has-selection' : ''}`}>
        {/* Single content column. Pivot is now driven by the in-view
            'Vergleichen nach:' toggle below — same pattern as the
            Informationsquellen tab's 'Spalten:' switch. */}
        <div className="strips-grid3__content" ref={contentRef}>
          {/* Unified toolbar — pivot + "Wert für" picker on the left,
              shared actions (Mythos-Suche, Filter, Exportieren) on the
              right so the bar reads identically across all four tabs.
              The "Mythos-Kategorie" dropdown that used to live here was
              removed in the toolbar-consolidation pass — its job is now
              done by the unified Filter drawer. */}
          {(() => {
            const activeId = topRow.items.find((it) => it.active)?.id
              ?? topRow.items[0]?.id
              ?? '';
            const valuePickerOptions: DataPickerOption<string>[] = topRow.items.map(
              (item) => ({
                value: item.id,
                label: item.label,
                Icon: item.Icon,
                emoji: item.emoji,
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
                aria-label={t('strips.compare.label', state.lang)}
                pivot={
                  <PivotToggle<typeof mode>
                    aria-label={t('strips.compare.label', state.lang)}
                    value={mode}
                    onChange={(v) => update('stripsMode', v)}
                    options={[
                      { value: 'indicator', label: t('strips.mode.indicator', state.lang) },
                      { value: 'group', label: t('strips.mode.group', state.lang) },
                    ]}
                  />
                }
                pickers={[
                  <DataPicker<string>
                    key="value"
                    caption={t('strips.value.label', state.lang)}
                    value={activeId}
                    options={valuePickerOptions}
                    onChange={(next) => {
                      const item = topRow.items.find((it) => it.id === next);
                      item?.onActivate();
                    }}
                    aria-label={t('strips.value.label', state.lang)}
                    lang={state.lang}
                  />,
                ]}
                actions={sharedActions}
              />
            );
          })()}

          {/* SVG chart wrapper — relative-positioned so HTML strip headers
              can be absolutely positioned over the in-SVG header area for
              each column, giving us a single unified box per strip. */}
          <div className="strips-svg-wrap" style={{ position: 'relative', width }}>
          <svg
            ref={svgRef}
            className="strips-svg-v3"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={t('howto.strips', state.lang)}
            onMouseLeave={() => { setHoveredMythId(null); setHoverPos(null); }}
          >
            {/* Strip backgrounds + gridlines.
                Each strip is ONE fully-rounded grey rectangle that spans both
                the header area at the top (icon + label + 'i') and the dots
                area below. A thin horizontal line divides the two zones inside
                the rect. The HTML header content is rendered above the SVG via
                absolute positioning (see `.strips-svg-headers` below). */}
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
                  {/* Divider between header area and dot area */}
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
                      {t('strips.na', state.lang)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Connecting polyline through the focused myth (selection or hover) */}
            {focusMyth && (
              <g transform={`translate(0, ${margin.top})`} pointerEvents="none">
                <path
                  d={(() => {
                    const pts: Array<{ x: number; y: number }> = [];
                    columns.forEach((col, i) => {
                      const node = col.nodes.find((n) => n.mythId === focusMyth.id);
                      if (!node) return;
                      pts.push({ x: colCenterX(i) + node.x, y: node.y });
                    });
                    if (pts.length < 2) return '';
                    return d3.line<{ x: number; y: number }>()
                      .x((p) => p.x).y((p) => p.y)
                      .curve(d3.curveMonotoneX)(pts) || '';
                  })()}
                  fill="none"
                  stroke={selectedMyth ? '#0f172a' : '#475569'}
                  strokeOpacity={selectedMyth ? 0.85 : 0.55}
                  strokeWidth={1.5}
                  strokeDasharray={selectedMyth ? '4 3' : '2 4'}
                />
              </g>
            )}

            {/* Dots — focused dot rendered last so its hit-area overlays neighbors.
                Streifen colour-encodes by *Verdict* via getCorrectnessColor below.
                Note: this differs intentionally from BalkenView, where the bar
                colour also encodes Verdict. Streifen used to colour by Mythos
                category; both views now share the Verdict palette so the legend
                works site-wide. */}
            {columns.map((col, i) => {
              const cx = colCenterX(i);
              const sortedNodes = focusMythId === null
                ? col.nodes
                : [...col.nodes.filter((n) => n.mythId !== focusMythId),
                   ...col.nodes.filter((n) => n.mythId === focusMythId)];
              return (
                <g key={`dots-${String(col.id)}`} transform={`translate(0, ${margin.top})`}>
                  {sortedNodes.map((n) => {
                    const isSel = n.mythId === selectedMythId;
                    const isHov = n.mythId === hoveredMythId && !isSel;
                    const dimmed = focusMythId !== null && !(isSel || isHov);
                    const r = isSel ? col.radius + 2.5 : isHov ? col.radius + 1.5 : col.radius;
                    const hitR = isSel ? 22 : 14;
                    const dotX = cx + n.x;
                    const dotY = n.y;
                    return (
                      <g key={`${col.id}-${n.mythId}`}>
                        <circle
                          cx={dotX}
                          cy={dotY}
                          r={r}
                          fill={getCorrectnessColor(n.myth.correctness_class)}
                          // Ghost non-highlighted dots at 10 % when something is focused;
                          // highlighted dot + connecting polyline stay full opacity.
                          fillOpacity={dimmed ? 0.1 : isSel ? 1 : isHov ? 1 : 0.85}
                          stroke={isSel ? '#0f172a' : isHov ? '#475569' : 'none'}
                          strokeWidth={isSel ? 1.5 : isHov ? 1 : 0}
                        />
                        <circle
                          cx={dotX}
                          cy={dotY}
                          r={hitR}
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); handleDotClick(n.mythId); }}
                          onMouseEnter={() => {
                            setHoveredMythId(n.mythId);
                            setHoverPos({ x: dotX, y: dotY + margin.top });
                          }}
                          onMouseLeave={() => setHoveredMythId(null)}
                        />
                        {/* Native browser tooltip <title> intentionally omitted: the
                            custom hover label below replaces it (and prevents the
                            two from rendering simultaneously). */}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Inline value pills next to highlighted dots — shown on
                selection AND on hover so users see the numbers either way. */}
            {focusMyth && (
              <g transform={`translate(0, ${margin.top})`} pointerEvents="none">
                {columns.map((col, i) => {
                  const node = col.nodes.find((n) => n.mythId === focusMyth.id);
                  const v = col.valueByMyth.get(focusMyth.id) ?? null;
                  const isAwareness = mode === 'indicator' && col.id === 'awareness';
                  const valText = formatPillValue(v, isAwareness, state.lang);
                  const cx = colCenterX(i);
                  // Anchor pill to the right of the dot when there's room, else to the left
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
                  // Flip to left if pill would overflow strip on the right
                  if (pillX + pillW > cx + colW / 2 - padding) {
                    pillX = dotX - 10 - pillW;
                    pillTextAnchor = 'end';
                  }
                  // Clamp within strip horizontally
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

          {/* Absolute-positioned HTML headers over the in-SVG header area —
              one per column — so each strip rectangle reads as a single
              unified box: header on top, divider line, dots below. */}
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
                    {col.emoji ? (
                      <span className="strips-svg-header__emoji" aria-hidden="true">{col.emoji}</span>
                    ) : col.Icon ? (
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

          {/* Hover statement card — rendered AFTER strip-svg-headers so it
              paints on top of the icons + 'i' tooltip triggers when it
              overlaps them near the top of the chart. Pure HTML (not SVG
              foreignObject) so z-index works reliably. */}
          {hoveredMyth && hoverPos && !selectedMyth && (
            <div
              className="strips-hover-statement strips-hover-statement--abs"
              style={{
                left: Math.max(8, Math.min(width - 260, hoverPos.x - 130)),
                top: Math.max(8, hoverPos.y - 92),
                width: 260,
              }}
            >
              {getMythText(hoveredMyth, state.lang)}
            </div>
          )}
          </div> {/* /.strips-svg-wrap */}

          {/* Myth card — appears BELOW the SVG (above the categories pills)
              when a myth is selected, with a × close button at the top-right. */}
          {selectedMyth && (
            <div className="strips-myth-card" role="status">
              <button
                type="button"
                className="strips-myth-card__close"
                onClick={(e) => {
                  e.stopPropagation();
                  update('selectedMythId', null);
                }}
                aria-label={t('detail.close', state.lang)}
                title={t('detail.close', state.lang)}
              >
                ×
              </button>
              <div className={`strips-myth-card__bar classification--${selectedMyth.correctness_class}`}>
                <span
                  className="strips-myth-card__bar-icon"
                  onClick={(e) => e.stopPropagation()}
                >
                  <VerdictArrowWithInfo
                    verdict={selectedMyth.correctness_class as CorrectnessClass}
                    size={14}
                    strokeWidth={2.5}
                  />
                </span>
                <span className="strips-myth-card__bar-label">{cardClassification}</span>
              </div>
              <p
                className={`strips-myth-card__statement statement--${selectedMyth.correctness_class}`}
              >
                {cardTitle}
              </p>
              {cardSummary && <p className="strips-myth-card__summary">{cardSummary}</p>}
              <div className="strips-myth-card__actions">
                <button
                  className="strips-myth-card__more"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMyth(selectedMyth.id);
                  }}
                >
                  {t('strips.more', state.lang)} →
                </button>
              </div>
            </div>
          )}

          {/* (Mythos-Kategorie dropdown moved to the top controls row.) */}
        </div>
      </div>
    </div>
  );
});

export default StripsView;

/* ── Helpers ──────────────────────────────────────────────────────── */

// (`classificationIcon` was removed in Stage 1 of the Daten-Explorer
//  refactor — the strips myth card now renders <VerdictArrow /> inline.)

/**
 * Pull the cardSummary (fakten-karten short text) from the rendered factsheet HTML.
 * The factsheet HTML doesn't include the YAML-only cardSummary directly; we use the
 * "Synthese" section's first paragraph as the equivalent reader-friendly summary.
 * Falls back to the myth's short text.
 */
function extractCardSummary(
  content: MythContentEntry | null | undefined,
  myth: Myth,
  lang: 'de' | 'en',
): string {
  if (!content) return getMythShortText(myth, lang);
  const html = content.html;
  const match = html.match(/<h2[^>]*>\s*Synthese\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!match) return getMythShortText(myth, lang);
  const text = match[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return getMythShortText(myth, lang);
  // Take roughly the first sentence(s) up to ~220 chars
  const trimmed = text.length > 220 ? text.slice(0, 220).replace(/[^.!?…]+$/, '') + '…' : text;
  return trimmed || getMythShortText(myth, lang);
}
