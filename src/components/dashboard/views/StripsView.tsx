/**
 * StripsView v3 — vertical strips with three pivot modes.
 *
 * Layout:
 *   - Left rail: 3 vertical pills, one per pivot mode (Themen / Gruppen /
 *     Indikatoren), text rotated 90°. The active pill marks which row's items
 *     become the SVG strips (the chart's X-axis).
 *   - Three rows of icon-blocks above the chart:
 *       Row 1: 5 Selbsttest themes
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

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Eye, TrendingUp, Target, Shield, Globe,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  Myth, Metric, Group, GroupId, AppState, Indicator,
  StripsMode, SelbsttestTheme, DashboardDefinitions, Category,
} from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText, getMythText } from '../../../lib/dashboard/data';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';
import InfoTooltip from '../InfoTooltip';
import type { MythContentEntry } from '../FactsheetPanel';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  groups: Group[];
  /** All myth categories (carm-data.json) — drives the category pill filter
   *  rendered below the SVG. */
  categories: Category[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Stage 2 — opens the factsheet. */
  onSelectMyth: (id: number) => void;
  definitions?: DashboardDefinitions | null;
  /** mythId → Selbsttest theme slug (kept for future use — unused in current UI). */
  mythThemes?: Record<number, string>;
  /** Pre-rendered factsheet HTML, keyed by myth id. Used here to pull the
   *  fakten-karten-style summary for the in-view myth card. */
  mythContentMap?: Record<number, MythContentEntry>;
}

const INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance', 'population_relevance'];
const STRIP_GROUP_IDS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const STRIP_THEMES: SelbsttestTheme[] = ['quiz-gefaehrlichkeit', 'quiz-gesellschaft', 'quiz-medizin', 'quiz-risiken', 'quiz-stimmung'];

const INDICATOR_ICONS: Record<Indicator, LucideIcon> = {
  awareness: Eye,
  significance: TrendingUp,
  correctness: Target,
  prevention_significance: Shield,
  population_relevance: Globe,
};

const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  general_population: Users,
  adults: Users,
  minors: Baby,
  consumers: Cannabis,
  young_adults: GraduationCap,
  parents: UsersRound,
};

/** Selbsttest theme emoji — same set used on the Selbsttest landing page. */
const THEME_EMOJI: Record<SelbsttestTheme, string> = {
  'quiz-gefaehrlichkeit': '⚖️', // ⚖️
  'quiz-gesellschaft': '🏛️', // 🏛️
  'quiz-medizin': '💊', // 💊
  'quiz-risiken': '⚠️', // ⚠️
  'quiz-stimmung': '🧠', // 🧠
};

const THEME_LABELS: Record<SelbsttestTheme, { full: string; short: string; defKey: string }> = {
  'quiz-gefaehrlichkeit': { full: 'strips.theme.gefaehrlichkeit', short: 'strips.theme.gefaehrlichkeit.short', defKey: 'strips.theme.gefaehrlichkeit' },
  'quiz-gesellschaft': { full: 'strips.theme.gesellschaft', short: 'strips.theme.gesellschaft.short', defKey: 'strips.theme.gesellschaft' },
  'quiz-medizin': { full: 'strips.theme.medizin', short: 'strips.theme.medizin.short', defKey: 'strips.theme.medizin' },
  'quiz-risiken': { full: 'strips.theme.risiken', short: 'strips.theme.risiken.short', defKey: 'strips.theme.risiken' },
  'quiz-stimmung': { full: 'strips.theme.stimmung', short: 'strips.theme.stimmung.short', defKey: 'strips.theme.stimmung' },
};

/** Short aliases for population groups on narrow viewports. */
const GROUP_SHORT_DE: Record<GroupId, string> = {
  general_population: 'Alle',
  adults: 'Erw.',
  minors: 'Minderj.',
  consumers: 'Konsum.',
  young_adults: 'Junge Erw.',
  parents: 'Eltern',
};
const GROUP_SHORT_EN: Record<GroupId, string> = {
  general_population: 'All',
  adults: 'Adults',
  minors: 'Minors',
  consumers: 'Cons.',
  young_adults: 'Y. Adults',
  parents: 'Parents',
};

type ColumnId = Indicator | GroupId | SelbsttestTheme;

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

export default function StripsView({
  myths, metrics, groups, categories, state, update, onSelectMyth, definitions, mythContentMap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  /** Available viewport height — drives the SVG's strip-rectangle height so
   *  the grey boxes always fill the chart area regardless of screen size. */
  const [viewportH, setViewportH] = useState(typeof window !== 'undefined' ? window.innerHeight : 720);
  /** Hover state — separate from selection. Drives the polyline + statement label. */
  const [hoveredMythId, setHoveredMythId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  /** Dropdown open state for the top selector ('Bevölkerungsgruppe wählen'). */
  const [topPickerOpen, setTopPickerOpen] = useState(false);
  const topPickerRef = useRef<HTMLDivElement>(null);
  /** Which menu item (by id) currently has its inline definition expanded.
   *  null means no row is expanded. Tapping the same row's 'i' again
   *  collapses; tapping a different row's 'i' switches. */
  const [topExpandedInfo, setTopExpandedInfo] = useState<string | null>(null);
  /** Dropdown open state for the bottom Mythos-Kategorie selector. */
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const catPickerRef = useRef<HTMLDivElement>(null);

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

  // Same for the bottom categories dropdown.
  useEffect(() => {
    if (!catPickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (catPickerRef.current && !catPickerRef.current.contains(e.target as Node)) {
        setCatPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCatPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [catPickerOpen]);

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

  /** The active row — used to render the strip headers inside the SVG. */
  const activeRow: RowItem[] = useMemo(() => {
    if (mode === 'indicator') return indicatorRow;
    return groupRow;
  }, [mode, indicatorRow, groupRow]);

  // ── Render row of icon-blocks ─────────────────────────────────────
  const renderRow = (row: RowItem[], isPivot: boolean) => (
    <div
      className={`strips-row ${isPivot ? 'is-pivot' : ''}`}
      style={{ paddingLeft: margin.left, paddingRight: margin.right, gap: colGap }}
      role="group"
    >
      {row.map((item, i) => (
        <div
          key={item.id}
          className={`strips-block ${item.active ? 'active' : ''} ${isPivot ? 'pivot-block' : ''}`}
          style={{ width: colW }}
        >
          <button
            className="strips-block-btn"
            onClick={item.onActivate}
            title={item.label}
            aria-pressed={item.active}
            disabled={isPivot}
          >
            {item.emoji ? (
              <span className="strips-block-emoji" aria-hidden="true">{item.emoji}</span>
            ) : item.Icon ? (
              <item.Icon size={isNarrow ? 16 : 18} strokeWidth={1.75} aria-hidden="true" />
            ) : null}
            <span className="strips-block-label">{isMobile ? item.shortLabel : item.label}</span>
          </button>
          {item.defLabel && item.defText && (
            <span className="strips-block-info">
              <InfoTooltip
                title={item.defLabel}
                definition={item.defText}
                scale={item.scale}
                sampleSize={item.sampleSize}
              />
            </span>
          )}
        </div>
      ))}
    </div>
  );

  // ── Myth card content (selected state) ────────────────────────────
  const selectedMythContent = selectedMyth ? mythContentMap?.[selectedMyth.id] : null;
  const cardTitle = selectedMyth
    ? (selectedMythContent?.title || getMythText(selectedMyth, state.lang))
    : '';
  const cardSummary = selectedMyth ? extractCardSummary(selectedMythContent, selectedMyth, state.lang) : '';
  const cardClassification = selectedMythContent?.classificationLabel || selectedMyth?.classification_de || '';

  return (
    <div className="strips-v3" ref={containerRef}>
      <div className={`strips-grid3 ${selectedMyth ? 'has-selection' : ''}`}>
        {/* Single content column — pivot is now driven by the top tab. */}
        <div className="strips-grid3__content" ref={contentRef}>
          {/* Top selector — single dropdown trigger that doubles as label.
              No inline definition, no separate tooltip popover. Each menu
              item has an 'i' that expands the definition INLINE below the
              row (inside the same dropdown). */}
          {(() => {
            const activeItem = topRow.items.find((it) => it.active) || topRow.items[0];
            const pickerLabel = mode === 'indicator'
              ? (state.lang === 'de' ? 'Bevölkerungsgruppe' : 'Population group')
              : (state.lang === 'de' ? 'Indikator' : 'Indicator');
            return (
              <div className="strips-picker" ref={topPickerRef}>
                <span className="strips-picker__caption">{pickerLabel}:</span>
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
                  {activeItem?.emoji ? (
                    <span className="strips-picker__emoji" aria-hidden="true">{activeItem.emoji}</span>
                  ) : activeItem?.Icon ? (
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
                              {item.emoji ? (
                                <span className="strips-picker__emoji" aria-hidden="true">{item.emoji}</span>
                              ) : item.Icon ? (
                                <item.Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                              ) : null}
                              <span className="strips-picker__item-label">{item.label}</span>
                            </button>
                            {item.defLabel && item.defText && (
                              <button
                                type="button"
                                className={`strips-picker__row-info ${expanded ? 'active' : ''}`}
                                aria-expanded={expanded}
                                aria-label={state.lang === 'de' ? 'Definition anzeigen' : 'Show definition'}
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
                                <p className="strips-picker__row-def-scale">
                                  {state.lang === 'de' ? 'Skala' : 'Scale'}: {item.scale}
                                </p>
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

          {/* SVG chart wrapper — relative-positioned so HTML strip headers
              can be absolutely positioned over the in-SVG header area for
              each column, giving us a single unified box per strip. */}
          <div className="strips-svg-wrap" style={{ position: 'relative', width }}>
          <svg
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

            {/* Dots — focused dot rendered last so its hit-area overlays neighbors */}
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
                          fillOpacity={dimmed ? 0.15 : isSel ? 1 : isHov ? 1 : 0.85}
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
                <span className="strips-myth-card__bar-icon" aria-hidden="true">
                  {classificationIcon(selectedMyth.correctness_class)}
                </span>
                <span className="strips-myth-card__bar-label">{cardClassification}</span>
              </div>
              <p className="strips-myth-card__statement">{cardTitle}</p>
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

          {/* Categories filter — mirrors the top dropdown. Trigger on the
              left, inline myth-count next to it. Default is 'Alle Mythen';
              menu lists Alle + the 7 carm-data categories. */}
          {(() => {
            const isAll = state.categoryIds.length === 0;
            const activeCat = !isAll
              ? categories.find((c) => c.id === state.categoryIds[0]) ?? null
              : null;
            const activeLabel = activeCat
              ? (state.lang === 'de' ? activeCat.name_de : activeCat.name_en)
              : (state.lang === 'de' ? 'Alle Mythen' : 'All myths');
            const myCount = visibleMyths.length;
            const countLabel = state.lang === 'de'
              ? `${myCount} Mythen`
              : `${myCount} myths`;
            return (
              <div className="strips-picker strips-picker--bottom strips-picker--dropup" ref={catPickerRef}>
                <span className="strips-picker__caption">
                  {state.lang === 'de' ? 'Mythos-Kategorie' : 'Myth category'}:
                </span>
                <button
                  type="button"
                  className="strips-picker__trigger"
                  aria-haspopup="listbox"
                  aria-expanded={catPickerOpen}
                  onClick={() => setCatPickerOpen((v) => !v)}
                >
                  <Layers size={15} strokeWidth={1.75} aria-hidden="true" />
                  <span className="strips-picker__current">{activeLabel}</span>
                  <span className="strips-picker__chevron" aria-hidden="true">▾</span>
                </button>
                <span className="strips-picker__inline" title={countLabel}>
                  {countLabel}
                </span>
                {catPickerOpen && (
                  <div className="strips-picker__menu" role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isAll}
                      className={`strips-picker__item-btn ${isAll ? 'active' : ''}`}
                      onClick={() => {
                        update('categoryIds', []);
                        setCatPickerOpen(false);
                      }}
                    >
                      <Layers size={15} strokeWidth={1.75} aria-hidden="true" />
                      <span className="strips-picker__item-label">
                        {state.lang === 'de' ? 'Alle Mythen' : 'All myths'}
                      </span>
                    </button>
                    {categories.map((cat) => {
                      const isSel = !isAll && state.categoryIds[0] === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="option"
                          aria-selected={isSel}
                          className={`strips-picker__item-btn ${isSel ? 'active' : ''}`}
                          onClick={() => {
                            update('categoryIds', [cat.id]);
                            setCatPickerOpen(false);
                          }}
                        >
                          <span className="strips-picker__item-label">
                            {state.lang === 'de' ? cat.name_de : cat.name_en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function classificationIcon(cls: string): string {
  if (cls === 'richtig' || cls === 'eher_richtig') return '✓';
  if (cls === 'falsch' || cls === 'eher_falsch') return '✗';
  return '~';
}

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
