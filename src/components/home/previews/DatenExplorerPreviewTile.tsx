import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

export interface Props {
  title: string;
  description: string;
  ctaLabel: string;
  targetUrl: string;
}

interface Group {
  label: string;
  /** Share (%) per verdict in the order of VERDICTS below. */
  values: readonly [number, number, number, number, number];
}

const GROUPS: ReadonlyArray<Group> = [
  { label: "Alle (Erwachsene 18–70)", values: [22, 28, 25, 18, 7] },
  { label: "Konsumierende",            values: [35, 30, 18, 12, 5] },
  { label: "Junge Erwachsene (18–26)", values: [15, 25, 30, 25, 5] },
  { label: "Eltern",                   values: [20, 30, 28, 17, 5] },
];

const VERDICTS = [
  { key: "richtig",        label: "Richtig",        cssVar: "--classification-richtig" },
  { key: "eher_richtig",   label: "Eher richtig",   cssVar: "--classification-eher-richtig" },
  { key: "eher_falsch",    label: "Eher falsch",    cssVar: "--classification-eher-falsch" },
  { key: "falsch",         label: "Falsch",         cssVar: "--classification-falsch" },
  { key: "keine_aussage",  label: "Keine Aussage",  cssVar: "--classification-keine-aussage" },
] as const;

const SWITCH_MS = 3000;

export default function DatenExplorerPreviewTile({
  title,
  description,
  ctaLabel,
  targetUrl,
}: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % GROUPS.length);
    }, SWITCH_MS);

    return () => window.clearInterval(id);
  }, []);

  const group = GROUPS[idx];

  return (
    <a className="path-tile path-tile--daten" href={targetUrl}>
      <div className="path-tile__preview">
        <div className="daten-preview" aria-hidden="true">
          <div className="daten-preview__chip-row">
            <span className="daten-preview__chip-label">Zielgruppe</span>
            <span className="daten-preview__chip">{group.label}</span>
          </div>
          <div className="daten-preview__bars">
            {VERDICTS.map((v, i) => (
              <div className="daten-preview__bar-row" key={v.key}>
                <span className="daten-preview__bar-label">{v.label}</span>
                <div className="daten-preview__bar-track">
                  <div
                    className="daten-preview__bar-fill"
                    style={{
                      width: `${group.values[i]}%`,
                      backgroundColor: `var(${v.cssVar})`,
                    } as CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
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
