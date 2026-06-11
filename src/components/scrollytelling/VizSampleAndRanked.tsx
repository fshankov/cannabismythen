import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AUDIENCE_ICONS_BY_GROUP,
  IconVolljaehrige,
  IconMinderjaehrige,
  IconKonsumierende,
  type IconComponent,
} from '../../lib/icons';
import type {
  CarmData,
  GroupId,
  IndicatorPhase,
  SampleRankedMode,
} from './types';
import {
  ACTIVE_GROUPS,
  GROUP_LABEL_DE,
  ON_VERDICT_BG_GLYPH,
  getMetric,
} from './dataLoaders';
import VerdictPill from '../shared/VerdictPill';
import { VerdictGlyphPaths } from '../shared/verdictGlyph';
import { useFlipPosition } from '../dashboard/hooks/useFlipPosition';
import { useAutoCycleGroup } from './hooks/useAutoCycleGroup';
import type { CorrectnessClass } from '../../lib/dashboard/types';

interface Props {
  data: CarmData;
  mode: SampleRankedMode;
}

interface SampleGroup {
  id: 'adults' | 'minors' | 'clubs';
  label: string;
  n: number;
  iconCount: number;
  color: string;
  Icon: IconComponent;
}

const SAMPLE_GROUPS: readonly SampleGroup[] = [
  { id: 'adults', label: 'Erwachsene 18–70',           n: 2097, iconCount: 210, color: 'var(--group-adults)',    Icon: IconVolljaehrige },
  { id: 'minors', label: 'Minderjährige 16–17',         n: 555,  iconCount: 56,  color: 'var(--group-minors)',    Icon: IconMinderjaehrige },
  { id: 'clubs',  label: 'Anbauvereinigungs-Mitglieder', n: 143,  iconCount: 14,  color: 'var(--group-consumers)', Icon: IconKonsumierende },
];

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
  { name: 'Bevölkerungsrelevanz',   unit: 'Punkte',        desc: 'Präventionsbedeutung × Kenntnisanteil — nur für Voll- und Minderjährige.',      mini: 'Präventionsbedeutung × Bekanntheit — nur Voll- + Minderjährige.',               key: 'population_relevance',    phase: 'population_relevance' },
];

/** Verdict glyphs are drawn inline inside the parent <svg> via
 *  <VerdictGlyphPaths> from the shared spec at `../shared/verdictGlyph`.
 *  Inlining (not <foreignObject>) keeps paint order under control: axis
 *  lines paint below, slope polylines paint above the axis, glyphs paint
 *  on top. Same chevron + shadow treatment as everywhere else on the
 *  site (dashboard, fakten-karten, quiz) — change the spec in one place,
 *  every surface updates. */
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
  keine_aussage_moeglich: 'var(--classification-keine-aussage)',
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
      {/* Iter-15: sample + ranked panels overlay in the same grid cell.
          When `mode` changes, the two panels crossfade by opacity only —
          no max-height collapse, no translateY slide. Same rhythm as
          the Step 7→8 column reveal. */}
      <div className="viz-sr__panels-stack">
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
                    <g.Icon
                      key={i}
                      size="1em"
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
  // CAR-?? (2026-05-30 revised): the Bevölkerungsgruppe tab now
  // auto-rotates every 4 s so first-time readers see the data shift
  // across the 5 audiences. Manual click stops the cycle; hover over
  // the viz pauses temporarily. Visible feedback: a thin progress
  // bar fills inside the active pill so the rotation is OBVIOUS
  // rather than something the reader has to wait to notice.
  const {
    activeGroup,
    selectGroup: setActiveGroup,
    hoverHandlers,
    isAutoCycling,
    intervalMs: cycleMs,
  } = useAutoCycleGroup(ACTIVE_GROUPS, { intervalMs: 4000 });
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Iter-10: hover tooltip is now driven by `useFlipPosition` so it
  // clamps to the viewport edges instead of clipping when an arrow sits
  // near the right border. The triggerRef is repointed at each hovered
  // hit-rect on enter.
  const {
    triggerRef: tooltipTriggerRef,
    cardRef: tooltipCardRef,
    pos: tooltipPos,
    open: tooltipOpen,
    setOpen: setTooltipOpen,
    updatePosition: updateTooltipPosition,
  } = useFlipPosition<HTMLElement, HTMLDivElement>({
    maxWidth: 320,
    gap: 10,
  });

  // The trigger may be either the SVG <rect> hit zone over an arrow or
  // the slope <path> itself. useFlipPosition only reads
  // getBoundingClientRect() from the ref, which exists on every DOM
  // element — the cast through `unknown` quiets the TS-level
  // HTMLElement constraint on the hook.
  function openMythTooltip(id: number, el: SVGGraphicsElement) {
    (tooltipTriggerRef as unknown as React.MutableRefObject<Element | null>).current = el;
    setHoveredId(id);
    setTooltipOpen(true);
    updateTooltipPosition();
  }
  function closeMythTooltip() {
    setTooltipOpen(false);
    setHoveredId(null);
  }

  // Iter-11 staggered reveal — refined from Iter-10 to fix two bugs:
  //   (a) `useRef(revealedStrips)` initialized to the current post-entry
  //       value on mount, so on FIRST entry to Steps 6 or 8 the prev ===
  //       current and revealIdx collapsed to 0 for every strip → no
  //       stagger. Switch to `useRef(0)` so the very first reveal on the
  //       viz's lifetime always cascades from delay 0.
  //   (b) Backward scroll (Step 7 → Step 6) should SNAP — strips 4/5
  //       hide immediately, no reverse stagger. Detected via
  //       `isForward = revealedStrips >= prevRevealedRef.current`.
  const prevRevealedRef = useRef(0);
  useEffect(() => {
    prevRevealedRef.current = revealedStrips;
  }, [revealedStrips]);
  const prevRevealed = prevRevealedRef.current;
  const isForward = revealedStrips >= prevRevealed;


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
  const hoveredVerdict: CorrectnessClass | null = hoveredMyth
    ? (hoveredMyth.correctness_class as CorrectnessClass)
    : null;

  return (
    // hoverHandlers pause the auto-cycle while the user is interacting
    // with the chart. Includes the picker row + the strips SVG itself.
    <div className="viz-sr__example" {...hoverHandlers}>
      <div className="viz-sr__example-header">
        <span className="viz-sr__example-label">Beispiel-Auswahl</span>
        {/* Static description — no longer swaps with hovered-myth text. The
            myth statement now lives in an absolutely-positioned tooltip
            near the hovered arrow (see viz-sr__strips-tooltip below). */}
        <p className="viz-sr__example-hint">
          Fünf Mythen mit unterschiedlichem Aufklärungsbedarf. Berühre eine Linie, um die These zu lesen.
        </p>
      </div>

      <div
        className="viz-sr__example-picker"
        role="tablist"
        aria-label="Zielgruppe"
        data-auto-cycling={isAutoCycling ? 'true' : 'false'}
      >
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
              className={`viz-sr__example-pick ${isActive ? 'viz-sr__example-pick--active' : ''}`}
            >
              {/* Iter-24: per-audience icon (same shape the left-column
                  `{icon:adults}` inline marker draws). Was the generic
                  Lucide `<User>`, which looked identical for all five
                  groups. */}
              <Icon
                size="1em"
                strokeWidth={1.75}
                color={GROUP_COLOR[g]}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
              {GROUP_LABEL_DE[g]}
              {/* Progress bar — only mounts under the ACTIVE pill while
                  auto-cycling is on. Keyed by `activeGroup` so the CSS
                  animation restarts on every tick / manual change. */}
              {isActive && isAutoCycling && (
                <span
                  key={`pb-${g}`}
                  className="viz-sr__example-pick-progress"
                  style={{ animationDuration: `${cycleMs}ms` }}
                  aria-hidden="true"
                />
              )}
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
          const settledOpacity = bevRisikoDimmed ? 0.55 : 1;
          // Iter-12 reveal — use CSS keyframe animation (not transition)
          // so first-entry mounts fire too. `isNewlyRevealed` = strip
          // crossed the reveal threshold on THIS render's forward
          // transition (or first mount). Settled strips and unrevealed
          // strips use inline opacity directly.
          const isNewlyRevealed =
            isForward && isRevealed && i >= prevRevealed;
          const revealIdx = isNewlyRevealed ? i - prevRevealed : 0;
          const stripStyle: React.CSSProperties = isNewlyRevealed
            ? {
                animation: 'viz-reveal-in var(--viz-reveal-dur) cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `calc(${revealIdx} * var(--viz-reveal-stagger))`,
              }
            : { opacity: isRevealed ? settledOpacity : 0 };
          return (
            <g
              key={`axis-${ind.name}`}
              className="viz-sr__strip-axis"
              data-revealed={isRevealed}
              style={stripStyle}
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

        {/* Iter-11: connecting segments rendered as INDIVIDUAL <line>s
            (one per adjacent-strip pair) so each can opacity-gate by its
            own reveal-index. The whole strip — axis + text + slope
            segments INTO this strip + arrows ON this strip — staggers in
            as a single visual unit. Bridging across null values still
            works because the segment between strip i and strip i+1 only
            renders if BOTH endpoints are non-null. */}
        {mythPoints.map(({ myth, points }) => {
          const isHovered = hoveredId === myth.id;
          const isDimmed = hoveredId !== null && !isHovered;
          const color = CORRECTNESS_PATH_COLOR[myth.correctness_class] ?? 'var(--fg-muted)';
          const baseOpacity = isHovered ? 0.95 : isDimmed ? 0.18 : 0.55;
          return points.slice(0, -1).map((p, segIdx) => {
            const next = points[segIdx + 1];
            if (p.v == null || next.v == null) return null;
            // Segment between strip[segIdx] and strip[segIdx+1] becomes
            // visible when strip[segIdx+1] is revealed. Iter-12: CSS
            // keyframe animation (not transition) so first-entry mounts
            // fire too.
            const laterIdx = segIdx + 1;
            const segIsRevealed = laterIdx < revealedStrips;
            const isNewlyRevealed =
              isForward && segIsRevealed && laterIdx >= prevRevealed;
            const segRevealIdx = isNewlyRevealed ? laterIdx - prevRevealed : 0;
            const segStyle: React.CSSProperties = isNewlyRevealed
              ? {
                  animation: 'viz-reveal-in var(--viz-reveal-dur) cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `calc(${segRevealIdx} * var(--viz-reveal-stagger))`,
                }
              : {
                  opacity: segIsRevealed ? baseOpacity : 0,
                  transition: 'opacity 180ms ease',
                };
            return (
              <line
                key={`seg-${myth.id}-${segIdx}`}
                x1={p.x.toFixed(1)}
                y1={p.y.toFixed(1)}
                x2={next.x.toFixed(1)}
                y2={next.y.toFixed(1)}
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                style={segStyle}
                onMouseEnter={(e) => openMythTooltip(myth.id, e.currentTarget)}
                onMouseLeave={closeMythTooltip}
                pointerEvents="stroke"
              />
            );
          });
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
          const settledOpacity = bevRisikoDimmed ? 0.55 : 1;
          const unitText = bevRisikoDimmed ? 'nur Voll- + Minderjährige' : ind.unit;
          // Approximate text widths so the dark backing rect snugly hugs
          // each text element. Slight overestimate keeps text comfortably
          // inside its backing on any browser's font metrics.
          const nameW = ind.name.length * 7 + 6;
          const unitW = unitText.length * 6 + 6;
          const miniW = ind.mini.length * 5.2 + 8;
          const isNewlyRevealed =
            isForward && isRevealed && i >= prevRevealed;
          const revealIdx = isNewlyRevealed ? i - prevRevealed : 0;
          const textStyle: React.CSSProperties = isNewlyRevealed
            ? {
                animation: 'viz-reveal-in var(--viz-reveal-dur) cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `calc(${revealIdx} * var(--viz-reveal-stagger))`,
              }
            : { opacity: isRevealed ? settledOpacity : 0 };
          return (
            <g
              key={`text-${ind.name}`}
              className="viz-sr__strip-text"
              data-revealed={isRevealed}
              style={textStyle}
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

        {/* Iter-11: arrow puck — verdict-colored CIRCLE backing + WHITE
            chevron inside. Rendered for every (myth, strip) pair (not
            sliced) so the per-arrow opacity transitions can fire as
            each strip is revealed, staggered with the rest of the
            strip's content. Hit-area is a wider circle for sub-pixel
            mouse jitter. */}
        {mythPoints.map(({ myth, points }) =>
          points.map((p, i) => {
            if (p.v == null) return null;
            const isHovered = hoveredId === myth.id;
            const isDimmed = hoveredId !== null && !isHovered;
            // <VerdictGlyphPaths> uses a 24×24 user-space; scale to ARROW_SIZE.
            const scale = ARROW_SIZE / 24;
            const stripIsRevealed = i < revealedStrips;
            const isNewlyRevealed =
              isForward && stripIsRevealed && i >= prevRevealed;
            const stripRevealIdx = isNewlyRevealed ? i - prevRevealed : 0;
            // Settled target opacity (0/1, or 0.3 if dimmed-by-hover).
            // Iter-12: reveal uses CSS keyframe so first-entry mounts
            // fire too; settled state uses transition for hover.
            const settledOpacity = stripIsRevealed
              ? isDimmed
                ? 0.3
                : 1
              : 0;
            const stripFill =
              CORRECTNESS_PATH_COLOR[myth.correctness_class] ??
              'var(--fg-muted)';
            const arrowStyle: React.CSSProperties = isNewlyRevealed
              ? {
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  animation: 'viz-reveal-in var(--viz-reveal-dur) cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `calc(${stripRevealIdx} * var(--viz-reveal-stagger))`,
                }
              : {
                  cursor: stripIsRevealed ? 'pointer' : 'default',
                  pointerEvents: stripIsRevealed ? 'auto' : 'none',
                  opacity: settledOpacity,
                  transition: 'opacity 180ms ease',
                };
            return (
              <g
                key={`arrow-${myth.id}-${i}`}
                transform={`translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`}
                style={arrowStyle}
              >
                {/* Transparent hit zone — wider than the puck. */}
                <circle
                  r={ARROW_SIZE / 2 + ARROW_HIT_PAD}
                  fill="transparent"
                  pointerEvents="all"
                  onMouseEnter={(e) => openMythTooltip(myth.id, e.currentTarget)}
                  onMouseLeave={closeMythTooltip}
                  onFocus={(e) => openMythTooltip(myth.id, e.currentTarget)}
                  onBlur={closeMythTooltip}
                  tabIndex={stripIsRevealed ? 0 : -1}
                  role="img"
                  aria-label={`${myth.text_short_de} · ${INDICATORS[i].name}: ${Math.round(p.v)}`}
                />
                {/* Verdict-colored circle backing (puck), white glyph
                    inside — same visual unit as Step 4 grid cells. */}
                <circle
                  r={ARROW_SIZE / 2 + 1}
                  fill={stripFill}
                  stroke="#0f1318"
                  strokeWidth={1}
                  pointerEvents="none"
                />
                <g
                  transform={`translate(${-ARROW_SIZE / 2}, ${-ARROW_SIZE / 2}) scale(${scale})`}
                  pointerEvents="none"
                >
                  <VerdictGlyphPaths
                    verdict={myth.correctness_class as CorrectnessClass}
                    strokeWidth={2.5}
                    colorOverride={ON_VERDICT_BG_GLYPH}
                  />
                </g>
              </g>
            );
          }),
        )}
      </svg>

      {/* Iter-10 hover tooltip — portalled to body so Safari's
          contain:layout on .scrolly__viz-canvas doesn't trap position:fixed. */}
      {createPortal(
        <div
          ref={tooltipCardRef}
          role="tooltip"
          className={`scrolly-hover-tooltip ${tooltipOpen && hoveredMyth && hoveredVerdict ? 'is-open' : ''}`}
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
          {hoveredMyth && hoveredVerdict && (
            <>
              <p className="scrolly-hover-tooltip__title">
                „{hoveredMyth.text_de}"
              </p>
              <p>
                <VerdictPill verdict={hoveredVerdict} size="sm" />
              </p>
            </>
          )}
        </div>,
        document.body,
      )}
      </div>
    </div>
  );
}
