import { useEffect, useMemo, useRef, useState } from 'react';
import type { TimelineTooltip } from './types';
import { useFlipPosition } from '../dashboard/hooks/useFlipPosition';

interface Props {
  active: boolean;
  tooltips: ReadonlyArray<TimelineTooltip>;
}

interface Anchor {
  date: string; // ISO yyyy-mm-dd, midpoint of period
  startISO: string;
  endISO: string;
  labelDate: string; // German display
  title: string; // short German title
  subtitle?: string;
  highlight?: boolean; // pulse marker for the publication anchor
}

const ANCHORS: Anchor[] = [
  {
    date: '2024-04-01',
    startISO: '2024-04-01',
    endISO: '2024-04-01',
    labelDate: 'April 2024',
    title: 'Konsumcannabisgesetz',
    subtitle: 'Inkrafttreten KCanG',
  },
  {
    date: '2024-09-01',
    startISO: '2024-08-01',
    endISO: '2024-10-31',
    labelDate: 'Aug.–Okt. 2024',
    title: 'Erste Online-Befragung',
    subtitle: 'n = 1.041 Personen',
  },
  {
    date: '2025-01-15',
    startISO: '2025-01-01',
    endISO: '2025-02-28',
    labelDate: 'Jan.–Feb. 2025',
    title: 'Literaturanalysen',
    subtitle: 'PubMed · PsychInfo · SocIndex',
  },
  {
    date: '2025-07-15',
    startISO: '2025-07-01',
    endISO: '2025-08-31',
    labelDate: 'Juli–Aug. 2025',
    title: 'Hauptbefragung',
    subtitle: 'n = 2.795 Personen',
  },
  {
    date: '2025-11-15',
    startISO: '2025-11-01',
    endISO: '2025-11-30',
    labelDate: 'November 2025',
    title: 'Expert:innen-Diskussion',
  },
  {
    date: '2026-09-01',
    startISO: '2026-09-01',
    endISO: '2026-09-30',
    labelDate: 'September 2026',
    title: 'Veröffentlichung',
    subtitle: 'Diese Website',
    highlight: true,
  },
];

const T_START = new Date('2024-04-01').getTime();
const T_END = new Date('2026-10-01').getTime();

function pct(d: string): number {
  const t = new Date(d).getTime();
  return ((t - T_START) / (T_END - T_START)) * 100;
}

const YEAR_TICKS: { date: string; label: string }[] = [
  { date: '2024-04-01', label: '2024' },
  { date: '2025-01-01', label: '2025' },
  { date: '2026-01-01', label: '2026' },
];

/**
 * VizTimeline — Step 1 vertical timeline.
 *
 * Iter-10 rewrite: switched from a horizontal 800×320 SVG with alternating
 * above/below labels to a vertical CSS-grid + absolutely-positioned-HTML
 * layout. The track is a 2px vertical line down the left column; anchor
 * dots sit on the track and HTML label rows sit beside them in the right
 * column at the same vertical position. This gains:
 *   - Larger, fluid-wrapping anchor titles (no SVG <text> sizing pain).
 *   - One canonical text scale via `--viz-text-primary` / `--viz-text-secondary`.
 *   - A tooltip with viewport-edge clamping via `useFlipPosition`.
 *
 * The drawn-line entry animation is preserved: a vertical foreground bar
 * grows from 0 to 100% height over ~1.4s with easeOutCubic; anchor dots
 * fade in as the bar passes their date.
 */
export function VizTimeline({ active, tooltips }: Props) {
  const [drawn, setDrawn] = useState(0); // 0..1, line draw progress
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const tooltipMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of tooltips) m[t.anchorDate] = t.body;
    return m;
  }, [tooltips]);

  // Tooltip positioning — anchor follows the hovered dot's bounding box,
  // flipped above/below + clamped to viewport edges by the shared hook.
  const { triggerRef, cardRef, pos, open, setOpen, updatePosition } =
    useFlipPosition<HTMLButtonElement, HTMLDivElement>({
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
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
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
    // Point the shared triggerRef at the freshly-hovered hit zone.
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
      <div className="viz-timeline-v__grid">
        {/* Left column: vertical track with year ticks + anchor dots */}
        <div className="viz-timeline-v__track-col" aria-hidden="true">
          <div className="viz-timeline-v__track-bg" />
          <div
            className="viz-timeline-v__track-fg"
            style={{ height: `${(drawn * 100).toFixed(2)}%` }}
          />
          {/* Period bars — vertical highlight for date ranges */}
          {ANCHORS.map((a, i) => {
            if (a.startISO === a.endISO) return null;
            const ys = pct(a.startISO);
            const ye = pct(a.endISO);
            return (
              <div
                key={`bar-${i}`}
                className="viz-timeline-v__period-bar"
                style={{
                  top: `${ys.toFixed(2)}%`,
                  height: `${(ye - ys).toFixed(2)}%`,
                }}
              />
            );
          })}
          {/* Year ticks */}
          {YEAR_TICKS.map((y) => (
            <div
              key={y.label}
              className="viz-timeline-v__year-tick"
              style={{ top: `${pct(y.date).toFixed(2)}%` }}
            />
          ))}
          {/* Anchor dots */}
          {ANCHORS.map((a, i) => {
            const visible = drawn >= pct(a.date) / 100;
            const isHovered = hoveredIdx === i;
            return (
              <div
                key={`dot-${i}`}
                className={[
                  'viz-timeline-v__dot-wrap',
                  a.highlight ? 'viz-timeline-v__dot-wrap--highlight' : '',
                  isHovered ? 'viz-timeline-v__dot-wrap--hovered' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  top: `${pct(a.date).toFixed(2)}%`,
                  opacity: visible ? 1 : 0,
                }}
              >
                {a.highlight && <span className="viz-timeline-v__dot-pulse" />}
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
            );
          })}
        </div>

        {/* Right column: HTML labels + year markers */}
        <div className="viz-timeline-v__labels-col">
          {YEAR_TICKS.map((y) => (
            <div
              key={y.label}
              className="viz-timeline-v__year-label"
              style={{ top: `${pct(y.date).toFixed(2)}%` }}
              aria-hidden="true"
            >
              {y.label}
            </div>
          ))}
          {ANCHORS.map((a, i) => {
            const visible = drawn >= pct(a.date) / 100;
            return (
              <div
                key={`label-${i}`}
                className={[
                  'viz-timeline-v__label',
                  a.highlight ? 'viz-timeline-v__label--highlight' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  top: `${pct(a.date).toFixed(2)}%`,
                  opacity: visible ? 1 : 0,
                  transform: visible
                    ? 'translateY(-50%) translateX(0)'
                    : 'translateY(-50%) translateX(8px)',
                }}
              >
                <div className="viz-timeline-v__label-date">{a.labelDate}</div>
                <div className="viz-timeline-v__label-title">{a.title}</div>
                {a.subtitle && (
                  <div className="viz-timeline-v__label-subtitle">
                    {a.subtitle}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
