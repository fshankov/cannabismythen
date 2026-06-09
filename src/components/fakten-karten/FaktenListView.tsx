/**
 * FaktenListView — table/list view for the 42 Mythen page.
 *
 * Flat list of all myths: #, full statement text, verdict pill.
 * Row hover shows a cursor-following tooltip with cardSummary.
 * Tooltip is portal-rendered (position: fixed) so it escapes the
 * panel's overflow:hidden and always follows the mouse.
 * Clicking a row navigates to the myth factsheet at /daten-explorer/[slug]/.
 */

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { FaktenCardMyth } from "./FaktenCard";
import VerdictPill from "../shared/VerdictPill";
import type { CorrectnessClass } from "../../lib/dashboard/types";

const VALID_VERDICTS: ReadonlySet<CorrectnessClass> = new Set([
  "richtig",
  "eher_richtig",
  "eher_falsch",
  "falsch",
  "keine_aussage_moeglich",
]);

function toVerdict(raw: string): CorrectnessClass {
  return VALID_VERDICTS.has(raw as CorrectnessClass)
    ? (raw as CorrectnessClass)
    : "keine_aussage_moeglich";
}

const TOOLTIP_MAX_W = 340;
const VIEWPORT_MARGIN = 20;
const CURSOR_OFFSET = 18; /* px above the cursor */

interface Props {
  myths: FaktenCardMyth[];
}

interface TooltipState {
  summary: string;
  x: number;
  y: number;
  place: "top" | "bottom";
}

export default function FaktenListView({ myths }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const updateTooltip = useCallback(
    (e: React.MouseEvent, summary: string) => {
      const cx = e.clientX;
      const cy = e.clientY;
      const place = cy - CURSOR_OFFSET - 80 > 8 ? "top" : "bottom";
      const x = Math.max(
        TOOLTIP_MAX_W / 2 + VIEWPORT_MARGIN,
        Math.min(window.innerWidth - TOOLTIP_MAX_W / 2 - VIEWPORT_MARGIN, cx)
      );
      const y = place === "top" ? cy - CURSOR_OFFSET : cy + CURSOR_OFFSET;
      setTooltip({ summary, x, y, place });
    },
    []
  );

  const clearTooltip = useCallback(() => setTooltip(null), []);

  return (
    <>
      <div className="fakten-list-panel">
        <table className="fakten-list-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th>Mythos</th>
              <th className="col-verdict">Wissenschaftlich</th>
            </tr>
          </thead>
          <tbody>
            {myths.map((myth) => (
              <tr
                key={myth.mythNumber}
                className="fakten-list-row"
                data-classification={toVerdict(myth.classification)}
                onMouseMove={
                  myth.cardSummary
                    ? (e) => updateTooltip(e, myth.cardSummary)
                    : undefined
                }
                onMouseLeave={myth.cardSummary ? clearTooltip : undefined}
              >
                <td className="col-num">{myth.mythNumber}</td>
                <td className="col-statement">
                  <a
                    href={`/daten-explorer/${myth.slug}/`}
                    className="fakten-list-statement"
                  >
                    {myth.title}
                  </a>
                </td>
                <td className="col-verdict">
                  <VerdictPill verdict={toVerdict(myth.classification)} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip !== null && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              className="fakten-list-tooltip-portal"
              style={{
                position: "fixed",
                left: tooltip.x,
                top: tooltip.y,
                transform:
                  tooltip.place === "top"
                    ? "translate(-50%, -100%)"
                    : "translate(-50%, 0)",
                zIndex: 10000,
                pointerEvents: "none",
              }}
            >
              {tooltip.summary}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
