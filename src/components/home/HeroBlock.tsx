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
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Lit (revealed) glyph colours — the LIGHTER dark-background verdict palette.
// main = chevron + vertical shaft, shadow = the flat base line.
const LIT_GLYPH: Record<
  string,
  { main: [number, number, number]; shadow: [number, number, number] }
> = {
  richtig: { main: hexToRgb("#6bc4a0"), shadow: hexToRgb("#a7d3c5") },
  eher_richtig: { main: hexToRgb("#9bcc6b"), shadow: hexToRgb("#c2d3a3") },
  eher_falsch: { main: hexToRgb("#e0b07a"), shadow: hexToRgb("#e0b58d") },
  falsch: { main: hexToRgb("#e58d83"), shadow: hexToRgb("#e9a8b9") },
  keine_aussage: { main: hexToRgb("#aebbc2"), shadow: hexToRgb("#aebbc2") },
};
function litGlyph(cls: string) {
  return LIT_GLYPH[cls] ?? LIT_GLYPH.keine_aussage;
}

// ── Exhibit + atmospheric field helpers ──────────────────────────────────────
const ROTATIONS: Record<string, number> = {
  richtig: 180,
  eher_richtig: -135,
  eher_falsch: 45,
  falsch: 0,
};
const VERDICT_LABEL: Record<string, string> = {
  richtig: "Richtig",
  eher_richtig: "Eher richtig",
  eher_falsch: "Eher falsch",
  falsch: "Falsch",
  keine_aussage: "Keine Aussage möglich",
  keine_aussage_moeglich: "Keine Aussage möglich",
};
/** Arrow SVG as inline HTML string — flat line only for keine_aussage (no shaft/chevron). */
function arrowSvgStr(
  cls: string,
  sz: number,
  mc: string,
  sc: string,
  sw: number,
): string {
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

export function HeroBlock({ myths, headline1, headline2, eyebrow }: Props) {
  const pillRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glyphRowRef = useRef<HTMLDivElement>(null);

  // ── Exhibit cycling (all 42 real myths) + glyph row ─────────────────────────
  useEffect(() => {
    const pill = pillRef.current;
    const stage = stageRef.current;
    const glyphRow = glyphRowRef.current;
    if (!pill || !stage || !glyphRow || myths.length === 0) return;

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
    const hoverSpan =
      hoverSlot.querySelector<HTMLSpanElement>(".cmhero__ex-text")!;

    // -- Verdict pill ----------------------------------------------------------
    // Bind to a non-null const so inner closures don't lose narrowing.
    const pillEl: HTMLDivElement = pill;
    function setPill(m: HeroMyth) {
      const lit = litGlyph(m.classification);
      const mc = `rgb(${lit.main[0]},${lit.main[1]},${lit.main[2]})`;
      const sc = `rgba(${lit.shadow[0]},${lit.shadow[1]},${lit.shadow[2]},0.55)`;
      pillEl.className = `cmhero__exhibit-pill p-${m.classification}`;
      pillEl.innerHTML =
        arrowSvgStr(m.classification, 12, mc, sc, 2) +
        " " +
        (VERDICT_LABEL[m.classification] ?? m.classification);
    }
    let pillTimer = 0;
    function fadePill(m: HeroMyth, delay: number) {
      window.clearTimeout(pillTimer);
      pillEl.style.opacity = "0";
      pillTimer = window.setTimeout(() => {
        setPill(m);
        pillEl.style.opacity = "1";
      }, delay);
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
        el.style.setProperty(
          "--cmg-mn",
          `rgb(${lit.main[0]},${lit.main[1]},${lit.main[2]})`,
        );
        el.style.setProperty(
          "--cmg-sh",
          `rgba(${lit.shadow[0]},${lit.shadow[1]},${lit.shadow[2]},0.55)`,
        );
      }
      glyphRow.appendChild(el);
      glyphEls.push(el);
    });
    function activateG(idx: number, cls: string) {
      const el = glyphEls[idx];
      if (!el) return;
      const lit = litGlyph(cls);
      el.classList.add("on");
      el.style.setProperty(
        "--cmg-mn",
        `rgb(${lit.main[0]},${lit.main[1]},${lit.main[2]})`,
      );
      el.style.setProperty(
        "--cmg-sh",
        `rgba(${lit.shadow[0]},${lit.shadow[1]},${lit.shadow[2]},0.55)`,
      );
    }
    function deactivateG(idx: number) {
      const el = glyphEls[idx];
      if (!el) return;
      el.classList.remove("on");
      el.style.removeProperty("--cmg-mn");
      el.style.removeProperty("--cmg-sh");
    }

    // -- Auto-cycle -----------------------------------------------------------
    const cycleSlots = Array.from(
      stage.querySelectorAll<HTMLDivElement>(".cmhero__ex-slot:not(.hover)"),
    );
    let cur = 0,
      isHov = false,
      prevHovIdx = -1;
    function runCycle() {
      if (isHov) return;
      const prev = cur;
      cur = (cur + 1) % cycleSlots.length;
      cycleSlots[prev].classList.remove("vis");
      cycleSlots[prev].classList.add("exit");
      window.setTimeout(() => cycleSlots[prev].classList.remove("exit"), 1100);
      cycleSlots[cur].classList.add("vis");
      deactivateG(prev);
      activateG(cur, myths[cur].classification);
      fadePill(myths[cur], 400);
    }
    let cycleInt = window.setInterval(runCycle, 3600);
    function onVis() {
      window.clearInterval(cycleInt);
      if (!document.hidden) cycleInt = window.setInterval(runCycle, 3600);
    }
    document.addEventListener("visibilitychange", onVis);

    // -- Glyph row hover ------------------------------------------------------
    let xTimer = 0,
      lvTimer = 0;
    myths.forEach((m, i) => {
      glyphEls[i]?.addEventListener("mouseenter", () => {
        window.clearTimeout(lvTimer);
        isHov = true;
        stage.classList.add("paused");
        cycleSlots[cur].classList.remove("vis");
        deactivateG(cur);
        if (prevHovIdx >= 0 && prevHovIdx !== i) deactivateG(prevHovIdx);
        prevHovIdx = i;
        activateG(i, m.classification);
        if (hoverSlot.classList.contains("vis")) {
          window.clearTimeout(xTimer);
          hoverSpan.style.opacity = "0";
          fadePill({ text: m.text, classification: m.classification }, 220);
          xTimer = window.setTimeout(() => {
            hoverSpan.textContent = m.text;
            hoverSpan.style.opacity = "1";
          }, 220);
        } else {
          hoverSlot.classList.remove("exit-hover");
          hoverSpan.textContent = m.text;
          hoverSpan.style.opacity = "1";
          hoverSlot.classList.add("vis");
          fadePill({ text: m.text, classification: m.classification }, 0);
        }
      });
    });
    glyphRow.addEventListener("mouseleave", () => {
      isHov = false;
      window.clearTimeout(xTimer);
      if (prevHovIdx >= 0) {
        deactivateG(prevHovIdx);
        prevHovIdx = -1;
      }
      hoverSlot.classList.remove("vis");
      hoverSlot.classList.add("exit-hover");
      fadePill(myths[cur], 180);
      lvTimer = window.setTimeout(() => {
        hoverSlot.classList.remove("exit-hover");
        stage.classList.remove("paused");
        cycleSlots[cur].classList.add("vis");
        activateG(cur, myths[cur].classification);
      }, 380);
    });

    return () => {
      window.clearInterval(cycleInt);
      window.clearTimeout(pillTimer);
      window.clearTimeout(xTimer);
      window.clearTimeout(lvTimer);
      document.removeEventListener("visibilitychange", onVis);
      stage.replaceChildren();
      glyphRow.replaceChildren();
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
      <div className="cmhero__vig" aria-hidden="true"></div>

      <div className="cmhero__center">
        <p className="cmhero__eyebrow">{eyebrow}</p>
        <h1 className="cmhero__head">
          <span className="cmhero__head-a">{headline1}</span>
          <span className="cmhero__head-b">{headline2}</span>
        </h1>

        <div className="cmhero__rule" aria-hidden="true" />
        {/* Exhibit — cycling myth + verdict pill + interactive glyph row */}
        <div className="cmhero__exhibit" aria-hidden="true">
          <div ref={pillRef} className="cmhero__exhibit-pill p-eher_richtig" />
          <div ref={stageRef} className="cmhero__ex-stage" />
          <span className="cmhero__myth-label" aria-hidden="true">
            42 Mythen
          </span>
          <div ref={glyphRowRef} className="cmhero__myth-row" />
        </div>
      </div>
    </section>
  );
}

export default HeroBlock;
