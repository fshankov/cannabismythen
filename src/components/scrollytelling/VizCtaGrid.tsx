import { useEffect, useState } from "react";
import type { CarmData } from "./types";
import { PathCards } from "../shared/PathCards";

/**
 * Step 10 viz — the four "next step" cards (Quiz · Fakten-Karten ·
 * Daten-Explorer · Meine Interessen). Cards reveal one-by-one as the
 * user scrolls into Step 10 (scroll-driven stagger), and dissolve out
 * as Step 11 scrolls into view.
 */
export function VizCtaGrid({ data }: { data: CarmData }) {
  const [revealed, setRevealed] = useState(0);
  const [dissolve, setDissolve] = useState(false);

  useEffect(() => {
    function update() {
      const step10 = document.querySelector(
        '[data-step="10"]',
      ) as HTMLElement | null;
      const step11 = document.querySelector(
        '[data-step="11"]',
      ) as HTMLElement | null;
      const vh = window.innerHeight;

      if (step10) {
        const r = step10.getBoundingClientRect();
        // All cards appear together once step 10 is 40% into the viewport.
        const HI = vh * 0.9,
          LO = vh * 0.5;
        const p = Math.max(0, Math.min(1, (HI - r.top) / (HI - LO)));
        setRevealed(p > 0 ? 4 : 0);
      }

      if (step11) {
        const r11 = step11.getBoundingClientRect();
        setDissolve(r11.top < vh * 0.72);
      } else {
        setDissolve(false);
      }
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="viz"
      style={{
        opacity: dissolve ? 0 : 1,
        transition: "opacity 500ms ease",
      }}
    >
      <PathCards myths={data.myths} revealedCards={revealed} />
    </div>
  );
}
