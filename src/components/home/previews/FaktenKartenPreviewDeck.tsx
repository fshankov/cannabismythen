import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getVerdictVisual } from "../../../lib/fakten-karten/verdict-colors";
import { getCategoryMeta } from "../../../lib/fakten-karten/categories";
import type { CorrectnessClass } from "../../../lib/dashboard/types";

export interface FaktenDeckMyth {
  text: string;
  classification: string;
  categoryGroup: string;
}
interface Props {
  myths: ReadonlyArray<FaktenDeckMyth>;
}

const VALID = new Set([
  "richtig",
  "eher_richtig",
  "eher_falsch",
  "falsch",
  "keine_aussage_moeglich",
]);
const toVerdict = (c: string): CorrectnessClass =>
  VALID.has(c) ? (c as CorrectnessClass) : "keine_aussage_moeglich";
const ROTATE_MS = 3200;

// Cycles the REAL Fakten-Karten card front (verdict gradient + faint direction
// arrow + italic statement + category footer — same getVerdictVisual source as
// /fakten-karten/), so the homepage preview matches the live card design.
export default function FaktenKartenPreviewDeck({ myths }: Props) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = ref.current;
    if (!root || myths.length < 2) return;
    let iv: number | null = null;
    const start = () => {
      if (iv === null)
        iv = window.setInterval(
          () => setIdx((i) => (i + 1) % myths.length),
          ROTATE_MS,
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
      { threshold: 0.5 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      stop();
    };
  }, [myths.length]);

  if (!myths.length) return null;
  const m = myths[idx];
  const v = getVerdictVisual(toVerdict(m.classification));
  const cat = getCategoryMeta(m.categoryGroup);
  const CatIcon = cat.icon;

  return (
    <div className="karten-deck" ref={ref} aria-hidden="true">
      <div
        className="karten-deck__card"
        key={idx}
        style={{ backgroundImage: v.gradient } as CSSProperties}
      >
        <span
          className="karten-deck__arrow"
          style={
            {
              top: v.arrowFrame.top,
              left: v.arrowFrame.left,
              width: v.arrowFrame.width,
              height: v.arrowFrame.height,
            } as CSSProperties
          }
        >
          <img src={v.arrowSrc} alt="" />
        </span>
        <div className="karten-deck__body">
          <p className="karten-deck__statement">{m.text}</p>
          <span className="karten-deck__cat">
            {CatIcon ? (
              <CatIcon size={15} strokeWidth={2} aria-hidden="true" />
            ) : null}
            <span className="karten-deck__cat-name">{m.categoryGroup}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
