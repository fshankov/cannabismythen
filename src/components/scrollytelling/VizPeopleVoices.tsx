import { useEffect, useRef, useState } from 'react';
import { FileText, User } from 'lucide-react';

interface Props {
  active: boolean;
}

interface Voice {
  id: number;
  text: string;
  /** 0..1 — relative weight, mapped to font size + bubble scale.
   *  Approximates how widespread the underlying belief is. */
  weight: number;
  /** Origin of the statement in CaRM's three-source methodology:
   *  - 'survey'       → Online-Befragung (n=1.041)
   *  - 'professional' → Präventionsfachkräfte (n=60)
   *  - 'media'        → Medien- / Online-Foren-Analyse
   *  Renders a thin uncolored Lucide icon next to the quote: a User
   *  silhouette for human-said statements (survey + professional), a
   *  FileText page for media. ISD should sign off on the per-voice
   *  attribution before this leaves the team — current mapping is a
   *  heuristic. */
  source: 'survey' | 'professional' | 'media';
}

/** Returns the Lucide component to render in the bubble's glyph slot. */
function SourceIcon({ source, size }: { source: Voice['source']; size: number }) {
  const Icon = source === 'media' ? FileText : User;
  return (
    <Icon
      size={size}
      strokeWidth={1.6}
      color="currentColor"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    />
  );
}

/** 56 hand-curated everyday voices loosely grounded in CaRM's three-source
 *  methodology. `source` is a heuristic tag — ISD should verify per-voice
 *  attribution before this leaves the team. The split here is roughly:
 *    1–30  → 'survey'        (lay statements, Online-Befragung n=1.041)
 *    31–45 → 'professional'  (clinical/structured claims, Fachkräfte n=60)
 *    46–56 → 'media'         (slogan / forum-style, Medien-Analyse)
 *  Weight ≈ awareness magnitude (0.20 = niche, 1.0 = ubiquitous). */
const VOICES: Voice[] = [
  { id: 1,  text: 'Hilft besser gegen Schmerzen als Pillen.',     weight: 1.00, source: 'survey' },
  { id: 2,  text: 'Cannabis ist eine Einstiegsdroge.',             weight: 0.95, source: 'survey' },
  { id: 3,  text: 'Macht entspannt — was soll daran schlimm sein?', weight: 0.90, source: 'survey' },
  { id: 4,  text: 'Sicherer als Alkohol — wirklich?',              weight: 0.85, source: 'survey' },
  { id: 5,  text: 'Schadet dem ungeborenen Kind.',                 weight: 0.80, source: 'survey' },
  { id: 6,  text: 'Wer kifft, kommt nicht aus dem Bett.',          weight: 0.75, source: 'survey' },
  { id: 7,  text: 'Hilft beim Schlafen — fast wie ein Tee.',       weight: 0.72, source: 'survey' },
  { id: 8,  text: 'Macht abhängig wie Heroin.',                    weight: 0.68, source: 'survey' },
  { id: 9,  text: 'Verändert die Wahrnehmung total.',              weight: 0.65, source: 'survey' },
  { id: 10, text: 'Naturprodukt — also unbedenklich.',             weight: 0.62, source: 'survey' },
  { id: 11, text: 'Junge Gehirne nehmen Schaden, klar.',           weight: 0.58, source: 'survey' },
  { id: 12, text: 'Ist jetzt überall erlaubt.',                    weight: 0.55, source: 'survey' },
  { id: 13, text: 'Wer kifft, wird depressiv.',                    weight: 0.52, source: 'survey' },
  { id: 14, text: 'Macht Jugendliche dumm.',                       weight: 0.50, source: 'survey' },
  { id: 15, text: 'Macht kreativ und entspannt zugleich.',         weight: 0.48, source: 'survey' },
  { id: 16, text: 'Mischen mit Alkohol ist riskant.',              weight: 0.46, source: 'survey' },
  { id: 17, text: 'Hilft gegen Angststörungen.',                   weight: 0.44, source: 'survey' },
  { id: 18, text: 'Streckmittel sind das eigentliche Problem.',    weight: 0.42, source: 'survey' },
  { id: 19, text: 'Ist medizinisch sehr nützlich.',                weight: 0.40, source: 'survey' },
  { id: 20, text: 'Cool ist das jedenfalls nicht mehr.',           weight: 0.38, source: 'survey' },
  { id: 21, text: 'Hilft gegen Übelkeit bei Chemo.',               weight: 0.36, source: 'survey' },
  { id: 22, text: 'Lungenkrebs durch Joints? Wahrscheinlich.',     weight: 0.35, source: 'survey' },
  { id: 23, text: 'Hilft sogar bei ADHS, sagt mein Cousin.',       weight: 0.34, source: 'survey' },
  { id: 24, text: 'Wer regelmäßig kifft, ist sozial schwächer.',   weight: 0.33, source: 'survey' },
  { id: 25, text: 'Allheilmittel — alles Marketing.',              weight: 0.32, source: 'survey' },
  { id: 26, text: 'Überdosis? Nein, davon stirbt man nicht.',      weight: 0.31, source: 'survey' },
  { id: 27, text: 'Kann man eigentlich gar nicht überdosieren.',   weight: 0.30, source: 'survey' },
  { id: 28, text: 'Eine Mehrheit kifft heute doch eh, oder?',      weight: 0.30, source: 'survey' },
  // Voices 29–56 added Round 3 — AI draft, awaiting ISD review (CLAUDE.md HARD rule).
  { id: 29, text: 'Hilft beim Einschlafen besser als jede Tablette.', weight: 0.50, source: 'survey' },
  { id: 30, text: 'Schadet dem Gedächtnis nachhaltig.',             weight: 0.62, source: 'survey' },
  { id: 31, text: 'Fördert Schizophrenie bei Jugendlichen.',        weight: 0.58, source: 'professional' },
  { id: 32, text: 'CBD ist gesund — THC nicht.',                    weight: 0.55, source: 'professional' },
  { id: 33, text: 'Joints sind harmloser als Zigaretten.',          weight: 0.48, source: 'professional' },
  { id: 34, text: 'Macht aggressiv, das sagt jede Statistik.',      weight: 0.36, source: 'professional' },
  { id: 35, text: 'Hilft Krebspatient:innen gegen Schmerzen.',      weight: 0.65, source: 'professional' },
  { id: 36, text: 'Senkt den Testosteronspiegel.',                  weight: 0.32, source: 'professional' },
  { id: 37, text: 'Reduziert Krampfanfälle bei Epilepsie.',         weight: 0.42, source: 'professional' },
  { id: 38, text: 'Verändert das jugendliche Gehirn unwiderruflich.', weight: 0.60, source: 'professional' },
  { id: 39, text: 'Ist effektiver als jedes Antidepressivum.',      weight: 0.34, source: 'professional' },
  { id: 40, text: 'Lässt einen sportlich völlig nachlassen.',       weight: 0.30, source: 'professional' },
  { id: 41, text: 'Macht impotent.',                                 weight: 0.28, source: 'professional' },
  { id: 42, text: 'Fast jeder unter 25 hat es schon probiert.',     weight: 0.55, source: 'professional' },
  { id: 43, text: 'Ist sozial akzeptierter als Alkohol.',           weight: 0.40, source: 'professional' },
  { id: 44, text: 'Macht in Gruppen besonders dumm.',                weight: 0.32, source: 'professional' },
  { id: 45, text: 'Wer kifft, fährt schlechter Auto.',               weight: 0.70, source: 'professional' },
  { id: 46, text: 'Hilft gegen Tinnitus.',                           weight: 0.25, source: 'media' },
  { id: 47, text: 'Macht alle Probleme weg, kurzfristig.',           weight: 0.45, source: 'media' },
  { id: 48, text: 'Verschlechtert die schulischen Leistungen.',      weight: 0.55, source: 'media' },
  { id: 49, text: 'Lockt zu härteren Drogen.',                       weight: 0.78, source: 'media' },
  { id: 50, text: 'Hilft gegen Migräne.',                            weight: 0.40, source: 'media' },
  { id: 51, text: 'Bringt das Immunsystem aus dem Tritt.',           weight: 0.30, source: 'media' },
  { id: 52, text: 'Ist günstiger als Bier auf lange Sicht.',         weight: 0.22, source: 'media' },
  { id: 53, text: 'Macht Kreative kreativer, Faule fauler.',         weight: 0.36, source: 'media' },
  { id: 54, text: 'Bringt das Herz aus dem Rhythmus.',               weight: 0.34, source: 'media' },
  { id: 55, text: 'Wer aufhört, schläft wochenlang schlecht.',       weight: 0.30, source: 'media' },
  { id: 56, text: 'Ist in Wahrheit kein echtes Suchtmittel.',        weight: 0.42, source: 'media' },
];

/** Measured card with its target center position. Iter-18: dropped the
 *  d3.SimulationNodeDatum extension — the shelf-pack layout doesn't run
 *  any iterative simulation, just measures real card dimensions and
 *  assigns deterministic (x, y) centers. */
interface PackNode {
  id: number;
  text: string;
  weight: number;
  /** Actual rendered half-width (px). */
  halfW: number;
  /** Actual rendered half-height (px). */
  halfH: number;
  /** Center X in container coordinates. */
  x: number;
  /** Center Y in container coordinates. */
  y: number;
}

export function VizPeopleVoices({ active }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.dataset.reducedMotion === 'true');

    let done = false;
    let cancelled = false;

    // Stable non-null reference for the closures below — `containerRef`
    // could go null on unmount, but the cleanup function disconnects the
    // observer first.
    const el = container;

    /** Compute positions once the container has real dimensions.
     *
     *  Iter-18 — deterministic SHELF-PACK. The previous d3 force-sim
     *  approach (Iter-6 through Iter-17) was tick-sensitive: packing
     *  56 rectangles of mixed sizes into a 640 px field without
     *  overlap AND without visible wedge gaps is fundamentally hard
     *  for force-directed layouts. Different tick counts produced
     *  either unresolved overlap (cards stacked) or large unfilled
     *  pockets (perimeter reads as empty black). Shelf-pack solves
     *  both by construction:
     *
     *    1. PHASE 1 — measure every card with the browser's real
     *       text-wrap layout (visibility: hidden trick).
     *    2. PHASE 2 — sort by height desc, greedily fill rows up to
     *       the container width, then justify each row with extra
     *       space distributed evenly between cards. Total stack is
     *       vertically centered. NO ITERATION, NO OVERLAP, predictable
     *       gaps.
     *    3. PHASE 3 — write final (x, y) centers; flip
     *       `visibility: visible`; trigger fade-in via the `--in`
     *       class.
     *
     *  Subtle Y-jitter within each row breaks the strict grid look so
     *  the cloud still reads as organic rather than spreadsheet-tidy. */
    function runLayout() {
      if (done || cancelled) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 200 || h < 200) return;

      const rng = mulberry32(31337);

      // PHASE 1 — pre-position every card at the container origin,
      // hidden. The browser does real text-wrap layout so the
      // subsequent getBoundingClientRect returns true dimensions
      // (padding, inline icon, natural wrap).
      for (const v of VOICES) {
        const card = cardRefs.current.get(v.id);
        if (!card) continue;
        card.style.visibility = 'hidden';
        card.style.left = '0px';
        card.style.top = '0px';
      }

      // Synchronous layout flush — reading offsetWidth forces the
      // browser to commit the layout above before we measure.
      void el.offsetWidth;

      const measured: PackNode[] = [];
      for (const v of VOICES) {
        const card = cardRefs.current.get(v.id);
        if (!card) continue;
        const r = card.getBoundingClientRect();
        measured.push({
          id: v.id,
          text: v.text,
          weight: v.weight,
          halfW: r.width / 2,
          halfH: r.height / 2,
          x: 0,
          y: 0,
        });
      }

      // PHASE 2 — DART-THROWING placement (Iter-19).
      //
      // Iter-18's shelf-pack guaranteed no overlap but read as a
      // strict 2-column list sorted by size. We need ORGANIC AND
      // collision-free, like a word cloud. Algorithm:
      //
      //   1. Sort cards by AREA desc — biggest land first while the
      //      field is empty (they need the most room).
      //   2. For each card, sample random (x, y) within bounds; accept
      //      if no overlap with already-placed cards.
      //   3. If the first pass with a clean GAP can't find a slot in
      //      80 attempts, retry with progressively smaller gaps
      //      (4 → 2 → 0 px) and finally with allowed-tiny-overlap so
      //      every card gets a position even at high density.
      //   4. Bounds clamping (PAD_*) keeps the hanging source-icon
      //      and tail inside the container.
      //
      // Cost: ~56 cards × up to 220 attempts × up to ~55 collision
      // checks = ≈680k ops worst case. Empirically <10 ms.
      const PAD_X = 6;
      const PAD_Y_TOP = 4;
      const PAD_Y_BOTTOM = 14;

      if (reduced) {
        // Reduced-motion: simple grid, no animation.
        const cols = w < 600 ? 3 : 5;
        const sorted = [...measured].sort((a, b) => b.weight - a.weight);
        sorted.forEach((n, i) => {
          n.x = ((i % cols) + 0.5) * (w / cols);
          n.y =
            (Math.floor(i / cols) + 0.5) *
            (h / Math.ceil(VOICES.length / cols));
        });
        applyPositions(measured, cardRefs.current);
        if (!cancelled) setSettled(true);
        done = true;
        return;
      }

      // Place biggest cards first — they're hardest to fit later when
      // the field is crowded.
      const order = [...measured].sort(
        (a, b) => b.halfW * b.halfH - a.halfW * a.halfH,
      );
      const placed: PackNode[] = [];

      function overlapPenalty(
        card: PackNode,
        x: number,
        y: number,
        gap: number,
      ): number {
        let pen = 0;
        for (const p of placed) {
          const needX = card.halfW + p.halfW + gap;
          const needY = card.halfH + p.halfH + gap;
          const dx = Math.abs(x - p.x);
          const dy = Math.abs(y - p.y);
          if (dx < needX && dy < needY) {
            pen += (needX - dx) * (needY - dy);
          }
        }
        return pen;
      }

      // Progressive gap schedule: aim for 4 px breathing room; if
      // density forces it, fall back to 2, then 0, then allow tiny
      // overlap (best-of-N fallback).
      const GAP_SCHEDULE: Array<{ gap: number; attempts: number }> = [
        { gap: 4, attempts: 80 },
        { gap: 2, attempts: 60 },
        { gap: 0, attempts: 60 },
      ];

      for (const card of order) {
        const minX = card.halfW + PAD_X;
        const maxX = w - card.halfW - PAD_X;
        const minY = card.halfH + PAD_Y_TOP;
        const maxY = h - card.halfH - PAD_Y_BOTTOM;
        const rangeX = Math.max(0, maxX - minX);
        const rangeY = Math.max(0, maxY - minY);

        // Best-found fallback in case no gap level succeeds — pick the
        // lowest-overlap candidate we sampled.
        let bestX = (minX + maxX) / 2;
        let bestY = (minY + maxY) / 2;
        let bestPenalty = Infinity;
        let placedClean = false;

        for (const step of GAP_SCHEDULE) {
          if (placedClean) break;
          for (let i = 0; i < step.attempts; i++) {
            const x = minX + rng() * rangeX;
            const y = minY + rng() * rangeY;
            const pen = overlapPenalty(card, x, y, step.gap);
            if (pen === 0) {
              bestX = x;
              bestY = y;
              placedClean = true;
              break;
            }
            if (pen < bestPenalty) {
              bestPenalty = pen;
              bestX = x;
              bestY = y;
            }
          }
        }

        card.x = bestX;
        card.y = bestY;
        placed.push(card);
      }

      // PHASE 3 — apply final positions and reveal.
      applyPositions(measured, cardRefs.current);
      done = true;
      requestAnimationFrame(() => {
        if (!cancelled) setSettled(true);
      });
    }

    // First attempt — usually succeeds on a hot mount.
    runLayout();

    // ResizeObserver: catches the case where the parent flexbox hadn't
    // committed dimensions yet when the island hydrated.
    const ro = new ResizeObserver(() => runLayout());
    ro.observe(el);

    // Iter-6 defensive fallback: if neither the initial call nor any
    // resize event manages to trigger a successful layout within 500ms,
    // force one more attempt. Belt-and-braces for browsers that don't
    // fire ResizeObserver on the first layout commit.
    const timeoutId = window.setTimeout(() => runLayout(), 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="viz" style={{ width: '100%' }}>
      <div
        className="viz-voices"
        ref={containerRef}
        style={{ height: 640, width: '100%', position: 'relative', overflow: 'hidden' }}
      >
        {VOICES.map((v, idx) => {
          const fontSize = voiceFontSize(v.weight);
          const opacityTarget = 0.7 + v.weight * 0.3;
          const iconSize = Math.round(fontSize * 0.8);
          return (
            <div
              key={v.id}
              ref={(el) => {
                cardRefs.current.set(v.id, el);
              }}
              className={`viz-voice-card ${active && settled ? 'viz-voice-card--in' : ''}`}
              data-source={v.source}
              tabIndex={0}
              style={{
                left: 0,
                top: 0,
                fontSize: `${fontSize.toFixed(1)}px`,
                // Fade-in target opacity; the card starts at 0 (see CSS) and
                // animates up to this value once `settled` is true.
                ['--card-opacity' as string]: opacityTarget,
                // Iter-16: tighter stagger so the cloud appears in
                // ~220 ms total (was ~1100 ms with 18 ms × 40 +
                // 380 ms anim). The wave still reads as ordered but
                // doesn't feel like "loading".
                animationDelay: `${Math.min(idx, 30) * 4}ms`,
              }}
              title={v.text}
            >
              <span className="viz-voice-card__quote">{v.text}</span>
              <span className="viz-voice-card__glyph" aria-hidden="true">
                <SourceIcon source={v.source} size={iconSize} />
              </span>
              <span className="viz-voice-card__tail" aria-hidden="true" />
            </div>
          );
        })}
      </div>
      {/* Iter-9: the funnel-caption legend (7.408 · 53 · 42) moved to the
          left text column as `editorial.legend` so the viz column stays
          purely visual. */}
    </div>
  );
}

/** Map a voice's weight (0..1) to a font size in pixels. The range 9 → 24 px
 *  is intentionally wide so the cloud reads as "many statements, a few
 *  prominent ones". A cubic curve makes the high-weight voices stand out
 *  while keeping the low-weight tail small. */
function voiceFontSize(weight: number): number {
  const w = Math.max(0, Math.min(1, weight));
  return 9 + Math.pow(w, 1.6) * 15;
}

function applyPositions(
  nodes: PackNode[],
  cards: Map<number, HTMLDivElement | null>,
) {
  // Iter-6 bugfix: write to left/top, NOT transform. The fade-in keyframe
  // animates `transform: translate(-50%, -50%) scale(...)`, which would
  // otherwise override an inline transform set here — wiping the computed
  // x/y and stacking every card at (-50%, -50%) i.e. negative coords
  // outside the container's overflow-hidden clip. With position via
  // left/top, the keyframe's transform only handles centering + scale,
  // and the computed position survives.
  for (const n of nodes) {
    const el = cards.get(n.id);
    if (!el) continue;
    el.style.left = `${n.x.toFixed(1)}px`;
    el.style.top = `${n.y.toFixed(1)}px`;
    el.style.visibility = '';
  }
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
