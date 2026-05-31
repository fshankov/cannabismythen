import { useRef, useEffect, useState } from "react";
import { Hand } from "lucide-react";
import type { MythPosition } from "./mythPositions";

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeroMyth {
  id: string;
  text: string;
  classification: string;
  position: MythPosition;
}

interface Props {
  myths: HeroMyth[];
  headline1: string;
  headline2: string;
  eyebrow: string;
}

// ── 1:1 port of the v3 standalone HTML prototype ────────────────────────────
// Mechanics that have to stay identical for pixel-parity:
//   • Per-word DOM state (rest ↔ lit) — NOT a radial-gradient mask.
//   • Smoothstep proximity falloff (R = 140) painted every rAF tick.
//   • Slow smoke-dissolve transitions on rest (--diss, 0.4s default).
//   • Fast lit transitions (.16s opacity/.26s transform).
//   • Per-word slow float drift (20–40s) on its own wrapper.
//   • Two slow GPU blobs (driftA/driftB) + radial bg gradient.
//   • 560×560 cursor glow following the pointer.
//   • Mobile: figure-eight auto-sweep + tap to redirect.
//
// The "Tweaks" dev panel from the HTML is omitted in prod; the defaults below
// match the CFG literals in the prototype (R/restOp/restBlur/colors/diss).

// Verdict palette (muted, tuned to the forest bg) — copied verbatim
const CLS: Record<string, { c: string; g: string }> = {
  richtig:       { c: "#6bc4a0", g: "rgba(107,196,160,.45)" },
  eher_richtig:  { c: "#9bcc6b", g: "rgba(155,204,107,.42)" },
  eher_falsch:   { c: "#cea566", g: "rgba(206,165,102,.40)" },
  falsch:        { c: "#d8857c", g: "rgba(216,133,124,.45)" },
  keine_aussage: { c: "#a7a7a7", g: "rgba(167,167,167,.34)" },
};
const SMOKE = "#bcd6c6"; // neutral resting colour when verdict-colours toggle is off

// Defaults (the HTML's CFG literals, minus the LS override + tweaks panel)
const CFG = {
  R: 140,         // reveal radius (px)
  restOp: 0.24,   // resting opacity
  restBlur: 3.6,  // resting blur (px)
  colors: false,  // resting colour = SMOKE; verdict colour only when lit
  diss: 0.4,      // dissolve transition (s)
};

// ── Adaptive sizing (matches HTML's `adaptive`) ─────────────────────────────
function adaptive(base: number, len: number): number {
  const o = Math.max(0, len - 28);
  const sc = Math.max(0.62, 1 - (o / 10) * 0.05);
  return Math.round(base * sc);
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function meta(classification: string) {
  return CLS[classification] || CLS.keine_aussage;
}

interface WordRec {
  el: HTMLSpanElement;
  classification: string;
  rotation: number;
  cx: number;
  cy: number;
  state: "rest" | "lit";
}

export function HeroBlock({ myths, headline1, headline2, eyebrow }: Props) {
  const heroRef  = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const glowRef  = useRef<HTMLDivElement>(null);
  const hintRef  = useRef<HTMLDivElement>(null);

  const [isTouch, setIsTouch] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const forceTouch = new URLSearchParams(window.location.search).has("touch");
    setIsTouch(forceTouch || window.matchMedia("(hover: none)").matches);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // ── Build word nodes + drive the proximity paint loop ─────────────────────
  useEffect(() => {
    const hero  = heroRef.current;
    const field = fieldRef.current;
    const glow  = glowRef.current;
    const hint  = hintRef.current;
    if (!hero || !field || !glow) return;

    // Publish --diss for the .cmhero__word transition
    hero.style.setProperty("--diss", CFG.diss + "s");

    // Clear (HMR-safe) + build word DOM
    field.replaceChildren();
    const words: WordRec[] = myths.map((m) => {
      const wrap = document.createElement("div");
      wrap.className = "cmhero__float";
      wrap.style.left = m.position.x + "%";
      wrap.style.top  = m.position.y + "%";
      const sign = Math.random() < 0.5 ? -1 : 1;
      wrap.style.setProperty("--fx", (sign * rand(8, 16)).toFixed(1) + "px");
      wrap.style.setProperty("--fy", rand(-12, -6).toFixed(1) + "px");
      wrap.style.setProperty("--fr", (sign * rand(0.8, 2.2)).toFixed(2) + "deg");
      wrap.style.setProperty("--fdur", rand(20, 40).toFixed(1) + "s");
      wrap.style.setProperty("--fdelay", (-rand(0, 28)).toFixed(1) + "s");

      const el = document.createElement("span");
      el.className = "cmhero__word";
      el.textContent = m.text;
      el.style.fontWeight = String(m.position.weight);
      const sized = adaptive(m.position.size, m.text.length);
      el.style.fontSize = sized + "px";
      wrap.appendChild(el);
      field.appendChild(wrap);

      return { el, classification: m.classification, rotation: m.position.r, cx: 0, cy: 0, state: "rest" };
    });

    // ── Rest / lit styling — copied verbatim from prototype ─────────────────
    function applyRest(wo: WordRec) {
      const col = CFG.colors ? meta(wo.classification).c : SMOKE;
      wo.el.style.color       = col;
      wo.el.style.opacity     = String(CFG.restOp);
      wo.el.style.filter      = `blur(${CFG.restBlur}px)`;
      wo.el.style.transform   = `rotate(${wo.rotation}deg) translateY(-6px) scale(1)`;
      wo.el.style.textShadow  = "none";
    }
    function applyLit(wo: WordRec, i: number) {
      const mt  = meta(wo.classification);
      const col = mt.c; // verdict colour always shows on hover
      wo.el.style.color       = col;
      wo.el.style.opacity     = (CFG.restOp + i * (1 - CFG.restOp)).toFixed(3);
      wo.el.style.filter      = `blur(${((1 - i) * CFG.restBlur).toFixed(2)}px)`;
      wo.el.style.transform   = `rotate(${wo.rotation}deg) translateY(${((1 - i) * -6).toFixed(2)}px) scale(${(1 + i * 0.05).toFixed(3)})`;
      wo.el.style.textShadow  = `0 0 ${(22 * i).toFixed(1)}px ${mt.g}, 0 0 8px ${mt.g}`;
    }

    // ── Geometry cache ──────────────────────────────────────────────────────
    function measure() {
      const hr = hero!.getBoundingClientRect();
      for (let i = 0; i < words.length; i++) {
        const r = words[i].el.getBoundingClientRect();
        words[i].cx = r.left + r.width / 2 - hr.left;
        words[i].cy = r.top  + r.height / 2 - hr.top;
      }
    }

    // ── Core proximity paint (smoothstep falloff) ───────────────────────────
    function paint(px: number, py: number) {
      const R = CFG.R;
      for (let i = 0; i < words.length; i++) {
        const wo = words[i];
        const dx = px - wo.cx, dy = py - wo.cy;
        const d  = Math.sqrt(dx * dx + dy * dy);
        let t = d < R ? 1 - d / R : 0;
        t = t <= 0 ? 0 : t * t * (3 - 2 * t); // smoothstep
        if (t > 0.02) {
          if (wo.state !== "lit") { wo.el.classList.add("cmhero__word--lit"); wo.state = "lit"; }
          applyLit(wo, t);
        } else if (wo.state === "lit") {
          wo.el.classList.remove("cmhero__word--lit"); // slow dissolve back
          applyRest(wo);
          wo.state = "rest";
        }
      }
    }
    function dissolveAll() {
      for (let i = 0; i < words.length; i++) {
        if (words[i].state === "lit") {
          words[i].el.classList.remove("cmhero__word--lit");
          applyRest(words[i]);
          words[i].state = "rest";
        }
      }
    }

    // Initial rest paint + measure
    words.forEach(applyRest);
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    const tFont = window.setTimeout(measure, 400);

    let rtTimer = 0;
    const onResize = () => {
      window.clearTimeout(rtTimer);
      rtTimer = window.setTimeout(measure, 120);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // hit-areas track the slow drift
    let driftTimer = 0;
    if (!reducedMotion) driftTimer = window.setInterval(measure, 240);

    // ── Desktop pointer (rAF-coalesced) ─────────────────────────────────────
    let raf = 0;
    const onMouseMove = (e: MouseEvent) => {
      const hr = hero!.getBoundingClientRect();
      const mx = e.clientX - hr.left;
      const my = e.clientY - hr.top;
      glow!.style.transform = `translate(${mx}px,${my}px)`;
      glow!.style.opacity = "1";
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          paint(mx, my);
        });
      }
    };
    const onMouseLeave = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      glow!.style.opacity = "0";
      dissolveAll();
    };

    // ── Touch loop ──────────────────────────────────────────────────────────
    let touchRaf = 0;
    let manualUntil = 0;
    let W = 0, H = 0, cx = 0, cy = 0, tx = 0, ty = 0, last = 0;
    function dims() {
      const r = hero!.getBoundingClientRect();
      W = r.width; H = r.height;
    }
    const onPointerDown = (e: PointerEvent) => {
      const hr = hero!.getBoundingClientRect();
      tx = e.clientX - hr.left;
      ty = e.clientY - hr.top;
      manualUntil = performance.now() + 2200;
      if (hint) hint.style.opacity = "0";
      if (reducedMotion) {
        cx = tx; cy = ty;
        glow!.style.transform = `translate(${cx}px,${cy}px)`;
        glow!.style.opacity = "1";
        paint(cx, cy);
      }
    };

    if (isTouch) {
      if (hint) {
        hint.style.opacity = "1";
        window.setTimeout(() => { if (hint) hint.style.opacity = "0"; }, 6000);
      }
      dims();
      cx = W * 0.5; cy = H * 0.45; tx = cx; ty = cy;
      window.addEventListener("resize", dims, { passive: true });
      const loop = (now: number) => {
        if (now - last > 180) { dims(); last = now; }
        if (!reducedMotion && now > manualUntil) {
          const a = (now / 15000) * Math.PI * 2;
          tx = W * (0.5 + 0.32 * Math.sin(a));
          ty = H * (0.46 + 0.20 * Math.sin(a * 2));
        }
        cx += (tx - cx) * 0.07;
        cy += (ty - cy) * 0.07;
        glow!.style.transform = `translate(${cx}px,${cy}px)`;
        glow!.style.opacity = "1";
        paint(cx, cy);
        touchRaf = requestAnimationFrame(loop);
      };
      if (reducedMotion) {
        glow!.style.transform = `translate(${cx}px,${cy}px)`;
        glow!.style.opacity = "1";
        paint(cx, cy);
      } else {
        touchRaf = requestAnimationFrame(loop);
      }
      hero.addEventListener("pointerdown", onPointerDown, { passive: true });
    } else {
      hero.addEventListener("mousemove", onMouseMove, { passive: true });
      hero.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", dims);
      hero.removeEventListener("mousemove", onMouseMove);
      hero.removeEventListener("mouseleave", onMouseLeave);
      hero.removeEventListener("pointerdown", onPointerDown);
      if (raf) cancelAnimationFrame(raf);
      if (touchRaf) cancelAnimationFrame(touchRaf);
      if (driftTimer) window.clearInterval(driftTimer);
      window.clearTimeout(tFont);
      window.clearTimeout(rtTimer);
      field.replaceChildren();
    };
  }, [myths, isTouch, reducedMotion]);

  return (
    <section
      ref={heroRef}
      className="cmhero"
      aria-label="Einstieg: Cannabis-Mythen und ihre Einordnung"
      data-screen-label="Hero"
    >
      <div className="cmhero__bg" aria-hidden="true">
        <div className="cmhero__blob cmhero__blob--a"></div>
        <div className="cmhero__blob cmhero__blob--b"></div>
      </div>
      <div className="cmhero__glow" ref={glowRef} aria-hidden="true"></div>
      <div className="cmhero__field" ref={fieldRef} aria-hidden="true"></div>
      <div className="cmhero__vig" aria-hidden="true"></div>

      {isTouch && (
        <div className="cmhero__hint" ref={hintRef} aria-hidden="true">
          <Hand size={30} color="rgba(237,244,240,.85)" strokeWidth={1.5} />
          <span>Tippen zum Erkunden</span>
        </div>
      )}

      <div className="cmhero__center">
        <div className="cmhero__plate" aria-hidden="true"></div>
        <div className="cmhero__inner">
          <p className="cmhero__eyebrow">{eyebrow}</p>
          <h1 className="cmhero__head">
            <span className="cmhero__head-a">{headline1}</span>
            <span className="cmhero__head-b">{headline2}</span>
          </h1>
        </div>
      </div>

      <style>{`
        /* ── Hero (matches v3 prototype 1:1) ─────────────────────────────── */
        .cmhero {
          position: relative;
          overflow: hidden;
          background: #1d4a37;
          touch-action: manipulation;
          min-height: 560px;
          height: 100vh;
          height: 100svh;
          max-height: 1040px;
        }
        @media (max-width: 640px) {
          .cmhero { min-height: 540px; max-height: 760px; }
        }

        /* Ambient base — static gradient + 2 slow blobs */
        .cmhero__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(120% 90% at 50% -10%, #265a43 0%, #1d4a37 46%, #163b2c 100%);
        }
        .cmhero__blob {
          position: absolute; border-radius: 50%;
          filter: blur(8px); opacity: .5; will-change: transform;
        }
        .cmhero__blob--a {
          width: 760px; height: 620px; left: -16%; top: -22%;
          background: radial-gradient(ellipse at center, rgba(12,30,21,.7) 0%, rgba(12,30,21,.25) 45%, transparent 70%);
          animation: cmheroDriftA 52s ease-in-out infinite;
        }
        .cmhero__blob--b {
          width: 680px; height: 560px; right: -14%; bottom: -18%;
          background: radial-gradient(ellipse at center, rgba(10,26,18,.7) 0%, rgba(10,26,18,.22) 45%, transparent 70%);
          animation: cmheroDriftB 64s ease-in-out infinite;
        }
        @keyframes cmheroDriftA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(120px, 80px) scale(1.08); }
        }
        @keyframes cmheroDriftB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-110px, -70px) scale(1.07); }
        }

        /* Cursor glow */
        .cmhero__glow {
          position: absolute; left: 0; top: 0;
          width: 560px; height: 560px; margin: -280px 0 0 -280px;
          border-radius: 50%;
          z-index: 2; pointer-events: none; opacity: 0;
          transition: opacity .45s ease;
          will-change: transform;
          background: radial-gradient(circle, rgba(150,214,180,.10) 0%, rgba(120,196,158,.05) 38%, transparent 68%);
        }

        /* Word field + slow per-word drift wrapper */
        .cmhero__field { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
        .cmhero__float {
          position: absolute;
          will-change: transform;
          animation: cmheroFloatDrift var(--fdur, 36s) ease-in-out var(--fdelay, 0s) infinite;
        }
        @keyframes cmheroFloatDrift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25%      { transform: translate(var(--fx, 10px), var(--fy, -8px)) rotate(var(--fr, 1.4deg)); }
          50%      { transform: translate(calc(var(--fx, 10px) * -0.55), calc(var(--fy, -8px) * -0.9)) rotate(calc(var(--fr, 1.4deg) * -1)); }
          75%      { transform: translate(calc(var(--fx, 10px) * 0.4),  calc(var(--fy, -8px) *  0.7)) rotate(calc(var(--fr, 1.4deg) * 0.5)); }
        }

        .cmhero__word {
          position: absolute;
          white-space: nowrap;
          user-select: none;
          line-height: 1;
          transform-origin: center;
          font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
          transition: opacity var(--diss, 1.15s) ease,
                      filter  var(--diss, 1.15s) ease,
                      transform var(--diss, 1.15s) cubic-bezier(.4, 0, .2, 1),
                      text-shadow var(--diss, 1.15s) ease;
        }
        .cmhero__word--lit {
          transition: opacity .16s ease,
                      filter  .16s ease,
                      transform .26s cubic-bezier(.2, .8, .25, 1),
                      text-shadow .16s ease;
        }

        /* Vignette to seat the headline */
        .cmhero__vig {
          position: absolute; inset: 0; z-index: 4; pointer-events: none;
          background: radial-gradient(ellipse 64% 48% at 50% 52%, rgba(10,28,20,.6) 0%, rgba(10,28,20,.22) 46%, transparent 74%);
        }

        /* Headline */
        .cmhero__center {
          position: absolute; inset: 0; z-index: 6;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 24px; text-align: center; pointer-events: none;
        }
        .cmhero__plate {
          position: absolute;
          width: min(90vw, 720px);
          height: clamp(260px, 38vw, 360px);
          background: radial-gradient(ellipse at center, rgba(20,52,37,.92) 26%, rgba(20,52,37,.55) 54%, transparent 76%);
        }
        .cmhero__inner { position: relative; max-width: 780px; }
        .cmhero__eyebrow {
          font-size: 11px; font-weight: 600;
          letter-spacing: 2.6px; text-transform: uppercase;
          color: #7ebb9a; margin: 0 0 22px;
          font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        }
        .cmhero__head { margin: 0; padding: 0; line-height: 1; }
        .cmhero__head-a {
          display: block; color: #edf4f0; font-weight: 800;
          letter-spacing: -0.8px;
          font-size: clamp(28px, 5vw, 50px);
          line-height: 1.12;
          text-shadow: 0 2px 36px rgba(0, 0, 0, .6);
          font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        }
        .cmhero__head-b {
          display: block; color: #9bd0b6; font-weight: 400; font-style: italic;
          font-family: 'DM Serif Display', Georgia, serif;
          letter-spacing: .4px;
          font-size: clamp(27px, 4.8vw, 47px);
          line-height: 1.2; margin-top: 6px;
          text-shadow: 0 2px 36px rgba(0, 0, 0, .6);
        }
        @media (max-width: 640px) {
          .cmhero__eyebrow {
            font-size: 10px; letter-spacing: 2px;
            margin-bottom: 18px; line-height: 1.5;
            max-width: 32ch; margin-left: auto; margin-right: auto;
          }
          .cmhero__head-a { font-size: clamp(26px, 7.4vw, 34px); letter-spacing: -0.6px; }
          .cmhero__head-b { font-size: clamp(25px, 7vw, 32px); margin-top: 4px; }
          .cmhero__plate  { width: 112vw; }
        }

        /* Mobile hint */
        .cmhero__hint {
          position: absolute; bottom: 23%; left: 50%;
          transform: translateX(-50%);
          z-index: 7; pointer-events: none;
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          opacity: 0; transition: opacity .6s ease;
        }
        .cmhero__hint span {
          font-size: 12px; letter-spacing: 1.6px;
          text-transform: uppercase;
          color: rgba(237, 244, 240, .72);
          font-weight: 600;
          font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        }

        @media (prefers-reduced-motion: reduce) {
          .cmhero__blob, .cmhero__float { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

export default HeroBlock;
