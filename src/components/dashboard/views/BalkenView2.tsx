/**
 * BalkenView2 — experimental "text on bar" layout (v3).
 *
 * v3 design (FiveThirtyEight-style hybrid):
 *   - Bar fill = subtle 20%-saturation verdict tint (emerald-50,
 *     lime-50, amber-50, rose-50). Restores the at-a-glance
 *     verdict-color scan we lost in v2's all-beige version, without
 *     the loud contrast issues of v1's full-saturation bars.
 *   - Text always dark (`--color-text`). Reads cleanly on any tint.
 *   - Verdict arrow at the BAR's right edge (where the fill stops),
 *     full-saturation verdict color, 18px. Arrow is the decisive
 *     verdict marker AND visually closes the row at the right
 *     position. For short bars where the arrow lands inside the
 *     text, the verdict-color contrast keeps it legible.
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
import { ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

const VERDICT_ARROW_ICONS: Record<CorrectnessClass, LucideIcon> = {
  richtig: ArrowUp,
  eher_richtig: ArrowUpRight,
  eher_falsch: ArrowDownLeft,
  falsch: ArrowDown,
  no_classification: Minus,
};

/** v3: subtle verdict tint per row — mirrors `--classification-{v}-bg`
 *  tokens (emerald-50, lime-50, amber-50, rose-50). Light enough that
 *  dark text on top stays max-readable, present enough that the eye
 *  picks up the verdict-color rhythm scrolling down the chart. */
const BAR_FILL: Record<CorrectnessClass, string> = {
  richtig: '#ecfdf5',           // emerald-50
  eher_richtig: '#f7fee7',      // lime-50
  eher_falsch: '#fffbeb',       // amber-50
  falsch: '#fff1f2',            // rose-50
  no_classification: '#f3f4f6', // gray-100
};

/** Full-saturation verdict color for the bar-end arrow.
 *  Mirrors the canonical CSS tokens in `--classification-*`. */
const ARROW_COLOR: Record<CorrectnessClass, string> = {
  richtig: '#047857',
  eher_richtig: '#4d7c0f',
  eher_falsch: '#b45309',
  falsch: '#be123c',
  no_classification: '#6b7280',
};

function sortData(data: Datum[], sort: BalkenSort): Datum[] {
  const copy = data.slice();
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
            const Arrow = VERDICT_ARROW_ICONS[cls];
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
                {/* Layer 1 (z=1): subtle verdict-tinted bar fill,
                    width = value%. */}
                <div
                  className="carm-balken2__bar"
                  style={{
                    width: `${d.value}%`,
                    background: BAR_FILL[cls],
                  }}
                  aria-hidden="true"
                />

                {/* Layer 2 (z=2): inline-flex container [text][arrow].
                    The arrow follows the text naturally — at the END
                    OF TEXT, not the bar end — so it never lands inside
                    the statement on short bars. */}
                <span className="carm-balken2__content">
                  <span className="carm-balken2__text">{text}</span>
                  <span
                    className="carm-balken2__arrow"
                    style={{ color: ARROW_COLOR[cls] }}
                    aria-hidden="true"
                  >
                    <Arrow size={18} strokeWidth={2.5} />
                  </span>
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
