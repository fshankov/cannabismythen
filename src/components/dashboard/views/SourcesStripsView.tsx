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
import type { ReactNode } from 'react';
import * as d3 from 'd3';
import {
  Search, Eye, ShieldCheck, Sparkles,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
  Layers, EyeOff,
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
import { useHiddenColumns } from '../hooks/useHiddenColumns';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
  /** Shared toolbar actions (Mythos-Suche, Filter, Exportieren) rendered
   *  on the right of every tab's toolbar so the bar stays consistent
   *  across views. */
  sharedActions?: ReactNode;
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
  // BugHerd #31 — round-to-int (no decimals on the whole site).
  return `${Math.round(value)}%`;
}

/** Imperative handle so MythenExplorer's ExportDrawer can grab the
 *  live `<svg>` for image export. Mirrors `StripsViewHandle`. */
export interface SourcesStripsViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

const SourcesStripsView = forwardRef<SourcesStripsViewHandle, Props>(
  function SourcesStripsView({ state, update, definitions, sharedActions }, ref) {
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
  /** Session 4b (BugHerd #53): parent-source sub-filter. Holds a list of
   *  parent source IDs (parentId === null) the user picked from the
   *  toolbar's "Quelle" picker. When non-empty, only those parents (and
   *  their channel children) render. Composes with categoryFilter
   *  (intersection). */
  const subFilter = state.sourceSubFilter;
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

  // Stage 6 v4: prominent left-margin y-axis labels removed; strips
  // can extend further left now. Tiny 12px gutter kept for breathing
  // room against the page edge.
  const margin = isMobile
    ? { top: 8, right: 8, bottom: 28, left: 12 }
    : { top: 10, right: 20, bottom: 32, left: 16 };

  const headerH = isMobile ? 50 : 56;

  // Match StripsView's reservedH so the chart breathes the same way.
  const reservedH = isMobile ? 360 : 300;
  const height = Math.max(360, Math.min(820, viewportH - reservedH));

  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = Math.max(0, height - margin.top - margin.bottom - headerH);
  const colGap = isMobile ? 4 : 10;

  // Stage 6 follow-up: per-column hide. Storage key is per-pivot so a
  // hide in 'metric' mode doesn't bleed into 'group' mode.
  const allColumnIds: string[] = mode === 'metric'
    ? (METRICS as unknown as string[])
    : (GROUPS as unknown as string[]);
  const { hidden, hide, show, isHidden } = useHiddenColumns(
    `carm.sources.hidden.${mode}`,
    allColumnIds,
  );

  const visibleColumnIds: string[] = allColumnIds.filter((id) => !isHidden(id));
  const hiddenColumnIds: string[] = allColumnIds.filter((id) => isHidden(id));

  const HIDDEN_STRIP_W = 28;
  const totalSlots = visibleColumnIds.length + hiddenColumnIds.length;
  const totalGaps = colGap * Math.max(0, totalSlots - 1);
  const availableForVisible = Math.max(
    0,
    innerW - HIDDEN_STRIP_W * hiddenColumnIds.length - totalGaps,
  );
  const numColumns = visibleColumnIds.length;
  const colW = availableForVisible / Math.max(1, numColumns);

  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, 100]).range([headerH + innerH, headerH]),
    [innerH, headerH],
  );

  /**
   * slotLayout — left x + width for each slot (visible + hidden) in
   * original column order. Identical pattern to StripsView.
   */
  type Slot = {
    id: string;
    kind: 'visible' | 'hidden';
    left: number;
    width: number;
  };
  const slotLayout: Slot[] = useMemo(() => {
    const out: Slot[] = [];
    let cursor = margin.left;
    allColumnIds.forEach((id) => {
      const isHid = hidden.has(id);
      const w = isHid ? HIDDEN_STRIP_W : colW;
      out.push({
        id,
        kind: isHid ? 'hidden' : 'visible',
        left: cursor,
        width: w,
      });
      cursor += w + colGap;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColumnIds, hidden, margin.left, colW, colGap]);

  const colCenterX = useCallback(
    (i: number) => {
      const visible = slotLayout.filter((s) => s.kind === 'visible');
      const slot = visible[i];
      if (!slot) return margin.left + colW / 2;
      return slot.left + slot.width / 2;
    },
    [slotLayout, margin.left, colW],
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
    // Session 4b (BugHerd #53): parent-source sub-filter. Composes with the
    // category filter (intersection): a parent must clear BOTH gates to
    // render. An empty subFilter is the no-op default.
    const subSet = subFilter.length > 0 ? new Set(subFilter) : null;
    const filterBySub = (s: InformationSource) =>
      subSet === null || subSet.has(s.id);
    const parents = sourceData.sources.filter(
      (s) => s.parentId === null && filterByCat(s) && filterBySub(s),
    );
    const result: InformationSource[] = [];
    const parentIds = new Set(parents.map((p) => p.id));
    for (const s of sourceData.sources) {
      if (s.parentId === null) {
        if (filterByCat(s) && filterBySub(s)) result.push(s);
      } else if (parentIds.has(s.parentId)) {
        result.push(s);
      }
    }
    return result;
  }, [sourceData, categoryFilter, subFilter]);

  /** Live count for the bottom-of-chart caption. Counts parents only — that
   *  is what users mean by "Quellen" (sub-categories are toggleable detail). */
  const parentCount = useMemo(
    () => visibleSources.filter((s) => s.parentId === null).length,
    [visibleSources],
  );

  // ── Build columns based on the active pivot ───────────────────────
  const columns = useMemo<ColumnData[]>(() => {
    if (!sourceData) return [];
    /**
     * Stage 6 follow-up: circle radius now scales by VIEWPORT WIDTH
     * (matches the StripsView arrow scaling tiers), with the column-
     * width math kept as a soft minimum so very narrow columns still
     * shrink the radius. Children render at radius × 0.7.
     *   <480px   → 5  (small phone)
     *   <768px   → 7  (large phone / portrait tablet)
     *   <1280px  → 9  (laptop / landscape tablet)
     *   ≥1280px  → 11 (desktop)
     */
    const widthBase =
      width < 480 ? 5
      : width < 768 ? 7
      : width < 1280 ? 9
      : 11;
    const radius = Math.max(3.5, Math.min(widthBase, colW * 0.09));

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
      return METRICS.filter((m) => !isHidden(m)).map((m) => {
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
    return GROUPS.filter((g) => !isHidden(g)).map((g) => {
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

          {/* Unified toolbar — pivot, the per-mode value picker, AND a
              "Quellen-Kategorie" picker that filters the chart. The
              Kategorie strip + legend that used to live below the SVG
              were removed in the toolbar-consolidation pass; the
              category info is surfaced inline on each dot via a native
              SVG <title> tooltip ("Quelle · Kategorie · Wert"). */}
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

            // Quellen-Kategorie picker — single-select with an "Alle Quellen"
            // sentinel. State lives in `state.sourceCategoryFilter` (multi-
            // select array preserved for URL back-compat); we collapse to
            // a single value here.
            const ALL = '__all__';
            const catOptions: DataPickerOption<string>[] = sourceData
              ? [
                  { value: ALL, label: 'Alle Quellen', Icon: Layers },
                  ...sourceData.sourceCategories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]
              : [{ value: ALL, label: 'Alle Quellen', Icon: Layers }];
            const catValue =
              categoryFilter.length === 0 ? ALL : categoryFilter[0];

            // Session 4b (BugHerd #53): Quelle (parent-source) picker —
            // single-select with an "Alle Unterkategorien" sentinel. Lists
            // every parentId=null source. When a Quellen-Kategorie is
            // active, the list narrows to that category's parents only so
            // the user can drill from a category into a specific source
            // (e.g. Internet → Influencer:innen). Selecting a parent here
            // BUT no category auto-clears any stale category filter — the
            // sub-filter is the more specific signal.
            //
            // German caption: "Quelle" (gloss: "Source"). Sentinel German:
            // "Alle Unterkategorien" (gloss: "All sub-categories"). Sie
            // baseline holds — there's no first-/second-person here.
            // DataPicker is generic over `T extends string`, so we serialise
            // numeric source IDs to strings at the boundary. The sentinel
            // for "no sub-filter" is the literal "__all__"; numeric strings
            // map back to source IDs via Number.parseInt.
            const SUB_ALL = '__all__';
            const subSourceOptions: DataPickerOption<string>[] = sourceData
              ? [
                  { value: SUB_ALL, label: 'Alle Unterkategorien' },
                  ...sourceData.sources
                    .filter((s) => {
                      if (s.parentId !== null) return false;
                      // When a Quellen-Kategorie is active, narrow the
                      // sub-list to that category's parents only.
                      if (categoryFilter.length > 0)
                        return categoryFilter.includes(s.category);
                      return true;
                    })
                    // Order: category-id (matches Quellen-Kategorie order
                    // in the picker above) → name. Stable, so the list
                    // groups by category visually without needing dividers.
                    .sort((a, b) => {
                      const ca = a.category.localeCompare(b.category);
                      if (ca !== 0) return ca;
                      return a.name.localeCompare(b.name, 'de');
                    })
                    .map((s) => ({ value: String(s.id), label: s.name })),
                ]
              : [{ value: SUB_ALL, label: 'Alle Unterkategorien' }];
            const subValue =
              subFilter.length === 0 ? SUB_ALL : String(subFilter[0]);

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
                  <DataPicker<string>
                    key="quellen-kategorie"
                    caption="Quellen-Kategorie"
                    value={catValue}
                    options={catOptions}
                    onChange={(next) => {
                      if (next === ALL) {
                        update('sourceCategoryFilter', []);
                      } else {
                        update('sourceCategoryFilter', [next]);
                        // Session 4b: when the user picks a category, drop
                        // any sub-filter pick that no longer belongs to it.
                        // Otherwise the picker shows a stale active value
                        // that doesn't match any visible row.
                        if (subFilter.length > 0 && sourceData) {
                          const stillValid = subFilter.filter((id) => {
                            const src = sourceData.sources.find((s) => s.id === id);
                            return src ? src.category === next : false;
                          });
                          if (stillValid.length !== subFilter.length) {
                            update('sourceSubFilter', stillValid);
                          }
                        }
                      }
                    }}
                    aria-label="Quellen-Kategorie"
                    searchable
                    searchPlaceholder="Kategorie suchen…"
                    lang="de"
                  />,
                  // Session 4b (BugHerd #53): Quelle sub-picker. Searchable
                  // because the parent-source list is ~30 rows long when no
                  // category is active; type-ahead is the fastest way to
                  // jump to "Influencer:innen" or "Suchmaschinen".
                  <DataPicker<string>
                    key="quelle-sub"
                    caption="Quelle"
                    value={subValue}
                    options={subSourceOptions}
                    onChange={(next) => {
                      if (next === SUB_ALL) {
                        update('sourceSubFilter', []);
                      } else {
                        const id = Number.parseInt(next, 10);
                        if (Number.isFinite(id) && id > 0)
                          update('sourceSubFilter', [id]);
                      }
                    }}
                    aria-label="Quelle"
                    searchable
                    searchPlaceholder="Quelle suchen…"
                    lang="de"
                  />,
                ]}
                actions={sharedActions}
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

          {/* Chart wrapper — same structure as StripsView. Stage 6: the
              "Alle Spalten einblenden" reset link was removed; hidden
              strips themselves are clickable to reveal. */}
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
              {/* Stage 6 v4: prominent left-margin y-axis numbers removed.
                  Per-strip faint grey labels (below each gridline inside
                  the strip column) are the only y-axis reference now. */}
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
                        {/* Stage 6 v4: faint grey per-strip tick labels,
                            BELOW the dashed gridline (was above). Sole
                            y-axis reference. Skip 0 + 100. */}
                        {tk !== 0 && tk !== 100 && (
                          <text
                            x={stripLeft + 4}
                            y={yScale(tk) + 11}
                            fontSize={9}
                            fontWeight={500}
                            style={{
                              fill: 'var(--color-border-strong, #cbd5e1)',
                              fontVariantNumeric: 'tabular-nums',
                              pointerEvents: 'none',
                            }}
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
                      // Native SVG <title> takes over the role of the
                      // bottom-of-chart legend that used to label every
                      // category swatch — hovering a dot reveals the
                      // source name, its category, and the value on the
                      // current strip without a separate legend row.
                      const catName =
                        sourceData.sourceCategories.find(
                          (c) => c.id === n.source.category,
                        )?.name ?? n.source.category;
                      const dotTitle = `${cleanName(n.source.name)} · ${catName} · ${formatPillValue(n.value)}`;
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
                          >
                            <title>{dotTitle}</title>
                          </circle>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Session 4b (BugHerd #55): Export-only chrome — column
                  headers + per-dot value labels mirrored into the SVG so
                  PNG/SVG exports include them. Hidden in normal viewing
                  via inline `display: none`; revealed on the export
                  clone by `revealExportOnly()` in `lib/dashboard/export.ts`.
                  See StripsView.tsx for the full rationale. */}
              <g data-export-only="true" style={{ display: 'none' }} pointerEvents="none">
                {columns.map((col, i) => {
                  const cx = colCenterX(i);
                  const colLabel = isMobile ? col.shortLabel : col.label;
                  return (
                    <text
                      key={`exp-hd-${String(col.id)}`}
                      x={cx}
                      y={margin.top + headerH / 2 + 4}
                      textAnchor="middle"
                      fontSize={isNarrow ? 11 : 13}
                      fontWeight={600}
                      fill="#1a1a2e"
                    >
                      {colLabel}
                    </text>
                  );
                })}
                {columns.map((col, i) => {
                  const cx = colCenterX(i);
                  return (
                    <g key={`exp-vals-${String(col.id)}`} transform={`translate(0, ${margin.top})`}>
                      {col.nodes.map((n) => {
                        const valText = formatPillValue(n.value);
                        const dotX = cx + n.x;
                        const dotY = n.y;
                        let labelX = dotX + 8;
                        let anchor: 'start' | 'end' = 'start';
                        if (labelX + valText.length * 5 > cx + colW / 2 - 2) {
                          labelX = dotX - 8;
                          anchor = 'end';
                        }
                        return (
                          <text
                            key={`exp-v-${col.id}-${n.sourceId}`}
                            x={labelX}
                            y={dotY + 3}
                            textAnchor={anchor}
                            fontSize={n.isChild ? 8 : 9}
                            fontWeight={600}
                            fill="#1a1a2e"
                          >
                            {valText}
                          </text>
                        );
                      })}
                    </g>
                  );
                })}
              </g>

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

            {/* Absolute-positioned HTML headers over the in-SVG header area.
                Includes per-column EyeOff button (Stage 6) + hidden-column
                placeholders rendered from slotLayout. */}
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
                    <button
                      type="button"
                      className="strips-svg-header__hide"
                      onClick={() => hide(String(col.id))}
                      aria-label={`${t('column.hide', 'de')} — ${col.label}`}
                      title={`${t('column.hide', 'de')} — ${col.label}`}
                    >
                      <EyeOff size={12} strokeWidth={2} aria-hidden="true" />
                    </button>
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
              {slotLayout
                .filter((s) => s.kind === 'hidden')
                .map((s) => {
                  const labelLookup = mode === 'metric'
                    ? METRIC_LABELS[s.id as SourceMetricType]
                    : GROUP_LABELS[s.id as SourceGroupId];
                  return (
                    <button
                      key={`hd-hidden-${s.id}`}
                      type="button"
                      className="strips-svg-header strips-svg-header--hidden"
                      style={{
                        left: s.left,
                        top: margin.top,
                        width: s.width,
                        height: headerH + innerH,
                      }}
                      onClick={() => show(s.id)}
                      aria-label={`${t('column.show', 'de')} — ${labelLookup}`}
                      title={`${t('column.show', 'de')} — ${labelLookup}`}
                    >
                      <span className="strips-svg-header--hidden__chevron" aria-hidden="true">
                        ▸
                      </span>
                      <span className="strips-svg-header--hidden__label">
                        {labelLookup}
                      </span>
                    </button>
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

          {/* Live "n Quellen" caption stays — the toolbar picker
              already drives the filter, but users still want a quick
              read on how many parent sources are visible after
              filtering. */}
          <p className="strips-cat-pills__count" aria-live="polite">
            {parentCount} Quellen
          </p>

          </> /* /sourceData loaded */ )}

        </div>
      </div>
    </div>
  );
});

export default SourcesStripsView;
