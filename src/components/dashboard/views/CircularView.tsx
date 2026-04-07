import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Myth, Metric, AppState, Group, Indicator } from '../../../lib/dashboard/types';
import { getMythMetric, getMythShortText } from '../../../lib/dashboard/data';

/* ── Indicator config ──────────────────────────────────────────── */

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
];

const INDICATOR_COLORS: Record<Indicator, string> = {
  awareness: '#3B82F6',             // Blue-500
  significance: '#2d6a4f',          // Forest Green (site accent)
  correctness: '#D97706',           // Amber-600
  prevention_significance: '#8B5CF6', // Violet-500
};

const INDICATOR_LABELS: Record<Indicator, { de: string; en: string }> = {
  awareness:                { de: 'Kenntnis',    en: 'Awareness' },
  significance:             { de: 'Bedeutung',   en: 'Significance' },
  correctness:              { de: 'Richtigkeit', en: 'Correctness' },
  prevention_significance:  { de: 'Prävention',  en: 'Prevention' },
};

/* ── 8-category mapping (user-specified order) ─────────────────── */

const CIRCULAR_CATEGORIES = [
  {
    name_de: 'Medizinischer Nutzen',
    name_en: 'Medical Benefits',
    color: '#D97706',
    mythIds: [10, 12, 13, 18, 25, 26, 27, 17, 1],
  },
  {
    name_de: 'Körper & Entwicklung',
    name_en: 'Body & Development',
    color: '#DC2626',
    mythIds: [3, 8, 14, 15, 16, 11],
  },
  {
    name_de: 'Psychische Gesundheit',
    name_en: 'Mental Health',
    color: '#2563EB',
    mythIds: [24, 20, 28, 30, 23, 22],
  },
  {
    name_de: 'Stimmung & Wahrnehmung',
    name_en: 'Mood & Perception',
    color: '#9333EA',
    mythIds: [31, 29, 33, 19, 32],
  },
  {
    name_de: 'Soziale Auswirkungen',
    name_en: 'Social Impact',
    color: '#0891B2',
    mythIds: [21, 34, 36, 37, 35, 38],
  },
  {
    name_de: 'Dosierung & Qualität',
    name_en: 'Dosing & Quality',
    color: '#6B7280',
    mythIds: [5, 6, 7],
  },
  {
    name_de: 'Verbreitung & Gesetzgebung',
    name_en: 'Prevalence & Legislation',
    color: '#4F46E5',
    mythIds: [39, 40, 41, 42],
  },
  {
    name_de: 'Allgemeine Gefährlichkeit',
    name_en: 'General Risk Assessment',
    color: '#be123c',
    mythIds: [4, 2, 9],
  },
];

/* ── Types ─────────────────────────────────────────────────────── */

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  groups: Group[];
  onSelectMyth: (id: number) => void;
}

interface MythDatum {
  myth: Myth;
  categoryIdx: number;
  values: Record<Indicator, number>;
  rawValues: Record<Indicator, number | null>;
  total: number;
}

/* ── Component ─────────────────────────────────────────────────── */

export default function CircularView({
  myths,
  metrics,
  state,
  groups,
  onSelectMyth,
}: Props) {
  const selectedGroup = state.groupIds[0] || 'adults';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);

  /* Responsive width */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const size = Math.min(containerWidth, 820);

  /* Layout constants */
  const LABEL_MARGIN = size > 600 ? 115 : 85;
  const innerRadius = size * 0.12;
  const outerRadius = size / 2 - LABEL_MARGIN;
  const CATEGORY_GAP = 0.07; // radians between categories
  const BAR_PAD = 0.22;      // fraction of bar slot used as padding

  /* ── Build ordered myth data ──────────────────────────────────── */
  const data = useMemo((): MythDatum[] => {
    const mythMap = new Map(myths.map((m) => [m.id, m]));
    const items: MythDatum[] = [];

    for (let ci = 0; ci < CIRCULAR_CATEGORIES.length; ci++) {
      for (const mythId of CIRCULAR_CATEGORIES[ci].mythIds) {
        const myth = mythMap.get(mythId);
        if (!myth) continue;
        const metric = getMythMetric(metrics, mythId, selectedGroup);
        const rawValues: Record<Indicator, number | null> = {
          awareness: metric?.awareness ?? null,
          significance: metric?.significance ?? null,
          correctness: metric?.correctness ?? null,
          prevention_significance: metric?.prevention_significance ?? null,
        };
        const values: Record<Indicator, number> = {
          awareness: rawValues.awareness ?? 0,
          significance: rawValues.significance ?? 0,
          correctness: rawValues.correctness ?? 0,
          prevention_significance: rawValues.prevention_significance ?? 0,
        };
        items.push({
          myth,
          categoryIdx: ci,
          values,
          rawValues,
          total:
            values.awareness +
            values.significance +
            values.correctness +
            values.prevention_significance,
        });
      }
    }
    return items;
  }, [myths, metrics, selectedGroup]);

  /* ── Geometry: arcs + category arcs ────────────────────────── */
  const { barArcs, catArcs } = useMemo(() => {
    if (!data.length) return { barArcs: [] as BarArc[], catArcs: [] as CatArc[] };

    const numCats = new Set(data.map((d) => d.categoryIdx)).size;
    const totalGap = CATEGORY_GAP * numCats;
    const available = 2 * Math.PI - totalGap;
    const barSlot = available / data.length;
    const barWidth = barSlot * (1 - BAR_PAD);

    const maxTotal = d3.max(data, (d) => d.total) || 1;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxTotal])
      .range([innerRadius, outerRadius]);

    let angle = 0;
    let prevCat = -1;
    const catStarts: number[] = [];
    const catEnds: number[] = [];

    const barArcs: BarArc[] = data.map((d, _i) => {
      if (d.categoryIdx !== prevCat) {
        if (prevCat >= 0) {
          catEnds.push(angle);
          angle += CATEGORY_GAP;
        }
        prevCat = d.categoryIdx;
        catStarts.push(angle);
      }

      const startAngle = angle;
      const endAngle = angle + barWidth;
      const midAngle = (startAngle + endAngle) / 2;

      let cum = 0;
      const segments: Array<{ indicator: Indicator; path: string }> = [];
      for (const ind of INDICATORS) {
        const val = d.values[ind];
        if (val <= 0) continue;
        const r0 = yScale(cum);
        const r1 = yScale(cum + val);
        cum += val;
        const path = d3.arc()({
          innerRadius: r0,
          outerRadius: r1,
          startAngle,
          endAngle,
        });
        if (path) segments.push({ indicator: ind, path });
      }

      angle += barSlot;

      return {
        segments,
        midAngle,
        labelRadius: yScale(cum) + 6,
      };
    });

    // close last category
    catEnds.push(angle - barSlot * BAR_PAD);

    const catArcs: CatArc[] = [];
    const seenCats = Array.from(new Set(data.map((d) => d.categoryIdx)));
    seenCats.forEach((ci, i) => {
      if (i >= catStarts.length) return;
      const cat = CIRCULAR_CATEGORIES[ci];
      catArcs.push({
        name_de: cat.name_de,
        name_en: cat.name_en,
        color: cat.color,
        startAngle: catStarts[i],
        endAngle: catEnds[i],
        midAngle: (catStarts[i] + catEnds[i]) / 2,
      });
    });

    return { barArcs, catArcs };
  }, [data, innerRadius, outerRadius, size]);

  /* ── Tooltip tracking ──────────────────────────────────────── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: e.clientX - rect.left + 16,
      y: e.clientY - rect.top - 10,
    });
  }, []);

  const hoveredData = hoveredIdx !== null ? data[hoveredIdx] : null;
  const groupLabel =
    groups.find((g) => g.id === selectedGroup)?.name_de ?? selectedGroup;

  const lang = state.lang || 'de';

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div
      className="circular-view"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative' }}
    >
      <svg
        width={size}
        height={size}
        style={{ display: 'block', margin: '0 auto' }}
      >
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* Category ring (inner colored arcs) */}
          {catArcs.map((cat, i) => (
            <path
              key={`cat-${i}`}
              d={
                d3.arc()({
                  innerRadius: innerRadius - 10,
                  outerRadius: innerRadius - 3,
                  startAngle: cat.startAngle,
                  endAngle: cat.endAngle,
                }) || ''
              }
              fill={cat.color}
              opacity={0.55}
            />
          ))}

          {/* Category name arcs (textPath) */}
          <defs>
            {catArcs.map((cat, i) => {
              const r = innerRadius - 18;
              const mid = cat.midAngle;
              const spread = 0.3;
              const a1 = mid - spread;
              const a2 = mid + spread;
              const x1 = r * Math.sin(a1);
              const y1 = -r * Math.cos(a1);
              const x2 = r * Math.sin(a2);
              const y2 = -r * Math.cos(a2);
              return (
                <path
                  key={`catpath-${i}`}
                  id={`catpath-${i}`}
                  d={`M ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2}`}
                  fill="none"
                />
              );
            })}
          </defs>
          {catArcs.map((cat, i) => (
            <text
              key={`cattxt-${i}`}
              fontSize={size > 600 ? 8 : 6.5}
              fill={cat.color}
              fontWeight={600}
              fontFamily="'Inter Variable', Inter, sans-serif"
            >
              <textPath
                href={`#catpath-${i}`}
                startOffset="50%"
                textAnchor="middle"
              >
                {lang === 'de' ? cat.name_de : cat.name_en}
              </textPath>
            </text>
          ))}

          {/* Stacked bars */}
          {barArcs.map((bar, i) => (
            <g
              key={`bar-${i}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectMyth(data[i].myth.id)}
              opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.3}
            >
              {bar.segments.map((seg, si) => (
                <path
                  key={si}
                  d={seg.path}
                  fill={INDICATOR_COLORS[seg.indicator]}
                  fillOpacity={hoveredIdx === i ? 1 : 0.82}
                  stroke="white"
                  strokeWidth={0.5}
                />
              ))}
            </g>
          ))}

          {/* Myth labels (outer ring) */}
          {barArcs.map((bar, i) => {
            const angle = bar.midAngle;
            const rotation = (angle * 180) / Math.PI - 90;
            const flip =
              (angle + Math.PI) % (2 * Math.PI) < Math.PI;
            const rawText = getMythShortText(data[i].myth, lang);
            const maxLen = size > 600 ? 22 : 15;
            const label =
              rawText.length > maxLen
                ? rawText.substring(0, maxLen - 2) + '…'
                : rawText;

            return (
              <g
                key={`lbl-${i}`}
                transform={`rotate(${rotation}) translate(${bar.labelRadius}, 0)`}
                style={{ pointerEvents: 'none' }}
              >
                <text
                  textAnchor={flip ? 'end' : 'start'}
                  dominantBaseline="central"
                  fontSize={size > 600 ? 9.5 : 7}
                  fill={hoveredIdx === i ? '#1e293b' : '#4a5568'}
                  fontWeight={hoveredIdx === i ? 700 : 400}
                  fontFamily="'Inter Variable', Inter, sans-serif"
                  transform={flip ? 'rotate(180)' : ''}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Center legend */}
          <g>
            <text
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="#1e293b"
              y={-40}
              fontFamily="'Inter Variable', Inter, sans-serif"
            >
              {lang === 'de' ? 'Indikatoren' : 'Indicators'}
            </text>
            {INDICATORS.map((ind, i) => {
              const y = -20 + i * 19;
              return (
                <g key={ind} transform={`translate(-42, ${y})`}>
                  <rect
                    width={11}
                    height={11}
                    fill={INDICATOR_COLORS[ind]}
                    rx={2}
                  />
                  <text
                    x={16}
                    y={9.5}
                    fontSize={10.5}
                    fill="#4a5568"
                    fontFamily="'Inter Variable', Inter, sans-serif"
                  >
                    {INDICATOR_LABELS[ind][lang]}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredData && (
        <div
          className="circular-tooltip"
          style={{
            left: Math.min(tooltipPos.x, containerWidth - 240),
            top: tooltipPos.y,
          }}
        >
          <div className="circular-tooltip-title">
            {hoveredData.myth.text_de}
          </div>
          <div className="circular-tooltip-group">{groupLabel}</div>
          {INDICATORS.map((ind) => {
            const raw = hoveredData.rawValues[ind];
            const label = INDICATOR_LABELS[ind][lang];
            const val =
              raw === null
                ? 'k. A.'
                : ind === 'awareness'
                  ? `${raw.toFixed(1)}%`
                  : raw.toFixed(1);
            return (
              <div key={ind} className="circular-tooltip-row">
                <span
                  className="circular-tooltip-dot"
                  style={{ background: INDICATOR_COLORS[ind] }}
                />
                <span className="circular-tooltip-label">{label}</span>
                <span className="circular-tooltip-value">{val}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Local helper types ──────────────────────────────────────── */

interface BarArc {
  segments: Array<{ indicator: Indicator; path: string }>;
  midAngle: number;
  labelRadius: number;
}

interface CatArc {
  name_de: string;
  name_en: string;
  color: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}
