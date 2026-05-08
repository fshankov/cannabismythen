import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  active: boolean;
}

interface Voice {
  id: number;
  text: string;
  /** 0..1 — relative weight, mapped to font size + bubble scale.
   *  Approximates how widespread the underlying belief is. */
  weight: number;
}

/** 28 hand-curated everyday voices loosely grounded in CaRM's media analysis.
 *  Weight ≈ awareness magnitude (0.35 = niche, 1.0 = ubiquitous). */
const VOICES: Voice[] = [
  { id: 1,  text: 'Hilft besser gegen Schmerzen als Pillen.',     weight: 1.00 },
  { id: 2,  text: 'Cannabis ist eine Einstiegsdroge.',             weight: 0.95 },
  { id: 3,  text: 'Macht entspannt — was soll daran schlimm sein?', weight: 0.90 },
  { id: 4,  text: 'Sicherer als Alkohol — wirklich?',              weight: 0.85 },
  { id: 5,  text: 'Schadet dem ungeborenen Kind.',                 weight: 0.80 },
  { id: 6,  text: 'Wer kifft, kommt nicht aus dem Bett.',          weight: 0.75 },
  { id: 7,  text: 'Hilft beim Schlafen — fast wie ein Tee.',       weight: 0.72 },
  { id: 8,  text: 'Macht abhängig wie Heroin.',                    weight: 0.68 },
  { id: 9,  text: 'Verändert die Wahrnehmung total.',              weight: 0.65 },
  { id: 10, text: 'Naturprodukt — also unbedenklich.',             weight: 0.62 },
  { id: 11, text: 'Junge Gehirne nehmen Schaden, klar.',           weight: 0.58 },
  { id: 12, text: 'Ist jetzt überall erlaubt.',                    weight: 0.55 },
  { id: 13, text: 'Wer kifft, wird depressiv.',                    weight: 0.52 },
  { id: 14, text: 'Macht Jugendliche dumm.',                       weight: 0.50 },
  { id: 15, text: 'Macht kreativ und entspannt zugleich.',         weight: 0.48 },
  { id: 16, text: 'Mischen mit Alkohol ist riskant.',              weight: 0.46 },
  { id: 17, text: 'Hilft gegen Angststörungen.',                   weight: 0.44 },
  { id: 18, text: 'Streckmittel sind das eigentliche Problem.',    weight: 0.42 },
  { id: 19, text: 'Ist medizinisch sehr nützlich.',                weight: 0.40 },
  { id: 20, text: 'Cool ist das jedenfalls nicht mehr.',           weight: 0.38 },
  { id: 21, text: 'Hilft gegen Übelkeit bei Chemo.',               weight: 0.36 },
  { id: 22, text: 'Lungenkrebs durch Joints? Wahrscheinlich.',     weight: 0.35 },
  { id: 23, text: 'Hilft sogar bei ADHS, sagt mein Cousin.',       weight: 0.34 },
  { id: 24, text: 'Wer regelmäßig kifft, ist sozial schwächer.',   weight: 0.33 },
  { id: 25, text: 'Allheilmittel — alles Marketing.',              weight: 0.32 },
  { id: 26, text: 'Überdosis? Nein, davon stirbt man nicht.',      weight: 0.31 },
  { id: 27, text: 'Kann man eigentlich gar nicht überdosieren.',   weight: 0.30 },
  { id: 28, text: 'Eine Mehrheit kifft heute doch eh, oder?',      weight: 0.30 },
];

interface SimNode extends d3.SimulationNodeDatum {
  id: number;
  text: string;
  weight: number;
  size: number;
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

    const rng = mulberry32(31337);
    const nodes: SimNode[] = VOICES.map((v) => {
      // Bubble width estimate from weight (12–17px font, ~10ch)
      const fontSize = 11 + v.weight * 6;
      const padding = 14;
      const ch = v.text.length;
      const wEst = Math.min(260, ch * fontSize * 0.42 + padding * 2);
      const hEst = fontSize * (ch > 28 ? 3.4 : 2.4) + padding;
      return {
        id: v.id,
        text: v.text,
        weight: v.weight,
        size: Math.max(wEst, hEst) / 2 + 8,
        x: rng() * w,
        y: rng() * h,
      };
    });

    if (reduced) {
      // Static masonry-ish grid (5 cols × 6 rows) sorted by weight desc
      const cols = w < 600 ? 3 : 5;
      const sorted = [...nodes].sort((a, b) => b.weight - a.weight);
      sorted.forEach((n, i) => {
        n.x = ((i % cols) + 0.5) * (w / cols);
        n.y = (Math.floor(i / cols) + 0.5) * (h / Math.ceil(VOICES.length / cols));
      });
      applyPositions(nodes, cardRefs.current);
      return;
    }

    const sim = d3
      .forceSimulation<SimNode>(nodes)
      .force('center', d3.forceCenter(w / 2, h / 2).strength(0.04))
      .force(
        'collide',
        d3.forceCollide<SimNode>().radius((n) => n.size).strength(0.9),
      )
      .force('x', d3.forceX(w / 2).strength(0.025))
      .force('y', d3.forceY(h / 2).strength(0.04))
      .alphaDecay(0.04)
      .on('tick', () => applyPositions(nodes, cardRefs.current));

    return () => {
      sim.stop();
    };
  }, []);

  return (
    <div className="viz" style={{ width: '100%' }}>
      <div className="viz-voices" ref={containerRef} style={{ height: 560, width: '100%' }}>
        {VOICES.map((v) => {
          const fontSize = 11 + v.weight * 6;
          const opacity = 0.55 + v.weight * 0.45;
          return (
            <div
              key={v.id}
              ref={(el) => {
                cardRefs.current.set(v.id, el);
              }}
              className={`viz-voice-card ${active ? 'viz-voice-card--in' : ''}`}
              tabIndex={0}
              style={{
                left: 0,
                top: 0,
                fontSize: `${fontSize.toFixed(1)}px`,
                opacity,
              }}
              title={v.text}
            >
              <span className="viz-voice-card__glyph" aria-hidden="true">„</span>
              <span className="viz-voice-card__quote">{v.text}</span>
              <span className="viz-voice-card__tail" aria-hidden="true" />
            </div>
          );
        })}
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

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
