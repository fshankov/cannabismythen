import { useRef, useEffect } from "react";
import { VERDICT_GLYPHS } from "../shared/verdictGlyph";
import type { CorrectnessClass } from "../../lib/dashboard/types";
import "./HeroBlock.css";

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeroMyth {
  /** The FULL myth statement (stripped of the "Mythos N:" prefix) — shown as
   *  the caption that fades in when the glyph reveals. */
  text: string;
  /** richtig | eher_richtig | eher_falsch | falsch | keine_aussage */
  classification: string;
}

interface Props {
  myths: HeroMyth[];
  headline1: string;
  headline2: string;
  eyebrow: string;
}

// ── Scattered verdict-glyph field ────────────────────────────────────────────
// The 42 myths are scattered across the hero as VERDICT GLYPHS (the same
// chevron/arrow marker the dashboard uses — one per myth's classification).
// Poisson-disk placement keeps them non-overlapping, with the centre (headline)
// and chrome kept clear.
// At rest every glyph is WHITE + blurred (colourless) and no text shows. When
// the visitor hovers the nearest one — or the auto-spotlight cycles to one —
// that glyph GRADUALLY gains its verdict colour, sharpens, and its FULL
// statement fades in below it.
//
// Motion: only a gentle per-myth orbit (CSS) — no global sway/breathing.
// Reveal is JS-eased (slow); only the active node gets per-frame style writes.

// Rest colour for the colourless (white, blurred) glyph field.
const REST_WHITE: [number, number, number] = [237, 244, 240]; // #edf4f0
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}
// Map the legacy `keine_aussage` spelling to the canonical glyph verdict.
function asVerdict(cls: string): CorrectnessClass {
  return (cls === "keine_aussage" ? "keine_aussage_moeglich" : cls) as CorrectnessClass;
}

// Lit (revealed) glyph colours — the LIGHTER dark-background verdict palette
// (the dashboard's own colours are too dark to read on the forest hero). main =
// chevron + vertical shaft, shadow = the flat base line. Keyed by class string.
const LIT_GLYPH: Record<string, { main: [number, number, number]; shadow: [number, number, number] }> = {
  richtig:       { main: hexToRgb("#6bc4a0"), shadow: hexToRgb("#a7d3c5") },
  eher_richtig:  { main: hexToRgb("#9bcc6b"), shadow: hexToRgb("#c2d3a3") },
  eher_falsch:   { main: hexToRgb("#e0b07a"), shadow: hexToRgb("#e0b58d") },
  falsch:        { main: hexToRgb("#e58d83"), shadow: hexToRgb("#e9a8b9") },
  keine_aussage: { main: hexToRgb("#aebbc2"), shadow: hexToRgb("#aebbc2") },
};
function litGlyph(cls: string) {
  return LIT_GLYPH[cls] ?? LIT_GLYPH.keine_aussage;
}

// Build the verdict glyph as an inline SVG (same marker as VerdictArrow /
// verdictGlyph): a rotated chevron + vertical shaft (.cmh-g-mn) over a flat
// base line (.cmh-g-sh). The two stroke colours are driven by CSS vars
// (--gmain / --gshadow) so the reveal can lerp white→verdict per frame.
const SVGNS = "http://www.w3.org/2000/svg";
function buildGlyph(cls: string): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "32");
  svg.setAttribute("height", "32");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", "cmh__glyph");
  const mk = (d: string, cssClass: string) => {
    const p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", d);
    p.setAttribute("class", cssClass);
    return p;
  };
  const v = asVerdict(cls);
  const spec =
    v !== "keine_aussage_moeglich"
      ? VERDICT_GLYPHS[v as Exclude<CorrectnessClass, "keine_aussage_moeglich">]
      : undefined;
  if (!spec) {
    svg.appendChild(mk("M2 16h20", "cmh-g-sh")); // flat line — no scientific verdict
    return svg;
  }
  const g = document.createElementNS(SVGNS, "g");
  g.setAttribute("transform", `rotate(${spec.rotation} 12 12)`);
  g.appendChild(mk("M2 16h20", "cmh-g-sh"));
  g.appendChild(mk("M12 2v14", "cmh-g-mn"));
  g.appendChild(mk("m5 9 7 7 7-7", "cmh-g-mn"));
  svg.appendChild(g);
  return svg;
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// Tiny seeded RNG (deterministic, stable layout/float across reloads).
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

// Poisson-disk sampling (Bridson) in [ox,ox+W]×[oy,oy+H] with minimum distance r
// between points and an `accept(x,y)` mask (global coords). Returns up to maxN
// organically-scattered, non-overlapping points.
function bridson(
  ox: number, oy: number, W: number, H: number, r: number,
  accept: (x: number, y: number) => boolean, rng: () => number, maxN: number,
): { x: number; y: number }[] {
  const k = 30, cell = r / Math.SQRT2;
  const gw = Math.max(1, Math.ceil(W / cell)), gh = Math.max(1, Math.ceil(H / cell));
  const grid = new Int32Array(gw * gh).fill(-1);
  const pts: { x: number; y: number }[] = [];
  const active: number[] = [];
  const fits = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (!accept(ox + x, oy + y)) return false;
    const cxi = Math.floor(x / cell), cyi = Math.floor(y / cell);
    for (let yy = Math.max(0, cyi - 2); yy <= Math.min(gh - 1, cyi + 2); yy++)
      for (let xx = Math.max(0, cxi - 2); xx <= Math.min(gw - 1, cxi + 2); xx++) {
        const id = grid[xx + yy * gw];
        if (id >= 0) { const p = pts[id]; if ((p.x - x) ** 2 + (p.y - y) ** 2 < r * r) return false; }
      }
    return true;
  };
  const add = (x: number, y: number) => {
    const id = pts.length; pts.push({ x, y }); active.push(id);
    grid[Math.floor(x / cell) + Math.floor(y / cell) * gw] = id;
  };
  // Seed MANY points (not one): when the centre exclusion zone splits the field
  // into disconnected regions (common on narrow screens, where the headline box
  // spans nearly full width), a single flood-fill seed would only fill its own
  // region. Scattered seeds give every region coverage → an even field.
  const seeds = Math.max(10, Math.ceil(maxN / 4));
  for (let t = 0; t < 1200 && active.length < seeds && pts.length < maxN; t++) {
    const x = rng() * W, y = rng() * H; if (fits(x, y)) add(x, y);
  }
  while (active.length && pts.length < maxN) {
    const ai = Math.floor(rng() * active.length), a = pts[active[ai]];
    let ok = false;
    for (let t = 0; t < k; t++) {
      const ang = rng() * Math.PI * 2, dist = r * (1 + rng());
      const x = a.x + Math.cos(ang) * dist, y = a.y + Math.sin(ang) * dist;
      if (fits(x, y)) { add(x, y); ok = true; break; }
    }
    if (!ok) active.splice(ai, 1);
  }
  return pts.map((p) => ({ x: ox + p.x, y: oy + p.y }));
}

interface Node {
  slot: HTMLDivElement;
  float: HTMLDivElement;
  glyph: SVGSVGElement;       // the floating verdict marker
  cap: HTMLDivElement;        // the full-statement caption (hidden at rest)
  cls: string;
  litMain: [number, number, number];
  litShadow: [number, number, number];
  fdx: number;            // orbit direction (unit) — amplitude applied in layout
  fdy: number;
  x: number;
  y: number;
  curT: number;
  state: "rest" | "lit";
}

export function HeroBlock({ myths, headline1, headline2, eyebrow }: Props) {
  const heroRef  = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const h1Ref    = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const hero  = heroRef.current;
    const cloud = cloudRef.current;
    const flash = flashRef.current;
    const h1    = h1Ref.current;
    if (!hero || !cloud || !h1) return;

    const isTouch = window.matchMedia("(hover: none)").matches;
    const reduce  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const N = myths.length;
    const AUTO_STEP = 4250;       // how long each myth stays in the spotlight
    const R_CUR = 180;            // hover reveal radius (px)
    const REVEAL = 0.06;          // myth reveal lerp — slow ease-in (~1s)

    // ── Build the 42 myth nodes (slot > float > glyph + caption) ────────────
    cloud.replaceChildren();
    const frng = makeRng(9173);
    const nodes: Node[] = myths.map((m, i) => {
      const slot = document.createElement("div");
      slot.className = "cmh__slot";
      slot.style.setProperty("--i", String(i));
      const float = document.createElement("div");
      float.className = "cmh__float";
      const ang = frng() * Math.PI * 2;                       // random orbit orientation
      float.style.setProperty("--fdur", (10 + frng() * 7).toFixed(1) + "s");
      float.style.setProperty("--fdelay", (-frng() * 20).toFixed(1) + "s");
      const glyph = buildGlyph(m.classification);
      const cap = document.createElement("div");
      cap.className = "cmh__cap";
      cap.textContent = m.text;                               // FULL myth statement
      const lit = litGlyph(m.classification);
      cap.style.color = `rgb(${lit.main[0]},${lit.main[1]},${lit.main[2]})`;
      float.appendChild(glyph); float.appendChild(cap);
      slot.appendChild(float); cloud.appendChild(slot);
      return {
        slot, float, glyph, cap, cls: m.classification,
        litMain: lit.main, litShadow: lit.shadow,
        fdx: Math.cos(ang), fdy: Math.sin(ang),
        x: 0, y: 0, curT: 0, state: "rest",
      };
    });

    // ── Layout: jittered-grid scatter, central zone + chrome kept clear ──────
    function layout() {
      const W = hero!.clientWidth, H = hero!.clientHeight;
      const mobile = W < 768;
      const topSafe = 112, botSafe = mobile ? 150 : 132;
      const gutter = Math.min(Math.max(W * 0.04, 18), 72);
      const uL = gutter, uR = W - gutter, uT = topSafe, uB = H - botSafe;
      const uW = uR - uL, uH = uB - uT;

      // Central exclusion zone = bbox of eyebrow + headline (+ padding).
      const hr = hero!.getBoundingClientRect();
      const eyebrow = hero!.querySelector<HTMLElement>(".cmhero__eyebrow");
      const boxes = [h1!, eyebrow].filter(Boolean) as HTMLElement[];
      let ex0 = Infinity, ey0 = Infinity, ex1 = -Infinity, ey1 = -Infinity;
      for (const el of boxes) {
        const r = el.getBoundingClientRect();
        ex0 = Math.min(ex0, r.left - hr.left); ey0 = Math.min(ey0, r.top - hr.top);
        ex1 = Math.max(ex1, r.right - hr.left); ey1 = Math.max(ey1, r.bottom - hr.top);
      }
      const pad = mobile ? 22 : 38;
      ex0 -= pad; ey0 -= pad; ex1 += pad; ey1 += pad;

      // Chaotic scatter via Poisson-disk (Bridson): organic random placement with
      // a guaranteed minimum distance `rDist` between every pair → no overlap, no
      // grid look. Centre (headline) and chrome are excluded. The glyphs
      // are small + uniform (~32px), so spacing is generous and they float freely.
      const glyphW = 34;
      const accept = (x: number, y: number) =>
        !(x > ex0 && x < ex1 && y > ey0 && y < ey1) && x >= uL && x <= uR && y >= uT && y <= uB;

      const exclW = Math.max(0, Math.min(ex1, uR) - Math.max(ex0, uL));
      const exclH = Math.max(0, Math.min(ey1, uB) - Math.max(ey0, uT));
      const availArea = Math.max(1, uW * uH - exclW * exclH);
      // Bridson packs ~N points when r ≈ sqrt(area / (1.25·N)); start near there
      // and shrink r until all N land (smaller r packs more). Bounded → no spin.
      let rDist = Math.max(glyphW + 18, Math.sqrt(availArea / (1.25 * N)));
      let placed: { x: number; y: number }[] = [];
      for (let attempt = 0; attempt < 12 && placed.length < N; attempt++) {
        placed = bridson(uL, uT, uW, uH, rDist, accept, makeRng(4242 + attempt), N);
        if (placed.length < N) rDist *= 0.88;
      }
      // Bounded best-effort fill, then a guaranteed edge-pad so every slot has a
      // point (never an undefined index, never an infinite loop).
      const frng2 = makeRng(99);
      for (let g = 0; placed.length < N && g < N * 120; g++) {
        const x = uL + frng2() * uW, y = uT + frng2() * uH;
        if (accept(x, y)) placed.push({ x, y });
      }
      while (placed.length < N) {
        const k = placed.length;
        placed.push({ x: uL + (((k * 53) % 100) / 100) * uW, y: k % 2 ? uT + 12 : uB - 12 });
      }
      // Orbit amplitude: as large as the spacing safely allows (peak per-axis
      // excursion ≤ floatAmp; min pair distance rDist, glyph footprint glyphW →
      // 2·floatAmp < gap keeps neighbours from ever touching).
      const floatAmp = Math.max(6, Math.min(20, (rDist - glyphW) / 2 - 2));
      for (let i = 0; i < N; i++) {
        const n = nodes[i], p = placed[i];
        n.x = p.x; n.y = p.y;
        n.slot.style.left = p.x.toFixed(1) + "px";
        n.slot.style.top = p.y.toFixed(1) + "px";
        n.float.style.setProperty("--fx", (n.fdx * floatAmp).toFixed(1) + "px");
        n.float.style.setProperty("--fy", (n.fdy * floatAmp).toFixed(1) + "px");
      }
    }

    // ── Rest / lit styling — white blurred glyph at rest; verdict colour +
    //    full-statement caption as it reveals. ────────────────────────────────
    const WHITE = `rgb(${REST_WHITE[0]},${REST_WHITE[1]},${REST_WHITE[2]})`;
    function applyRest(n: Node) {
      n.glyph.style.setProperty("--gmain", WHITE);
      n.glyph.style.setProperty("--gshadow", WHITE);
      n.glyph.style.opacity = "0.5";
      n.glyph.style.filter = "blur(2.4px)";
      n.glyph.style.transform = "scale(1)";
      n.cap.style.opacity = "0";
      n.slot.style.zIndex = "";
    }
    function applyLit(n: Node, t: number) {
      n.glyph.style.setProperty("--gmain", mix(REST_WHITE, n.litMain, t));
      n.glyph.style.setProperty("--gshadow", mix(REST_WHITE, n.litShadow, t));
      n.glyph.style.opacity = (0.5 + t * 0.5).toFixed(3);
      n.glyph.style.filter = `blur(${((1 - t) * 2.4).toFixed(2)}px)`;
      n.glyph.style.transform = `scale(${(1 + t * 0.2).toFixed(3)})`;
      // Full statement fades in (a touch ahead of the glyph) and lifts above
      // the neighbouring glyphs.
      n.cap.style.opacity = Math.min(1, t * 1.25).toFixed(3);
      if (t > 0.2) n.slot.style.zIndex = "6";
    }

    let curX = -1e5, curY = -1e5, curOn = false;

    layout();
    nodes.forEach(applyRest);

    const t0 = performance.now();
    let raf = 0;

    function frame(now: number) {
      const el = Math.max(0, now - t0);

      // Hover = single myth: nearest to the cursor within R_CUR.
      let nearestI = -1, nearestD = Infinity;
      if (curOn) {
        for (let i = 0; i < N; i++) {
          const d = Math.hypot(nodes[i].x - curX, nodes[i].y - curY);
          if (d < nearestD) { nearestD = d; nearestI = i; }
        }
      }
      const hoverActive = curOn && nearestI >= 0 && nearestD < R_CUR;

      // Auto-spotlight: cycle by index.
      const autoIdx = Math.floor(el / AUTO_STEP) % N;

      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        const target = hoverActive
          ? (i === nearestI ? smooth(1 - nearestD / R_CUR) : 0)
          : (i === autoIdx ? 1 : 0);
        n.curT += (target - n.curT) * REVEAL;
        if (n.curT > 0.012) { applyLit(n, n.curT); n.state = "lit"; }
        else if (n.state === "lit") { applyRest(n); n.curT = 0; n.state = "rest"; }
      }

      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      const spread = [0, Math.floor(N / 4), Math.floor(N / 2), Math.floor((3 * N) / 4)];
      spread.forEach((i) => { if (nodes[i]) { applyLit(nodes[i], 1); nodes[i].curT = 1; nodes[i].state = "lit"; } });
    } else {
      raf = requestAnimationFrame(frame);
    }

    // ── Events ──────────────────────────────────────────────────────────────
    let rt = 0;
    const onResize = () => { window.clearTimeout(rt); rt = window.setTimeout(layout, 120); };
    window.addEventListener("resize", onResize, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    const onMove = (e: MouseEvent) => {
      if (isTouch) return;
      const r = hero!.getBoundingClientRect();
      curX = e.clientX - r.left; curY = e.clientY - r.top; curOn = true;
      if (flash) flash.style.transform = `translate(${curX}px, ${curY}px)`;
    };
    const onLeave = () => { curOn = false; };
    if (!isTouch) {
      hero.addEventListener("mousemove", onMove, { passive: true });
      hero.addEventListener("mouseleave", onLeave);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      cloud.replaceChildren();
    };
  }, [myths]);

  return (
    <section
      ref={heroRef}
      className="cmhero"
      aria-label="Einstieg: Cannabis-Mythen und ihre Einordnung"
      data-screen-label="Hero"
    >
      <div className="cmhero__bg" aria-hidden="true"></div>
      <div className="cmhero__flash" ref={flashRef} aria-hidden="true"></div>
      <div className="cmhero__cloud" ref={cloudRef} aria-hidden="true"></div>
      <div className="cmhero__vig" aria-hidden="true"></div>

      <div className="cmhero__center">
        <p className="cmhero__eyebrow">{eyebrow}</p>
        <h1 className="cmhero__head" ref={h1Ref}>
          <span className="cmhero__head-a">{headline1}</span>
          <span className="cmhero__head-b">{headline2}</span>
        </h1>
      </div>

      {/* Scroll-down cue — a down arrow that bobs ABOVE a STATIC baseline (only
          the arrow moves; the line stays fixed at the bottom). Scrolls to the
          "Über das Projekt" block. Desktop only (the mobile tab bar owns the
          bottom edge there). */}
      <a
        className="cmhero__scroll"
        href="#projekt-teaser"
        aria-label="Mehr über das Projekt — nach unten scrollen"
        onClick={(e) => {
          const t = document.getElementById("projekt-teaser");
          if (!t) return;
          e.preventDefault();
          const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          t.scrollIntoView({ behavior: rm ? "auto" : "smooth", block: "start" });
        }}
      >
        <svg
          className="cmhero__scroll-glyph"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* static baseline — never moves */}
          <path className="cmhero__scroll-line" d="M2 16h20" />
          {/* the only moving part — rests tip-on-line (= the original verdict
              glyph), hops up and falls back to touch the line */}
          <g className="cmhero__scroll-arrow">
            <path d="M12 2v14" />
            <path d="m5 9 7 7 7-7" />
          </g>
        </svg>
      </a>
    </section>
  );
}

export default HeroBlock;
