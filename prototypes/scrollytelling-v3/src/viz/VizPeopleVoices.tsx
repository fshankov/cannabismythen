import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  active: boolean;
}

interface Voice {
  id: number;
  text: string;
}

/** Hand-curated everyday-voice quotes inspired by the 42 myths.
 *  Phase-A approximations; Phase-E will be reviewed against the report's
 *  media-analysis appendix. */
const VOICES: Voice[] = [
  { id: 1, text: 'Macht abhängig wie Heroin.' },
  { id: 2, text: 'Sicherer als Alkohol — wirklich?' },
  { id: 3, text: 'Hilft besser gegen Schmerzen als Pillen.' },
  { id: 4, text: 'Wer kifft, kommt nicht aus dem Bett.' },
  { id: 5, text: 'Naturprodukt — also unbedenklich.' },
  { id: 6, text: 'Cannabis ist eine Einstiegsdroge.' },
  { id: 7, text: 'Macht entspannt — was soll daran schlimm sein?' },
  { id: 8, text: 'Ist jetzt überall erlaubt.' },
  { id: 9, text: 'Wer kifft, wird depressiv.' },
  { id: 10, text: 'Macht Jugendliche dumm.' },
  { id: 11, text: 'Schadet dem ungeborenen Kind.' },
  { id: 12, text: 'Ist medizinisch sehr nützlich.' },
];

interface SimNode extends d3.SimulationNodeDatum {
  id: number;
  text: string;
  // initial randomized "home" position so layout is stable
  x?: number;
  y?: number;
}

export function VizPeopleVoices({ active }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.dataset.reducedMotion === 'true');

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    // Seed deterministic positions
    const rng = mulberry32(1729);
    const nodes: SimNode[] = VOICES.map((v) => ({
      id: v.id,
      text: v.text,
      x: rng() * w,
      y: rng() * h,
    }));

    if (reduced) {
      // Static grid: 4 cols × 3 rows
      const cols = 4;
      nodes.forEach((n, i) => {
        n.x = ((i % cols) + 0.5) * (w / cols);
        n.y = (Math.floor(i / cols) + 0.5) * (h / Math.ceil(VOICES.length / cols));
      });
      applyPositions(nodes, cardRefs.current);
      return;
    }

    const sim = d3
      .forceSimulation<SimNode>(nodes)
      .force('center', d3.forceCenter(w / 2, h / 2).strength(0.05))
      .force('collide', d3.forceCollide(95).strength(0.85))
      .force('x', d3.forceX(w / 2).strength(0.04))
      .force('y', d3.forceY(h / 2).strength(0.04))
      .alphaDecay(0.04)
      .on('tick', () => {
        applyPositions(nodes, cardRefs.current);
      });

    return () => {
      sim.stop();
    };
  }, []);

  // Re-trigger gentle drift when active toggles
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      const cards = cardRefs.current;
      cards.forEach((el) => {
        if (!el) return;
        // small random jitter via CSS for life
        el.animate(
          [
            { transform: el.style.transform + ' translate(0, 0)' },
            { transform: el.style.transform + ' translate(2px, -3px)' },
            { transform: el.style.transform + ' translate(0, 0)' },
          ],
          { duration: 4000 + Math.random() * 2000, iterations: 1 },
        );
      });
    }, 6000);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="viz" style={{ width: '100%' }}>
      <div className="viz-voices" ref={containerRef} style={{ height: 480, width: '100%' }}>
        {VOICES.map((v) => (
          <div
            key={v.id}
            ref={(el) => {
              cardRefs.current.set(v.id, el);
            }}
            className="viz-voice-card"
            tabIndex={0}
            style={{ left: 0, top: 0 }}
          >
            <span className="viz-voice-card__glyph" aria-hidden="true">„</span>
            <span className="viz-voice-card__quote">{v.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function applyPositions(nodes: SimNode[], cards: Map<number, HTMLDivElement | null>) {
  for (const n of nodes) {
    const el = cards.get(n.id);
    if (!el) continue;
    el.style.transform = `translate(${(n.x ?? 0).toFixed(1)}px, ${(n.y ?? 0).toFixed(1)}px) translate(-50%, -50%)`;
  }
}

/** Tiny seeded RNG for deterministic layouts during development. */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
