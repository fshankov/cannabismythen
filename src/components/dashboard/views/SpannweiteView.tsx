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
  INDICATOR_ICONS,
  AUDIENCE_ICONS_BY_GROUP,
  type IconComponent,
} from '../../../lib/icons';
import type {
  Myth, Metric, Group, GroupId, AppState, Indicator,
  StripsMode, DashboardDefinitions, SpannweiteSort,
} from '../../../lib/dashboard/types';
import {
  getMythMetric, getIndicatorValueChecked, getMythShortText,
} from '../../../lib/dashboard/data';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import type { MythContentEntry } from '../FactsheetPanel';
import VerdictArrowSymbols from './verdictArrowSymbols';
import { useHiddenColumns } from '../hooks/useHiddenColumns';
import {
  GridDataHeader, GridLabelHeader, GridMythCell, GridValueCell, GridHoverTooltip,
} from '../grid';
import { renderSpannweiteSvg } from '../../../lib/dashboard/spannweite-svg';

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

// INDICATOR_ICONS is now imported directly from @/lib/icons.
// GROUP_ICONS aliases the central registry so the rest of the file
// reads as before.
const GROUP_ICONS: Record<GroupId, IconComponent> = AUDIENCE_ICONS_BY_GROUP;

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

  /** Single value for (myth, column) using the picked off-axis dim.
   *  Routes through `getIndicatorValueChecked` so methodologically-
   *  invalid combos (Bev. Relevanz × {consumers, young_adults, parents})
   *  return null regardless of any stray non-null value in the JSON. */
  const cellValue = useCallback(
    (mythId: number, colId: string): number | null => {
      if (mode === 'indicator') {
        return getIndicatorValueChecked(
          getMythMetric(metrics, mythId, pickedGroup),
          colId as Indicator,
          pickedGroup,
        );
      }
      return getIndicatorValueChecked(
        getMythMetric(metrics, mythId, colId as GroupId),
        pickedIndicator,
        colId as GroupId,
      );
    },
    [mode, metrics, pickedGroup, pickedIndicator],
  );

  /** Sort: 5-way (post-2026-05-22 verdict-rank revival).
   *   - 'a-z'                    — alphabetical by short text (default).
   *   - 'value-asc'/'value-desc' — per-column numeric (sortColumn).
   *     Nulls sort to the bottom in both directions. A-Z tie-break.
   *   - 'verdict-asc'/'verdict-desc' — by scientific verdict band
   *     (richtig=1 → falsch=4, no_classification=5). A-Z tie-break. */
  const sortedMyths = useMemo(() => {
    const rows = [...myths];
    const cmpAz = (a: Myth, b: Myth) =>
      getMythShortText(a, lang).localeCompare(getMythShortText(b, lang), 'de');

    if ((sort === 'value-asc' || sort === 'value-desc') && sortColumn) {
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
    } else if (sort === 'verdict-asc' || sort === 'verdict-desc') {
      const dir = sort === 'verdict-asc' ? 1 : -1;
      const order: Record<string, number> = {
        richtig: 1, eher_richtig: 2, eher_falsch: 3, falsch: 4, no_classification: 5,
      };
      rows.sort((a, b) => {
        const oa = order[a.correctness_class] ?? 5;
        const ob = order[b.correctness_class] ?? 5;
        if (oa !== ob) return dir * (oa - ob);
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
          {/* Header row — MYTHEN column. A-Z sort top-LEFT;
              verdict-rank sort top-RIGHT. Both buttons share the
              `.carm-spannweite__col-sort-btn` styling. */}
          {(() => {
            const isAzActive = sort === 'a-z';
            const azTooltip = t('spannweite.sort.alpha.tooltip', lang);
            const isVerdictActive = sort === 'verdict-asc' || sort === 'verdict-desc';
            const verdictDir: 'asc' | 'desc' = sort === 'verdict-desc' ? 'desc' : 'asc';
            const verdictTooltipKey: TranslationKey = !isVerdictActive
              ? 'spannweite.sort.verdict.activate.tooltip'
              : sort === 'verdict-asc'
              ? 'spannweite.sort.verdict.asc.tooltip'
              : 'spannweite.sort.verdict.desc.tooltip';
            return (
              <div
                className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--label"
                role="columnheader"
              >
                <GridLabelHeader
                  labelText={t('misc.myths', lang)}
                  isAzActive={isAzActive}
                  azTooltip={azTooltip}
                  onAzClick={() => {
                    update('spannweiteSort', 'a-z');
                    update('spannweiteSortColumn', null);
                  }}
                  verdictRank={{
                    isActive: isVerdictActive,
                    direction: verdictDir,
                    tooltip: t(verdictTooltipKey, lang),
                    onClick: () => {
                      if (sort === 'verdict-asc') update('spannweiteSort', 'verdict-desc');
                      else if (sort === 'verdict-desc') update('spannweiteSort', 'verdict-asc');
                      else {
                        update('spannweiteSort', 'verdict-asc');
                        update('spannweiteSortColumn', null);
                      }
                    },
                  }}
                />
              </div>
            );
          })()}
          {columns.map((col) => {
            if (isHidden(col.id)) {
              const ColIcon = col.Icon;
              return (
                <button
                  key={`th-${col.id}`}
                  type="button"
                  className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--hidden"
                  onClick={() => show(col.id)}
                  aria-label={`${t('column.show', lang)} — ${col.fullLabel}`}
                  title={`${t('column.show', lang)} — ${col.fullLabel}`}
                >
                  {/* Closed-column layout (Fedor 2026-05-25 PM) —
                      expand chevron on top + the column's indicator
                      icon below; vertical text label dropped.
                      `title` still carries the full label for hover. */}
                  <span className="carm-spannweite__hidden-chev" aria-hidden="true">▸</span>
                  <span className="carm-spannweite__hidden-icon" aria-hidden="true">
                    <ColIcon size={16} strokeWidth={1.75} />
                  </span>
                  <span className="carm-spannweite__hidden-label" aria-hidden="true">
                    {col.label}
                  </span>
                </button>
              );
            }
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
                <GridDataHeader
                  Icon={col.Icon}
                  label={col.label}
                  fullLabel={col.fullLabel}
                  defTitle={col.defTitle}
                  defText={col.defText}
                  defScale={col.defScale}
                  defSampleSize={col.defSampleSize}
                  hideLabel={`${t('column.hide', lang)} — ${col.fullLabel}`}
                  onHide={() => hide(col.id)}
                  isSortActive={isSortCol}
                  sortDir={isDesc ? 'desc' : 'asc'}
                  sortTooltip={colSortTooltip}
                  onSortClick={() => handleColumnSortClick(col.id)}
                />
              </div>
            );
          })}

          {/* Body rows */}
          {sortedMyths.map((myth, rowIdx) => {
            const verdict = myth.correctness_class;
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
                  <GridMythCell verdict={verdict} shortText={shortText} />
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
                        <GridValueCell verdict={verdict} value={value} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Bottom axis (0/50/100) removed 2026-05-22 — Fedor:
              "self-evident without it". */}
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

      {/* Verdict-tinted hover card delegated to GridHoverTooltip
          primitive (shared with Balken). */}
      {hoveredMyth && hoverPos && (() => {
        let lesebeispielIndicator: Indicator | null = null;
        let lesebeispielGroup: GroupId | undefined = pickedGroup;
        if (hoveredColId) {
          lesebeispielIndicator = mode === 'indicator'
            ? (hoveredColId as Indicator)
            : pickedIndicator;
          lesebeispielGroup = mode === 'indicator'
            ? pickedGroup
            : (hoveredColId as GroupId);
        }
        return (
          <GridHoverTooltip
            myth={hoveredMyth}
            metrics={metrics}
            lang={lang}
            x={hoverPos.x}
            y={hoverPos.y}
            lesebeispielIndicator={lesebeispielIndicator}
            lesebeispielGroup={lesebeispielGroup}
          />
        );
      })()}
    </div>
  );
});

export default SpannweiteView;
