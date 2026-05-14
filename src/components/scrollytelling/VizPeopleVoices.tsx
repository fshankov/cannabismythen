import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
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

interface SimNode extends d3.SimulationNodeDatum {
  id: number;
  text: string;
  weight: number;
  /** Bounding-circle radius — used by d3.forceCollide for non-overlap. */
  size: number;
  /** Actual rendered half-width (px) — used to clamp x against container edges. */
  halfW: number;
  /** Actual rendered half-height (px) — used to clamp y against container edges. */
  halfH: number;
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

    /** Compute positions once the container has real dimensions. Iter-8:
     *  MEASURE-then-place. Iter-6/7 estimated each card's half-width and
     *  half-height from character count × font-size, which underestimated
     *  the rendered card (padding, inline icon, tail, natural text wrap)
     *  and let the wall-clamp permit cards to extend past the right edge.
     *  We now place every card at the container center (visibility:hidden)
     *  so the browser does REAL text-wrap layout, read getBoundingClientRect
     *  for the true dimensions, then run d3 with real halfW/halfH and
     *  weaker centering forces so the cluster expands toward edges instead
     *  of bunching mid-frame. */
    function runLayout() {
      if (done || cancelled) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 200 || h < 200) return;

      const rng = mulberry32(31337);

      // PHASE 1 — pre-position every card at the container center, hidden.
      // The browser then lays out the real card (padding + icon + tail +
      // natural text wrap) so we can read its true dimensions.
      for (const v of VOICES) {
        const card = cardRefs.current.get(v.id);
        if (!card) continue;
        card.style.visibility = 'hidden';
        card.style.left = `${w / 2}px`;
        card.style.top = `${h / 2}px`;
      }

      // Force a synchronous layout flush so getBoundingClientRect returns
      // the freshly-laid-out dimensions, not stale ones. Reading offsetWidth
      // is the cheapest reliable trigger.
      void el.offsetWidth;

      const measured: SimNode[] = [];
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
          size: Math.max(r.width, r.height) / 2,
          // Wider seed band [0.18w, 0.82w] × [0.18h, 0.82h] so cards fill
          // the field. Iter-6 used [0.30w, 0.70w] — too tight, left the
          // perimeter black even after d3 converged.
          x: w / 2 + (rng() - 0.5) * 0.64 * w,
          y: h / 2 + (rng() - 0.5) * 0.64 * h,
        });
      }

      if (reduced) {
        const cols = w < 600 ? 3 : 5;
        const sorted = [...measured].sort((a, b) => b.weight - a.weight);
        sorted.forEach((n, i) => {
          n.x = ((i % cols) + 0.5) * (w / cols);
          n.y = (Math.floor(i / cols) + 0.5) * (h / Math.ceil(VOICES.length / cols));
        });
        applyPositions(measured, cardRefs.current);
        if (!cancelled) setSettled(true);
        done = true;
        return;
      }

      // PHASE 2 — d3 sim with REAL halfW/halfH. Centering forces are
      // weaker than Iter-6 (0.04→0.012, 0.025→0.008) so the cluster
      // expands toward edges instead of bunching mid-frame. Collision
      // unchanged.
      const sim = d3
        .forceSimulation<SimNode>(measured)
        .force('center', d3.forceCenter(w / 2, h / 2).strength(0.012))
        .force(
          'collide',
          d3.forceCollide<SimNode>().radius((n) => n.size * 1.04).strength(0.95),
        )
        .force('x', d3.forceX(w / 2).strength(0.008))
        .force('y', d3.forceY(h / 2).strength(0.008))
        .stop();

      const TICKS = 240;
      for (let i = 0; i < TICKS; i++) {
        sim.tick();
        for (const n of measured) {
          const insetX = n.halfW * 1.05;
          const insetY = n.halfH * 1.05;
          if (n.x !== undefined) n.x = Math.max(insetX, Math.min(w - insetX, n.x));
          if (n.y !== undefined) n.y = Math.max(insetY, Math.min(h - insetY, n.y));
        }
      }

      // PHASE 3 — apply final positions and reveal.
      for (const n of measured) {
        const c = cardRefs.current.get(n.id);
        if (!c) continue;
        c.style.left = `${(n.x ?? 0).toFixed(1)}px`;
        c.style.top = `${(n.y ?? 0).toFixed(1)}px`;
        c.style.visibility = '';
      }
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
                // Stagger the fade-in slightly so the cluster appears as a
                // wave rather than all-at-once — feels less abrupt.
                animationDelay: `${Math.min(idx, 40) * 18}ms`,
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

function applyPositions(nodes: SimNode[], cards: Map<number, HTMLDivElement | null>) {
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
    el.style.left = `${(n.x ?? 0).toFixed(1)}px`;
    el.style.top = `${(n.y ?? 0).toFixed(1)}px`;
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
