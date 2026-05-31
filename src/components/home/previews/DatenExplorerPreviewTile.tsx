import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import VerdictArrow from "../../shared/VerdictArrow";
import type { CorrectnessClass } from "../../../lib/dashboard/types";

export interface Props {
  title: string;
  description: string;
  ctaLabel: string;
  targetUrl: string;
}

interface Row {
  label: string;
  verdict: CorrectnessClass;
  cssVar: string;
  /** Illustrative values (%) for three population columns. */
  v: readonly [number, number, number];
}

// Illustrative rows — visually plausible, NOT real CaRM data. They exist only
// to echo the look of the Daten-Explorer's three views on the homepage tile.
const ROWS: ReadonlyArray<Row> = [
  { label: "Harmlos",        verdict: "falsch",      cssVar: "--classification-falsch",      v: [28, 22, 33] },
  { label: "Einstiegsdroge", verdict: "eher_falsch", cssVar: "--classification-eher-falsch", v: [52, 46, 58] },
  { label: "Abhängigkeit",   verdict: "richtig",     cssVar: "--classification-richtig",     v: [63, 69, 60] },
  { label: "Schädigt Fötus", verdict: "richtig",     cssVar: "--classification-richtig",     v: [71, 66, 74] },
];

// The dashboard's three view types, in the same order as its ViewTabs.
const VIEWS = ["Balken", "Spannweite", "Tabelle"] as const;
const COLS = ["Erw.", "Jung", "Eltern"] as const;
const SWITCH_MS = 3200;

export default function DatenExplorerPreviewTile({
  title,
  description,
  ctaLabel,
  targetUrl,
}: Props) {
  const [view, setView] = useState(0);
  const wrapperRef = useRef<HTMLAnchorElement | null>(null);

  // Auto-cycle the three views, gated on visibility so it doesn't "skip"
  // while scrolled off the mobile carousel.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = wrapperRef.current;
    if (!root) return;

    let interval: number | null = null;
    const start = () => {
      if (interval === null) interval = window.setInterval(() => setView((i) => (i + 1) % VIEWS.length), SWITCH_MS);
    };
    const stop = () => { if (interval !== null) { window.clearInterval(interval); interval = null; } };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.5 });
    io.observe(root);
    return () => { io.disconnect(); stop(); };
  }, []);

  const arrow = (r: Row) => (
    <span className="dp__arrow"><VerdictArrow verdict={r.verdict} size={13} strokeWidth={2.2} /></span>
  );
  const colorOf = (r: Row) => ({ ["--v" as string]: `var(${r.cssVar})` } as CSSProperties);

  return (
    <a ref={wrapperRef} className="path-tile path-tile--daten" href={targetUrl}>
      <div className="path-tile__preview">
        <div className="daten-preview" aria-hidden="true">
          <div className="daten-preview__tabs" role="presentation">
            {VIEWS.map((v, i) => (
              <span key={v} className="daten-preview__tab" data-active={i === view ? "true" : "false"}>{v}</span>
            ))}
          </div>

          {/* Balken — verdict arrow + label + a verdict-coloured fill bar */}
          {view === 0 && (
            <div className="dp-viz dp-balken">
              {ROWS.map((r) => (
                <div className="dp-row" key={r.label} style={colorOf(r)}>
                  {arrow(r)}
                  <span className="dp-label">{r.label}</span>
                  <span className="dp-track"><span className="dp-fill" style={{ width: `${r.v[0]}%` }} /></span>
                  <span className="dp-val">{r.v[0]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Spannweite — thin stem + lollipop dot at the value (range marker) */}
          {view === 1 && (
            <div className="dp-viz dp-spann">
              {ROWS.map((r) => (
                <div className="dp-row" key={r.label} style={colorOf(r)}>
                  {arrow(r)}
                  <span className="dp-label">{r.label}</span>
                  <span className="dp-track dp-track--stem">
                    <span className="dp-stem" style={{ width: `${r.v[0]}%` }} />
                    <span className="dp-dot" style={{ left: `${r.v[0]}%` }} />
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tabelle — numeric grid across three population columns */}
          {view === 2 && (
            <div className="dp-viz dp-table">
              <div className="dp-trow dp-trow--head">
                <span className="dp-tcell dp-tcell--corner" />
                {COLS.map((c) => <span key={c} className="dp-tcell dp-tcell--head">{c}</span>)}
              </div>
              {ROWS.map((r) => (
                <div className="dp-trow" key={r.label} style={colorOf(r)}>
                  <span className="dp-tcell dp-tcell--label">{arrow(r)}<span className="dp-label">{r.label}</span></span>
                  {r.v.map((n, i) => <span key={i} className="dp-tcell dp-tcell--num">{n}</span>)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="path-tile__body">
        <h3 className="path-tile__title">
          {title}
          <span className="path-tile__title-arrow" aria-hidden="true">→</span>
        </h3>
        <p className="path-tile__description">{description}</p>
        <p className="path-tile__cta">{ctaLabel}</p>
      </div>
    </a>
  );
}
