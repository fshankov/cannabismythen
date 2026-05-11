/**
 * BalkenView2 — experimental "text on bar" layout (v3).
 *
 * v3 design (FiveThirtyEight-style hybrid):
 *   - Bar fill = subtle 20%-saturation verdict tint (emerald-50,
 *     lime-50, amber-50, rose-50). Restores the at-a-glance
 *     verdict-color scan we lost in v2's all-beige version, without
 *     the loud contrast issues of v1's full-saturation bars.
 *   - Text always dark (`--color-text`). Reads cleanly on any tint.
 *   - Session 4a (BugHerd #47): the trailing verdict arrow at the
 *     end of the statement was removed. The bar's verdict-tinted
 *     fill carries the verdict signal on its own; the arrow next to
 *     the text was redundant and read as a duplicate cue. Other
 *     VerdictArrow surfaces (FactsheetPanel, ScrollytellingViewer,
 *     HeroBlock) are unchanged.
 *   - No percentages on screen — value lives in the row's `title`
 *     and `aria-label`. No more "Inhalation bewirkt Atemwegser…16%"
 *     overlap.
 *
 * Reuses Balken's:
 *   - sortData() logic via the same balkenSort state slot
 *   - filteredMyths upstream (state.categoryIds, mythIds, verdictFilter)
 *   - state.indicator + state.groupIds[0]
 */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { CorrectnessClass, Myth, Metric, AppState, BalkenSort } from '../../../lib/dashboard/types';
import {
  buildTooltipHtml,
  formatValue,
  getIndicatorValue,
  getMythMetric,
  getMythShortText,
} from '../../../lib/dashboard/data';
import { t } from '../../../lib/dashboard/translations';

const GROUP_LABELS: Record<string, string> = {
  adults: 'Volljährige (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  onSelectMyth: (id: number) => void;
  onResetFilters?: () => void;
}

/** Imperative handle exposed to MythenExplorer's ExportDrawer wiring.
 *  PNG/SVG export is NOT supported on this view (HTML-based, not
 *  ECharts) — getEchartsInstance returns null so callers fall back
 *  gracefully. CSV/JSON export still works via the shared dataset. */
export interface BalkenView2Handle {
  getEchartsInstance: () => null;
}

interface Datum {
  myth: Myth;
  value: number;
}

/** v4: bumped from classification-50 to classification-100 so the bars
 *  read clearly against the page's `#f4f4f0` warm off-white. Paired
 *  with a 1px border in the -200 shade for crisp edges. Dark text on
 *  top still passes WCAG AA at body sizes. */
const BAR_FILL: Record<CorrectnessClass, string> = {
  richtig: '#d1fae5',           // emerald-100
  eher_richtig: '#ecfccb',      // lime-100
  eher_falsch: '#fef3c7',       // amber-100
  falsch: '#ffe4e6',            // rose-100
  no_classification: '#e5e7eb', // gray-200
};

/** Matching border shade per verdict (one step more saturated than
 *  the fill) — defines the bar's right edge clearly against the
 *  page background. */
const BAR_BORDER: Record<CorrectnessClass, string> = {
  richtig: '#a7f3d0',           // emerald-200
  eher_richtig: '#d9f99d',      // lime-200
  eher_falsch: '#fde68a',       // amber-200
  falsch: '#fecdd3',            // rose-200
  no_classification: '#cbd5e1', // gray-300
};

/** Session 4a (BugHerd #47): the trailing verdict arrow was removed.
 *  ARROW_COLOR + VERDICT_ARROW_ICONS were the only consumers of the
 *  full-saturation palette in this view; both are now dead and have
 *  been pruned. The bar's verdict-tinted fill (BAR_FILL + BAR_BORDER
 *  above) carries the verdict signal on its own. */

function sortData(
  data: Datum[],
  sort: BalkenSort,
): Datum[] {
  const copy = data.slice();
  if (sort === 'verdict-rank') {
    // Sort green → red by verdict band, then by descending value as
    // a stable tie-break so the highest indicator value within a band
    // sits at the top. Mirrors the rank used in TableView.tsx so the
    // two ranking views stay in lockstep.
    const order: Record<CorrectnessClass, number> = {
      richtig: 1,
      eher_richtig: 2,
      eher_falsch: 3,
      falsch: 4,
      no_classification: 5,
    };
    return copy.sort((a, b) => {
      const oa = order[a.myth.correctness_class as CorrectnessClass] ?? 5;
      const ob = order[b.myth.correctness_class as CorrectnessClass] ?? 5;
      if (oa !== ob) return oa - ob;
      return b.value - a.value;
    });
  }
  if (sort === 'value-asc') return copy.sort((a, b) => a.value - b.value);
  return copy.sort((a, b) => b.value - a.value);
}

const BalkenView2 = forwardRef<BalkenView2Handle, Props>(function BalkenView2(
  { myths, metrics, state, onSelectMyth, onResetFilters },
  ref,
) {
  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => null,
  }));

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewportH, setViewportH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  );
  const [measuredTop, setMeasuredTop] = useState(200);

  useEffect(() => {
    const onResize = () => {
      setViewportH(window.innerHeight);
      if (wrapperRef.current) {
        setMeasuredTop(wrapperRef.current.getBoundingClientRect().top);
      }
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Effect after mount: pick up the wrapper's real top once React's
  // first commit has run. Uses a microtask so the ref is populated.
  useEffect(() => {
    if (wrapperRef.current) {
      setMeasuredTop(wrapperRef.current.getBoundingClientRect().top);
    }
  }, []);

  const groupId = state.groupIds[0] ?? 'adults';
  const groupName = GROUP_LABELS[groupId] ?? groupId;
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  /** Tooltip position follows the cursor (matches Balken 1's ECharts
   *  tooltip behaviour). Stored as viewport coords so the fixed-
   *  position tooltip can render anywhere on screen. */
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const data = useMemo<Datum[]>(() => {
    const out: Datum[] = [];
    for (const myth of myths) {
      const metric = getMythMetric(metrics, myth.id, groupId);
      const value = getIndicatorValue(metric, state.indicator);
      if (value === null) continue;
      out.push({ myth, value });
    }
    return sortData(out, state.balkenSort);
  }, [myths, metrics, groupId, state.indicator, state.balkenSort]);

  const ROW_HEIGHT = 36;
  const fullHeight = data.length * ROW_HEIGHT + 40; // +40 for axis line at top
  const BOTTOM_MARGIN = 24;
  const availableH = Math.max(360, viewportH - measuredTop - BOTTOM_MARGIN);
  const containerHeight = Math.min(fullHeight, availableH);

  if (data.length === 0) {
    return (
      <div className="carm-balken2" ref={wrapperRef}>
        <div className="carm-balken-empty" role="status">
          <p className="carm-balken-empty__title">
            {t('filter.empty.title', 'de')}
          </p>
          <p className="carm-balken-empty__body">
            {t('filter.empty.body', 'de')}
          </p>
          {onResetFilters && (
            <button
              type="button"
              className="carm-btn carm-btn--primary carm-balken-empty__cta"
              onClick={onResetFilters}
            >
              {t('filter.empty.cta', 'de')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="carm-balken2" ref={wrapperRef}>
      {/* Top axis row — 0/20/40/60/80/100 reference. v2: edge ticks
          (0 + 100) anchor at the row's edges with text-anchor:start /
          end so they don't get clipped past the chart container. */}
      <div className="carm-balken2__axis" aria-hidden="true">
        {[0, 20, 40, 60, 80, 100].map((tk) => {
          const isFirst = tk === 0;
          const isLast = tk === 100;
          return (
            <span
              key={tk}
              className={`carm-balken2__axis-tick${
                isFirst ? ' is-first' : ''
              }${isLast ? ' is-last' : ''}`}
              style={{ left: `${tk}%` }}
            >
              {tk}
            </span>
          );
        })}
        <span className="carm-balken2__axis-name">
          {t(`indicator.${state.indicator}`, 'de')}
        </span>
      </div>

      <div
        className="carm-balken2__scroll"
        style={{ maxHeight: containerHeight, overflowY: 'auto' }}
        onMouseLeave={() => setHoveredId(null)}
      >
        <ul className="carm-balken2__rows" role="list">
          {data.map((d) => {
            const cls = d.myth.correctness_class as CorrectnessClass;
            const text = getMythShortText(d.myth, 'de');
            const formatted = formatValue(d.value, state.indicator);
            return (
              <li
                key={d.myth.id}
                className="carm-balken2__row"
                onClick={() => onSelectMyth(d.myth.id)}
                onMouseEnter={(e) => {
                  setHoveredId(d.myth.id);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) =>
                  setTooltipPos({ x: e.clientX, y: e.clientY })
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMyth(d.myth.id);
                  }
                }}
                aria-label={`${text} — ${formatted}`}
              >
                {/* Layer 1 (z=1): verdict-tinted bar fill + matching
                    border for crisp edges against the page bg. */}
                <div
                  className="carm-balken2__bar"
                  style={{
                    width: `${d.value}%`,
                    background: BAR_FILL[cls],
                    border: `1px solid ${BAR_BORDER[cls]}`,
                  }}
                  aria-hidden="true"
                />

                {/* Layer 2 (z=2): statement text only. Session 4a
                    (BugHerd #47) dropped the trailing verdict arrow —
                    the bar's verdict-tinted fill carries the verdict
                    signal on its own. */}
                <span className="carm-balken2__content">
                  <span className="carm-balken2__text">{text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Cursor-following tooltip — rendered ONCE at the chart level
          (not per-row) so position-fixed coords are correct regardless
          of which row triggered the hover. Mirrors Balken 1's ECharts
          tooltip placement near the mouse. */}
      {hoveredId !== null && (() => {
        const myth = data.find((d) => d.myth.id === hoveredId);
        if (!myth) return null;
        // Offset from cursor + clamp to viewport so the tooltip never
        // escapes the right or bottom edge.
        const TT_W = 320;
        const TT_OFFSET_X = 14;
        const TT_OFFSET_Y = 14;
        const left = Math.min(
          tooltipPos.x + TT_OFFSET_X,
          window.innerWidth - TT_W - 8,
        );
        const top = Math.min(
          tooltipPos.y + TT_OFFSET_Y,
          window.innerHeight - 200,
        );
        return (
          <div
            className="carm-balken2__tooltip"
            role="tooltip"
            style={{ left, top }}
            dangerouslySetInnerHTML={{
              __html: buildTooltipHtml({
                myth: myth.myth,
                lang: 'de',
                groupName,
                indicator: state.indicator,
                value: myth.value,
              }),
            }}
          />
        );
      })()}
    </div>
  );
});

export default BalkenView2;
