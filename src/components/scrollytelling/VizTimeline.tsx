import { useEffect, useMemo, useRef, useState } from 'react';
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

  const tooltipMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of tooltips) m[t.anchorDate] = t.body;
    return m;
  }, [tooltips]);

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

  return (
    <div
      className="viz viz-timeline-v"
      role="img"
      aria-label="Zeitlicher Ablauf der CaRM-Studie"
    >
      {/* Continuous line behind the rows */}
      <div className="viz-timeline-v__line-bg" aria-hidden="true" />
      <div
        className="viz-timeline-v__line-fg"
        style={{ height: `${(drawn * 100).toFixed(2)}%` }}
        aria-hidden="true"
      />
      {drawn > 0.01 && drawn < 1 && (
        <div
          className="viz-timeline-v__locator"
          style={{ top: `${(drawn * 100).toFixed(2)}%` }}
          aria-hidden="true"
        />
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
              <span className="viz-timeline-v__dot" />
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
