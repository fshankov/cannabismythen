import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { User } from 'lucide-react';
import type {
  GroupId,
  InformationSource,
  InformationSourcesData,
  SourceCategory,
  SourceCategoryId,
  SourceMetricId,
} from './types';

/** Per-group color tokens — must match GROUP_COLOR in VizSampleAndRanked.tsx
 *  so the User icons in both pickers (step 6 + step 7/8) read as the same
 *  visual identity for each Zielgruppe. */
const GROUP_COLOR: Record<GroupId, string> = {
  adults: 'var(--group-adults)',
  minors: 'var(--group-minors)',
  consumers: 'var(--group-consumers)',
  young_adults: 'var(--group-young_adults)',
  parents: 'var(--group-parents)',
};

interface Props {
  /** Pre-loaded info-sources data (lifted to App so the data is cached). */
  data: InformationSourcesData;
  /** 0..4. Number of metric columns currently revealed.
   *    0 → all four columns visible as empty placeholders (no dots yet)
   *    1 → Suche has dots
   *    2 → + Vertrauen + slope (Suche↔Vertrauen)
   *    3 → + Wahrnehmung + slope (Vertrauen↔Wahrnehmung)
   *    4 → + Prävention + slope (Wahrnehmung↔Prävention)
   *  Step 7 progresses 0/1 → 2; step 8 continues 3 → 4. The viz panel
   *  persists across the step transition without remounting. */
  revealedColumns: 0 | 1 | 2 | 3 | 4;
}

/** Four metric columns shown side-by-side as a parallel-coordinates strip
 *  viz. The order is fixed: Suche → Vertrauen → Wahrnehmung → Prävention. */
const COLUMNS: ReadonlyArray<SourceMetricId> = ['search', 'trust', 'perception', 'prevention'];

const SHORT_METRIC_LABEL: Record<SourceMetricId, string> = {
  search: 'Suche',
  trust: 'Vertrauen',
  perception: 'Wahrnehmung',
  prevention: 'Prävention',
};

const METRIC_UNIT_LABEL: Record<SourceMetricId, string> = {
  search: '% gesucht',
  trust: 'Vertrauen',
  perception: '% wahrgen.',
  prevention: 'Potenzial',
};

/** Five exemplary sources, ordered to span 5 different categories so the
 *  legend always shows the full source taxonomy. */
const UNIFIED_EXEMPLARY_SOURCE_IDS: ReadonlyArray<number> = [
  2,  // Apotheke / Arztpraxis      — institutionell
  1,  // Angehörige                — persönliches Umfeld
  16, // Foren                       — internet
  33, // Plakat / Flyer              — print / physisch
  43, // Kurzer Beitrag TV + Radio   — traditionelle Medien
];

const UNIFIED_HEADER = 'Apotheke · Angehörige · Foren · Plakat · Kurzbeitrag TV';

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
  yTarget: number;
}

type LaidOutDot = Dot & { x: number; y: number };

// Layout constants — four narrow strips side-by-side. Total width fits the
// right column of the scrolly without overflowing.
const STRIP_W = 130;
const STRIP_H = 320;
const STRIP_GAP = 36;
const PADDING_TOP = 38;
const PADDING_BOTTOM = 24;

export function VizSourcesStrips({ data, revealedColumns }: Props) {
  const [activeGroup, setActiveGroup] = useState<GroupId>('adults');
  const [hoverId, setHoverId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const parentSources: InformationSource[] = useMemo(() => {
    const allParents = data.sources.filter((s: InformationSource) => s.parentId === null);
    const allowSet = new Set(UNIFIED_EXEMPLARY_SOURCE_IDS);
    return allParents.filter((s: InformationSource) => allowSet.has(s.id));
  }, [data]);

  // Per-column beeswarm positions. Each column's dots cluster around its
  // x-center; y maps to the metric value (0–100 inverted so high = top).
  const positionsByColumn: LaidOutDot[][] = useMemo(() => {
    return COLUMNS.map((metric, colIdx) => {
      const m = data.metrics[metric];
      const dots: Dot[] = parentSources.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        yTarget: m?.data[activeGroup]?.[String(s.id)] ?? 0,
      }));
      return beeswarmLayout(dots, colIdx * (STRIP_W + STRIP_GAP));
    });
  }, [data, parentSources, activeGroup]);

  // Adjacent-column slope pairs. `slopeSegments[i]` connects column i to
  // column i+1 for every source.
  const slopeSegments = useMemo(() => {
    return positionsByColumn.slice(0, -1).map((leftDots, segIdx) => {
      const rightDots = positionsByColumn[segIdx + 1];
      return leftDots
        .map((a) => {
          const b = rightDots.find((p) => p.id === a.id);
          return b ? { id: a.id, a, b, category: a.category } : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    });
  }, [positionsByColumn]);

  const totalW = STRIP_W * COLUMNS.length + STRIP_GAP * (COLUMNS.length - 1);
  const totalH = STRIP_H + PADDING_TOP + PADDING_BOTTOM;

  const hoveredSource = hoverId !== null
    ? parentSources.find((s) => s.id === hoverId) ?? null
    : null;

  return (
    <div className="viz viz-strips" ref={containerRef}>
      <div className="viz-strips__header">
        <span className="viz-strips__header-label">Beispiel-Auswahl</span>
        <span className="viz-strips__header-list">{UNIFIED_HEADER}</span>
      </div>

      {/* Group picker — colored User-icon affordance shared with step 6. */}
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
            <User
              size={12}
              strokeWidth={2}
              color={GROUP_COLOR[g.id]}
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
            {g.label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        preserveAspectRatio="xMidYMid meet"
        className="viz-strips__chart"
        role="img"
        aria-label="Vier Indikatoren über fünf Informationsquellen"
      >
        {/* Strip backgrounds + Y-axis ticks for each of 4 columns. The
            placeholder (when a column hasn't been revealed yet) keeps the
            geometry but dims to a faint outline. */}
        {COLUMNS.map((metric, i) => {
          const x = i * (STRIP_W + STRIP_GAP);
          const isRevealed = i < revealedColumns;
          return (
            <g
              key={metric}
              opacity={isRevealed ? 1 : 0.45}
              style={{ transition: 'opacity 320ms ease' }}
            >
              <rect
                x={x}
                y={PADDING_TOP}
                width={STRIP_W}
                height={STRIP_H}
                fill="rgba(31, 41, 55, 0.4)"
                rx={6}
              />
              {[0, 50, 100].map((tick) => {
                const ty = PADDING_TOP + STRIP_H * (1 - tick / 100);
                return (
                  <g key={tick}>
                    <line
                      x1={x}
                      x2={x + STRIP_W}
                      y1={ty}
                      y2={ty}
                      stroke="#2d3748"
                      strokeWidth={1}
                      strokeDasharray={tick === 0 || tick === 100 ? '0' : '2 4'}
                    />
                    <text
                      x={x - 4}
                      y={ty + 3}
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
              {/* Column title */}
              <text
                x={x + STRIP_W / 2}
                y={16}
                textAnchor="middle"
                fontSize={12}
                fontFamily="Georgia, serif"
                fontWeight={600}
                fill={isRevealed ? '#e5e7eb' : '#6b7280'}
                style={{ transition: 'fill 320ms ease' }}
              >
                {SHORT_METRIC_LABEL[metric]}
              </text>
              {/* Unit subtitle */}
              <text
                x={x + STRIP_W / 2}
                y={PADDING_TOP - 6}
                textAnchor="middle"
                fontSize={9}
                fontFamily="monospace"
                fill="#6b7280"
              >
                {METRIC_UNIT_LABEL[metric]}
              </text>
            </g>
          );
        })}

        {/* Slope lines — only between consecutive REVEALED columns. */}
        <g className="viz-strips__pairs" style={{ pointerEvents: 'none' }}>
          {slopeSegments.map((segPairs, segIdx) => {
            const segVisible = segIdx + 1 < revealedColumns;
            return (
              <g
                key={`seg-${segIdx}`}
                opacity={segVisible ? 1 : 0}
                style={{ transition: 'opacity 320ms ease' }}
              >
                {segPairs.map((p) => {
                  const isHovered = hoverId === p.id;
                  const isDimmed = hoverId !== null && !isHovered;
                  return (
                    <line
                      key={`seg-${segIdx}-${p.id}`}
                      x1={p.a.x}
                      y1={p.a.y}
                      x2={p.b.x}
                      y2={p.b.y}
                      stroke={categoryColor(p.category)}
                      strokeWidth={1}
                      opacity={isHovered ? 0.95 : isDimmed ? 0.06 : 0.22}
                      style={{ transition: 'opacity 180ms ease' }}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* Dots per column — fade in when that column is revealed. */}
        {positionsByColumn.map((dots, colIdx) => {
          const isRevealed = colIdx < revealedColumns;
          return (
            <g
              key={`col-${colIdx}`}
              opacity={isRevealed ? 1 : 0}
              style={{ transition: 'opacity 320ms ease' }}
              aria-hidden={!isRevealed}
            >
              {dots.map((d) => (
                <Dot
                  key={`${colIdx}-${d.id}`}
                  d={d}
                  dim={hoverId !== null && hoverId !== d.id}
                  onHover={isRevealed ? setHoverId : noop}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Info pill — always rendered (with idle hint when nothing is
          hovered) so the legend below it doesn't reflow on hover. When a
          source is hovered, show its values for every REVEALED metric. */}
      <div
        className={`viz-strips__pill ${hoveredSource ? '' : 'viz-strips__pill--idle'}`}
        role="tooltip"
        aria-live="polite"
      >
        {hoveredSource ? (
          <>
            <strong>{hoveredSource.name}</strong>
            <span
              className="viz-strips__pill-cat"
              style={{ color: categoryColor(hoveredSource.category) }}
            >
              {hoveredSource.category.replace('_', ' ')}
            </span>
            <span className="viz-strips__pill-vals">
              {COLUMNS.slice(0, revealedColumns).map((metric, i) => {
                const v = data.metrics[metric]?.data[activeGroup]?.[String(hoveredSource.id)];
                return (
                  <span key={metric}>
                    {i > 0 && ' · '}
                    {SHORT_METRIC_LABEL[metric]}: <b>{v == null ? '–' : Math.round(v)}</b>
                  </span>
                );
              })}
            </span>
          </>
        ) : (
          <span className="viz-strips__pill-hint">
            Bewege die Maus über eine Quelle, um Details zu sehen.
          </span>
        )}
      </div>

      {/* Category legend — only the categories present in the 5 visible
          sources, so the reader never sees a chip for a category that has
          no dot on the chart. */}
      <div className="viz-strips__legend" aria-label="Quellen-Kategorien">
        {(() => {
          const visibleCats = new Set(parentSources.map((s: InformationSource) => s.category));
          return data.sourceCategories
            .filter((c: SourceCategory) => visibleCats.has(c.id))
            .map((c: SourceCategory) => (
              <span key={c.id} className="viz-strips__legend-item">
                <span
                  className="viz-strips__legend-dot"
                  style={{ background: categoryColor(c.id) }}
                  aria-hidden="true"
                />
                {c.name}
              </span>
            ));
        })()}
      </div>
    </div>
  );
}

function noop(_: number | null): void {
  // Used as a hover-handler stub for non-revealed columns so the dots
  // don't fire hover state until they're actually visible.
}

interface DotProps {
  d: LaidOutDot;
  dim: boolean;
  onHover: (id: number | null) => void;
}

function Dot({ d, dim, onHover }: DotProps) {
  // Hover feedback is opacity-only. Stroke + radius FIXED — the chart
  // cannot visibly shift on hover because no geometry changes. A
  // transparent r=11 hit-area absorbs sub-pixel mouse jitter.
  return (
    <g
      transform={`translate(${d.x}, ${d.y})`}
      style={{
        opacity: dim ? 0.28 : 1,
        cursor: 'pointer',
        transition: 'opacity 180ms ease',
      }}
      onMouseEnter={() => onHover(d.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(d.id)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      aria-label={`${d.name}: ${Math.round(d.yTarget)}`}
    >
      <circle r={11} fill="transparent" />
      <circle
        r={6}
        fill={categoryColor(d.category)}
        stroke="#0f1318"
        strokeWidth={1.5}
        pointerEvents="none"
      />
    </g>
  );
}

/** Beeswarm layout for one column. Y-axis = metric value (0–100 mapped to
 *  STRIP_H). X-axis = forced collision avoidance around the strip's
 *  centerline. Returns dots with absolute SVG coords inside the parent
 *  viewBox. */
function beeswarmLayout(dots: Dot[], xOffset: number): LaidOutDot[] {
  if (dots.length === 0) return [];
  const centerX = xOffset + STRIP_W / 2;

  type SimNode = Dot & { x: number; y: number; _targetY: number };
  const nodes: SimNode[] = dots.map((d) => {
    const targetY =
      PADDING_TOP + STRIP_H * (1 - Math.max(0, Math.min(100, d.yTarget)) / 100);
    return {
      ...d,
      x: centerX,
      y: targetY,
      _targetY: targetY,
    };
  });

  d3.forceSimulation<SimNode>(nodes)
    .force('y', d3.forceY<SimNode>((n) => n._targetY).strength(1))
    .force('x', d3.forceX<SimNode>(centerX).strength(0.25))
    .force('collide', d3.forceCollide<SimNode>(7))
    .stop()
    .tick(160);

  for (const n of nodes) {
    n.x = Math.max(xOffset + 8, Math.min(xOffset + STRIP_W - 8, n.x));
    n.y = Math.max(PADDING_TOP, Math.min(PADDING_TOP + STRIP_H, n.y));
  }

  return nodes;
}
