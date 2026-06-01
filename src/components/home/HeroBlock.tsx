import { useRef, useEffect, useState } from "react";
import VerdictArrow from "../shared/VerdictArrow";
import type { CorrectnessClass } from "../../lib/dashboard/types";
import "./HeroBlock.css";

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeroMyth {
  /** The myth statement, already stripped of the "Mythos N:" prefix. */
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

// ── Scattered myth field ────────────────────────────────────────────────────
// The 42 myth statements are scattered across the whole hero (jittered grid:
// no overlap, breathing room, and the centre — headline + Lupe — stays clear).
// At rest every statement is WHITE + blurred (no colour). When the visitor
// hovers the nearest one, or the auto-spotlight cycles to one, that statement
// GRADUALLY gains its verdict colour and sharpens; the others stay white.
// The verdict glyph inside the Lupe reveals at the same slow pace.
//
// Motion: only a whisper-subtle per-myth float (CSS) — no global sway/breathing.
// Reveal is JS-eased (slow); only the active node gets per-frame style writes.

// Verdict colours for the revealed (lit) state + glow.
interface VColor { c: string; g: string }
const TXT: Record<string, VColor> = {
  richtig:       { c: "#6bc4a0", g: "rgba(107,196,160,.55)" },
  eher_richtig:  { c: "#9bcc6b", g: "rgba(155,204,107,.5)" },
  eher_falsch:   { c: "#e0b07a", g: "rgba(224,176,122,.5)" },
  falsch:        { c: "#e58d83", g: "rgba(229,141,131,.55)" },
  keine_aussage: { c: "#aebbc2", g: "rgba(174,187,194,.4)" },
};
const REST_WHITE: [number, number, number] = [237, 244, 240]; // #edf4f0
function txt(cls: string) {
  return TXT[cls] || TXT.keine_aussage;
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}
// Map the legacy `keine_aussage` spelling to the canonical glyph verdict.
function asVerdict(cls: string): CorrectnessClass {
  return (cls === "keine_aussage" ? "no_classification" : cls) as CorrectnessClass;
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
  span: HTMLDivElement;
  cls: string;
  t: VColor;
  rgb: [number, number, number];
  fdx: number;            // float direction (unit) — amplitude applied in layout
  fdy: number;
  x: number;
  y: number;
  curT: number;
  state: "rest" | "lit";
}

export function HeroBlock({ myths, headline1, headline2, eyebrow }: Props) {
  const heroRef  = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const h1Ref    = useRef<HTMLHeadingElement>(null);

  const [activeVerdict, setActiveVerdict] = useState<string>(
    myths[0]?.classification ?? "keine_aussage",
  );

  useEffect(() => {
    const hero  = heroRef.current;
    const cloud = cloudRef.current;
    const glass = glassRef.current;
    const flash = flashRef.current;
    const h1    = h1Ref.current;
    if (!hero || !cloud || !glass || !h1) return;

    const isTouch = window.matchMedia("(hover: none)").matches;
    const reduce  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const N = myths.length;
    const AUTO_STEP = 4250;       // how long each myth stays in the spotlight
    const R_CUR = 180;            // hover reveal radius (px)
    const REVEAL = 0.06;          // myth reveal lerp — slow ease-in (~1s)

    // ── Build the 42 myth nodes (slot > float > text) ───────────────────────
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
      const span = document.createElement("div");
      span.className = "cmh__text";
      span.textContent = m.text;
      float.appendChild(span); slot.appendChild(float); cloud.appendChild(slot);
      return {
        slot, float, span, cls: m.classification, t: txt(m.classification),
        rgb: hexToRgb(txt(m.classification).c), fdx: Math.cos(ang), fdy: Math.sin(ang),
        x: 0, y: 0, curT: 0, state: "rest",
      };
    });

    // ── Layout: jittered-grid scatter, central zone + chrome kept clear ──────
    let cx = 0, lupeCx = 0, lupeCy = 0, lupeR = 0;
    function layout() {
      const W = hero!.clientWidth, H = hero!.clientHeight;
      cx = W / 2;
      const mobile = W < 768;
      const topSafe = 112, botSafe = mobile ? 150 : 132;
      const gutter = Math.min(Math.max(W * 0.04, 18), 72);
      const uL = gutter, uR = W - gutter, uT = topSafe, uB = H - botSafe;
      const uW = uR - uL, uH = uB - uT;

      // Park the Lupe in the clear gap under the headline (never into chrome).
      const hb = h1!.getBoundingClientRect(), hr = hero!.getBoundingClientRect();
      const glassH = glass!.offsetHeight || 84, glassW = glass!.offsetWidth || 84;
      let gtop = (hb.bottom - hr.top) + 56;
      gtop = Math.min(Math.max(gtop, uT + 8), uB - glassH);
      glass!.style.top = gtop + "px";
      lupeCx = cx; lupeCy = gtop; lupeR = glassW / 2 + 20;

      // Central exclusion zone = bbox of eyebrow + headline + Lupe (+ padding).
      const eyebrow = hero!.querySelector<HTMLElement>(".cmhero__eyebrow");
      const boxes = [h1!, eyebrow, glass!].filter(Boolean) as HTMLElement[];
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
      // grid look. Centre (headline + Lupe) and chrome are excluded. Labels are
      // short (text_short_de) so the rest width can stay narrow → room to float.
      const restLabelW = Math.max(50, Math.min(uW / 20, 66));
      cloud!.style.setProperty("--cmh-lw", restLabelW.toFixed(0) + "px");
      const accept = (x: number, y: number) =>
        !(x > ex0 && x < ex1 && y > ey0 && y < ey1) && x >= uL && x <= uR && y >= uT && y <= uB;

      const exclW = Math.max(0, Math.min(ex1, uR) - Math.max(ex0, uL));
      const exclH = Math.max(0, Math.min(ey1, uB) - Math.max(ey0, uT));
      const availArea = Math.max(1, uW * uH - exclW * exclH);
      // Bridson packs ~N points when r ≈ sqrt(area / (1.25·N)); start near there
      // and shrink r until all N land (smaller r packs more). Bounded → no spin.
      let rDist = Math.max(restLabelW + 14, Math.sqrt(availArea / (1.25 * N)));
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
      // Orbit amplitude: as large as the inter-label spacing safely allows
      // (peak per-axis excursion ≤ floatAmp; min pair distance is rDist, label
      // width restLabelW → 2·floatAmp < gap keeps neighbours from ever touching).
      const floatAmp = Math.max(5, Math.min(18, (rDist - restLabelW) / 2 - 2));
      for (let i = 0; i < N; i++) {
        const n = nodes[i], p = placed[i];
        n.x = p.x; n.y = p.y;
        n.slot.style.left = p.x.toFixed(1) + "px";
        n.slot.style.top = p.y.toFixed(1) + "px";
        n.float.style.setProperty("--fx", (n.fdx * floatAmp).toFixed(1) + "px");
        n.float.style.setProperty("--fy", (n.fdy * floatAmp).toFixed(1) + "px");
      }
    }

    // ── Rest / lit styling — white at rest, verdict colour as it reveals ─────
    function applyRest(n: Node) {
      n.span.style.color = `rgb(${REST_WHITE[0]},${REST_WHITE[1]},${REST_WHITE[2]})`;
      n.span.style.opacity = "0.5";
      n.span.style.filter = "blur(3px)";
      n.span.style.transform = "scale(1)";
      n.span.style.fontWeight = "500";
      n.span.style.textShadow = "none";
      n.span.classList.remove("cmh__text--full");   // back to capped + clamped
      n.slot.style.zIndex = "";
    }
    function applyLit(n: Node, t: number) {
      n.span.style.color = mix(REST_WHITE, n.rgb, t);
      n.span.style.opacity = (0.5 + t * 0.5).toFixed(3);
      n.span.style.filter = `blur(${((1 - t) * 3).toFixed(2)}px)`;
      n.span.style.transform = `scale(${(1 + t * 0.16).toFixed(3)})`;
      n.span.style.fontWeight = t > 0.55 ? "700" : "500";
      n.span.style.textShadow = t > 0.05 ? `0 0 ${(24 * t).toFixed(1)}px ${n.t.g}, 0 0 8px ${n.t.g}` : "none";
      // Once revealing, show the FULL statement (no width cap / clamp) above the
      // others — so the spotlit myth is never truncated with "…".
      if (t > 0.25) { n.span.classList.add("cmh__text--full"); n.slot.style.zIndex = "5"; }
    }

    let curX = -1e5, curY = -1e5, curOn = false;
    let shownCls = nodes[0]?.cls ?? "keine_aussage";
    let lupeReveal = 0;
    function setVerdict(cls: string) {
      if (cls !== shownCls) { shownCls = cls; setActiveVerdict(cls); }
    }

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

      // Auto-spotlight: cycle by index; skip if it would sit on the Lupe.
      let autoIdx = Math.floor(el / AUTO_STEP) % N;
      if (!hoverActive) {
        if (Math.hypot(nodes[autoIdx].x - lupeCx, nodes[autoIdx].y - lupeCy) < lupeR + 60)
          autoIdx = (autoIdx + 1) % N;
      }
      const activeI = hoverActive ? nearestI : autoIdx;
      const desiredCls = nodes[activeI].cls;

      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        const target = hoverActive
          ? (i === nearestI ? smooth(1 - nearestD / R_CUR) : 0)
          : (i === autoIdx ? 1 : 0);
        n.curT += (target - n.curT) * REVEAL;
        if (n.curT > 0.012) { applyLit(n, n.curT); n.state = "lit"; }
        else if (n.state === "lit") { applyRest(n); n.curT = 0; n.state = "rest"; }
      }

      // Lupe glyph reveals at the same slow pace: fade out on verdict change,
      // swap while invisible, fade in (mirrors the active myth's reveal).
      if (desiredCls === shownCls) lupeReveal += (1 - lupeReveal) * REVEAL;
      else {
        lupeReveal += (0 - lupeReveal) * 0.09;
        if (lupeReveal < 0.04) setVerdict(desiredCls);
      }
      glass!.style.setProperty("--lupe-reveal", lupeReveal.toFixed(3));

      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      const spread = [0, Math.floor(N / 4), Math.floor(N / 2), Math.floor((3 * N) / 4)];
      spread.forEach((i) => { if (nodes[i]) { applyLit(nodes[i], 1); nodes[i].curT = 1; nodes[i].state = "lit"; } });
      glass.style.setProperty("--lupe-reveal", "1");
      setVerdict(nodes[0]?.cls ?? "keine_aussage");
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

      {/* Lupe — one connected SVG outline (rim + handle) over a frosted lens disc.
          The neutral outline never recolours; the verdict glyph inside fades in
          with the active myth (--lupe-reveal). */}
      <div className="cmhero__glass" ref={glassRef} aria-hidden="true">
        <div className="cmhero__lens-frost"></div>
        <svg
          className="cmhero__mag"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.34-4.34" />
        </svg>
        <span className="cmhero__arrow">
          <VerdictArrow verdict={asVerdict(activeVerdict)} size={32} strokeWidth={2} />
        </span>
      </div>
    </section>
  );
}

export default HeroBlock;
