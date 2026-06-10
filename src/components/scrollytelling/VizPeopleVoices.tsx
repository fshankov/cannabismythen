/**
 * VizPeopleVoices — Step 2 (Iter-17 rewrite, 2026-05-30).
 *
 * A proper billboarded 3-D "opinion sphere" of chat messages, built with
 * the TagCloud/TagCanvas technique: each chip's 2-D screen position +
 * scale + opacity + blur are computed in JS from a per-frame perspective
 * projection, and the chip element itself NEVER rotates in 3-D. So text
 * is always upright and razor-sharp, front messages are dramatically
 * larger than back ones, and it reads as a genuine rotating sphere —
 * even while it slowly turns.
 *
 * Composition:
 *   • 58 readable chips — horizontal iMessage-style bubbles (group-
 *     tinted pills). NOTE (Fedor 2026-06-08): the media/social source
 *     tags and the easter-egg speck were removed so the cloud shows
 *     ONLY the authentic CaRM statements.
 *   • 45 tiny speck fragments forming the iceberg of thousands behind
 *     the readable layer.
 *   • Gentle auto-rotation (paused on hover + when off-screen); reduced
 *     motion → a single static frame.
 *   • Live group-fit-scale keeps the whole sphere inside the canvas at
 *     any width.
 *
 * Step 2 → 3 bridge: when the user scrolls toward Step 3, `falling`
 * flips and every readable chip flies into its 42-cell matrix position
 * (several per cell), holds, then dissolves — leaving the grid that
 * Step 3's real myth matrix takes over. Specks fade immediately.
 *
 * Voice + speck statements are sourced VERBATIM from the CaRM qualitative-
 * stage myth list ("Auswahl Mythen Originalton" — _local/research/
 * "! Mythen From Qualitative stage.xlsx") per Asana task 1215409887535304:
 * the authentic original-tone statements ISD collected, not AI copy. Each
 * chip's group tag (adults/minors/consumers/young_adults/parents/
 * professional) is an editorial/aesthetic choice — it drives the bubble
 * colour + icon only and is NOT a CaRM data attribute. The cloud now
 * holds ONLY these Excel statements — the earlier AI media/social source
 * tags and the easter-egg speck were removed (Fedor 2026-06-08).
 *
 * Perf: ~113 nodes, transform/opacity writes per frame (compositor-
 * friendly), blur throttled to >0.2px deltas. React renders the chip
 * list ONCE; the RAF loop writes element.style directly.
 */
import { useEffect, useRef } from 'react';
import {
  AUDIENCE_ICONS_BY_GROUP,
  IconFachkraefte,
  SOURCE_CATEGORY_ICONS,
  type IconComponent,
  type SourceCategoryId,
} from '../../lib/icons';

interface Props {
  active: boolean;
}

type VoiceGroup =
  | 'adults'
  | 'minors'
  | 'consumers'
  | 'young_adults'
  | 'parents'
  | 'professional';

type ReadableDef =
  | { kind: 'voice'; group: VoiceGroup; text: string; side: 'l' | 'r' | 't' }
  | {
      kind: 'source';
      source: SourceCategoryId;
      tag: string;
      text: string;
    };

const VOICE_ICONS: Record<VoiceGroup, IconComponent> = {
  adults: AUDIENCE_ICONS_BY_GROUP.adults,
  minors: AUDIENCE_ICONS_BY_GROUP.minors,
  consumers: AUDIENCE_ICONS_BY_GROUP.consumers,
  young_adults: AUDIENCE_ICONS_BY_GROUP.young_adults,
  parents: AUDIENCE_ICONS_BY_GROUP.parents,
  professional: IconFachkraefte,
};

/* ── Statement pool — 64 authentic CaRM survey statements, verbatim from the
 *    ISD Excel (refreshed + expanded per Fedor 2026-06-08). Interleaved across
 *    the six voice groups so the sphere shows a mix of colours, not blocks. ── */
const VOICE_POOL: ReadonlyArray<[VoiceGroup, string]> = [
  ['adults', 'ist doch wie Alkohol'],
  ['minors', 'Es kiffen doch eh alle'],
  ['consumers', 'hilft beim Einschlafen'],
  ['young_adults', 'Lieber Kiffen als Saufen!'],
  ['parents', 'Schädlich für Kinder und Jugendliche'],
  ['professional', 'Erhöht Demenzrisiko'],
  ['adults', 'ist weniger schädlich als Alkohol'],
  ['minors', 'Wer kifft, ist cool'],
  ['consumers', 'Lindert Migräne'],
  ['young_adults', 'Spaß haben'],
  ['parents', 'Einstiegsdroge'],
  ['professional', 'Erhöhtes Risiko für Psychosen'],
  ['adults', 'ist ungefährlich'],
  ['minors', 'Peer pressure'],
  ['consumers', 'Lindert Übelkeit'],
  ['young_adults', 'Freiheitsgefühl'],
  ['parents', 'Zerstört Familien'],
  ['professional', 'Risikofaktor für Schizophrenie'],
  ['adults', 'ist nun legal'],
  ['minors', 'Coole Peergroup'],
  ['consumers', 'Wirkt entspannend'],
  ['young_adults', 'macht gute Laune'],
  ['parents', 'Schulabbruch'],
  ['professional', 'Mentale und körperliche Abhängigkeit'],
  ['adults', 'macht faul'],
  ['minors', 'Ansehen in der Peergroup steigt'],
  ['consumers', 'macht kreativer'],
  ['young_adults', 'high sein, Heiterkeit, Euphorie'],
  ['parents', 'Gefahr für Jugendliche'],
  ['professional', 'Suchtpotenzial'],
  ['adults', 'Motivationsverlust'],
  ['minors', 'Jetzt wo es legal ist, kiffen alle'],
  ['consumers', 'Kein Kater am nächsten Tag'],
  ['young_adults', 'gesünder als Alkohol'],
  ['parents', 'Schlechte Noten in der Schule'],
  ['professional', 'Lungenkrebsrisiko'],
  ['adults', 'Es macht müde'],
  ['minors', 'macht high'],
  ['consumers', 'Besser schlafen'],
  ['young_adults', 'Steigert Kreativität'],
  ['parents', 'Ärger zu Hause'],
  ['professional', 'Herzrhythmusstörungen'],
  ['adults', 'Ab und zu Kiffen ist völlig unbedenklich'],
  ['minors', 'Konsum aus Gruppenzwang'],
  ['consumers', 'Wirkt schmerzlindernd'],
  ['young_adults', 'Lässt einen abschalten'],
  ['parents', 'Gruppenzwang unter Jugendlichen'],
  ['professional', 'mindert den IQ'],
  ['adults', 'Von Cannabis ist noch nie jemand gestorben'],
  ['minors', 'Dichtsein'],
  ['consumers', 'hilft bei Schlafproblemen'],
  ['young_adults', 'Zur Ruhe kommen, Abschalten'],
  ['parents', 'Sozialer Abstieg'],
  ['professional', 'Beeinträchtigung der Motorik'],
  ['adults', 'ist ein Allheilmittel'],
  ['minors', 'Zur Gruppe dazu gehören - "Gruppenzwang"'],
  ['consumers', 'Hilft bei chronischen Schmerzen'],
  ['young_adults', 'Ausgelassenheit'],
  ['parents', 'Schädigt das Hirn in der Entwicklung bei Kindern und Jugendlichen'],
  ['professional', 'Entwicklungsverzögerungen des Gehirns bei Jugendlichen'],
  ['consumers', 'innere Ruhe'],
  ['young_adults', 'Lachflash'],
  ['parents', 'Ausbildungsabbruch'],
  ['professional', 'Kardiovaskuläre Effekte'],
];

/** Iter-24 (Fedor 2026-06-08): the cloud must show ONLY the authentic
 *  CaRM statements, so the earlier AI-drafted media/social headlines were
 *  removed — this pool is intentionally empty. The 'source' branch in
 *  buildReadable + the render fork stay inert so the structure (and any
 *  future re-add) remain intact. */
const SOURCE_POOL: ReadonlyArray<[SourceCategoryId, string, string]> = [];

const SPECK_POOL: ReadonlyArray<string> = [
  'Paranoia', 'Lethargie', 'Faulheit', 'Krebsrisiko', 'rote Augen', 'Schmerzfrei',
  'Trägheit', 'Verdummung', 'Tödlich', 'Droge', 'Lachflash', 'Fressflash',
  'innere Ruhe', 'Reizbar', 'Zittern', 'Halluzinationen', 'Schmerzlinderung', 'Krebsheilend',
  'Krebsvorbeugend', 'Auflockernd', 'Stimulierend', 'Kontrollverlust', 'Gewichtsverlust', 'Lungenschäden',
  'Schmerzhemmend', 'macht wach', 'macht labil', 'macht langsam', 'Trockener Mund', 'Verpeiltheit',
  'Verwirrtheit', 'Wahnvorstellungen', 'Stigmatisierung', 'Soziale Isolation', 'Sozialer Abstieg', 'Geldprobleme',
  'Jobverlust', 'Schulprobleme', 'Runterkommen', 'Zugedröhnt sein', 'gerötete Augen', 'Redeflash',
  'Dichtsein', 'Potenz nimmt ab', 'Schlafstörungen',
];

const SPECK_GROUPS: VoiceGroup[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents', 'professional'];
const TAIL_SIDES: Array<'l' | 'r' | 't'> = ['l', 'r', 'l', 'r', 't'];

/** Build the readable list: a source interleaved every ~6 voices. */
function buildReadable(): ReadableDef[] {
  const out: ReadableDef[] = [];
  let si = 0;
  for (let i = 0; i < VOICE_POOL.length; i++) {
    const [group, text] = VOICE_POOL[i];
    out.push({ kind: 'voice', group, text, side: TAIL_SIDES[i % TAIL_SIDES.length] });
    if (i % 6 === 5 && si < SOURCE_POOL.length) {
      const [source, tag, text2] = SOURCE_POOL[si++];
      out.push({ kind: 'source', source, tag, text: text2 });
    }
  }
  while (si < SOURCE_POOL.length) {
    const [source, tag, text2] = SOURCE_POOL[si++];
    out.push({ kind: 'source', source, tag, text: text2 });
  }
  return out;
}

const READABLE = buildReadable();

/** Speck list — no easter egg; only the authentic CaRM speck fragments. */
const SPECK_ITEMS: string[] = SPECK_POOL.slice();

interface SphereNode {
  base: { x: number; y: number; z: number };
  rUnit: number;
  tier: 'readable' | 'speck' | 'egg';
}

/** Fibonacci/golden-spiral points on a unit sphere (even coverage). */
function spiral(n: number): { x: number; y: number; z: number }[] {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = phi * i;
    pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
  }
  return pts;
}

export function VizPeopleVoices(_props: Props) {
  void _props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sphereRef = useRef<HTMLDivElement | null>(null);
  // Chip element refs in render order: readable first, then specks.
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const containerEl = containerRef.current;
    const sphereEl = sphereRef.current;
    if (!containerEl || !sphereEl) return;
    // Non-null typed aliases so the hoisted helper functions below
    // (project / measure / sortToMatrix) don't trip TS's "possibly
    // null" check — function declarations are hoisted, so TS can't
    // rely on the early-return narrowing of `containerRef.current`.
    const container: HTMLDivElement = containerEl;
    const sphere: HTMLDivElement = sphereEl;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Build node geometry (positions only; DOM already rendered) ──
    const nodes: SphereNode[] = [];
    const readPts = spiral(READABLE.length);
    READABLE.forEach((_, i) => {
      nodes.push({ base: readPts[i], rUnit: 1.0, tier: 'readable' });
    });
    const speckPts = spiral(SPECK_ITEMS.length);
    SPECK_ITEMS.forEach((s, i) => {
      const isEgg = s === '__EGG__';
      const rUnit = isEgg ? 1.0 : 0.5 + ((i * 47) % 100) / 100 * 0.55;
      nodes.push({ base: speckPts[i], rUnit, tier: isEgg ? 'egg' : 'speck' });
    });

    const els = () => chipRefs.current;

    // ── Iter-20: per-node "funnel" metadata for the Step 2→3 transition.
    //    Instead of sorting into a matrix, EVERY node (readable + speck +
    //    egg) streams toward the canvas's bottom-right corner and fades
    //    out as `sortProgress` (0→1) tracks the scroll toward Step 3 —
    //    Step 3's matrix then builds up from that same corner (see
    //    VizMythGrid's scroll-driven `--build`). `off` staggers the
    //    stream; `jx/jy` scatter the corner pile so chips don't stack. ──
    type FunnelMeta = { jx: number; jy: number; off: number };
    const funnelMeta: FunnelMeta[] = (() => {
      let jseed = 12345;
      const jr = () => { jseed = (jseed * 9301 + 49297) % 233280; return jseed / 233280 - 0.5; };
      return nodes.map((_, i) => ({ jx: jr(), jy: jr(), off: (i % 12) / 12 * 0.28 }));
    })();
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

    let R = 170;
    let FOCAL = R * 2.5;
    let halfW: number[] = [];
    let halfH: number[] = [];
    const lastBlur: number[] = [];
    const lastScale: number[] = [];
    let angleY = 0.5;
    let angleX = -0.15;
    let paused = false;
    /** Scroll-scrubbed Step 2→3 migration progress, 0 (full sphere) →
     *  1 (all messages in the matrix, dissolved). Updated by the scroll
     *  handler; consumed by the projection loop. */
    let sortProgress = 0;
    let inView = true;
    let hovered: HTMLElement | null = null;

    function measure() {
      const rect = container.getBoundingClientRect();
      R = 0.315 * Math.min(rect.width, rect.height);
      FOCAL = R * 2.5;
      halfW = [];
      halfH = [];
      const e = els();
      for (let i = 0; i < nodes.length; i++) {
        const el = e[i];
        if (!el) { halfW.push(60); halfH.push(14); continue; }
        const r = el.getBoundingClientRect();
        const s = lastScale[i] || 1;
        halfW.push((r.width / s) / 2);
        halfH.push((r.height / s) / 2);
      }
    }

    function project() {
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
      const rect = container.getBoundingClientRect();
      const hcw = rect.width / 2, hch = rect.height / 2;
      const p = sortProgress;
      const funneling = p > 0;
      // Iter-20: bottom-right corner target (local sphere coords,
      // relative to the centred sphere origin). Slightly inset so the
      // pile sits just inside the canvas edge.
      const cornerX = hcw - 16, cornerY = hch - 16;
      const e = els();
      let maxExtent = 1;
      for (let i = 0; i < nodes.length; i++) {
        const el = e[i];
        if (!el) continue;
        const n = nodes[i], b = n.base, Rn = R * n.rUnit;
        const x = b.x * Rn, y = b.y * Rn, z = b.z * Rn;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const scale = FOCAL / (FOCAL - z2);
        const sx = x1 * scale, sy = y2 * scale;
        lastScale[i] = scale;
        const a = Math.max(0, Math.min(1, (z2 / R + 1) / 2));

        // Base (sphere) opacity + blur per tier.
        const baseOp =
          n.tier === 'egg' ? (0.3 + a * 0.7)
          : n.tier === 'speck' ? (0.12 + a * 0.42)
          : (0.4 + a * 0.6);

        let fx = sx, fy = sy, fscale = scale, fop = baseOp;
        let bl =
          n.tier === 'speck' ? (1.3 - a * 0.9)
          : n.tier === 'egg' ? (1 - a) * 1.1
          : (1 - a) * 1.3;

        if (funneling) {
          // Iter-20: everything "falls" into the bottom-right corner and
          // fades out. Accelerating ease (e2 = pe²) gives a gravity feel;
          // specks lead slightly so the readable layer drains last. By
          // p=1 every chip has shrunk into the corner and faded to 0,
          // which is exactly where Step 3's matrix begins to build.
          const fm = funnelMeta[i];
          const lead = n.tier === 'readable' ? 0 : 0.08;
          const pe = clamp01((p - Math.max(0, fm.off - lead)) / (1 - 0.28));
          const e2 = pe * pe;
          const tcx = cornerX + fm.jx * 26;
          const tcy = cornerY + fm.jy * 26;
          fx = sx + (tcx - sx) * e2;
          fy = sy + (tcy - sy) * e2;
          fscale = scale * (1 - 0.72 * e2);
          const fade = 1 - clamp01((pe - 0.5) / 0.5); // hold, then fade out
          fop = baseOp * fade;
          bl = bl * (1 - clamp01(pe * 1.6));           // sharpen as it falls
        }

        el.style.transform =
          'translate(calc(-50% + ' + fx.toFixed(1) + 'px), calc(-50% + ' + fy.toFixed(1) + 'px)) scale(' + fscale.toFixed(3) + ')';
        // Store the true spinning scale so the hover magnify can cap relative
        // to it (and never compound). (Fedor 2026-06-09.)
        el.dataset.s = fscale.toFixed(3);
        el.style.zIndex = String(funneling ? Math.round(500 + a * 200) : Math.round(a * 1000));
        el.style.opacity = fop.toFixed(2);
        if (el.style.filter === 'none' || lastBlur[i] === undefined || Math.abs(lastBlur[i] - bl) > 0.2) { el.style.filter = 'blur(' + bl.toFixed(2) + 'px)'; lastBlur[i] = bl; }

        if (!funneling) {
          const hw = halfW[i] * fscale, hh = halfH[i] * fscale;
          maxExtent = Math.max(maxExtent, (Math.abs(fx) + hw) / hcw, (Math.abs(fy) + hh) / hch);
        }
      }
      // While funnelling, pin --fit to 1 so the corner is reachable
      // without the fit-shrink reacting to the transient corner pile.
      const m = 0.93;
      sphere.style.setProperty('--fit', funneling ? '1' : (maxExtent > m ? (m / maxExtent) : 1).toFixed(3));
    }

    let raf = 0;
    function loop() {
      // Always re-project while in view (so the scroll scrub updates);
      // only advance the auto-rotation when at rest (p≈0) and not
      // hovering / reduced-motion.
      if (inView && !paused) {
        if (!reduced && sortProgress < 0.02) {
          angleY += 0.0009;
          angleX += 0.00006;
        }
        project();
      }
      raf = requestAnimationFrame(loop);
    }

    // ── Hover: pause rotation + magnify the hovered chip to exactly 2×
    //    its natural size. `hovered` tracks the active chip so rapid
    //    chip-to-chip moves never fire a premature paused=false. ──
    function onOver(ev: Event) {
      const t = (ev.target as HTMLElement).closest('.viz-msg, .viz-src') as HTMLElement | null;
      if (!t || t === hovered) return;
      // Cancel the previous chip without resuming rotation yet.
      if (hovered) {
        const prev = hovered;
        prev.classList.remove('is-hover');
        const ps = parseFloat(prev.dataset.s || '1');
        prev.style.transition = 'transform 150ms ease-out, opacity 150ms ease-out, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease';
        prev.style.transform = prev.style.transform.replace(/scale\([\d.]+\)/, 'scale(' + ps.toFixed(3) + ')');
        prev.style.opacity = prev.dataset.prevOpacity || '1';
        setTimeout(() => { prev.style.transition = ''; }, 150);
      }
      hovered = t;
      paused = true;
      t.dataset.prevOpacity = t.style.opacity || '1';
      t.classList.add('is-hover');
      const currentScale = parseFloat(t.dataset.s || '1');
      const targetScale = currentScale + 0.4;
      t.style.transition = 'transform 200ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease, background 200ms ease, border-color 200ms ease, box-shadow 200ms ease';
      t.style.transform = t.style.transform.replace(/scale\([\d.]+\)/, 'scale(' + targetScale.toFixed(3) + ')');
      t.style.opacity = '1';
      t.style.filter = 'none';
    }
    function onOut(ev: Event) {
      const t = (ev.target as HTMLElement).closest('.viz-msg, .viz-src') as HTMLElement | null;
      if (!t || t !== hovered) return;
      const to = (ev as MouseEvent).relatedTarget as Node | null;
      if (to && t.contains(to)) return;
      hovered = null;
      t.classList.remove('is-hover');
      const spinScale = parseFloat(t.dataset.s || '1');
      t.style.transition = 'transform 150ms ease-out, opacity 150ms ease-out, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease';
      t.style.transform = t.style.transform.replace(/scale\([\d.]+\)/, 'scale(' + spinScale.toFixed(3) + ')');
      t.style.opacity = t.dataset.prevOpacity || '1';
      setTimeout(() => {
        t.style.transition = '';
        if (!hovered) paused = false;
      }, 150);
    }
    sphere.addEventListener('mouseover', onOver);
    sphere.addEventListener('mouseout', onOut);

    // ── Scroll-scrubbed migration: map Step 3's position to `sortProgress`
    //    so the messages migrate into the matrix in lockstep with the
    //    swipe. Starts early (Step 3 just entering at the bottom, HI),
    //    completes as Step 3 nears the active band (LO). Reverses
    //    naturally on scroll-up because it's a pure function of scroll. ──
    function onScroll() {
      const step3 = document.querySelector('[data-step="3"]');
      if (!step3) return;
      const r = (step3 as HTMLElement).getBoundingClientRect();
      const vh = window.innerHeight;
      // Iter-20: start the funnel MUCH later so the sphere keeps spinning
      // (sortProgress stays 0 → loop() keeps rotating) through most of the
      // Step-2 reading. The corner-funnel runs over HI→LO and must finish
      // BEFORE Step 3 activates (canvas crossfade to the matrix). These
      // values are tuned so the drain completes just before the swap.
      const HI = vh * 0.85, LO = vh * 0.55;
      sortProgress = clamp01((HI - r.top) / (HI - LO));
    }
    let scrollRaf = 0;
    const scrollHandler = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => { scrollRaf = 0; onScroll(); });
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // ── Init ──
    measure();
    project();
    requestAnimationFrame(() => requestAnimationFrame(() => { measure(); project(); }));
    const ro = new ResizeObserver(() => { measure(); project(); });
    ro.observe(container);
    const io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0.04 });
    io.observe(container);
    onScroll();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      window.removeEventListener('scroll', scrollHandler);
      sphere.removeEventListener('mouseover', onOver);
      sphere.removeEventListener('mouseout', onOut);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // ── Render the chip list once; the RAF loop positions them. ──
  let refIdx = 0;
  const setRef = (el: HTMLSpanElement | null) => {
    chipRefs.current[refIdx] = el;
    refIdx++;
  };
  // Reset the running index each render so refs map by DOM order.
  refIdx = 0;

  return (
    <div className="viz viz-voice-cloud" ref={containerRef}>
      <div className="viz-voice-cloud__sphere" ref={sphereRef}>
        {READABLE.map((c, i) => {
          if (c.kind === 'voice') {
            const Icon = VOICE_ICONS[c.group];
            return (
              <span
                key={'r' + i}
                ref={setRef}
                className={`viz-chip viz-msg viz-msg--${c.side}`}
                data-group={c.group}
                title={c.text}
              >
                <Icon size={11} strokeWidth={1.75} className="viz-chip__icon" aria-hidden="true" />
                {c.text}
              </span>
            );
          }
          const Icon = SOURCE_CATEGORY_ICONS[c.source];
          return (
            <span
              key={'r' + i}
              ref={setRef}
              className="viz-chip viz-src"
              data-source={c.source}
              title={c.text}
            >
              <Icon size={11} strokeWidth={1.75} className="viz-chip__icon" aria-hidden="true" />
              <span className="viz-src__tag">{c.tag}</span>
              {c.text}
            </span>
          );
        })}
        {SPECK_ITEMS.map((s, i) => {
          const grp = SPECK_GROUPS[i % SPECK_GROUPS.length];
          return (
            <span key={'s' + i} ref={setRef} className="viz-chip viz-speck" data-group={grp} title={s}>
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
}
