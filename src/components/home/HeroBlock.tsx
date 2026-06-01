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

// ── Pendel-Lupe-Ring ────────────────────────────────────────────────────────
// All myth statements ride a raised OVAL ring around the central question.
// Motion is a gentle pendulum sway + breathing (no full rotation). Myths are
// unreadable at rest (blurred, faintly verdict-tinted). One myth sharpens IN
// PLACE (no jump) when the visitor hovers it (single nearest) or — when idle /
// on touch — when the auto-spotlight cycles to it. A neutral magnifying-glass
// (lupe) sits stably under the headline and shows the SITE's verdict glyph for
// whichever myth is active.
//
// Geometry: a CIRCLE of myths inside a `scaleY(--s)` wrapper that sways — so the
// pendulum rotation slides items along the ELLIPSE without tumbling. Radii are
// responsive + chrome-safe (kept clear of the fixed header band and the bottom
// banner/tab-bar). Base angles are arc-length-even on the ellipse so the 42
// myths are visually equidistant (no bunching at the flat top/bottom).
//
// Motion = compositor transforms (CSS vars driven once per frame); only the
// active node gets per-frame style writes — light enough for old devices.
// Reference: _local/hero-prototypes/pendulum.html (approved 2026-05-31).

// Verdict colours tuned for the dark forest hero (legible text + glow)
interface VColor { c: string; g: string }
const TXT: Record<string, VColor> = {
  richtig:       { c: "#6bc4a0", g: "rgba(107,196,160,.55)" },
  eher_richtig:  { c: "#9bcc6b", g: "rgba(155,204,107,.5)" },
  eher_falsch:   { c: "#e0b07a", g: "rgba(224,176,122,.5)" },
  falsch:        { c: "#e58d83", g: "rgba(229,141,131,.55)" },
  keine_aussage: { c: "#aebbc2", g: "rgba(174,187,194,.4)" },
};
function txt(cls: string) {
  return TXT[cls] || TXT.keine_aussage;
}
// Map the legacy `keine_aussage` spelling to the canonical glyph verdict.
function asVerdict(cls: string): CorrectnessClass {
  return (cls === "keine_aussage" ? "no_classification" : cls) as CorrectnessClass;
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

interface Node {
  slot: HTMLDivElement;
  span: HTMLDivElement;
  cls: string;
  t: VColor;
  aRad: number;
  curT: number;
  state: "rest" | "lit";
}

export function HeroBlock({ myths, headline1, headline2, eyebrow }: Props) {
  const heroRef  = useRef<HTMLElement>(null);
  const ovalRef  = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const h1Ref    = useRef<HTMLHeadingElement>(null);

  const [activeVerdict, setActiveVerdict] = useState<string>(
    myths[0]?.classification ?? "keine_aussage",
  );

  useEffect(() => {
    const hero  = heroRef.current;
    const oval  = ovalRef.current;
    const cloud = cloudRef.current;
    const glass = glassRef.current;
    const flash = flashRef.current;
    const h1    = h1Ref.current;
    if (!hero || !oval || !cloud || !glass || !h1) return;

    const isTouch = window.matchMedia("(hover: none)").matches;
    const reduce  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const N = myths.length;
    const SWAY_AMP = (12 * Math.PI) / 180;
    const SWAY_PERIOD = 27500;
    const BREATHE_PERIOD = 20000;
    const AUTO_STEP = 4250;
    const R_CUR = 190;

    // ── Build the 42 myth nodes ─────────────────────────────────────────────
    cloud.replaceChildren();
    const nodes: Node[] = myths.map((m, i) => {
      const slot = document.createElement("div");
      slot.className = "cmh__slot";
      slot.style.setProperty("--i", String(i));   // staggered entrance delay
      const counter = document.createElement("div"); counter.className = "cmh__counter";
      const label   = document.createElement("div"); label.className = "cmh__label";
      const fix     = document.createElement("div"); fix.className = "cmh__fix";
      const span    = document.createElement("div"); span.className = "cmh__text";
      span.textContent = m.text;
      fix.appendChild(span); label.appendChild(fix); counter.appendChild(label); slot.appendChild(counter);
      cloud.appendChild(slot);
      return { slot, span, cls: m.classification, t: txt(m.classification), aRad: 0, curT: 0, state: "rest" };
    });

    // ── Geometry (responsive, chrome-safe, arc-length-even) ──────────────────
    let cx = 0, ovalCY = 0, R = 0, s = 0.58;            // s = live Y-squash
    let lupeCx = 0, lupeCy = 0, lupeR = 0;
    function layout() {
      const W = hero!.clientWidth, H = hero!.clientHeight;
      cx = W / 2;
      const mobile   = W < 768;
      const topSafe  = 112;                              // clears the fixed header band
      const botSafe  = mobile ? 150 : 132;               // clears preview banner / mobile tab bar
      const usableTop = topSafe, usableBot = H - botSafe;
      ovalCY = Math.round(usableTop + (usableBot - usableTop) * 0.46);
      const RyMax = Math.max(60, Math.min(ovalCY - usableTop, usableBot - ovalCY));
      const sideGutter = Math.min(Math.max(W * 0.06, 24), 96);
      const RxMax = W / 2 - sideGutter;
      let Rx = Math.min(Math.max(W * 0.50, 300), 760);
      Rx = Math.min(Rx, RxMax);
      let Ry = Math.min(Rx * 0.60, RyMax);
      s = Ry / Rx;
      R = Rx;
      oval!.style.top = ovalCY + "px";
      hero!.style.setProperty("--s", s.toFixed(4));

      // Arc-length-even base angles: sample the ellipse perimeter once, place N
      // points at equal-perimeter intervals → per-item circle-angle φ.
      const M = 720;
      const cum = new Float64Array(M + 1);
      let px = 0, py = R * s;                            // φ=0 → (0, Ry)
      for (let k = 1; k <= M; k++) {
        const phi = (k / M) * 2 * Math.PI;
        const x = -Math.sin(phi) * R, y = Math.cos(phi) * R * s;
        cum[k] = cum[k - 1] + Math.hypot(x - px, y - py);
        px = x; py = y;
      }
      const total = cum[M] || 1;
      for (let i = 0; i < N; i++) {
        const target = (i * total) / N;
        let lo = 0, hi = M;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < target) lo = mid + 1; else hi = mid; }
        const k = lo, k0 = Math.max(0, k - 1);
        const c0 = cum[k0], c1 = cum[k], frac = c1 > c0 ? (target - c0) / (c1 - c0) : 0;
        const phi = ((k0 + frac) / M) * 2 * Math.PI;
        nodes[i].aRad = phi;
        nodes[i].slot.style.setProperty("--a", ((phi * 180) / Math.PI).toFixed(2) + "deg");
        nodes[i].slot.style.setProperty("--r", R.toFixed(1) + "px");
      }

      // Lupe: parked in the clear gap under the headline, never into bottom chrome.
      const hb = h1!.getBoundingClientRect(), hr = hero!.getBoundingClientRect();
      const glassH = glass!.offsetHeight || 84, glassW = glass!.offsetWidth || 84;
      let gtop = (hb.bottom - hr.top) + 64;
      gtop = Math.min(Math.max(gtop, ovalCY + 8), usableBot - glassH);
      glass!.style.top = gtop + "px";
      lupeCx = cx; lupeCy = gtop; lupeR = glassW / 2 + 18;
    }

    // project a node's centre to hero-local screen coords for the current frame
    function project(aRad: number, sway: number, breathe: number) {
      const th = aRad + sway;
      return { x: cx - Math.sin(th) * R * breathe, y: ovalCY + s * Math.cos(th) * R * breathe };
    }

    // ── Rest / lit styling (no positional jump — scale in place) ─────────────
    function applyRest(n: Node) {
      n.span.style.color      = n.t.c;
      n.span.style.opacity    = "0.30";
      n.span.style.filter     = "blur(3px)";
      n.span.style.transform  = "scale(.96)";
      n.span.style.fontWeight = "600";
      n.span.style.textShadow = "none";
    }
    function applyLit(n: Node, t: number) {
      n.span.style.color      = n.t.c;
      n.span.style.opacity    = (0.3 + t * 0.7).toFixed(3);
      n.span.style.filter     = `blur(${((1 - t) * 3).toFixed(2)}px)`;
      n.span.style.transform  = `scale(${(0.96 + t * 0.46).toFixed(3)})`;
      n.span.style.fontWeight = t > 0.6 ? "700" : "600";
      n.span.style.textShadow = `0 0 ${(26 * t).toFixed(1)}px ${n.t.g}, 0 0 9px ${n.t.g}`;
    }

    let curX = -1e5, curY = -1e5, curOn = false;
    let lastVerdict = "";
    function setVerdict(cls: string) {
      if (cls === lastVerdict) return;
      lastVerdict = cls;
      setActiveVerdict(cls);
    }

    layout();
    nodes.forEach(applyRest);

    const t0 = performance.now();
    let raf = 0;

    function frame(now: number) {
      const el = Math.max(0, now - t0);
      const sway = SWAY_AMP * Math.sin((el / SWAY_PERIOD) * 2 * Math.PI);
      const breathe = 1 + 0.018 * Math.sin((el / BREATHE_PERIOD) * 2 * Math.PI);
      hero!.style.setProperty("--cmh-sway", ((sway * 180) / Math.PI).toFixed(2) + "deg");
      hero!.style.setProperty("--cmh-breathe", breathe.toFixed(3));

      // Hover = single myth: nearest to the cursor within R_CUR
      let nearestI = -1, nearestD = Infinity;
      if (curOn) {
        for (let i = 0; i < N; i++) {
          const p = project(nodes[i].aRad, sway, breathe);
          const d = Math.hypot(p.x - curX, p.y - curY);
          if (d < nearestD) { nearestD = d; nearestI = i; }
        }
      }
      const hoverActive = curOn && nearestI >= 0 && nearestD < R_CUR;

      // Auto-spotlight: cycle by index; skip if the chosen myth would sit on the lupe.
      let autoIdx = Math.floor(el / AUTO_STEP) % N;
      if (!hoverActive) {
        const p = project(nodes[autoIdx].aRad, sway, breathe);
        if (Math.hypot(p.x - lupeCx, p.y - lupeCy) < lupeR) autoIdx = (autoIdx + 1) % N;
      }
      const lupeCls = hoverActive ? nodes[nearestI].cls : nodes[autoIdx].cls;

      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        const target = hoverActive
          ? (i === nearestI ? smooth(1 - nearestD / R_CUR) : 0)
          : (i === autoIdx ? 1 : 0);
        n.curT += (target - n.curT) * 0.14;
        if (n.curT > 0.012) { applyLit(n, n.curT); n.state = "lit"; }
        else if (n.state === "lit") { applyRest(n); n.curT = 0; n.state = "rest"; }
      }
      setVerdict(lupeCls);
      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      // Static: a small spread of revealed myths + lupe, no rAF.
      hero.style.setProperty("--cmh-sway", "0deg");
      hero.style.setProperty("--cmh-breathe", "1");
      const spread = [0, Math.floor(N / 4), Math.floor(N / 2), Math.floor((3 * N) / 4)];
      spread.forEach((i) => { if (nodes[i]) { applyLit(nodes[i], 1); nodes[i].curT = 1; nodes[i].state = "lit"; } });
      setVerdict(nodes[0]?.cls ?? "keine_aussage");
    } else {
      setVerdict(nodes[0]?.cls ?? "keine_aussage");
      raf = requestAnimationFrame(frame);
    }

    // ── Events ────────────────────────────────────────────────────────────
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
      <div className="cmhero__oval" ref={ovalRef} aria-hidden="true">
        <div className="cmhero__cloud" ref={cloudRef}></div>
      </div>
      <div className="cmhero__vig" aria-hidden="true"></div>

      <div className="cmhero__center">
        <p className="cmhero__eyebrow">{eyebrow}</p>
        <h1 className="cmhero__head" ref={h1Ref}>
          <span className="cmhero__head-a">{headline1}</span>
          <span className="cmhero__head-b">{headline2}</span>
        </h1>
      </div>

      {/* Lupe — one connected SVG outline (rim + handle) over a frosted lens disc.
          The neutral outline never recolours; only the verdict glyph inside changes. */}
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
