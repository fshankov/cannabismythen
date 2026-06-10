import { useRef, useEffect } from "react";
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

// ── Glyph colour helpers ──────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Lit (revealed) glyph colours — the LIGHTER dark-background verdict palette.
// main = chevron + vertical shaft, shadow = the flat base line.
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

// ── Exhibit + atmospheric field helpers ──────────────────────────────────────
const ROTATIONS: Record<string, number> = {
  richtig: 180, eher_richtig: -135, eher_falsch: 45, falsch: 0,
};
const VERDICT_LABEL: Record<string, string> = {
  richtig: "Richtig", eher_richtig: "Eher richtig",
  eher_falsch: "Eher falsch", falsch: "Falsch",
  keine_aussage: "Keine Aussage", keine_aussage_moeglich: "Keine Aussage",
};
/** Arrow SVG as inline HTML string — flat line only for keine_aussage (no shaft/chevron). */
function arrowSvgStr(cls: string, sz: number, mc: string, sc: string, sw: number): string {
  if (cls === "keine_aussage" || cls === "keine_aussage_moeglich") {
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16h20" stroke="${sc}" stroke-width="${sw}"/></svg>`;
  }
  const rot = ROTATIONS[cls] ?? 0;
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(${rot} 12 12)"><path d="M2 16h20" stroke="${sc}" stroke-width="${sw}"/><path d="M12 2v14" stroke="${mc}" stroke-width="${sw}"/><path d="m5 9 7 7 7-7" stroke="${mc}" stroke-width="${sw}"/></g></svg>`;
}
/** Arrow SVG driven by CSS vars — flat line only for keine_aussage. */
function arrowSvgVars(cls: string, sz: number, sw: number): string {
  if (cls === "keine_aussage" || cls === "keine_aussage_moeglich") {
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16h20" stroke="var(--cmg-sh)" stroke-width="${sw}"/></svg>`;
  }
  const rot = ROTATIONS[cls] ?? 0;
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(${rot} 12 12)"><path d="M2 16h20" stroke="var(--cmg-sh)" stroke-width="${sw}"/><path d="M12 2v14" stroke="var(--cmg-mn)" stroke-width="${sw}"/><path d="m5 9 7 7 7-7" stroke="var(--cmg-mn)" stroke-width="${sw}"/></g></svg>`;
}

// 32 atmospheric BG glyphs — edges/wings, blur ×0.9 vs prototype (−10%).
const BG_FIELD: ReadonlyArray<{x:number;y:number;cls:string;sz:number;blur:number;del:number}> = [
  { x:  3, y: 10, cls:"eher_richtig", sz:26, blur:5.0, del:0.0 },
  { x: 13, y: 24, cls:"eher_falsch",  sz:20, blur:5.9, del:0.2 },
  { x:  6, y: 40, cls:"falsch",       sz:30, blur:4.1, del:0.4 },
  { x: 20, y: 54, cls:"eher_richtig", sz:22, blur:6.3, del:0.6 },
  { x:  8, y: 67, cls:"eher_falsch",  sz:28, blur:4.5, del:0.8 },
  { x: 23, y: 80, cls:"richtig",      sz:24, blur:5.4, del:1.0 },
  { x: 14, y: 90, cls:"eher_richtig", sz:20, blur:5.0, del:1.2 },
  { x:  2, y: 73, cls:"eher_falsch",  sz:32, blur:3.6, del:0.3 },
  { x: 90, y: 11, cls:"eher_falsch",  sz:24, blur:4.5, del:0.1 },
  { x: 78, y: 25, cls:"eher_richtig", sz:28, blur:5.9, del:0.5 },
  { x: 94, y: 43, cls:"falsch",       sz:22, blur:4.1, del:0.7 },
  { x: 72, y: 57, cls:"eher_richtig", sz:30, blur:6.3, del:0.9 },
  { x: 86, y: 70, cls:"eher_falsch",  sz:26, blur:5.0, del:1.1 },
  { x: 76, y: 83, cls:"richtig",      sz:20, blur:5.4, del:1.3 },
  { x: 92, y: 88, cls:"eher_richtig", sz:28, blur:4.1, del:0.4 },
  { x: 68, y: 16, cls:"eher_falsch",  sz:24, blur:5.0, del:0.2 },
  { x: 34, y:  4, cls:"eher_richtig", sz:22, blur:6.3, del:0.6 },
  { x: 62, y:  7, cls:"eher_falsch",  sz:26, blur:5.4, del:0.8 },
  { x: 48, y: 11, cls:"falsch",       sz:18, blur:6.8, del:1.0 },
  { x: 38, y: 83, cls:"richtig",      sz:22, blur:5.0, del:1.1 },
  { x: 55, y: 80, cls:"eher_richtig", sz:26, blur:5.4, del:0.9 },
  { x: 27, y: 93, cls:"eher_falsch",  sz:20, blur:4.1, del:1.4 },
  { x:  5, y: 50, cls:"falsch",       sz:24, blur:4.5, del:0.7 },
  { x: 18, y: 15, cls:"richtig",      sz:22, blur:5.4, del:0.9 },
  { x: 96, y: 60, cls:"eher_richtig", sz:26, blur:5.0, del:1.0 },
  { x: 70, y: 35, cls:"falsch",       sz:20, blur:5.9, del:0.3 },
  { x: 40, y:  8, cls:"richtig",      sz:24, blur:6.3, del:0.5 },
  { x: 58, y: 89, cls:"eher_falsch",  sz:22, blur:4.5, del:1.2 },
  { x: 85, y: 92, cls:"eher_richtig", sz:28, blur:5.4, del:0.6 },
  { x: 10, y: 85, cls:"richtig",      sz:20, blur:5.0, del:1.5 },
  { x: 30, y: 48, cls:"eher_falsch",  sz:26, blur:6.8, del:0.8 },
  { x: 65, y: 78, cls:"falsch",       sz:22, blur:4.5, del:1.1 },
];

export function HeroBlock({ myths, headline1, headline2, eyebrow }: Props) {
  const fieldRef    = useRef<HTMLDivElement>(null);
  const pillRef     = useRef<HTMLDivElement>(null);
  const stageRef    = useRef<HTMLDivElement>(null);
  const glyphRowRef = useRef<HTMLDivElement>(null);

  // ── Exhibit cycling (all 42 real myths) + glyph row + atmospheric BG ────────
  useEffect(() => {
    const field    = fieldRef.current;
    const pill     = pillRef.current;
    const stage    = stageRef.current;
    const glyphRow = glyphRowRef.current;
    if (!field || !pill || !stage || !glyphRow || myths.length === 0) return;

    // -- Atmospheric BG field (32 static blurred glyphs, very faint) ----------
    const DRIFTS = ["cmhFgDrift0", "cmhFgDrift1", "cmhFgDrift2"];
    field.replaceChildren();
    BG_FIELD.forEach((g, i) => {
      const lit = litGlyph(g.cls);
      const mc = `rgba(${lit.main[0]},${lit.main[1]},${lit.main[2]},0.10)`;
      const sc = `rgba(${lit.shadow[0]},${lit.shadow[1]},${lit.shadow[2]},0.04)`;
      const el = document.createElement("div");
      el.className = "cmhero__fg";
      el.style.cssText = `left:${g.x}%;top:${g.y}%;animation-delay:${g.del}s;animation-name:cmhFgIn,${DRIFTS[i % 3]};animation-duration:2s,${(16 + (i * 3.1 % 11)).toFixed(1)}s;animation-timing-function:ease,ease-in-out;animation-fill-mode:both,none;animation-iteration-count:1,infinite;`;
      el.innerHTML = arrowSvgStr(g.cls, g.sz, mc, sc, 2).replace("<svg ", `<svg style="filter:blur(${g.blur}px)" `);
      field.appendChild(el);
    });

    // -- Cycling exhibit slots — all myths, real CaRM data --------------------
    stage.replaceChildren();
    myths.forEach((m, i) => {
      const slot = document.createElement("div");
      slot.className = "cmhero__ex-slot" + (i === 0 ? " vis" : "");
      slot.innerHTML = `<span class="cmhero__ex-text">${m.text}</span>`;
      stage.appendChild(slot);
    });
    const hoverSlot = document.createElement("div");
    hoverSlot.className = "cmhero__ex-slot hover";
    hoverSlot.innerHTML = `<span class="cmhero__ex-text"></span>`;
    stage.appendChild(hoverSlot);
    const hoverSpan = hoverSlot.querySelector<HTMLSpanElement>(".cmhero__ex-text")!;

    // -- Verdict pill ----------------------------------------------------------
    // Bind to a non-null const so inner closures don't lose narrowing.
    const pillEl: HTMLDivElement = pill;
    function setPill(m: HeroMyth) {
      const lit = litGlyph(m.classification);
      const mc = `rgb(${lit.main[0]},${lit.main[1]},${lit.main[2]})`;
      const sc = `rgba(${lit.shadow[0]},${lit.shadow[1]},${lit.shadow[2]},0.55)`;
      pillEl.className = `cmhero__exhibit-pill p-${m.classification}`;
      pillEl.innerHTML = arrowSvgStr(m.classification, 12, mc, sc, 2) + " " + (VERDICT_LABEL[m.classification] ?? m.classification);
    }
    let pillTimer = 0;
    function fadePill(m: HeroMyth, delay: number) {
      window.clearTimeout(pillTimer);
      pillEl.style.opacity = "0";
      pillTimer = window.setTimeout(() => { setPill(m); pillEl.style.opacity = "1"; }, delay);
    }
    setPill(myths[0]);

    // -- Glyph interactive row (one glyph per myth) ---------------------------
    glyphRow.replaceChildren();
    const glyphEls: HTMLSpanElement[] = [];
    myths.forEach((m, i) => {
      const el = document.createElement("span");
      el.className = "cmhero__mg" + (i === 0 ? " on" : "");
      el.innerHTML = arrowSvgVars(m.classification, 12, 2.5);
      if (i === 0) {
        const lit = litGlyph(m.classification);
        el.style.setProperty("--cmg-mn", `rgb(${lit.main[0]},${lit.main[1]},${lit.main[2]})`);
        el.style.setProperty("--cmg-sh", `rgba(${lit.shadow[0]},${lit.shadow[1]},${lit.shadow[2]},0.55)`);
      }
      glyphRow.appendChild(el);
      glyphEls.push(el);
    });
    function activateG(idx: number, cls: string) {
      const el = glyphEls[idx]; if (!el) return;
      const lit = litGlyph(cls);
      el.classList.add("on");
      el.style.setProperty("--cmg-mn", `rgb(${lit.main[0]},${lit.main[1]},${lit.main[2]})`);
      el.style.setProperty("--cmg-sh", `rgba(${lit.shadow[0]},${lit.shadow[1]},${lit.shadow[2]},0.55)`);
    }
    function deactivateG(idx: number) {
      const el = glyphEls[idx]; if (!el) return;
      el.classList.remove("on"); el.style.removeProperty("--cmg-mn"); el.style.removeProperty("--cmg-sh");
    }

    // -- Auto-cycle -----------------------------------------------------------
    const cycleSlots = Array.from(stage.querySelectorAll<HTMLDivElement>(".cmhero__ex-slot:not(.hover)"));
    let cur = 0, isHov = false, prevHovIdx = -1;
    function runCycle() {
      if (isHov) return;
      const prev = cur; cur = (cur + 1) % cycleSlots.length;
      cycleSlots[prev].classList.remove("vis"); cycleSlots[prev].classList.add("exit");
      window.setTimeout(() => cycleSlots[prev].classList.remove("exit"), 1100);
      cycleSlots[cur].classList.add("vis");
      deactivateG(prev); activateG(cur, myths[cur].classification);
      fadePill(myths[cur], 400);
    }
    let cycleInt = window.setInterval(runCycle, 3600);
    function onVis() { if (document.hidden) window.clearInterval(cycleInt); else cycleInt = window.setInterval(runCycle, 3600); }
    document.addEventListener("visibilitychange", onVis);

    // -- Glyph row hover ------------------------------------------------------
    let xTimer = 0, lvTimer = 0;
    myths.forEach((m, i) => {
      glyphEls[i]?.addEventListener("mouseenter", () => {
        window.clearTimeout(lvTimer); isHov = true;
        deactivateG(cur);
        if (prevHovIdx >= 0 && prevHovIdx !== i) deactivateG(prevHovIdx);
        prevHovIdx = i; activateG(i, m.classification);
        if (hoverSlot.classList.contains("vis")) {
          window.clearTimeout(xTimer); hoverSpan.style.opacity = "0";
          fadePill({ text: m.text, classification: m.classification }, 220);
          xTimer = window.setTimeout(() => { hoverSpan.textContent = m.text; hoverSpan.style.opacity = "1"; }, 220);
        } else {
          hoverSlot.classList.remove("exit-hover"); stage.classList.add("paused");
          hoverSpan.textContent = m.text; hoverSpan.style.opacity = "1";
          hoverSlot.classList.add("vis"); fadePill({ text: m.text, classification: m.classification }, 0);
        }
      });
    });
    glyphRow.addEventListener("mouseleave", () => {
      isHov = false; window.clearTimeout(xTimer);
      if (prevHovIdx >= 0) { deactivateG(prevHovIdx); prevHovIdx = -1; }
      hoverSlot.classList.remove("vis"); hoverSlot.classList.add("exit-hover");
      fadePill(myths[cur], 180);
      lvTimer = window.setTimeout(() => {
        hoverSlot.classList.remove("exit-hover"); stage.classList.remove("paused");
        cycleSlots[cur].classList.add("vis"); activateG(cur, myths[cur].classification);
      }, 380);
    });

    return () => {
      window.clearInterval(cycleInt); window.clearTimeout(pillTimer);
      window.clearTimeout(xTimer); window.clearTimeout(lvTimer);
      document.removeEventListener("visibilitychange", onVis);
      field.replaceChildren(); stage.replaceChildren(); glyphRow.replaceChildren();
      pillEl.innerHTML = "";
    };
  }, [myths]);

  return (
    <section
      className="cmhero"
      aria-label="Einstieg: Cannabis-Mythen und ihre Einordnung"
      data-screen-label="Hero"
    >
      <div className="cmhero__bg" aria-hidden="true"></div>
      {/* Atmospheric BG field — 32 blurred glyphs on the edges (z-index 1) */}
      <div className="cmhero__field" ref={fieldRef} aria-hidden="true"></div>
      <div className="cmhero__vig" aria-hidden="true"></div>

      <div className="cmhero__center">
        <p className="cmhero__eyebrow">{eyebrow}</p>
        <h1 className="cmhero__head">
          <span className="cmhero__head-a">{headline1}</span>
          <span className="cmhero__head-b">{headline2}</span>
        </h1>

        {/* Exhibit — rule + cycling myth + verdict pill + interactive glyph row */}
        <div className="cmhero__ex-rule" aria-hidden="true" />
        <div className="cmhero__exhibit" aria-hidden="true">
          <div ref={pillRef} className="cmhero__exhibit-pill p-eher_richtig" />
          <div ref={stageRef} className="cmhero__ex-stage" />
          <div ref={glyphRowRef} className="cmhero__myth-row" />
        </div>
      </div>

      {/* Scroll-down cue — the verdict glyph arrow hops above a static baseline.
          Desktop only (mobile tab bar owns the bottom edge). */}
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
          {/* the only moving part — rests tip-on-line, hops up and falls back */}
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
