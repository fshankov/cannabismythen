/**
 * VizSingleMythBalken — Steps 6 + 7 (Iter-12).
 *
 * One myth (M28 by default), one Zielgruppe (picker-controlled), a
 * vertical stack of five indicator rows rendered in the dark-adapted
 * Daten-Explorer Balken visual: 0/25/50/75/100 % dotted axis behind a
 * verdict-tinted translucent wash, capped by the shared 22 px
 * `ValueCircle` with the rounded value in white.
 *
 * Reveal:
 *   - Step 6 → `revealedRows = 3` (Kenntnis, Bedeutung, Richtigkeit)
 *   - Step 7 → `revealedRows = 5` (+ Präventionsbedeutung,
 *               Bevölkerungsrisiko)
 * All 5 rows are always in the DOM with reserved height; the last two
 * fade in with the existing `viz-reveal-in` keyframe + 200 ms stagger.
 * Backward scroll snaps (no reverse stagger).
 *
 * Hover a row → fixed-position card with the Lesebeispiel single
 * sentence for that (indicator, group) pair. Same prose the Daten-
 * Explorer uses for its hover tooltips.
 *
 * Bevölkerungsrisiko falls back to "k. A." when the selected group is
 * not adults/minors (mirrors `getIndicatorValueChecked`).
 */

import { useEffect, useRef, useState } from 'react';
import { AUDIENCE_ICONS_BY_GROUP, INDICATOR_ICONS } from '../../lib/icons';
import type { CarmData, GroupId, Indicator } from './types';
import {
  ACTIVE_GROUPS,
  BEV_RISIKO_VALID_GROUPS,
  GROUP_LABEL_DE,
  INDICATOR_DEFS_DE,
  INDICATOR_LABEL_DE,
  VERDICT_COLOR,
  getIndicatorValueChecked,
  getMetric,
} from './dataLoaders';
import ValueCircle from '../shared/ValueCircle';
import BalkenAxis from '../shared/BalkenAxis';
import InfoDot from '../shared/InfoDot';
import VerdictPill from '../shared/VerdictPill';
import { lesebeispielSentence } from './lesebeispiel-bands';
import { useFlipPosition } from '../dashboard/hooks/useFlipPosition';
import DatenExplorerLink from './DatenExplorerLink';
import type { CorrectnessClass } from '../../lib/dashboard/types';

interface Props {
  data: CarmData;
  /** Featured myth id. Defaults to M28 (Motivationsverlust) per the
   *  approved plan; surfaced as a prop so a future iteration can route
   *  a different myth here without touching the component. */
  mythId?: number;
  /** 3 → Step 6 (raw indicators), 5 → Step 7 (+ derived). */
  revealedRows: 3 | 5;
  /** Current step number — drives the "Mehr im Daten-Explorer →"
   *  deep-link target (Iter-14, CAR-15/16/17). */
  step: 6 | 7;
}

const GROUP_COLOR: Record<GroupId, string> = {
  adults: 'var(--group-adults)',
  minors: 'var(--group-minors)',
  consumers: 'var(--group-consumers)',
  young_adults: 'var(--group-young_adults)',
  parents: 'var(--group-parents)',
};

const INDICATOR_ORDER: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

const INDICATOR_UNIT: Record<Indicator, string> = {
  awareness: '% gekannt',
  significance: 'Punkte',
  correctness: 'Punkte',
  prevention_significance: 'Punkte',
  population_relevance: 'Punkte',
};

/** Sample-size hint shown above the picker. Numbers mirror the
 *  Stichprobe panel (Step 5). */
const GROUP_N: Record<GroupId, number> = {
  adults: 2097,
  minors: 555,
  consumers: 358,
  young_adults: 333,
  parents: 539,
};

export function VizSingleMythBalken({
  data,
  mythId = 28,
  revealedRows,
  step,
}: Props) {
  const myth = data.myths.find((m) => m.id === mythId);
  const [activeGroup, setActiveGroup] = useState<GroupId>('adults');
  const [hoveredIndicator, setHoveredIndicator] = useState<Indicator | null>(null);

  // Iter-14: viz-block bounds ref. `useFlipPosition` clamps the
  // tooltip inside this element so it never bleeds past the canvas
  // frame — Harald-review cross-cutting fix.
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hover tooltip — anchored to the hovered row via `useFlipPosition`
  // so it flips above/below depending on viewport room and clamps
  // horizontally on narrow widths. Single instance for the whole grid.
  const {
    triggerRef: tooltipTriggerRef,
    cardRef: tooltipCardRef,
    pos: tooltipPos,
    open: tooltipOpen,
    setOpen: setTooltipOpen,
    updatePosition: updateTooltipPosition,
  } = useFlipPosition<HTMLElement, HTMLDivElement>({
    maxWidth: 360,
    gap: 12,
    boundsRef: containerRef,
  });

  function openRowTooltip(indicator: Indicator, el: HTMLElement) {
    (tooltipTriggerRef as unknown as React.MutableRefObject<Element | null>).current = el;
    setHoveredIndicator(indicator);
    setTooltipOpen(true);
    updateTooltipPosition();
  }
  function closeRowTooltip() {
    setTooltipOpen(false);
    setHoveredIndicator(null);
  }

  // Iter-11 staggered reveal — init to 0 so the FIRST entry to Step 6
  // cascades from 0/200 ms. Gate stagger to forward direction so
  // backward scroll snaps.
  const prevRevealedRef = useRef(0);
  useEffect(() => {
    prevRevealedRef.current = revealedRows;
  }, [revealedRows]);
  const prevRevealed = prevRevealedRef.current;
  const isForward = revealedRows >= prevRevealed;

  if (!myth) {
    return (
      <div className="viz viz-balken-myth viz-balken-myth--missing">
        <p>Myth #{mythId} not found in carm-data.json.</p>
      </div>
    );
  }

  const verdict = myth.correctness_class as CorrectnessClass;
  const accent = VERDICT_COLOR[verdict];
  const hoveredMetric = getMetric(data, myth.id, activeGroup);
  const hoveredSentence =
    hoveredIndicator && hoveredMetric
      ? lesebeispielSentence(hoveredMetric, hoveredIndicator, activeGroup)
      : null;

  return (
    <div className="viz viz-balken-myth" ref={containerRef}>
      {/* Header strip — verdict puck + the myth statement, framed like the
          Daten-Explorer factsheet header. */}
      <header className="viz-balken-myth__header">
        <div className="viz-balken-myth__header-row">
          <VerdictPill verdict={verdict} size="sm" variant="puck" />
          <span className="viz-balken-myth__header-label">Beispiel-These</span>
        </div>
        <p className="viz-balken-myth__statement">„{myth.text_de}"</p>
      </header>

      {/* Audience picker — same 5 pills + colors as Step 5 + Sources.
          Iter-15 (2026-05-29): per-group audience icon instead of the
          generic lucide User glyph, so the picker mirrors the visual
          vocabulary used everywhere else on the site. */}
      <div className="viz-balken-myth__picker" role="tablist" aria-label="Zielgruppe">
        {ACTIVE_GROUPS.map((g) => {
          const isActive = activeGroup === g;
          const Icon = AUDIENCE_ICONS_BY_GROUP[g];
          return (
            <button
              key={g}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveGroup(g)}
              className={`viz-balken-myth__pick${isActive ? ' viz-balken-myth__pick--active' : ''}`}
            >
              <Icon
                size="1em"
                strokeWidth={1.75}
                color={GROUP_COLOR[g]}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
              {GROUP_LABEL_DE[g]}
            </button>
          );
        })}
      </div>

      <p className="viz-balken-myth__caption">
        Stichprobe {GROUP_LABEL_DE[activeGroup]}, n={GROUP_N[activeGroup].toLocaleString('de-DE')}.
      </p>

      {/* The 5-row Balken grid. All rows always in the DOM; opacity-gated
          by `revealedRows`. */}
      <div className="viz-balken-myth__grid carm-spannweite carm-balken-view" role="grid">
        {INDICATOR_ORDER.map((ind, i) => {
          const isRevealed = i < revealedRows;
          const isNewlyRevealed =
            isForward && isRevealed && i >= prevRevealed;
          const revealIdx = isNewlyRevealed ? i - prevRevealed : 0;
          const rowStyle: React.CSSProperties = isNewlyRevealed
            ? {
                animation:
                  'viz-reveal-in var(--viz-reveal-dur) cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `calc(${revealIdx} * var(--viz-reveal-stagger))`,
              }
            : { opacity: isRevealed ? 1 : 0 };

          const value = getIndicatorValueChecked(data, myth.id, activeGroup, ind);
          const def = INDICATOR_DEFS_DE[ind];
          const Icon = INDICATOR_ICONS[ind];
          const isBev = ind === 'population_relevance';
          const bevApplies = BEV_RISIKO_VALID_GROUPS.has(activeGroup);
          const showKaa = isBev && !bevApplies;
          const isHover = hoveredIndicator === ind;

          return (
            <div
              key={ind}
              role="row"
              className={`viz-balken-myth__row${isHover ? ' is-hover' : ''}`}
              data-revealed={isRevealed}
              style={rowStyle}
              tabIndex={isRevealed ? 0 : -1}
              onMouseEnter={(e) =>
                isRevealed && openRowTooltip(ind, e.currentTarget)
              }
              onMouseMove={(e) =>
                isRevealed && openRowTooltip(ind, e.currentTarget)
              }
              onMouseLeave={closeRowTooltip}
              onFocus={(e) =>
                isRevealed && openRowTooltip(ind, e.currentTarget)
              }
              onBlur={closeRowTooltip}
            >
              <div className="viz-balken-myth__row-label" role="rowheader">
                <Icon
                  size={14}
                  strokeWidth={1.75}
                  color="currentColor"
                  aria-hidden="true"
                />
                <span className="viz-balken-myth__row-name">
                  {INDICATOR_LABEL_DE[ind]}
                </span>
                <InfoDot title={def.label} body={def.body} meta={def.scale} />
              </div>
              <div
                className="viz-balken-myth__row-plot"
                role="gridcell"
                aria-label={
                  value !== null
                    ? `${INDICATOR_LABEL_DE[ind]}: ${Math.round(value)} (${INDICATOR_UNIT[ind]})`
                    : `${INDICATOR_LABEL_DE[ind]}: keine Aussage`
                }
              >
                <div className="carm-balken__plot">
                  <BalkenAxis />
                  {value !== null && value > 0 && (
                    <div
                      className="carm-balken__wash"
                      style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: accent }}
                      aria-hidden="true"
                    />
                  )}
                  {value !== null ? (
                    <ValueCircle value={value} accent={accent} />
                  ) : (
                    <span className="carm-spannweite__no-data" aria-hidden="true">
                      {showKaa ? 'nur Voll- + Minderjährige' : 'k. A.'}
                    </span>
                  )}
                </div>
                {/* Iter-18 (CAR-15/16/17 reposition): the Daten-Explorer
                    link sits at the right of the LAST row (Bevölkerungs-
                    risiko). Bev.risiko values are low (≈17) or "k. A.",
                    so the right ~80% of this plot is empty — the pill
                    fits without overlapping the ValueCircle. Only
                    rendered once the row is revealed (Step 7). */}
                {isBev && isRevealed && (
                  <DatenExplorerLink step={step} compact shortLabel />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip — single instance reused across rows. */}
      <div
        ref={tooltipCardRef}
        role="tooltip"
        className={`scrolly-hover-tooltip viz-balken-myth__tooltip${
          tooltipOpen && hoveredSentence ? ' is-open' : ''
        }`}
        style={
          tooltipPos
            ? {
                position: 'fixed',
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: tooltipPos.width,
              }
            : undefined
        }
      >
        {hoveredIndicator && hoveredSentence && (
          <>
            <p className="scrolly-hover-tooltip__eyebrow">
              {INDICATOR_LABEL_DE[hoveredIndicator]} · {GROUP_LABEL_DE[activeGroup]}
            </p>
            <p
              className="scrolly-hover-tooltip__body"
              // The sentence is a static string from a locked template; safe
              // to render as text.
            >
              {hoveredSentence}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default VizSingleMythBalken;
