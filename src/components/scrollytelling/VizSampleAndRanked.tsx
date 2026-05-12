import { useState } from 'react';
import { User } from 'lucide-react';
import type {
  CarmData,
  GroupId,
  IndicatorPhase,
  SampleRankedMode,
} from './types';
import {
  ACTIVE_GROUPS,
  GROUP_LABEL_DE,
  getMetric,
} from './dataLoaders';

interface Props {
  data: CarmData;
  mode: SampleRankedMode;
}

const SAMPLE_GROUPS = [
  { id: 'adults', label: 'Erwachsene 18–70', n: 2097, iconCount: 210, color: 'var(--group-adults)' },
  { id: 'minors', label: 'Minderjährige 16–17', n: 555, iconCount: 56, color: 'var(--group-minors)' },
  { id: 'clubs', label: 'Anbauvereinigungs-Mitglieder', n: 143, iconCount: 14, color: 'var(--group-consumers)' },
] as const;

type IndicatorKey =
  | 'awareness'
  | 'significance'
  | 'correctness'
  | 'prevention_significance'
  | 'population_relevance';

interface IndicatorMeta {
  name: string;
  unit: string;
  desc: string;
  /** One-sentence definition rendered inside the strip header so each
   *  indicator is self-explanatory as it reveals. */
  mini: string;
  key: IndicatorKey;
  phase: IndicatorPhase | null;
}

const INDICATORS: readonly IndicatorMeta[] = [
  { name: 'Kenntnis',             unit: 'Anteil %',      desc: 'Wer hat die Aussage überhaupt schon gehört?',                                   mini: 'Wer hat die Aussage überhaupt schon gehört?',                                   key: 'awareness',               phase: 'awareness' },
  { name: 'Bedeutung',            unit: 'Punkte',        desc: 'Wie stark prägt die Aussage den eigenen Umgang mit Cannabis?',                  mini: 'Wie stark prägt die Aussage den eigenen Umgang?',                               key: 'significance',            phase: 'significance' },
  { name: 'Richtigkeit',          unit: 'Punkte 0–100',  desc: 'Wie nahe liegt die Einschätzung an der wissenschaftlichen Klassifikation?',     mini: 'Wie nahe liegt die Einschätzung an der Wissenschaft?',                          key: 'correctness',             phase: 'correctness' },
  { name: 'Präventionsbedeutung', unit: 'Punkte',        desc: 'Bedeutung × Wissenslücke — wo Aufklärung am meisten Wirkung zeigt.',            mini: 'Bedeutung × Wissenslücke — wo Aufklärung wirkt.',                               key: 'prevention_significance', phase: 'prevention_significance' },
  { name: 'Bevölkerungsrisiko',   unit: 'Punkte',        desc: 'Präventionsbedeutung × Kenntnisanteil — nur für Voll- und Minderjährige.',      mini: 'Präventionsbedeutung × Bekanntheit — nur Voll- + Minderjährige.',               key: 'population_relevance',    phase: 'population_relevance' },
];

/** Lucide arrow path data (24 × 24 viewBox), inlined so we can render the
 *  arrows inside the parent SVG with a guaranteed paint order (lines below,
 *  arrows above). foreignObject + Lucide-React paints in a separate layer
 *  and can render *under* sibling SVG content in some browsers. */
const ARROW_PATHS: Record<string, string> = {
  richtig:           'M12 19V5 M5 12l7-7 7 7',
  eher_richtig:      'M7 17 17 7 M7 7h10v10',
  eher_falsch:       'M17 7 7 17 M17 17H7V7',
  falsch:            'M12 5v14 M19 12l-7 7-7-7',
  no_classification: 'M5 12h14',
};

const ARROW_SIZE = 14;            // visible arrow width/height (px)
const ARROW_HIT_PAD = 6;          // transparent hit-area extension beyond the arrow rect
const ARROW_JITTER_MIN_GAP = 20;  // minimum horizontal distance between two arrows on the same strip — wider than ARROW_SIZE so no two arrows ever touch

/** Five exemplary myths shown across step 6's parallel-coordinates viz:
 *  three with the highest Präventionsbedeutung (most-needing-prevention),
 *  one mid-rank, one lowest. Picked once from adults metrics; if data
 *  changes, regenerate via the analysis script under scripts/ (or eyeball
 *  the rank in carm-data.json). */
const EXAMPLE_MYTH_IDS: readonly number[] = [
  28, // "Konsum verursacht einen generellen Motivationsverlust" — top Präv.
  26, // "Konsum hilft gegen Depressionen"                       — top Präv.
  39, // "Ein großer Teil der Bevölkerung konsumiert Cannabis"   — top Präv.
  3,  // "Konsum durch Heranwachsende … gesundheitliche Schäden" — mid Präv.
  8,  // "Konsum schädigt den Fötus"                              — low Präv.
];

/** Verdict colors for the slope-strip paths in step 6 — myths colored by
 *  their scientific classification so the eye can spot patterns. */
const CORRECTNESS_PATH_COLOR: Record<string, string> = {
  richtig: 'var(--classification-richtig)',
  eher_richtig: 'var(--classification-eher-richtig)',
  eher_falsch: 'var(--classification-eher-falsch)',
  falsch: 'var(--classification-falsch)',
  no_classification: 'var(--classification-keine-aussage)',
};

/** Bevölkerungsrisiko (population_relevance) only has meaningful per-group
 *  data for Voll- + Minderjährige. The other three groups inherit the
 *  Volljährige values, which is misleading — so the strip is dimmed + the
 *  caption explains the scope when those groups are selected. */
const BEV_RISIKO_VALID_GROUPS: ReadonlySet<GroupId> = new Set<GroupId>(['adults', 'minors']);

/** Step 6 splits into 5 narrative sub-phases — one indicator per phase.
 *  Each new strip slides in below the previous ones; nothing above moves. */
const PHASE_BY_MODE: Record<SampleRankedMode, IndicatorPhase | null> = {
  sample: null,
  'ranked-1': 'awareness',
  'ranked-2': 'significance',
  'ranked-3': 'correctness',
  'ranked-4': 'prevention_significance',
  'ranked-5': 'population_relevance',
};

/** How many indicator strips are visible at this phase (1..5, one per phase). */
const REVEALED_STRIPS_BY_PHASE: Record<IndicatorPhase, number> = {
  awareness: 1,
  significance: 2,
  correctness: 3,
  prevention_significance: 4,
  population_relevance: 5,
};

const GROUP_COLOR: Record<GroupId, string> = {
  adults: 'var(--group-adults)',
  minors: 'var(--group-minors)',
  consumers: 'var(--group-consumers)',
  young_adults: 'var(--group-young_adults)',
  parents: 'var(--group-parents)',
};

/**
 * Step 5+6 shared-DOM viz. Steps 5 → 6 do NOT remount; they swap the `mode`
 * prop and let CSS animate panel cross-fades + bar growth. The Stichprobe-Chip
 * stays visible across both steps to anchor "what's being measured".
 */
export function VizSampleAndRanked({ data, mode }: Props) {
  const phase = PHASE_BY_MODE[mode];
  const isSample = mode === 'sample';
  // Resolve the 5 exemplary myths against the data once per render.
  const exampleMyths = EXAMPLE_MYTH_IDS
    .map((id) => data.myths.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <div className="viz viz-sr" data-mode={mode}>
      {/* SAMPLE PANEL — visible only in sample mode */}
      <div className="viz-sr__sample" aria-hidden={!isSample} data-active={isSample}>
        <div className="viz-sr__panel">
          <h3 className="viz-sr__title">Stichprobe</h3>
          <p className="viz-sr__subtitle">Eine Person-Symbol = 10 Befragte</p>
          <div className="viz-sr__groups">
            {SAMPLE_GROUPS.map((g, gi) => (
              <div
                key={g.id}
                className="viz-sr__group"
                style={{ ['--row-delay' as string]: `${gi * 80}ms` }}
              >
                <div className="viz-sr__group-header">
                  <span className="viz-sr__group-num">{g.n.toLocaleString('de-DE')}</span>
                  <span className="viz-sr__group-label">{g.label}</span>
                </div>
                <div className="viz-sr__icon-row" aria-hidden="true">
                  {Array.from({ length: g.iconCount }, (_, i) => (
                    <User
                      key={i}
                      size={12}
                      strokeWidth={2}
                      color={g.color}
                      style={{
                        flexShrink: 0,
                        // Stagger only the first ~30 icons so high-count rows
                        // (210 adults icons) don't ripple for 3+ seconds.
                        animationDelay: `calc(var(--row-delay, 0ms) + ${Math.min(i, 30) * 12}ms)`,
                      }}
                      className="viz-sr__icon"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RANKED PANEL — visible only in ranked-* modes. Step 6's 3 sub-phases
          map to 2 / 3 / 5 strips revealed. All 5 strips are always rendered
          (with reserved space) so revealing more never pushes earlier strips
          up. Parallel-coordinates lines connect each myth's dot across the
          currently-revealed strips. Hover a dot or path to see the myth. */}
      <div className="viz-sr__ranked" aria-hidden={isSample} data-active={!isSample}>
        {exampleMyths.length > 0 && phase && (
          <ExampleMythStrips
            data={data}
            myths={exampleMyths}
            revealedStrips={REVEALED_STRIPS_BY_PHASE[phase]}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Horizontal parallel-coordinates viz for step 6. Five exemplary myths
 * (three top-Prävention + one mid + one low) are plotted across the five
 * indicators as horizontal strips. Each myth traces a connecting path
 * through the strips, colored by its scientific verdict. Hovering a path
 * or a dot reveals the full myth statement in a tooltip slot.
 *
 * `revealedStrips` controls how many strips are visible at once (2 / 3 / 5
 * — one per scroll sub-phase). All five strips are always in the DOM with
 * reserved space, so revealing more never pushes earlier strips up.
 */
function ExampleMythStrips({
  data,
  myths,
  revealedStrips,
}: {
  data: CarmData;
  myths: ReadonlyArray<{ id: number; text_de: string; text_short_de: string; correctness_class: string }>;
  /** 1..5 — how many indicator strips currently show data points + slope
   *  lines. ALL 5 strip axes (header, mini-def, axis line, ticks) are
   *  always visible from phase 1; only the data layer is gated by this
   *  value, and the most-recently-revealed strip gets a highlight ring
   *  so the eye knows where the new reading lives. */
  revealedStrips: number;
}) {
  const [activeGroup, setActiveGroup] = useState<GroupId>('adults');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  // Hover tooltip position (in SVG-percent coords, anchored to the hovered
  // arrow). Replaces the old dynamic-header text that caused layout shake.
  const [hoverPos, setHoverPos] = useState<{ xPct: number; yPct: number } | null>(null);


  // Build a value matrix: myths × indicators × selected group. Bev.risiko
  // values for Konsumierende / junge Erwachsene / Eltern are zeroed out
  // here (the JSON inherits the adults values for those groups, which is
  // misleading) — so the arrows and slope segments simply skip that strip
  // when one of the non-applicable groups is selected.
  const bevRisikoApplies = BEV_RISIKO_VALID_GROUPS.has(activeGroup);
  const valueMatrix = myths.map((myth) => {
    const m = getMetric(data, myth.id, activeGroup);
    return {
      myth,
      values: INDICATORS.map((ind) => {
        if (!m) return null;
        if (ind.key === 'population_relevance' && !bevRisikoApplies) return null;
        return m[ind.key];
      }),
    };
  });

  // SVG layout — fixed dimensions so each strip's y-position is stable
  // regardless of which strips are revealed.
  const W = 600;
  const STRIP_X0 = 24;
  const STRIP_X1 = W - 60;
  const STRIP_W = STRIP_X1 - STRIP_X0;
  const STRIP_GAP = 68;
  const STRIP_TOP_PAD = 28;
  const STRIP_LINE_Y = 34; // axis line inside each row's box, below header + mini-def
  const H = STRIP_TOP_PAD + STRIP_GAP * INDICATORS.length;

  function valueToX(v: number | null): number {
    if (v == null) return STRIP_X0;
    const clamped = Math.max(0, Math.min(100, v));
    return STRIP_X0 + (clamped / 100) * STRIP_W;
  }

  // For each myth, precompute its (x, y) point in each strip. Within each
  // strip, arrows that share (or come very close to sharing) an x-position
  // are nudged horizontally by ARROW_JITTER_MIN_GAP so they don't stack on
  // top of one another. The slope-line connects the *nudged* x's across
  // strips so the eye still follows a single myth's path.
  type RawPoint = { mythIdx: number; x: number; y: number; v: number | null };
  const rawByStrip: RawPoint[][] = INDICATORS.map((_, indIdx) =>
    valueMatrix.map(({ values }, mythIdx) => ({
      mythIdx,
      x: valueToX(values[indIdx]),
      y: STRIP_TOP_PAD + indIdx * STRIP_GAP + STRIP_LINE_Y,
      v: values[indIdx],
    })),
  );
  for (const stripPoints of rawByStrip) {
    // Sort by x for the jitter walk, but only nudge points that actually
    // have a value (null-valued points aren't rendered anyway).
    const valued = stripPoints.filter((p) => p.v !== null);
    valued.sort((a, b) => a.x - b.x);
    for (let i = 1; i < valued.length; i++) {
      if (valued[i].x - valued[i - 1].x < ARROW_JITTER_MIN_GAP) {
        valued[i].x = valued[i - 1].x + ARROW_JITTER_MIN_GAP;
      }
    }
    // Clamp to the strip's right edge so a nudge near 100 doesn't push the
    // last arrow off the axis.
    for (const p of valued) {
      if (p.x > STRIP_X1) p.x = STRIP_X1;
    }
  }
  const mythPoints = valueMatrix.map(({ myth, values }, mythIdx) => ({
    myth,
    points: values.map((v, i) => {
      const raw = rawByStrip[i].find((p) => p.mythIdx === mythIdx)!;
      return { x: raw.x, y: raw.y, v };
    }),
  }));

  const hoveredMyth = hoveredId !== null ? myths.find((m) => m.id === hoveredId) ?? null : null;
  const hoveredVerdict = hoveredMyth ? VERDICT_FROM_CLASS[hoveredMyth.correctness_class] ?? null : null;

  return (
    <div className="viz-sr__example">
      <div className="viz-sr__example-header">
        <span className="viz-sr__example-label">Beispiel-Auswahl</span>
        {/* Static description — no longer swaps with hovered-myth text. The
            myth statement now lives in an absolutely-positioned tooltip
            near the hovered arrow (see viz-sr__strips-tooltip below). */}
        <p className="viz-sr__example-hint">
          Fünf Mythen mit unterschiedlichem Aufklärungsbedarf. Berühre eine Linie, um die These zu lesen.
        </p>
      </div>

      <div className="viz-sr__example-picker" role="tablist" aria-label="Zielgruppe">
        {ACTIVE_GROUPS.map((g) => {
          const isActive = activeGroup === g;
          return (
            <button
              key={g}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveGroup(g)}
              className={`viz-sr__example-pick ${isActive ? 'viz-sr__example-pick--active' : ''}`}
            >
              <User
                size={12}
                strokeWidth={2}
                color={GROUP_COLOR[g]}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
              {GROUP_LABEL_DE[g]}
            </button>
          );
        })}
      </div>

      <div className="viz-sr__strips-wrap" style={{ position: 'relative' }}>
      <svg
        className="viz-sr__strips"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Fünf Indikatoren für fünf Beispiel-Mythen"
      >
        {/* Strip rows — one per indicator. Each row is always rendered with
            reserved space; opacity flips via data-revealed. The
            Bevölkerungsrisiko strip dims further when the selected group is
            not adults/minors, because the dataset's values for the other
            three groups inherit the adults values — showing them would be
            misleading. */}
        {INDICATORS.map((ind, i) => {
          const y = STRIP_TOP_PAD + i * STRIP_GAP;
          const lineY = y + STRIP_LINE_Y;
          // Iter-5: all strip AXES visible from phase 1. Only the data
          // layer (arrows + slope lines) is gated by `revealedStrips`.
          // Iter-6: yellow highlight ring removed for visual parity with
          // Step 7/8.
          const isRevealed = i < revealedStrips;
          const isBevRisikoStrip = ind.key === 'population_relevance';
          const bevRisikoDimmed = isBevRisikoStrip && !BEV_RISIKO_VALID_GROUPS.has(activeGroup);
          const axisOpacity = isRevealed ? (bevRisikoDimmed ? 0.55 : 1) : 0.45;
          return (
            <g
              key={`axis-${ind.name}`}
              className="viz-sr__strip-axis"
              data-revealed={isRevealed}
              style={{ transition: 'opacity 320ms ease' }}
              opacity={axisOpacity}
            >
              {/* Axis line */}
              <line
                x1={STRIP_X0}
                x2={STRIP_X1}
                y1={lineY}
                y2={lineY}
                stroke="#2d3748"
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Tick marks at 0 / 50 / 100 (lines only — number labels are
                  rendered in the LATER text-layer pass so they appear over
                  any slope line that crosses them). */}
              {[0, 50, 100].map((t) => (
                <line
                  key={`tick-${t}`}
                  x1={valueToX(t)}
                  x2={valueToX(t)}
                  y1={lineY - 4}
                  y2={lineY + 4}
                  stroke="#3a4452"
                  strokeWidth={1}
                />
              ))}
            </g>
          );
        })}

        {/* Connecting polylines — one per myth. Only the revealed segments
            are drawn (slice to revealedStrips). Colored by verdict. Lines
            skip strips where the value is null (e.g., Bev.risiko for
            non-applicable groups) — they bridge across the gap so the path
            still reads as one myth. Stroke-width is fixed across hover/non-
            hover so the chart doesn't visibly shift on hover. */}
        {mythPoints.map(({ myth, points }) => {
          const visible = points.slice(0, revealedStrips).filter((p) => p.v !== null);
          if (visible.length < 2) return null;
          const isHovered = hoveredId === myth.id;
          const isDimmed = hoveredId !== null && !isHovered;
          const color = CORRECTNESS_PATH_COLOR[myth.correctness_class] ?? 'var(--fg-muted)';
          const d = visible.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          // Anchor the tooltip at the midpoint of the visible polyline.
          const midpoint = visible[Math.floor(visible.length / 2)];
          return (
            <path
              key={`path-${myth.id}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isHovered ? 0.95 : isDimmed ? 0.18 : 0.55}
              style={{ transition: 'opacity 180ms ease' }}
              onMouseEnter={() => {
                setHoveredId(myth.id);
                setHoverPos({ xPct: (midpoint.x / W) * 100, yPct: (midpoint.y / H) * 100 });
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                setHoverPos(null);
              }}
              pointerEvents="stroke"
            />
          );
        })}

        {/* Iter-6: text labels rendered AFTER slope lines so they paint on
            top — fixes the unreadability when a connecting line cuts
            through the italic mini-definition. Each text element gets a
            translucent dark backing rect so it stays legible against any
            line passing behind it. */}
        {INDICATORS.map((ind, i) => {
          const y = STRIP_TOP_PAD + i * STRIP_GAP;
          const lineY = y + STRIP_LINE_Y;
          const isRevealed = i < revealedStrips;
          const isBevRisikoStrip = ind.key === 'population_relevance';
          const bevRisikoDimmed = isBevRisikoStrip && !BEV_RISIKO_VALID_GROUPS.has(activeGroup);
          const axisOpacity = isRevealed ? (bevRisikoDimmed ? 0.55 : 1) : 0.45;
          const unitText = bevRisikoDimmed ? 'nur Voll- + Minderjährige' : ind.unit;
          // Approximate text widths so the dark backing rect snugly hugs
          // each text element. Slight overestimate keeps text comfortably
          // inside its backing on any browser's font metrics.
          const nameW = ind.name.length * 7 + 6;
          const unitW = unitText.length * 6 + 6;
          const miniW = ind.mini.length * 5.2 + 8;
          return (
            <g
              key={`text-${ind.name}`}
              className="viz-sr__strip-text"
              data-revealed={isRevealed}
              style={{ transition: 'opacity 320ms ease' }}
              opacity={axisOpacity}
            >
              {/* Strip header — name + unit, both with dark backing. The
                  name uses pure-white + heavier weight to match Step 7/8's
                  column titles (Suche · Vertrauen · …) which render as
                  bold HTML text. SVG antialiases lighter than HTML at the
                  same nominal weight, so we step weight up to 600. */}
              <rect
                x={STRIP_X0 - 2}
                y={y - 7}
                width={nameW}
                height={18}
                fill="#0f1318"
                opacity={0.82}
                rx={3}
              />
              <text
                x={STRIP_X0}
                y={y + 6}
                fill="#ffffff"
                fontSize={13}
                fontFamily="Georgia, serif"
                fontWeight={600}
              >
                {ind.name}
              </text>
              <rect
                x={STRIP_X1 - unitW + 2}
                y={y - 6}
                width={unitW}
                height={14}
                fill="#0f1318"
                opacity={0.72}
                rx={3}
              />
              <text
                x={STRIP_X1}
                y={y + 6}
                textAnchor="end"
                fill="#6b7280"
                fontSize={10}
                fontFamily="monospace"
              >
                {unitText}
              </text>
              {/* Mini-definition — italic question under the header */}
              <rect
                x={STRIP_X0 - 2}
                y={y + 10}
                width={miniW}
                height={14}
                fill="#0f1318"
                opacity={0.72}
                rx={3}
              />
              <text
                x={STRIP_X0}
                y={y + 20}
                fill="#9ca3af"
                fontSize={10}
                fontFamily="Georgia, serif"
                fontStyle="italic"
              >
                {ind.mini}
              </text>
              {/* Tick number labels (0 / 50 / 100) over the slope lines */}
              {[0, 50, 100].map((t) => (
                <g key={`ticknum-${t}`}>
                  <rect
                    x={valueToX(t) - 10}
                    y={lineY + 7}
                    width={20}
                    height={12}
                    fill="#0f1318"
                    opacity={0.72}
                    rx={2}
                  />
                  <text
                    x={valueToX(t)}
                    y={lineY + 16}
                    textAnchor="middle"
                    fill="#4d5566"
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    {t}
                  </text>
                </g>
              ))}
            </g>
          );
        })}

        {/* Plot markers — colored verdict arrows (↑/↗/↙/↓/—) drawn as inline
            SVG paths (NOT foreignObject) so they paint on top of the slope
            lines in every browser. Geometry is fixed across hover/non-hover
            (the only change is opacity); a transparent hit-area rect around
            each arrow absorbs sub-pixel mouse jitter. */}
        {mythPoints.map(({ myth, points }) =>
          points.slice(0, revealedStrips).map((p, i) => {
            if (p.v == null) return null;
            const isHovered = hoveredId === myth.id;
            const isDimmed = hoveredId !== null && !isHovered;
            const color = CORRECTNESS_PATH_COLOR[myth.correctness_class] ?? 'var(--fg-muted)';
            const pathD = ARROW_PATHS[myth.correctness_class] ?? ARROW_PATHS.no_classification;
            // Lucide paths use a 24×24 viewBox; we scale them to ARROW_SIZE.
            const scale = ARROW_SIZE / 24;
            return (
              <g
                key={`arrow-${myth.id}-${i}`}
                transform={`translate(${(p.x - ARROW_SIZE / 2).toFixed(1)}, ${(p.y - ARROW_SIZE / 2).toFixed(1)})`}
                opacity={isDimmed ? 0.3 : 1}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 180ms ease',
                }}
              >
                {/* Transparent hit area — wider than the visible arrow so
                    sub-pixel mouse jitter doesn't flip hover state. */}
                <rect
                  x={-ARROW_HIT_PAD}
                  y={-ARROW_HIT_PAD}
                  width={ARROW_SIZE + ARROW_HIT_PAD * 2}
                  height={ARROW_SIZE + ARROW_HIT_PAD * 2}
                  fill="transparent"
                  onMouseEnter={() => {
                    setHoveredId(myth.id);
                    setHoverPos({ xPct: (p.x / W) * 100, yPct: (p.y / H) * 100 });
                  }}
                  onMouseLeave={() => {
                    setHoveredId(null);
                    setHoverPos(null);
                  }}
                  onFocus={() => {
                    setHoveredId(myth.id);
                    setHoverPos({ xPct: (p.x / W) * 100, yPct: (p.y / H) * 100 });
                  }}
                  onBlur={() => {
                    setHoveredId(null);
                    setHoverPos(null);
                  }}
                  tabIndex={0}
                  role="img"
                  aria-label={`${myth.text_short_de} · ${INDICATORS[i].name}: ${Math.round(p.v)}`}
                />
                {/* Dark backing rect so the arrow stays legible against the
                    strip's tick line behind it. */}
                <rect
                  x={-1}
                  y={-1}
                  width={ARROW_SIZE + 2}
                  height={ARROW_SIZE + 2}
                  rx={3}
                  fill="#0f1318"
                  opacity={0.85}
                  pointerEvents="none"
                />
                {/* The arrow itself, scaled from Lucide's 24×24 paths. */}
                <g
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform={`scale(${scale})`}
                  pointerEvents="none"
                >
                  <path d={pathD} />
                </g>
              </g>
            );
          }),
        )}
      </svg>

      {/* Hover tooltip overlay — positioned in CSS-percent over the SVG's
          viewBox so it tracks the hovered arrow/line accurately regardless
          of the SVG's rendered size. Mirrors the timeline tooltip pattern
          in VizTimeline. The dynamic header text was removed to fix the
          scroll-shake caused by the row reflowing on every hover. */}
      {hoveredMyth && hoverPos && hoveredVerdict && (
        <div
          className="viz-sr__strips-tooltip"
          role="tooltip"
          style={{
            left: `${hoverPos.xPct}%`,
            top: `${hoverPos.yPct}%`,
          }}
        >
          <p className="viz-sr__strips-tooltip-myth">„{hoveredMyth.text_de}"</p>
          <span className={`verdict-tag ${hoveredVerdict.cls}`}>
            {hoveredVerdict.arrow} {hoveredVerdict.label}
          </span>
        </div>
      )}
      </div>
    </div>
  );
}


/** Map carm-data.json's `correctness_class` field to verdict-tag styling. */
const VERDICT_FROM_CLASS: Record<string, { arrow: string; label: string; cls: string }> = {
  richtig: { arrow: '↑', label: 'richtig', cls: 'verdict-tag--richtig' },
  eher_richtig: { arrow: '↗', label: 'eher richtig', cls: 'verdict-tag--eher-richtig' },
  eher_falsch: { arrow: '↙', label: 'eher falsch', cls: 'verdict-tag--eher-falsch' },
  falsch: { arrow: '↓', label: 'falsch', cls: 'verdict-tag--falsch' },
  no_classification: { arrow: '—', label: 'keine Aussage', cls: 'verdict-tag--keine-aussage' },
};
