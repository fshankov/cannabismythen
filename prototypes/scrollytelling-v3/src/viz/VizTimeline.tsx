import { useEffect, useRef, useState } from 'react';

interface Props { active: boolean; }

interface Anchor {
  date: string;        // ISO yyyy-mm-dd, midpoint of period
  startISO: string;
  endISO: string;
  labelDate: string;   // German display
  title: string;       // short German title
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

const VIEW_W = 800;
const VIEW_H = 320;
const PAD_X = 40;
const TRACK_W = VIEW_W - PAD_X * 2;

function pct(d: string): number {
  const t = new Date(d).getTime();
  return ((t - T_START) / (T_END - T_START)) * 100;
}

export function VizTimeline({ active }: Props) {
  const [drawn, setDrawn] = useState(0); // 0..1, line draw progress
  const rafRef = useRef<number | null>(null);

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
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDrawn(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <div className="viz viz-timeline" role="img" aria-label="Zeitlicher Ablauf der CaRM-Studie">
      <div className="viz-timeline__chart">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {/* Year ticks */}
          {[2024, 2025, 2026].map((year) => {
            const x = PAD_X + (pct(`${year}-01-01`) / 100) * TRACK_W;
            return (
              <g key={year}>
                <line
                  x1={x}
                  x2={x}
                  y1={140}
                  y2={150}
                  stroke="#3a4452"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={170}
                  fill="#6b7280"
                  fontSize={11}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {year}
                </text>
              </g>
            );
          })}

          {/* Track line */}
          <line
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={140}
            y2={140}
            stroke="#2d3748"
            strokeWidth={2}
          />

          {/* Drawn line */}
          <line
            x1={PAD_X}
            x2={PAD_X + TRACK_W * drawn}
            y1={140}
            y2={140}
            stroke="#047857"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Period bars (where applicable) */}
          {ANCHORS.map((a, i) => {
            const x1 = PAD_X + (pct(a.startISO) / 100) * TRACK_W;
            const x2 = PAD_X + (pct(a.endISO) / 100) * TRACK_W;
            if (x2 - x1 < 6) return null;
            const visible = pct(a.startISO) / 100 <= drawn + 0.02;
            return (
              <rect
                key={`p${i}`}
                x={x1}
                y={134}
                width={Math.max(2, x2 - x1)}
                height={12}
                rx={3}
                fill="#047857"
                opacity={visible ? 0.35 : 0}
                style={{ transition: 'opacity 400ms ease' }}
              />
            );
          })}

          {/* Anchor dots + labels */}
          {ANCHORS.map((a, i) => {
            const x = PAD_X + (pct(a.date) / 100) * TRACK_W;
            const above = i % 2 === 0;
            const labelY = above ? 86 : 198;
            const subY = above ? 70 : 218;
            const visible = pct(a.date) / 100 <= drawn + 0.05;
            // Use start/end anchors at the extremes so labels stay inside the box
            const isFirst = i === 0;
            const isLast = i === ANCHORS.length - 1;
            const textAnchor: 'start' | 'middle' | 'end' = isFirst
              ? 'start'
              : isLast
                ? 'end'
                : 'middle';
            return (
              <g
                key={a.date}
                style={{
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 500ms ease',
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                {/* Connector */}
                <line
                  x1={x}
                  x2={x}
                  y1={140}
                  y2={above ? 100 : 180}
                  stroke={a.highlight ? '#facc15' : '#4d7c0f'}
                  strokeWidth={1}
                  strokeDasharray={a.highlight ? '0' : '2 2'}
                />
                {/* Dot */}
                <circle
                  cx={x}
                  cy={140}
                  r={a.highlight ? 8 : 5}
                  fill={a.highlight ? '#facc15' : '#10b981'}
                  stroke="#0f1318"
                  strokeWidth={2}
                />
                {a.highlight && (
                  <circle
                    cx={x}
                    cy={140}
                    r={14}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth={1}
                    opacity={0.6}
                    style={{
                      animation: 'viz-timeline-pulse 2s ease-in-out infinite',
                      transformOrigin: `${x}px 140px`,
                    }}
                  />
                )}
                {/* Title */}
                <text
                  x={x}
                  y={labelY}
                  fill="#e5e7eb"
                  fontSize={13}
                  fontFamily="Georgia, serif"
                  fontWeight={600}
                  textAnchor={textAnchor}
                >
                  {a.title}
                </text>
                {/* Subtitle */}
                {a.subtitle && (
                  <text
                    x={x}
                    y={subY}
                    fill="#9ca3af"
                    fontSize={10}
                    fontFamily="monospace"
                    textAnchor={textAnchor}
                  >
                    {a.subtitle}
                  </text>
                )}
                {/* Date */}
                <text
                  x={x}
                  y={above ? labelY - 28 : subY + 14}
                  fill={a.highlight ? '#facc15' : '#6b7280'}
                  fontSize={10}
                  fontFamily="monospace"
                  textAnchor={textAnchor}
                  fontWeight={a.highlight ? 600 : 400}
                >
                  {a.labelDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="viz-timeline__caption">
        <span>★ Projektzeitraum CaRM-Studie · April 2024 bis September 2026</span>
      </div>
    </div>
  );
}
