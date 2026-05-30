/**
 * VizSourcesSpannweite — Steps 8 + 9 (Iter-12).
 *
 * Dark-adapted port of `cannabismythen/.../SourcesSpannweiteView`.
 * Five curated information sources × four metric columns × one
 * Zielgruppe (picker-controlled). Each cell renders the same lollipop
 * primitive as the Mythen Spannweite: 0/25/50/75/100 % dotted axis,
 * 2 px category-colored stem 0 → value%, 22 px `ValueCircle` capping
 * the stem with the rounded value in white.
 *
 * Reveal:
 *   - Step 8 → `revealedColumns = 2` (Suche + Vertrauen)
 *   - Step 9 → `revealedColumns = 4` (+ Wahrnehmung + Prävention)
 * Unrevealed columns render only the dotted axis (no stem, no circle)
 * so the geometry stays stable across the step boundary.
 *
 * Hover a populated cell → fixed-position card with the
 * LesebeispielSource sentence for that (metric, group) pair.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AUDIENCE_ICONS_BY_GROUP,
  SOURCE_CATEGORY_ICONS,
  SOURCE_METRIC_ICONS,
  type SourceCategoryId,
} from '../../lib/icons';
import type {
  GroupId,
  InformationSource,
  InformationSourcesData,
  SourceMetricId,
} from './types';
import {
  ACTIVE_GROUPS,
  GROUP_LABEL_DE,
  SOURCE_METRIC_DEFS_DE,
} from './dataLoaders';
import ValueCircle from '../shared/ValueCircle';
import BalkenAxis from '../shared/BalkenAxis';
import InfoDot from '../shared/InfoDot';
import { lesebeispielSourceSentence } from './lesebeispiel-bands';
import { useFlipPosition } from '../dashboard/hooks/useFlipPosition';
import DatenExplorerLink from './DatenExplorerLink';

interface Props {
  data: InformationSourcesData;
  /** 0..4. 2 → Step 8, 4 → Step 9. */
  revealedColumns: 0 | 1 | 2 | 3 | 4;
  /** Current step number — drives the "Mehr im Daten-Explorer →"
   *  deep-link target (Iter-14, CAR-15/16/17). */
  step: 8 | 9;
}

/** Column order — keep in sync with the Iter-10 scrolly narrative
 *  (Step 8 = active: Suche + Vertrauen; Step 9 = passive: Wahrnehmung +
 *  Prävention). */
const COLUMNS: ReadonlyArray<SourceMetricId> = [
  'search',
  'trust',
  'perception',
  'prevention',
];

/** The curated 5 sources featured in the scrolly. Same IDs as
 *  `VizSourcesStrips`'s exemplary set — spans 5 source categories. */
const CURATED_IDS: ReadonlyArray<number> = [2, 1, 16, 33, 43];

const GROUP_COLOR: Record<GroupId, string> = {
  adults: 'var(--group-adults)',
  minors: 'var(--group-minors)',
  consumers: 'var(--group-consumers)',
  young_adults: 'var(--group-young_adults)',
  parents: 'var(--group-parents)',
};

function categoryColorVar(cat: string): string {
  return `var(--source-cat-${cat})`;
}

interface HoverState {
  sourceId: number;
  metric: SourceMetricId;
}

export function VizSourcesSpannweite({ data, revealedColumns, step }: Props) {
  const [activeGroup, setActiveGroup] = useState<GroupId>('adults');
  const [hover, setHover] = useState<HoverState | null>(null);

  // Iter-14: viz-block bounds ref. `useFlipPosition` clamps the tooltip
  // inside this element so right-edge cells never bleed past the canvas
  // frame.
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  function openCellTooltip(state: HoverState, el: HTMLElement) {
    (tooltipTriggerRef as unknown as React.MutableRefObject<Element | null>).current = el;
    setHover(state);
    setTooltipOpen(true);
    updateTooltipPosition();
  }
  function closeCellTooltip() {
    setTooltipOpen(false);
    setHover(null);
  }

  // Iter-11 staggered reveal — same shape as `VizSampleAndRanked`.
  const prevRevealedRef = useRef(0);
  useEffect(() => {
    prevRevealedRef.current = revealedColumns;
  }, [revealedColumns]);
  const prevRevealed = prevRevealedRef.current;
  const isForward = revealedColumns >= prevRevealed;

  const curatedSources: InformationSource[] = useMemo(() => {
    const allow = new Set(CURATED_IDS);
    return data.sources
      .filter((s) => s.parentId === null && allow.has(s.id))
      .sort((a, b) => CURATED_IDS.indexOf(a.id) - CURATED_IDS.indexOf(b.id));
  }, [data]);

  const visibleCategories = useMemo(() => {
    const visibleCats = new Set(curatedSources.map((s) => s.category));
    return data.sourceCategories.filter((c) => visibleCats.has(c.id));
  }, [curatedSources, data]);

  const hoveredSource =
    hover !== null
      ? curatedSources.find((s) => s.id === hover.sourceId) ?? null
      : null;
  const hoveredValue =
    hover !== null
      ? data.metrics[hover.metric]?.data[activeGroup]?.[String(hover.sourceId)] ?? null
      : null;
  const hoveredSentence =
    hover && hoveredValue != null
      ? lesebeispielSourceSentence(hoveredValue, hover.metric, activeGroup)
      : null;

  return (
    <div className="viz viz-spannweite-sources" ref={containerRef}>
      <header className="viz-spannweite-sources__header">
        <span className="viz-spannweite-sources__header-eyebrow">Beispiel-Quellen</span>
        <p className="viz-spannweite-sources__header-list">
          Apotheke · Angehörige · Foren · Plakat · Kurzbeitrag TV/Radio
        </p>
      </header>

      <div className="viz-spannweite-sources__picker" role="tablist" aria-label="Zielgruppe">
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

      <div
        className="viz-spannweite-sources__grid carm-spannweite"
        role="grid"
        style={{ ['--source-cols' as string]: COLUMNS.length }}
      >
        {/* Header row — QUELLEN label cell + 4 metric headers. */}
        <div className="viz-spannweite-sources__row viz-spannweite-sources__row--head" role="row">
          <div
            className="viz-spannweite-sources__cell viz-spannweite-sources__cell--label viz-spannweite-sources__cell--header"
            role="columnheader"
          >
            <span className="viz-spannweite-sources__col-eyebrow">Quellen</span>
          </div>
          {COLUMNS.map((metric, i) => {
            const isRevealed = i < revealedColumns;
            // Iter-18: headers EASE 0.35 → 1 (CSS transition on the cell)
            // rather than flashing from 0, so on Step 9 the Wahrnehmung
            // + Prävention headers brighten from their Step-8 placeholder
            // state instead of appearing from blank.
            const cellStyle: React.CSSProperties = { opacity: isRevealed ? 1 : 0.35 };
            const def = SOURCE_METRIC_DEFS_DE[metric];
            const Icon = SOURCE_METRIC_ICONS[metric];
            return (
              <div
                key={metric}
                role="columnheader"
                className="viz-spannweite-sources__cell viz-spannweite-sources__cell--header"
                data-revealed={isRevealed}
                style={cellStyle}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                <span className="viz-spannweite-sources__col-name">{def.label}</span>
                <InfoDot title={def.label} body={def.body} meta={def.scale} />
              </div>
            );
          })}
        </div>

        {/* Body rows — one per curated source. Iter-15: per-category
            icon replaces the bare colour dot so the row labels carry
            the same visual vocabulary as the legend. Icon colour
            inherits from the row label cell's `currentColor`, which
            equals the category accent via an inline `color`. */}
        {curatedSources.map((source) => {
          const CatIcon = SOURCE_CATEGORY_ICONS[source.category as SourceCategoryId];
          return (
          <div
            key={source.id}
            role="row"
            className="viz-spannweite-sources__row"
          >
            <div
              className="viz-spannweite-sources__cell viz-spannweite-sources__cell--label"
              role="rowheader"
              style={{ color: categoryColorVar(source.category) }}
            >
              {CatIcon ? (
                <CatIcon
                  size={16}
                  strokeWidth={1.75}
                  className="viz-spannweite-sources__cat-icon"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="viz-spannweite-sources__cat-dot"
                  style={{ background: categoryColorVar(source.category) }}
                  aria-hidden="true"
                />
              )}
              <span className="viz-spannweite-sources__source-name">
                {source.name}
              </span>
            </div>
            {COLUMNS.map((metric, colIdx) => {
              const isRevealed = colIdx < revealedColumns;
              const isNewlyRevealed =
                isForward && isRevealed && colIdx >= prevRevealed;
              const revealIdx = isNewlyRevealed ? colIdx - prevRevealed : 0;
              // Iter-18: the CELL is always opaque — its dotted axis stays
              // visible as a placeholder while the column is unrevealed
              // (dimmed via [data-revealed="false"] in CSS). Only the
              // stem + ValueCircle FILL animates in on reveal, so on
              // Step 9 Wahrnehmung + Prävention fill over the Step-8
              // scaffold instead of appearing from blank.
              const fillStyle: React.CSSProperties = isNewlyRevealed
                ? {
                    animation:
                      'viz-reveal-in var(--viz-reveal-dur) cubic-bezier(0.22, 1, 0.36, 1) both',
                    animationDelay: `calc(${revealIdx} * var(--viz-reveal-stagger))`,
                  }
                : {};
              const raw = data.metrics[metric]?.data[activeGroup]?.[String(source.id)];
              const value = typeof raw === 'number' ? raw : null;
              const isHover =
                hover !== null && hover.sourceId === source.id && hover.metric === metric;
              return (
                <div
                  key={`${source.id}-${metric}`}
                  role="gridcell"
                  className={`viz-spannweite-sources__cell viz-spannweite-sources__cell--plot${isHover ? ' is-hover' : ''}`}
                  data-revealed={isRevealed}
                  aria-label={
                    isRevealed && value !== null
                      ? `${source.name} · ${SOURCE_METRIC_DEFS_DE[metric].label}: ${Math.round(value)}`
                      : `${source.name} · ${SOURCE_METRIC_DEFS_DE[metric].label}: keine Aussage`
                  }
                  tabIndex={isRevealed && value !== null ? 0 : -1}
                  onMouseEnter={(e) =>
                    isRevealed && value !== null && openCellTooltip({ sourceId: source.id, metric }, e.currentTarget)
                  }
                  onMouseMove={(e) =>
                    isRevealed && value !== null && openCellTooltip({ sourceId: source.id, metric }, e.currentTarget)
                  }
                  onMouseLeave={closeCellTooltip}
                  onFocus={(e) =>
                    isRevealed && value !== null && openCellTooltip({ sourceId: source.id, metric }, e.currentTarget)
                  }
                  onBlur={closeCellTooltip}
                >
                  {/* Always render the dotted axis so unrevealed columns
                      read as present-but-empty placeholders (dimmed). */}
                  <div className="carm-spannweite__plot">
                    <BalkenAxis />
                    {isRevealed && value !== null && (
                      <div className="viz-spannweite-sources__fill" style={fillStyle}>
                        <div
                          className="carm-spannweite__bar"
                          style={{
                            width: `${Math.max(0, Math.min(100, value))}%`,
                            background: categoryColorVar(source.category),
                          }}
                          aria-hidden="true"
                        />
                        <ValueCircle value={value} accent={categoryColorVar(source.category)} />
                      </div>
                    )}
                    {isRevealed && value === null && (
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
      </div>

      {/* Category legend — only categories present among the curated 5.
          Iter-18: each item now carries its category ICON (matching the
          row labels) instead of a bare colour dot; the Daten-Explorer
          link trails on the right of the same row (after Persönliches
          Umfeld, the last category). */}
      <div className="viz-spannweite-sources__legend" aria-label="Quellen-Kategorien">
        {visibleCategories.map((c) => {
          const LegIcon = SOURCE_CATEGORY_ICONS[c.id as SourceCategoryId];
          return (
            <span key={c.id} className="viz-spannweite-sources__legend-item">
              {LegIcon ? (
                <LegIcon
                  size={13}
                  strokeWidth={1.75}
                  className="viz-spannweite-sources__legend-icon"
                  style={{ color: categoryColorVar(c.id) }}
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="viz-spannweite-sources__legend-dot"
                  style={{ background: categoryColorVar(c.id) }}
                  aria-hidden="true"
                />
              )}
              {c.name}
            </span>
          );
        })}
        {/* Iter-18 (CAR-15/16/17 reposition): Daten-Explorer link at the
            right end of the legend row. */}
        <DatenExplorerLink step={step} compact shortLabel />
      </div>

      {/* Hover tooltip — single shared instance. */}
      <div
        ref={tooltipCardRef}
        role="tooltip"
        className={`scrolly-hover-tooltip viz-balken-myth__tooltip${
          tooltipOpen && hoveredSource && hoveredSentence ? ' is-open' : ''
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
        {hover && hoveredSource && hoveredSentence && (() => {
          const TipIcon = SOURCE_CATEGORY_ICONS[hoveredSource.category as SourceCategoryId];
          return (
          <>
            <p className="scrolly-hover-tooltip__eyebrow">
              {/* Iter-18: colored category ICON in the upper-left
                  corner instead of a small dot. */}
              {TipIcon ? (
                <TipIcon
                  size={15}
                  strokeWidth={1.75}
                  className="viz-spannweite-sources__tip-icon"
                  style={{ color: categoryColorVar(hoveredSource.category) }}
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="viz-spannweite-sources__cat-dot"
                  style={{ background: categoryColorVar(hoveredSource.category) }}
                  aria-hidden="true"
                />
              )}
              {hoveredSource.name} · {SOURCE_METRIC_DEFS_DE[hover.metric].label}
            </p>
            <p className="scrolly-hover-tooltip__body">
              {hoveredSentence}
            </p>
          </>
          );
        })()}
      </div>
    </div>
  );
}

export default VizSourcesSpannweite;
