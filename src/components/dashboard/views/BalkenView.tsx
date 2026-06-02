/**
 * BalkenView — 1-column Spannweite (Stage 2026-05-21 rebuild).
 *
 * The previous ECharts-based horizontal bar chart was replaced with a
 * React + SVG grid that shares the Spannweite primitives 1:1. The view
 * shows ONE data column (the active indicator × active group) for every
 * filtered myth, using the same header chrome (icon + label +
 * InfoTooltip + sort button), the same myth identity cell (verdict
 * arrow + short text), and the same value cell (lollipop 2px stem +
 * 18px solid white-on-verdict dot, or "k. A." for null).
 *
 * Sort state lives in `state.balkenSort` ('a-z' | 'value-asc' |
 * 'value-desc' | 'verdict-asc' | 'verdict-desc'). Default 'a-z'. The
 * shared toolbar's SortToggle has been retired for this view; sort
 * now lives in the column headers (A-Z + verdict-rank on the MYTHEN
 * column, value-asc/desc on the indicator column).
 *
 * Bev. Relevanz × invalid-group combos route through
 * `getIndicatorValueChecked` so the cell renders "k. A." even when
 * carm-data.json contains a stray non-null value.
 */
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo,
  useRef, useState,
} from 'react';
import type {
  Myth, Metric, GroupId, AppState, Indicator, BalkenSort,
  DashboardDefinitions, Group,
} from '../../../lib/dashboard/types';
import {
  getIndicatorValueChecked, getMythMetric, getMythShortText,
} from '../../../lib/dashboard/data';
import { INDICATOR_ICONS } from '../../../lib/icons';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import VerdictArrowSymbols from './verdictArrowSymbols';
import {
  GridDataHeader, GridLabelHeader, GridMythCell, GridHoverTooltip,
  BalkenBar,
} from '../grid';
import { renderSpannweiteSvg } from '../../../lib/dashboard/spannweite-svg';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  groups: Group[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onSelectMyth: (id: number) => void;
  /** Empty-state CTA resets categoryIds + mythIds + verdictFilter +
   *  search so the user can recover from an "over-filtered to nothing"
   *  state in one click. */
  onResetFilters?: () => void;
  definitions?: DashboardDefinitions | null;
}

export interface BalkenViewHandle {
  /** Returns the SVG element used for PNG/SVG export. Mirrors
   *  SpannweiteViewHandle.getSvgElement. */
  getSvgElement: () => SVGSVGElement | null;
}

const BalkenView = forwardRef<BalkenViewHandle, Props>(function BalkenView(
  { myths, metrics, groups, state, update, onSelectMyth, onResetFilters, definitions },
  ref,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  /** Cache of the latest render-relevant state — feeds renderSpannweiteSvg
   *  for export, identical to SpannweiteView's renderDataRef pattern. */
  const renderDataRef = useRef<{
    myths: Myth[];
    metrics: Metric[];
    groups: Group[];
    mode: 'indicator';
    pickedGroup: GroupId;
    pickedIndicator: Indicator;
    visibleColumns: { id: string; label: string }[];
    lang: AppState['lang'];
  } | null>(null);
  useImperativeHandle(ref, () => ({
    getSvgElement: () => {
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

  const lang = state.lang;
  const groupId: GroupId = state.groupIds[0] ?? 'adults';
  const indicator: Indicator = state.indicator;
  const sort: BalkenSort = state.balkenSort ?? 'a-z';

  // Indicator column metadata (icon + labels + definition for InfoTooltip).
  const indicatorCol = useMemo(() => {
    const Icon = INDICATOR_ICONS[indicator];
    const rawLabel = t(`indicator.${indicator}.short` as TranslationKey, lang);
    const label = rawLabel.replace(/\s*%\s*$/, '');
    const def = definitions?.mythIndicators?.[indicator];
    return {
      id: indicator as string,
      Icon,
      label,
      fullLabel: t(`indicator.${indicator}` as TranslationKey, lang),
      defTitle: def?.label,
      defText: def?.definition,
      defScale: def?.scale,
      defSampleSize: def?.sampleSize,
    };
  }, [indicator, lang, definitions]);

  /** Single value lookup — routes through the Bev. Relevanz validity
   *  guard so invalid combos render "k. A." regardless of JSON state. */
  const cellValue = useCallback(
    (mythId: number): number | null =>
      getIndicatorValueChecked(
        getMythMetric(metrics, mythId, groupId),
        indicator,
        groupId,
      ),
    [metrics, groupId, indicator],
  );

  /** Sort: 5-way (Spannweite parity). */
  const sortedMyths = useMemo(() => {
    const rows = [...myths];
    const cmpAz = (a: Myth, b: Myth) =>
      getMythShortText(a, lang).localeCompare(getMythShortText(b, lang), 'de');
    if (sort === 'value-asc' || sort === 'value-desc') {
      const dir = sort === 'value-asc' ? 1 : -1;
      rows.sort((a, b) => {
        const va = cellValue(a.id);
        const vb = cellValue(b.id);
        if (va === null && vb === null) return cmpAz(a, b);
        if (va === null) return 1;
        if (vb === null) return -1;
        if (va !== vb) return dir * (va - vb);
        return cmpAz(a, b);
      });
    } else if (sort === 'verdict-asc' || sort === 'verdict-desc') {
      const dir = sort === 'verdict-asc' ? 1 : -1;
      const order: Record<string, number> = {
        richtig: 1, eher_richtig: 2, eher_falsch: 3, falsch: 4, keine_aussage_moeglich: 5,
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
  }, [myths, sort, cellValue, lang]);

  /** Sort cycle on the indicator column: inactive → asc → desc → asc. */
  const handleColumnSortClick = useCallback(() => {
    if (sort === 'value-asc') update('balkenSort', 'value-desc');
    else if (sort === 'value-desc') update('balkenSort', 'value-asc');
    else update('balkenSort', 'value-asc');
  }, [sort, update]);

  // ─── Hover tooltip state. v3 (2026-05-26): unified label-and-cell
  //     hover. Balken shows ONE indicator per row, so the Lesebeispiel
  //     content is identical wherever you hover within the row — no
  //     need for the Spannweite-style `hoveredOnCell` gate. The
  //     row-label hover gets the same tooltip + Lesebeispiel as the
  //     value cell.
  const [hoveredMythId, setHoveredMythId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const TOOLTIP_MAX_W = 420;
  const VIEWPORT_MARGIN = 24;
  const handleHover = useCallback(
    (mythId: number, e: React.MouseEvent) => {
      setHoveredMythId(mythId);
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
    setHoverPos(null);
  }, []);

  const hoveredMyth = hoveredMythId !== null
    ? myths.find((m) => m.id === hoveredMythId) ?? null
    : null;

  // Keep export-data ref in sync with the live view.
  useEffect(() => {
    renderDataRef.current = {
      myths: sortedMyths,
      metrics,
      groups,
      mode: 'indicator',
      pickedGroup: groupId,
      pickedIndicator: indicator,
      visibleColumns: [{ id: indicatorCol.id, label: indicatorCol.label }],
      lang,
    };
  });

  // 2026-05-29: the viewport-fit height measuring (viewportH / measuredTop
  // + resize listener) was removed — Balken now renders full-height and
  // the page scrolls, so there's no inner-scroll cap to compute. wrapperRef
  // stays for the empty-state + main wrapper.
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (myths.length === 0) {
    return (
      <div className="carm-balken-view" ref={wrapperRef}>
        <div className="carm-balken-empty" role="status">
          <p className="carm-balken-empty__title">
            {t('filter.empty.title', lang)}
          </p>
          <p className="carm-balken-empty__body">
            {t('filter.empty.body', lang)}
          </p>
          {onResetFilters && (
            <button
              type="button"
              className="carm-btn carm-btn--primary carm-balken-empty__cta"
              onClick={onResetFilters}
            >
              {t('filter.empty.cta', lang)}
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAzActive = sort === 'a-z';
  const azTooltip = t('spannweite.sort.alpha.tooltip', lang);
  const isVerdictActive = sort === 'verdict-asc' || sort === 'verdict-desc';
  const verdictDir: 'asc' | 'desc' = sort === 'verdict-desc' ? 'desc' : 'asc';
  const verdictTooltipKey: TranslationKey = !isVerdictActive
    ? 'spannweite.sort.verdict.activate.tooltip'
    : sort === 'verdict-asc'
    ? 'spannweite.sort.verdict.asc.tooltip'
    : 'spannweite.sort.verdict.desc.tooltip';
  const isSortCol = sort === 'value-asc' || sort === 'value-desc';
  const isAsc = sort === 'value-asc';
  const isDesc = sort === 'value-desc';
  const colSortTooltipKey: TranslationKey = isAsc
    ? 'spannweite.sort.col.asc.tooltip'
    : isDesc
    ? 'spannweite.sort.col.desc.tooltip'
    : 'spannweite.sort.col.activate.tooltip';
  const colSortTooltip = t(colSortTooltipKey, lang).replace('{col}', indicatorCol.fullLabel);

  const gridTemplate = `var(--carm-spannweite-label-col) minmax(0, 1fr)`;

  return (
    <div className="carm-spannweite carm-balken-view" ref={wrapperRef}>
      {/* 2026-05-29: no inner-scroll cap — the whole page scrolls (matches
          SpannweiteView). `.carm-spannweite__scroller` keeps overflow-x
          auto for narrow-screen horizontal scroll via its CSS rule. */}
      <div className="carm-spannweite__scroller">
        <div
          className="carm-spannweite__grid"
          style={{ gridTemplateColumns: gridTemplate }}
          role="grid"
        >
          {/* Header — MYTHEN column with A-Z (top-LEFT) + verdict-rank
              (top-RIGHT) sort buttons. */}
          <div
            className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--label"
            role="columnheader"
          >
            <GridLabelHeader
              labelText={t('misc.myths', lang)}
              isAzActive={isAzActive}
              azTooltip={azTooltip}
              onAzClick={() => update('balkenSort', 'a-z')}
              verdictRank={{
                isActive: isVerdictActive,
                direction: verdictDir,
                tooltip: t(verdictTooltipKey, lang),
                onClick: () => {
                  if (sort === 'verdict-asc') update('balkenSort', 'verdict-desc');
                  else if (sort === 'verdict-desc') update('balkenSort', 'verdict-asc');
                  else update('balkenSort', 'verdict-asc');
                },
              }}
            />
          </div>

          {/* Header — indicator data column. */}
          <div
            className="carm-spannweite__cell carm-spannweite__cell--header"
            role="columnheader"
          >
            <GridDataHeader
              Icon={indicatorCol.Icon}
              label={indicatorCol.label}
              fullLabel={indicatorCol.fullLabel}
              defTitle={indicatorCol.defTitle}
              defText={indicatorCol.defText}
              defScale={indicatorCol.defScale}
              defSampleSize={indicatorCol.defSampleSize}
              hideLabel={`${t('column.hide', lang)} — ${indicatorCol.fullLabel}`}
              onHide={() => undefined}
              isSortActive={isSortCol}
              sortDir={isDesc ? 'desc' : 'asc'}
              sortTooltip={colSortTooltip}
              onSortClick={handleColumnSortClick}
            />
          </div>

          {/* Body rows. */}
          {sortedMyths.map((myth, rowIdx) => {
            const verdict = myth.correctness_class;
            const shortText = getMythShortText(myth, lang);
            const isHover = hoveredMythId === myth.id;
            const value = cellValue(myth.id);
            return (
              <div
                key={`row-${myth.id}`}
                className={`carm-spannweite__row${isHover ? ' is-hover' : ''}${rowIdx % 2 === 0 ? '' : ' is-alt'}`}
                role="row"
                style={{
                  gridColumn: `1 / span 2`,
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
                  onMouseEnter={(e) => handleHover(myth.id, e)}
                  onMouseMove={(e) => handleHover(myth.id, e)}
                >
                  <GridMythCell verdict={verdict} shortText={shortText} />
                </div>
                <div
                  className="carm-spannweite__cell carm-spannweite__cell--plot"
                  role="gridcell"
                  aria-label={
                    value !== null
                      ? `${indicatorCol.fullLabel}: ${Math.round(value)} %`
                      : `${indicatorCol.fullLabel}: keine Daten`
                  }
                  onMouseEnter={(e) => handleHover(myth.id, e)}
                  onMouseMove={(e) => handleHover(myth.id, e)}
                >
                  <BalkenBar value={value} accent={getCorrectnessColor(verdict)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Shared verdict-arrow symbol library. */}
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

      {/* Hover tooltip — Spannweite-style verdict-tinted card.
          v3: always pin Lesebeispiel to the active indicator, since
          Balken's single column means label-hover and cell-hover
          should produce identical context. */}
      {hoveredMyth && hoverPos && (() => {
        return (
          <GridHoverTooltip
            myth={hoveredMyth}
            metrics={metrics}
            lang={lang}
            x={hoverPos.x}
            y={hoverPos.y}
            lesebeispielIndicator={indicator}
            lesebeispielGroup={groupId}
          />
        );
      })()}
    </div>
  );
});

export default BalkenView;
