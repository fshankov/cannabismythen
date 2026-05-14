/**
 * SpannweiteView v3 — single-picked-value grid with verdict-tinted bar
 * accent (the chosen "Variant B" from the 2026-05-14 prototype round).
 *
 * Rows = myths, columns = 5 Indikatoren or 5 Bevölkerungsgruppen
 * (toggled via `state.stripsMode`). Each cell shows ONE value — the
 * picked-off-axis value for that myth × column — rendered as:
 *
 *   - a faint verdict-tinted bar from 0 → value (opacity 0.22, 8 px tall)
 *   - the shared verdict-arrow glyph (`#strips-arrow-*`) at the value
 *     position
 *   - a small tabular-nums numeric label next to the glyph
 *
 * Picker semantics:
 *   - mode === 'indicator' → groupId = state.groupIds[0] (Bev.-picker)
 *   - mode === 'group'     → indicator = state.indicator (Indikator-picker)
 *
 * Hover renders a Balken-style verdict-tinted card with the full myth
 * text + verdict label + category. Click → factsheet (shared panel).
 *
 * Column hide matches Punktwolke: always-visible EyeOff button in each
 * column header; hidden columns collapse to a 28-px placeholder with a
 * rotated label + chevron that you click to expand.
 */

import {
  forwardRef, useImperativeHandle, useMemo, useRef, useState, useCallback, useEffect,
} from 'react';
import type { ReactNode } from 'react';
import {
  Eye, EyeOff, TrendingUp, Target, Shield, Globe,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
  ArrowDown01, ArrowDown10,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  Myth, Metric, Group, GroupId, AppState, Indicator,
  StripsMode, DashboardDefinitions, SpannweiteSort,
  CorrectnessClass,
} from '../../../lib/dashboard/types';
import {
  getMythMetric, getIndicatorValue, getMythShortText, getMythText,
  getCategoryName,
} from '../../../lib/dashboard/data';
import {
  getCorrectnessColor, getCorrectnessBgColor,
} from '../../../lib/dashboard/colors';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import type { MythContentEntry } from '../FactsheetPanel';
import VerdictArrowSymbols from './verdictArrowSymbols';
import { useHiddenColumns } from '../hooks/useHiddenColumns';
import InfoTooltip from '../InfoTooltip';
import { renderSpannweiteSvg } from '../../../lib/dashboard/spannweite-svg';

/** Per-verdict vertical pixel shift applied to .carm-spannweite__pos
 *  so the verdict-arrow's CHEVRON TIP lands on the bar's vertical
 *  center (instead of the SVG viewBox center, which puts the tip a
 *  few px above or below the bar). Derived from the rotation each
 *  verdict applies inside verdictArrowSymbols.tsx around (12, 12). */
const VERDICT_Y_SHIFT_PX: Record<CorrectnessClass, number> = {
  richtig: 2.67,        // chevron at viewBox y=8 → shift glyph DOWN
  eher_richtig: 1.89,
  eher_falsch: -1.89,
  falsch: -2.67,        // chevron at viewBox y=16 → shift glyph UP
  no_classification: 0,
};

interface Props {
  myths: Myth[];
  metrics: Metric[];
  groups: Group[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onSelectMyth: (id: number) => void;
  definitions?: DashboardDefinitions | null;
  mythThemes?: Record<number, string>;
  mythContentMap?: Record<number, MythContentEntry>;
  sharedActions?: ReactNode;
}

const INDICATORS: Indicator[] = [
  'awareness', 'significance', 'correctness',
  'prevention_significance', 'population_relevance',
];
const GROUP_IDS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

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

export interface SpannweiteViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

/** Verdict rank order — richtig at top (lowest index), keine_aussage
 *  at bottom. Used by the verdict-rank sort. */
const VERDICT_RANK: Record<CorrectnessClass, number> = {
  richtig: 0,
  eher_richtig: 1,
  eher_falsch: 2,
  falsch: 3,
  no_classification: 4,
};

const SpannweiteView = forwardRef<SpannweiteViewHandle, Props>(function SpannweiteView(
  { myths, metrics, groups, state, update, onSelectMyth, definitions },
  ref,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  /** Cache of the latest render-relevant state. Read by
   *  `getSvgElement()` so the export pipeline can build a parallel SVG
   *  matching whatever the user is currently looking at. */
  const renderDataRef = useRef<{
    myths: Myth[];
    metrics: Metric[];
    groups: Group[];
    mode: StripsMode;
    pickedGroup: GroupId;
    pickedIndicator: Indicator;
    visibleColumns: { id: string; label: string }[];
    lang: typeof state.lang;
  } | null>(null);
  useImperativeHandle(ref, () => ({
    getSvgElement: () => {
      // Build the export SVG on demand using the latest data.
      // Returning the in-DOM symbols-only `<svg>` would produce an
      // empty PNG — the actual chart is HTML + CSS, not a single SVG.
      if (renderDataRef.current) {
        try {
          return renderSpannweiteSvg(renderDataRef.current);
        } catch {
          return svgRef.current;
        }
      }
      return svgRef.current;
    },
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMythId, setHoveredMythId] = useState<number | null>(null);
  /** Hovered cell's column ID. null when hovering the row-label cell
   *  (in which case the tooltip omits group/indicator/value). */
  const [hoveredColId, setHoveredColId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const mode: StripsMode = state.stripsMode;
  const sort: SpannweiteSort = state.spannweiteSort ?? 'a-z';
  const sortColumn: string | null = state.spannweiteSortColumn ?? null;
  const lang = state.lang;
  const pickedGroup: GroupId = state.groupIds[0] ?? 'adults';
  const pickedIndicator: Indicator = state.indicator;

  // ── Column list (visible + hidden, in original order) ──────────────
  const allColumnIds: string[] = mode === 'indicator'
    ? (INDICATORS as string[])
    : (GROUP_IDS as string[]);

  const { hide, show, isHidden } = useHiddenColumns(
    `carm.spannweite.hidden.${mode}`,
    allColumnIds,
  );

  // All columns kept in order so hidden ones still take their 28-px
  // slot in the layout — matches Punktwolke's "collapsed strip"
  // behavior where placeholders sit between visible columns.
  const columns = useMemo(() => {
    if (mode === 'indicator') {
      return INDICATORS.map((ind) => {
        const def = definitions?.mythIndicators?.[ind];
        // Strip trailing "%" suffix (e.g. "Kenntnis %") — the unit
        // signal lives in the InfoTooltip definition now, the header
        // label stays clean.
        const rawLabel = t(`indicator.${ind}.short` as TranslationKey, lang);
        const label = rawLabel.replace(/\s*%\s*$/, '');
        return {
          id: ind as string,
          Icon: INDICATOR_ICONS[ind],
          label,
          fullLabel: t(`indicator.${ind}` as TranslationKey, lang),
          defTitle: def?.label,
          defText: def?.definition,
          defScale: def?.scale,
          defSampleSize: def?.sampleSize,
        };
      });
    }
    return GROUP_IDS.map((gid) => {
      const g = groups.find((x) => x.id === gid);
      const def = definitions?.groups?.[gid];
      const fullLabel = g ? (lang === 'de' ? g.name_de : g.name_en) : gid;
      const shortLabel = lang === 'de' ? GROUP_SHORT_DE[gid] : GROUP_SHORT_EN[gid];
      return {
        id: gid as string,
        Icon: GROUP_ICONS[gid],
        label: shortLabel,
        fullLabel,
        defTitle: def?.label,
        defText: def?.definition,
        defScale: undefined as string | undefined,
        defSampleSize: def?.sampleSize,
      };
    });
  }, [mode, groups, lang, definitions]);

  /** Single value for (myth, column) using the picked off-axis dim. */
  const cellValue = useCallback(
    (mythId: number, colId: string): number | null => {
      if (mode === 'indicator') {
        return getIndicatorValue(
          getMythMetric(metrics, mythId, pickedGroup),
          colId as Indicator,
        );
      }
      return getIndicatorValue(
        getMythMetric(metrics, mythId, colId as GroupId),
        pickedIndicator,
      );
    },
    [mode, metrics, pickedGroup, pickedIndicator],
  );

  /** Sort: 5-way.
   *   - 'a-z'                   — alphabetical by short text
   *   - 'verdict-r-to-f'        — richtig → falsch (A-Z tie-break)
   *   - 'verdict-f-to-r'        — falsch → richtig (A-Z tie-break)
   *   - 'value-asc'/'value-desc' — by the value in `sortColumn` for
   *     each row's picked off-axis dim. Nulls sort to the bottom in
   *     both directions. A-Z tie-break. */
  const sortedMyths = useMemo(() => {
    const rows = [...myths];
    const cmpAz = (a: Myth, b: Myth) =>
      getMythShortText(a, lang).localeCompare(getMythShortText(b, lang), 'de');

    if (sort === 'verdict-r-to-f' || sort === 'verdict-f-to-r') {
      const dir = sort === 'verdict-r-to-f' ? 1 : -1;
      rows.sort((a, b) => {
        const ra = VERDICT_RANK[a.correctness_class] ?? VERDICT_RANK.no_classification;
        const rb = VERDICT_RANK[b.correctness_class] ?? VERDICT_RANK.no_classification;
        if (ra !== rb) return dir * (ra - rb);
        return cmpAz(a, b);
      });
    } else if ((sort === 'value-asc' || sort === 'value-desc') && sortColumn) {
      const dir = sort === 'value-asc' ? 1 : -1;
      rows.sort((a, b) => {
        const va = cellValue(a.id, sortColumn);
        const vb = cellValue(b.id, sortColumn);
        if (va === null && vb === null) return cmpAz(a, b);
        if (va === null) return 1;   // nulls last
        if (vb === null) return -1;
        if (va !== vb) return dir * (va - vb);
        return cmpAz(a, b);
      });
    } else {
      rows.sort(cmpAz);
    }
    return rows;
  }, [myths, sort, sortColumn, cellValue, lang]);

  /** Click a column's sort icon. State machine:
   *    - Not active for this col       → activate value-asc on this col
   *    - Active value-asc on this col  → flip to value-desc
   *    - Active value-desc on this col → flip back to value-asc
   *  Click a different column at any time → switch to that column, asc. */
  const handleColumnSortClick = useCallback((colId: string) => {
    const isThisCol =
      (sort === 'value-asc' || sort === 'value-desc') && sortColumn === colId;
    if (isThisCol && sort === 'value-asc') {
      update('spannweiteSort', 'value-desc');
    } else if (isThisCol && sort === 'value-desc') {
      update('spannweiteSort', 'value-asc');
    } else {
      update('spannweiteSort', 'value-asc');
      update('spannweiteSortColumn', colId);
    }
  }, [sort, sortColumn, update]);

  /** Tooltip width budget — used to clamp horizontal position so the
   *  card never extends past the viewport edges (matches the CSS
   *  `max-width: 320px` on `.carm-spannweite__tooltip`). */
  const TOOLTIP_MAX_W = 320;
  const VIEWPORT_MARGIN = 12;

  const handleHover = useCallback(
    (mythId: number, colId: string | null, e: React.MouseEvent) => {
      setHoveredMythId(mythId);
      setHoveredColId(colId);
      // Clamp x so the tooltip stays fully within the viewport (it's
      // rendered position:fixed and translate(-50%,…), so its center
      // sits at hoverPos.x).
      const halfW = TOOLTIP_MAX_W / 2;
      const minX = halfW + VIEWPORT_MARGIN;
      const maxX = (typeof window !== 'undefined' ? window.innerWidth : 1280) - halfW - VIEWPORT_MARGIN;
      const clampedX = Math.max(minX, Math.min(maxX, e.clientX));
      setHoverPos({ x: clampedX, y: e.clientY });
    },
    [],
  );
  const handleLeave = useCallback(() => {
    setHoveredMythId(null);
    setHoveredColId(null);
    setHoverPos(null);
  }, []);

  const hoveredMyth = hoveredMythId !== null
    ? myths.find((m) => m.id === hoveredMythId) ?? null
    : null;

  // Keep the export-data ref in sync with the live view so a click on
  // "Exportieren → PNG" can serialise whatever the user is currently
  // looking at (sort order, picker selection, hidden columns).
  useEffect(() => {
    renderDataRef.current = {
      myths: sortedMyths,
      metrics,
      groups,
      mode,
      pickedGroup,
      pickedIndicator,
      visibleColumns: columns
        .filter((c) => !isHidden(c.id))
        .map((c) => ({ id: c.id, label: c.label })),
      lang,
    };
  });

  // Grid template — visible columns get 1fr each, hidden ones 28 px.
  const gridTemplate = useMemo(() => {
    const cols = columns
      .map((c) => (isHidden(c.id) ? '28px' : 'minmax(0, 1fr)'))
      .join(' ');
    return `var(--carm-spannweite-label-col) ${cols}`;
  }, [columns, isHidden]);

  return (
    <div className="carm-spannweite" ref={containerRef}>
      <div className="carm-spannweite__scroller">
        <div
          className="carm-spannweite__grid"
          style={{ gridTemplateColumns: gridTemplate }}
          role="grid"
        >
          {/* Header row */}
          <div
            className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--label"
            role="columnheader"
          >
            <span className="carm-spannweite__header-text">
              {t('misc.myths', lang)}
            </span>
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
              ? 'spannweite.sort.col.asc.tooltip'
              : isDesc
              ? 'spannweite.sort.col.desc.tooltip'
              : 'spannweite.sort.col.activate.tooltip';
            const colSortTooltip = t(colSortTooltipKey, lang).replace('{col}', col.fullLabel);
            return (
              <div
                key={`th-${col.id}`}
                className="carm-spannweite__cell carm-spannweite__cell--header"
                role="columnheader"
              >
                {/* Upper-LEFT: EyeOff hide trigger (Punktwolke pattern). */}
                <button
                  type="button"
                  className="carm-spannweite__hide-btn"
                  onClick={() => hide(col.id)}
                  aria-label={`${t('column.hide', lang)} — ${col.fullLabel}`}
                  title={`${t('column.hide', lang)} — ${col.fullLabel}`}
                >
                  <EyeOff size={11} strokeWidth={2} aria-hidden="true" />
                </button>
                {/* Centered: indicator/group icon + label + inline "i"
                    InfoTooltip. The whole cluster acts as one hover
                    region for the basic browser tooltip (full label +
                    definition); the "i" itself opens the rich
                    InfoTooltip popover on hover or click. */}
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
                {/* Upper-RIGHT: per-column value sort. Click cycles
                    inactive → asc → desc → asc. Icons swap with state. */}
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
          {sortedMyths.map((myth, rowIdx) => {
            const verdict = myth.correctness_class;
            const verdictColor = getCorrectnessColor(verdict);
            const shortText = getMythShortText(myth, lang);
            const isHover = hoveredMythId === myth.id;
            return (
              <div
                key={`row-${myth.id}`}
                className={`carm-spannweite__row${isHover ? ' is-hover' : ''}${rowIdx % 2 === 0 ? '' : ' is-alt'}`}
                role="row"
                style={{
                  gridColumn: `1 / span ${columns.length + 1}`,
                  gridTemplateColumns: gridTemplate,
                }}
                onClick={() => onSelectMyth(myth.id)}
                onMouseLeave={handleLeave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMyth(myth.id);
                  }
                }}
                tabIndex={0}
              >
                <div
                  className="carm-spannweite__cell carm-spannweite__cell--label"
                  role="rowheader"
                  onMouseEnter={(e) => handleHover(myth.id, null, e)}
                  onMouseMove={(e) => handleHover(myth.id, null, e)}
                >
                  <span
                    className="carm-spannweite__row-glyph"
                    style={{ color: verdictColor }}
                    aria-hidden="true"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <use href={`#strips-arrow-${verdict}`} width="24" height="24" />
                    </svg>
                  </span>
                  <span
                    className="carm-spannweite__row-text"
                  >
                    {shortText}
                  </span>
                </div>
                {columns.map((col) => {
                  if (isHidden(col.id)) {
                    return (
                      <div
                        key={`cell-${myth.id}-${col.id}`}
                        className="carm-spannweite__cell carm-spannweite__cell--hidden-body"
                        role="gridcell"
                        aria-hidden="true"
                      />
                    );
                  }
                  const value = cellValue(myth.id, col.id);
                  return (
                    <div
                      key={`cell-${myth.id}-${col.id}`}
                      className="carm-spannweite__cell carm-spannweite__cell--plot"
                      role="gridcell"
                      aria-label={
                        value !== null
                          ? `${col.fullLabel}: ${Math.round(value)} %`
                          : `${col.fullLabel}: keine Daten`
                      }
                      onMouseEnter={(e) => handleHover(myth.id, col.id, e)}
                      onMouseMove={(e) => handleHover(myth.id, col.id, e)}
                    >
                      <div className="carm-spannweite__plot">
                        {value !== null ? (
                          <>
                            {/* Bar's right edge = glyph's CENTER (which is
                                where the chevron tip points). The right
                                half of the glyph extends past the bar's
                                end so the arrow visually "lands on" the
                                bar's end. */}
                            <div
                              className="carm-spannweite__bar"
                              style={{
                                width: `${Math.max(0, Math.min(100, value))}%`,
                                background: verdictColor,
                              }}
                              aria-hidden="true"
                            />
                            {/* Glyph centred at value% (its center is the
                                anchor — chevron tip lands on bar midline via
                                the per-verdict --y-shift). */}
                            <span
                              className="carm-spannweite__glyph"
                              aria-hidden="true"
                              style={{
                                left: `${Math.max(0, Math.min(100, value))}%`,
                                color: verdictColor,
                                ['--y-shift' as string]: `${VERDICT_Y_SHIFT_PX[verdict]}px`,
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24">
                                <use href={`#strips-arrow-${verdict}`} width="24" height="24" />
                              </svg>
                            </span>
                            {/* Numeric label sits IMMEDIATELY right of the
                                glyph (value% + 10 px = half-glyph + 2 px). */}
                            <span
                              className="carm-spannweite__num"
                              style={{
                                left: `calc(${Math.max(0, Math.min(100, value))}% + 10px)`,
                              }}
                            >
                              {Math.round(value)}
                            </span>
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

          {/* Bottom axis row — 0 / 50 / 100 once, anchored to each
              column's own boundaries so labels never collide. */}
          <div
            className="carm-spannweite__axis"
            style={{ gridColumn: `1 / span ${columns.length + 1}`, gridTemplateColumns: gridTemplate }}
            aria-hidden="true"
          >
            <div className="carm-spannweite__axis-corner" />
            {columns.map((col) => {
              if (isHidden(col.id)) {
                return <div key={`axis-${col.id}`} className="carm-spannweite__axis-hidden" />;
              }
              return (
                <div key={`axis-${col.id}`} className="carm-spannweite__axis-scale">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared symbol library — used by row-label glyphs + per-cell
            markers. */}
        <svg
          ref={svgRef}
          className="carm-spannweite__symbols"
          width={0}
          height={0}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <VerdictArrowSymbols />
          </defs>
        </svg>
      </div>

      {/* Verdict-tinted hover card. position:fixed + viewport-clamped
          x so the card never extends past the screen edges. Layout:
            row 1: myth statement (left)  + verdict glyph (right)
            row 2: "Wissenschaftlich [verdict]" (verdict-colored)
            row 3: gruppe · indikator · value   (meta, smaller)
          No verdict-definition explanation (per Fedor 2026-05-14). */}
      {hoveredMyth && hoverPos && (() => {
        const verdict = hoveredMyth.correctness_class;
        const verdictColor = getCorrectnessColor(verdict);
        const verdictBg = getCorrectnessBgColor(verdict);
        const wissenschaftlich = verdict === 'no_classification'
          ? (lang === 'de'
              ? 'Wissenschaftlich: keine Einordnung möglich'
              : 'Scientific verdict: not classified')
          : `${lang === 'de' ? 'Wissenschaftlich' : 'Scientifically'}: ${t(
              `verdict.${verdict}` as TranslationKey,
              lang,
            ).toLowerCase()}`;
        // Resolve the meta line (Gruppe · Indikator · Wert) based on
        // which cell is hovered. When hoveredColId is null (row-label
        // hover), we omit the per-cell meta line.
        let metaLine: string | null = null;
        if (hoveredColId) {
          const value = cellValue(hoveredMyth.id, hoveredColId);
          const indicator: Indicator = mode === 'indicator'
            ? (hoveredColId as Indicator)
            : pickedIndicator;
          const groupId: GroupId = mode === 'indicator'
            ? pickedGroup
            : (hoveredColId as GroupId);
          const groupLabel = t(`igs.group.${groupId}` as TranslationKey, lang);
          const indLabel = t(`indicator.${indicator}.short` as TranslationKey, lang)
            .replace(/\s*%\s*$/, '');
          const valLabel = value === null
            ? (lang === 'de' ? 'keine Daten' : 'no data')
            : `${Math.round(value)} %`;
          metaLine = `${groupLabel} · ${indLabel} · ${valLabel}`;
        }
        return (
          <div
            className="carm-spannweite__tooltip"
            role="tooltip"
            style={{
              position: 'fixed',
              left: hoverPos.x,
              top: hoverPos.y,
              background: verdictBg,
              borderLeft: `3px solid ${verdictColor}`,
            }}
          >
            <div className="carm-spannweite__tooltip-row">
              <div className="carm-spannweite__tooltip-myth">
                {getMythText(hoveredMyth, lang)}
              </div>
              <span
                className="carm-spannweite__tooltip-glyph"
                style={{ color: verdictColor }}
                aria-hidden="true"
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <use href={`#strips-arrow-${verdict}`} width="24" height="24" />
                </svg>
              </span>
            </div>
            <div
              className="carm-spannweite__tooltip-verdict"
              style={{ color: verdictColor }}
            >
              {wissenschaftlich}
            </div>
            {metaLine && (
              <div className="carm-spannweite__tooltip-meta">{metaLine}</div>
            )}
          </div>
        );
      })()}
    </div>
  );
});

export default SpannweiteView;
