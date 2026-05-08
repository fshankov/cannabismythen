import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type {
  GroupId,
  InformationSource,
  InformationSourcesData,
  SourceCategoryId,
  SourceMetricId,
  SourcesPair,
} from '../data/types';

interface Props {
  /** Step 7a or 7b — which metric pair to show. */
  pair: SourcesPair;
}

const PAIR_METRICS: Record<SourcesPair, [SourceMetricId, SourceMetricId]> = {
  'search-trust': ['search', 'trust'],
  'perception-prevention': ['perception', 'prevention'],
};

const GROUP_OPTIONS: { id: GroupId; label: string }[] = [
  { id: 'adults', label: 'Volljährige' },
  { id: 'minors', label: 'Minderjährige' },
  { id: 'consumers', label: 'Konsumierende' },
  { id: 'young_adults', label: 'Junge Erwachsene' },
  { id: 'parents', label: 'Eltern' },
];

function categoryColor(cat: SourceCategoryId | string): string {
  return `var(--source-cat-${cat})`;
}

interface Dot {
  id: number;
  name: string;
  category: SourceCategoryId | string;
  // Per-strip layout (filled by simulation)
  x?: number;
  y?: number;
  yTarget: number;       // metric value for current group + metric
  initialFx?: number;
}

const STRIP_W = 280;
const STRIP_H = 360;
const STRIP_GAP = 80;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 36;

export function VizSourcesStrips({ pair }: Props) {
  const [data, setData] = useState<InformationSourcesData | null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupId>('adults');
  const [hoverId, setHoverId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Data load (lazy import to avoid coupling carmData)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/info-sources.json');
      const json = (await res.json()) as InformationSourcesData;
      if (!cancelled) setData(json);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [metricA, metricB] = PAIR_METRICS[pair];

  // Parents only — children are surfaced via hover/title (cleaner viz)
  const parentSources: InformationSource[] = useMemo(
    () => (data ? data.sources.filter((s) => s.parentId === null) : []),
    [data],
  );

  // Build dot lists per strip — values come from data.metrics[metric].data[group][sourceId]
  const dotsA: Dot[] = useMemo(() => {
    if (!data) return [];
    const m = data.metrics[metricA];
    return parentSources.map<Dot>((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      yTarget: m.data[activeGroup]?.[String(s.id)] ?? 0,
    }));
  }, [data, metricA, activeGroup, parentSources]);

  const dotsB: Dot[] = useMemo(() => {
    if (!data) return [];
    const m = data.metrics[metricB];
    return parentSources.map<Dot>((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      yTarget: m.data[activeGroup]?.[String(s.id)] ?? 0,
    }));
  }, [data, metricB, activeGroup, parentSources]);

  // Beeswarm layout: y = scale(value); x = collision-avoided around centerline
  const positionsA = useMemo(() => beeswarmLayout(dotsA, 0), [dotsA]);
  const positionsB = useMemo(() => beeswarmLayout(dotsB, STRIP_W + STRIP_GAP), [dotsB]);

  if (!data) {
    return <div className="viz viz-strips viz-strips--loading">Lade Quellen-Daten …</div>;
  }

  const totalW = STRIP_W * 2 + STRIP_GAP;
  const totalH = STRIP_H + PADDING_TOP + PADDING_BOTTOM;
  const labelA = data.metrics[metricA].label;
  const labelB = data.metrics[metricB].label;
  const unitA = data.metrics[metricA].unit;
  const unitB = data.metrics[metricB].unit;

  const allPositions = [...positionsA, ...positionsB];
  const hovered = hoverId !== null ? allPositions.filter((p) => p.id === hoverId) : [];

  return (
    <div className="viz viz-strips" ref={containerRef}>
      {/* Group picker */}
      <div className="viz-strips__picker" role="tablist" aria-label="Zielgruppe">
        {GROUP_OPTIONS.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={activeGroup === g.id}
            className={`viz-strips__pick ${activeGroup === g.id ? 'viz-strips__pick--active' : ''}`}
            onClick={() => setActiveGroup(g.id)}
            type="button"
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Strips chart */}
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        preserveAspectRatio="xMidYMid meet"
        className="viz-strips__chart"
        role="img"
        aria-label={`Beeswarm-Streifen: ${labelA} und ${labelB} pro Quelle`}
      >
        {/* Strip backgrounds + Y-axis ticks */}
        {[
          { x: 0, label: labelA, unit: unitA },
          { x: STRIP_W + STRIP_GAP, label: labelB, unit: unitB },
        ].map((s) => (
          <g key={s.label}>
            <rect
              x={s.x}
              y={PADDING_TOP}
              width={STRIP_W}
              height={STRIP_H}
              fill="rgba(31, 41, 55, 0.4)"
              rx={6}
            />
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = PADDING_TOP + STRIP_H * (1 - tick / 100);
              return (
                <g key={tick}>
                  <line
                    x1={s.x}
                    x2={s.x + STRIP_W}
                    y1={y}
                    y2={y}
                    stroke="#2d3748"
                    strokeWidth={1}
                    strokeDasharray={tick === 0 || tick === 100 ? '0' : '2 4'}
                  />
                  <text
                    x={s.x - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={9}
                    fontFamily="monospace"
                    fill="#6b7280"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}
            {/* Strip title */}
            <text
              x={s.x + STRIP_W / 2}
              y={14}
              textAnchor="middle"
              fontSize={12}
              fontFamily="Georgia, serif"
              fontWeight={600}
              fill="#e5e7eb"
            >
              {s.label}
            </text>
            <text
              x={s.x + STRIP_W / 2}
              y={totalH - 14}
              textAnchor="middle"
              fontSize={10}
              fontFamily="monospace"
              fill="#6b7280"
            >
              {s.unit}
            </text>
          </g>
        ))}

        {/* Connector polyline for hovered source (across both strips) */}
        {hovered.length === 2 && (
          <line
            x1={hovered[0].x}
            y1={hovered[0].y}
            x2={hovered[1].x}
            y2={hovered[1].y}
            stroke="#facc15"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.75}
          />
        )}

        {/* Dots — strip A */}
        {positionsA.map((d) => (
          <Dot
            key={`a-${d.id}`}
            d={d}
            highlight={hoverId === d.id}
            dim={hoverId !== null && hoverId !== d.id}
            onHover={setHoverId}
          />
        ))}
        {/* Dots — strip B */}
        {positionsB.map((d) => (
          <Dot
            key={`b-${d.id}`}
            d={d}
            highlight={hoverId === d.id}
            dim={hoverId !== null && hoverId !== d.id}
            onHover={setHoverId}
          />
        ))}
      </svg>

      {/* Hover info pill */}
      {hoverId !== null && hovered.length === 2 && (
        <div className="viz-strips__pill" role="tooltip">
          <strong>{hovered[0].name}</strong>
          <span className="viz-strips__pill-cat" style={{ color: categoryColor(hovered[0].category) }}>
            {hovered[0].category.replace('_', ' ')}
          </span>
          <span className="viz-strips__pill-vals">
            {labelA}: <b>{Math.round(hovered[0].yTarget)} {unitA}</b>
            {' · '}
            {labelB}: <b>{Math.round(hovered[1].yTarget)} {unitB}</b>
          </span>
        </div>
      )}

      {/* Category legend */}
      <div className="viz-strips__legend" aria-label="Quellen-Kategorien">
        {data.sourceCategories.map((c) => (
          <span key={c.id} className="viz-strips__legend-item">
            <span
              className="viz-strips__legend-dot"
              style={{ background: categoryColor(c.id) }}
              aria-hidden="true"
            />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DotProps {
  d: Dot & { x: number; y: number };
  highlight: boolean;
  dim: boolean;
  onHover: (id: number | null) => void;
}

function Dot({ d, highlight, dim, onHover }: DotProps) {
  return (
    <g
      transform={`translate(${d.x}, ${d.y})`}
      style={{
        transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: dim ? 0.35 : 1,
        cursor: 'pointer',
      }}
      onMouseEnter={() => onHover(d.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(d.id)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      aria-label={`${d.name}: ${Math.round(d.yTarget)}`}
    >
      <circle
        r={highlight ? 8 : 6}
        fill={categoryColor(d.category)}
        stroke="#0f1318"
        strokeWidth={1.5}
        style={{ transition: 'r 200ms ease' }}
      />
      {highlight && (
        <text
          y={-12}
          textAnchor="middle"
          fontSize={10}
          fontFamily="Georgia, serif"
          fill="#e5e7eb"
          style={{ pointerEvents: 'none' }}
        >
          {d.name}
        </text>
      )}
    </g>
  );
}

/**
 * Beeswarm layout. Y-axis = metric value (0–100 mapped to STRIP_H).
 * X-axis = forced collision avoidance around the strip's centerline.
 * Returns dots with absolute SVG coords.
 */
function beeswarmLayout(
  dots: Dot[],
  xOffset: number,
): (Dot & { x: number; y: number })[] {
  if (dots.length === 0) return [];
  const centerX = xOffset + STRIP_W / 2;

  const nodes = dots.map((d) => ({
    ...d,
    y: PADDING_TOP + STRIP_H * (1 - Math.max(0, Math.min(100, d.yTarget)) / 100),
  })) as (Dot & { x: number; y: number })[];

  d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
    .force(
      'y',
      d3.forceY<{ x: number; y: number }>((n) => n.y).strength(1),
    )
    .force(
      'x',
      d3.forceX<{ x: number; y: number }>(centerX).strength(0.18),
    )
    .force('collide', d3.forceCollide(7))
    .stop()
    .tick(140);

  // Clamp x within strip bounds
  for (const n of nodes) {
    n.x = Math.max(xOffset + 8, Math.min(xOffset + STRIP_W - 8, n.x));
  }

  return nodes;
}
