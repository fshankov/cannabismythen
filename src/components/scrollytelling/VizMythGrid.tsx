import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { CarmData, CorrectnessClass } from "./types";
import {
  ON_VERDICT_BG_GLYPH,
  VERDICT_COLOR,
  sortedMyths,
  themeColorFor,
} from "./dataLoaders";
// MehrPopover removed (CAR-?? 2026-05-30) — myth grid is read-only on
// both step 3 (themed) and step 4 (classified). Full detail lives in
// /fakten-karten/ and is reachable from the hover-card aria-label.
import VerdictArrow from "../shared/VerdictArrow";
import {
  useFlipPosition,
  type FlipPosition,
} from "../dashboard/hooks/useFlipPosition";
import { withBase } from "../../lib/withBase";
import { CATEGORY_META } from "../../lib/fakten-karten/categories";

interface Props {
  data: CarmData;
  /** 'themed' = pastel category bg (step 3); 'classified' = verdict color + arrow (step 4). */
  mode: "themed" | "classified";
}

// Iter-14 (Harald review, CAR-14): the hover-card + detail-popover
// labels now use the canonical four-level classification words —
// `Richtig / Eher richtig / Eher falsch / Falsch / Keine Aussage` —
// rather than the colloquial "stimmt / stimmt nicht" phrasing flagged
// as off-brand. These match the in-body legend (VERDICT_LABEL_DE) so
// the same vocabulary surfaces in every place a verdict is named.
// English gloss: "Correct / Rather correct / Rather incorrect /
// Incorrect / No classification".
const VERDICT_LABEL_LONG: Record<CorrectnessClass, string> = {
  richtig: "Richtig",
  eher_richtig: "Eher richtig",
  eher_falsch: "Eher falsch",
  falsch: "Falsch",
  keine_aussage_moeglich: "Keine Aussage möglich",
};

interface MythSummary {
  summary_de: string;
  classification_label: string;
}
type MythSummaryMap = Record<string, MythSummary>;

export function VizMythGrid({ data, mode }: Props) {
  const myths = sortedMyths(data).slice(0, 42);
  const [summaries, setSummaries] = useState<MythSummaryMap | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  // CAR-?? (2026-05-30): the MehrPopover detail card was removed; both
  // step 3 (themed) and step 4 (classified) are now read-only chips.
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Iter-14 (Harald review, CAR-14): swap the bespoke grid-relative
  // positioning (left:x, top:y-12, transform translate(-50%,-100%))
  // for the shared useFlipPosition hook with `boundsRef` set to the
  // grid. Same flip-above-or-below behavior the other vizes use, plus
  // a clamp inside the viz block so corner-tile tooltips never bleed
  // past the canvas frame.
  const {
    triggerRef,
    cardRef,
    pos,
    open: tooltipOpen,
    setOpen: setTooltipOpen,
    updatePosition,
  } = useFlipPosition<HTMLElement, HTMLDivElement>({
    maxWidth: 320,
    gap: 10,
    boundsRef: gridRef,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(withBase("data/myth-summaries.json"))
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: MythSummaryMap) => {
        if (!cancelled) setSummaries(json);
      })
      .catch(() => {
        // Hover card falls back to text_de only on fetch error.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Iter-20: scroll-driven matrix build. In Step 3 (themed) the 42 cells
  // reveal in a radial wavefront growing from the bottom-right corner —
  // exactly where Step 2's messages "fell" — as the user scrolls into
  // the step. Drives a single `--build` (0→1) CSS var on the grid; each
  // cell carries a `--rt` reveal threshold (its normalised distance from
  // the bottom-right corner) and the CSS reveals it once `--build` passes
  // `--rt`. Step 4 (classified) and reduced-motion pin `--build` to 1 so
  // the full grid is always present there. useLayoutEffect sets the
  // initial value before paint (no flash); the listener scrubs it.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const reduced =
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.reducedMotion === "true");

    if (mode === "classified" || reduced) {
      grid.style.setProperty("--build", "1");
      return;
    }

    const compute = () => {
      const step3 = document.querySelector('[data-step="3"]');
      if (!step3) return 1;
      const r = (step3 as HTMLElement).getBoundingClientRect();
      const vh = window.innerHeight;
      // Build runs as Step 3 settles into the active band and completes a
      // little further down — picking up the corner pile from Step 2.
      const HI = vh * 0.5,
        LO = vh * 0.05;
      const v = (HI - r.top) / (HI - LO);
      return v < 0 ? 0 : v > 1 ? 1 : v;
    };

    let last = -1;
    const write = () => {
      const v = compute();
      if (Math.abs(v - last) < 0.004) return;
      last = v;
      grid.style.setProperty("--build", v.toFixed(3));
    };
    write();

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        write();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mode]);

  // Iter-11: themed-legend (orderedCats) + classified counts (counts)
  // are now derived in ScrollytellingViewer via shared helpers in
  // dataLoaders.ts. The viz column itself no longer renders them.

  const hoveredMyth =
    hoverId !== null ? (myths.find((m) => m.id === hoverId) ?? null) : null;
  const hoveredSummary =
    hoveredMyth && summaries ? summaries[String(hoveredMyth.id)] : null;

  function onCellEnter(mythId: number, e: React.MouseEvent | React.FocusEvent) {
    const el = e.currentTarget as HTMLElement;
    (triggerRef as unknown as React.MutableRefObject<Element | null>).current =
      el;
    setHoverId(mythId);
    setTooltipOpen(true);
    updatePosition();
  }

  function onCellLeave() {
    setHoverId(null);
    setTooltipOpen(false);
  }

  return (
    <div className="viz" data-grid-mode={mode}>
      <div
        ref={gridRef}
        className="viz-grid"
        role="img"
        aria-label={
          mode === "classified"
            ? "42 Cannabis-Mythen mit wissenschaftlicher Klassifikation"
            : "42 Cannabis-Mythen, sortiert nach Themenfeld"
        }
        style={{ position: "relative" }}
      >
        {myths.map((m, i) => {
          const themedBg = themeColorFor(m.category_id);
          const classifiedBg = VERDICT_COLOR[m.correctness_class];
          const bg = mode === "classified" ? classifiedBg : themedBg;
          // Iter-20: reveal threshold = normalised distance of this cell
          // from the bottom-right corner (col 6, row 5) of the 7×6 grid,
          // so the matrix builds outward from that corner as `--build`
          // rises. Scaled to [0, 1−RAMP] (RAMP=0.18, matching the CSS
          // divisor) so the FARTHEST cell still reaches full reveal
          // (cp=1) exactly at --build=1 — otherwise the top-left corner
          // would never fully appear, even in Step 4.
          const col = i % 7;
          const row = Math.floor(i / 7);
          const rt =
            (Math.sqrt((6 - col) ** 2 + (5 - row) ** 2) / Math.sqrt(61)) * 0.82;
          return (
            <div
              key={m.id}
              className={`viz-grid__cell viz-grid__cell--${mode}`}
              style={{
                backgroundColor: bg,
                ["--rt" as string]: rt.toFixed(3),
                cursor: "pointer",
              }}
              // CAR-?? (2026-05-30): no click affordance on either mode.
              // The grid is purely visual — full myth detail lives in
              // /fakten-karten/. Hover tooltip (driven by onMouseEnter)
              // is retained so reading the statement on hover still
              // works, but the cells aren't focusable and don't trigger
              // a popup on tap or keypress.
              onMouseEnter={(e) => onCellEnter(m.id, e)}
              onMouseLeave={onCellLeave}
              aria-label={
                mode === "classified"
                  ? `${m.text_de} — ${VERDICT_LABEL_LONG[m.correctness_class]}`
                  : m.text_de
              }
            >
              {/* Iter-20: icon sits in a FIXED top band (always 14px,
                  placeholder in themed mode, verdict arrow in classified
                  mode); the text lives in a flex:1 area centred below it.
                  Because the top band + text area are identical in both
                  modes, the myth text holds the exact same position when
                  the verdict SVG appears in Step 4 — it never reflows. */}
              {mode === "classified" ? (
                <VerdictArrow
                  verdict={m.correctness_class}
                  className="viz-grid__cell-icon"
                  size={14}
                  strokeWidth={2.5}
                  colorOverride={ON_VERDICT_BG_GLYPH}
                />
              ) : (
                (() => {
                  // Iter-22: themed mode shows the myth's category icon
                  // (Fakten-Karten set) on the existing category-coloured
                  // cell — so each square reads as its Themenfeld. Inherits
                  // the cell text colour; falls back to the empty slot.
                  const catName =
                    m.category_id != null
                      ? data.categories.find((c) => c.id === m.category_id)
                          ?.name_de
                      : undefined;
                  const CatIcon = catName
                    ? CATEGORY_META[catName]?.icon
                    : undefined;
                  return CatIcon ? (
                    <CatIcon
                      size={14}
                      className="viz-grid__cell-icon"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="viz-grid__cell-icon-slot"
                      aria-hidden="true"
                    />
                  );
                })()
              )}
              <div className="viz-grid__cell-textwrap">
                <span className="viz-grid__cell-text" lang="de">
                  {m.text_short_de}
                </span>
              </div>
            </div>
          );
        })}

        {/* Iter-14: tooltip card is always rendered (so `useFlipPosition`
            can measure `cardRef.current?.offsetHeight`) and positioned
            via inline `position: fixed; top/left/width` from `pos`.
            Portal to document.body so Safari's contain:layout on
            .scrolly__viz-canvas doesn't trap the fixed element. */}
        {createPortal(
          <MythHoverCard
            ref={cardRef}
            myth={hoveredMyth}
            mode={mode}
            summary={hoveredSummary}
            pos={pos}
            open={tooltipOpen && hoveredMyth !== null}
            categoryName={
              hoveredMyth
                ? (data.categories.find((c) => c.id === hoveredMyth.category_id)
                    ?.name_de ?? null)
                : null
            }
          />,
          document.body,
        )}
      </div>

      {/* Iter-11: theme + verdict legends moved to the LEFT text
          column (rendered by ScrollytellingViewer based on step.gridMode).
          The viz column now shows ONLY the data — no metadata blocks.
          CAR-?? (2026-05-30): MehrPopover detail card removed; full
          factsheet remains reachable from /fakten-karten/. */}
    </div>
  );
}

interface HoverCardProps {
  myth: {
    id: number;
    text_de: string;
    correctness_class: CorrectnessClass;
    category_id: number | null;
  } | null;
  mode: "themed" | "classified";
  summary: MythSummary | null;
  pos: FlipPosition | null;
  open: boolean;
  categoryName: string | null;
}

/**
 * MythHoverCard (Iter-14): position-fixed, useFlipPosition-driven. The
 * card is always mounted (so the hook can measure its real height for
 * the flip-above-or-below decision) but kept invisible via the
 * `is-open` class + opacity rule on `.viz-grid__hover`. Position is
 * applied as inline `position: fixed; top/left/width` taken from
 * `pos` — clamped inside the grid's bounds by the hook.
 */
const MythHoverCard = forwardRef<HTMLDivElement, HoverCardProps>(
  function MythHoverCard(
    { myth, mode, summary, pos, open, categoryName },
    ref,
  ) {
    const verdictColor = myth
      ? VERDICT_COLOR[myth.correctness_class]
      : "transparent";
    return (
      <div
        ref={ref}
        className={`viz-grid__hover${open ? " viz-grid__hover--open" : ""}`}
        role="tooltip"
        style={
          pos
            ? {
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width,
              }
            : undefined
        }
      >
        {myth && (
          <>
            <p className="viz-grid__hover-statement">{myth.text_de}</p>
            {mode === "classified" && (
              <div
                className="viz-grid__hover-verdict"
                style={{ color: verdictColor }}
              >
                <VerdictArrow
                  verdict={myth.correctness_class}
                  size={14}
                  strokeWidth={2.5}
                />
                <span>{VERDICT_LABEL_LONG[myth.correctness_class]}</span>
              </div>
            )}
            {mode === "themed" && categoryName && (
              <div className="viz-grid__hover-category">{categoryName}</div>
            )}
            {summary && mode === "classified" && (
              <p className="viz-grid__hover-summary">{summary.summary_de}</p>
            )}
          </>
        )}
      </div>
    );
  },
);

export { MythHoverCard };
