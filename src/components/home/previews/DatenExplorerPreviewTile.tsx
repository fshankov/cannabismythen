import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChartBarIcon,
  Grid3x3Icon,
  Table2Icon,
} from "../../../lib/icons/viewTypeIcons";

export interface Props {
  title: string;
  description: string;
  ctaLabel: string;
  targetUrl: string;
}

// The dashboard's view tabs: two groups (Mythen / Quellen) × Balken/Übersicht/
// Tabelle. Each deep-links to that view (?view=<code>, src/lib/dashboard/url-state.ts).
const GROUPS = [
  {
    label: "Mythen",
    tabs: [
      { label: "Balken", Icon: ChartBarIcon, view: "balken" },
      { label: "Übersicht", Icon: Grid3x3Icon, view: "spannweite" },
      { label: "Tabelle", Icon: Table2Icon, view: "tabelle" },
    ],
  },
  {
    label: "Quellen",
    tabs: [
      { label: "Balken", Icon: ChartBarIcon, view: "quellen" },
      { label: "Übersicht", Icon: Grid3x3Icon, view: "quellen2" },
      { label: "Tabelle", Icon: Table2Icon, view: "quellen-tabelle" },
    ],
  },
] as const;

// Illustrative 3-bar states (verdict colours) — cycle as a small "Balken"
// animation above the tabs. Not real data.
const BAR_STATES = [
  [
    { c: "--classification-falsch", v: 74 },
    { c: "--classification-eher-falsch", v: 52 },
    { c: "--classification-richtig", v: 38 },
  ],
  [
    { c: "--classification-richtig", v: 63 },
    { c: "--classification-eher-richtig", v: 47 },
    { c: "--classification-falsch", v: 81 },
  ],
  [
    { c: "--classification-eher-falsch", v: 57 },
    { c: "--classification-richtig", v: 44 },
    { c: "--classification-keine-aussage", v: 29 },
  ],
] as const;
const SWITCH_MS = 2600;

export default function DatenExplorerPreviewTile({
  title,
  description,
  targetUrl,
}: Props) {
  const [bi, setBi] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = ref.current;
    if (!root) return;
    let iv: number | null = null;
    const start = () => {
      if (iv === null)
        iv = window.setInterval(
          () => setBi((i) => (i + 1) % BAR_STATES.length),
          SWITCH_MS,
        );
    };
    const stop = () => {
      if (iv !== null) {
        window.clearInterval(iv);
        iv = null;
      }
    };
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { threshold: 0.4 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  const bars = BAR_STATES[bi];

  return (
    <div className="path-tile path-tile--daten" ref={ref}>
      <div className="path-tile__preview">
        <div className="daten-field">
          <div className="daten-bars" aria-hidden="true">
            {bars.map((b, i) => (
              <span className="daten-bar" key={i}>
                <span
                  className="daten-bar__fill"
                  style={
                    {
                      width: `${b.v}%`,
                      background: `var(${b.c})`,
                    } as CSSProperties
                  }
                />
              </span>
            ))}
          </div>
          <div className="daten-tabs">
            {GROUPS.map((g) => (
              <div className="daten-tabs__group" key={g.label}>
                <span className="daten-tabs__label">{g.label}</span>
                <div className="daten-tabs__row">
                  {g.tabs.map((t) => (
                    <a
                      className="daten-tab"
                      key={t.view}
                      href={`/daten-explorer/?view=${t.view}`}
                      aria-label={`${g.label}: ${t.label}`}
                    >
                      <t.Icon size={15} aria-hidden="true" />
                      <span>{t.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="path-tile__body">
        <a className="path-tile__title-link" href={targetUrl}>
          <h3 className="path-tile__title">
            {title}
            <span className="path-tile__title-arrow" aria-hidden="true">
              →
            </span>
          </h3>
        </a>
        <p className="path-tile__description">{description}</p>
      </div>
    </div>
  );
}
