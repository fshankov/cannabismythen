import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TimelineTooltip } from './types';
import { useFlipPosition } from '../dashboard/hooks/useFlipPosition';

interface Props {
  active: boolean;
  tooltips: ReadonlyArray<TimelineTooltip>;
}

interface Anchor {
  date: string; // ISO yyyy-mm-dd
  labelDate: string;
  title: string;
  subtitle?: string;
  highlight?: boolean;
}

const ANCHORS: Anchor[] = [
  {
    date: '2024-04-01',
    labelDate: 'April 2024',
    title: 'Konsumcannabisgesetz',
    subtitle: 'Inkrafttreten KCanG',
  },
  {
    date: '2024-09-01',
    labelDate: 'Aug.–Okt. 2024',
    title: 'Erste Online-Befragung',
    subtitle: 'n = 1.041 Personen',
  },
  {
    date: '2025-01-15',
    labelDate: 'Jan.–Feb. 2025',
    title: 'Literaturanalysen',
    subtitle: 'PubMed · PsychInfo · SocIndex',
  },
  {
    date: '2025-07-15',
    labelDate: 'Juli–Aug. 2025',
    title: 'Hauptbefragung',
    subtitle: 'n = 2.795 Personen',
  },
  {
    date: '2025-11-15',
    labelDate: 'November 2025',
    title: 'Expert:innen-Diskussion',
  },
  {
    date: '2026-09-01',
    labelDate: 'September 2026',
    title: 'Veröffentlichung',
    subtitle: 'Diese Website',
    highlight: true,
  },
];

function AnchorLabel({ anchor }: { anchor: Anchor }) {
  return (
    <>
      <div className="viz-timeline-v__label-title">{anchor.title}</div>
      <div className="viz-timeline-v__label-date">{anchor.labelDate}</div>
      {anchor.subtitle && (
        <div className="viz-timeline-v__label-subtitle">{anchor.subtitle}</div>
      )}
    </>
  );
}

/**
 * VizTimeline — Step 1 timeline (Iter-15 rewrite).
 *
 * Six anchors stacked top-to-bottom as document-flow rows. Each row is a
 * 3-cell grid: [left-cell | track-cell (80 px) | right-cell]. Labels
 * alternate L/R via `i % 2`:
 *   i=0 right (left-aligned),   i=1 left (right-aligned),
 *   i=2 right (left-aligned),   i=3 left (right-aligned),
 *   i=4 right (left-aligned),   i=5 left (right-aligned).
 *
 * The continuous green line is an ABSOLUTELY POSITIONED bar that spans
 * the full container height, sitting behind the rows. As `drawn`
 * animates 0 → 1, the foreground line grows top-down and a golden
 * locator dot follows the tip; each row's opacity flips on when the
 * line has passed its (i + 0.5) / N midpoint.
 *
 * This replaces the Iter-12/13/14 model that absolute-positioned
 * entries inside grid cells — that approach kept producing
 * overlap/clipping bugs because absolute children don't size their
 * grid parent and `width: 100%` + `overflow: hidden` could collapse
 * the cells.
 */
export function VizTimeline({ active, tooltips }: Props) {
  const [drawn, setDrawn] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Iter-18: measure first/last dot positions so the green line spans
  // exactly first-dot-center → last-dot-center regardless of how tall
  // the timeline container ends up. The Iter-17 CSS-only fix
  // (`height: auto` override of `.viz { height: 100% }`) wasn't
  // robust — depended on source-order specificity AND on the user's
  // dev server picking up the change. JS-measured positions are
  // immune to either.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lineGeom, setLineGeom] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const tooltipMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of tooltips) m[t.anchorDate] = t.body;
    return m;
  }, [tooltips]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const first = dotRefs.current[0];
    const last = dotRefs.current[ANCHORS.length - 1];
    if (!container || !first || !last) return;

    function measure() {
      // Re-read after a possible layout shift. `container` is captured
      // and was confirmed non-null on entry.
      if (!container || !first || !last) return;
      const c = container.getBoundingClientRect();
      const f = first.getBoundingClientRect();
      const l = last.getBoundingClientRect();
      const top = f.top + f.height / 2 - c.top;
      const bottom = l.top + l.height / 2 - c.top;
      setLineGeom({ top, height: bottom - top });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    // Observe each dot too — if a row reflows (label wraps to a new
    // line on narrow viewports) the dot Y shifts and the line needs
    // to re-anchor.
    for (const d of dotRefs.current) if (d) ro.observe(d);
    return () => ro.disconnect();
  }, []);

  const {
    triggerRef,
    cardRef,
    pos,
    open,
    setOpen,
    updatePosition,
  } = useFlipPosition<HTMLButtonElement, HTMLDivElement>({
    maxWidth: 320,
    gap: 12,
  });

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.dataset.reducedMotion === 'true');
    if (!active) {
      setDrawn(0);
      return;
    }
    if (reduced) {
      setDrawn(1);
      return;
    }
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDrawn(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  const hoveredAnchor = hoveredIdx !== null ? ANCHORS[hoveredIdx] : null;

  function handleEnter(idx: number, el: HTMLButtonElement) {
    (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    setHoveredIdx(idx);
    setOpen(true);
    updatePosition();
  }
  function handleLeave() {
    setOpen(false);
    setHoveredIdx(null);
  }

  // Inline styles for the line-related elements, based on the measured
  // first/last dot positions. Until the first measurement commits (one
  // paint frame) we render the line at zero height, hidden — avoids a
  // flash of full-height line on initial mount.
  const lineBgStyle = lineGeom
    ? { top: lineGeom.top, height: lineGeom.height, bottom: 'auto' as const }
    : { top: 0, height: 0, bottom: 'auto' as const };
  const lineFgStyle = lineGeom
    ? {
        top: lineGeom.top,
        height: drawn * lineGeom.height,
        bottom: 'auto' as const,
      }
    : { top: 0, height: 0, bottom: 'auto' as const };
  // Glyph (yellow Falsch-shape: chevron + vertical shaft + horizontal
  // shadow line) sits at the bottom endpoint of the green line. The
  // shadow line at SVG-y=16/24 anchors the chevron tip — we translate
  // the wrapper so that point coincides with the line endpoint.
  const glyphStyle = lineGeom
    ? { top: lineGeom.top + lineGeom.height }
    : null;

  return (
    <div
      ref={containerRef}
      className="viz viz-timeline-v"
      role="img"
      aria-label="Zeitlicher Ablauf der CaRM-Studie"
    >
      {/* Continuous line — spans first dot to last dot via JS-measured
          coordinates. `bottom: auto` overrides the CSS `bottom: 0` from
          the bg rule so inline `top + height` win. */}
      <div
        className="viz-timeline-v__line-bg"
        style={lineBgStyle}
        aria-hidden="true"
      />
      <div
        className="viz-timeline-v__line-fg"
        style={lineFgStyle}
        aria-hidden="true"
      />
      {glyphStyle && (
        <div
          className="viz-timeline-v__glyph"
          style={glyphStyle}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <g
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
            >
              <path
                className="viz-timeline-v__glyph-shadow"
                d="M2 16h20"
              />
              <g className="viz-timeline-v__glyph-arrow">
                <path d="M12 2v14" />
                <path d="m5 9 7 7 7-7" />
              </g>
            </g>
          </svg>
        </div>
      )}

      {ANCHORS.map((a, i) => {
        const labelOnRight = i % 2 === 0;
        const visible = drawn >= (i + 0.5) / ANCHORS.length;
        const isHovered = hoveredIdx === i;
        return (
          <div
            key={i}
            className={[
              'viz-timeline-v__row',
              a.highlight ? 'viz-timeline-v__row--highlight' : '',
              isHovered ? 'viz-timeline-v__row--hovered' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ opacity: visible ? 1 : 0 }}
          >
            <div className="viz-timeline-v__row-cell viz-timeline-v__row-cell--left">
              {!labelOnRight && <AnchorLabel anchor={a} />}
            </div>

            <div className="viz-timeline-v__row-cell viz-timeline-v__row-cell--track">
              {a.highlight && drawn >= 1 && (
                <span
                  className="viz-timeline-v__dot-pulse"
                  aria-hidden="true"
                />
              )}
              <span
                className="viz-timeline-v__dot"
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
              />
              <button
                type="button"
                className="viz-timeline-v__dot-hit"
                aria-label={`${a.labelDate}: ${a.title}`}
                tabIndex={visible ? 0 : -1}
                onMouseEnter={(e) => handleEnter(i, e.currentTarget)}
                onMouseLeave={handleLeave}
                onFocus={(e) => handleEnter(i, e.currentTarget)}
                onBlur={handleLeave}
              />
            </div>

            <div className="viz-timeline-v__row-cell viz-timeline-v__row-cell--right">
              {labelOnRight && <AnchorLabel anchor={a} />}
            </div>
          </div>
        );
      })}

      {/* Tooltip — flip-positioned over the viewport */}
      <div
        ref={cardRef}
        role="tooltip"
        className={`scrolly-hover-tooltip ${open && hoveredAnchor ? 'is-open' : ''}`}
        style={
          pos
            ? {
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: pos.width,
              }
            : undefined
        }
      >
        {hoveredAnchor && (
          <>
            <p className="scrolly-hover-tooltip__date">
              {hoveredAnchor.labelDate}
            </p>
            <p className="scrolly-hover-tooltip__title">{hoveredAnchor.title}</p>
            {tooltipMap[hoveredAnchor.date] && (
              <p className="scrolly-hover-tooltip__body">
                {tooltipMap[hoveredAnchor.date]}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
