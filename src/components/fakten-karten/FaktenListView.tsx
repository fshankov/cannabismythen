/**
 * FaktenListView — sortable, expandable table view for the 42 Mythen page.
 *
 * A2 overhaul (2026-06-10):
 *  - Clicking the row (or the chevron) expands the short summary inline
 *    beneath it, replacing the former cursor-following tooltip. The
 *    expanded panel carries a "Tippen für mehr →" button that opens the
 *    full factsheet popup — mirroring the Karten card's face-2 flow.
 *  - A2-3/4: tabular figures in the "#" column + a calm hover treatment
 *    (row tint + trailing arrow).
 *  - A2-5: the "#" and "Wissenschaftlich" headers sort the list.
 *
 * The statement stays an <a href> to the factsheet page so middle-click /
 * right-click still open it in a new tab; a plain left-click is prevented
 * and the row toggle handles expansion.
 */

import { useState, useMemo, useCallback, Fragment } from "react";
import { ChevronDown } from "lucide-react";
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

/** Sort order for the verdict column: richtig → … → falsch → keine Aussage. */
const VERDICT_RANK: Record<CorrectnessClass, number> = {
  richtig: 0,
  eher_richtig: 1,
  eher_falsch: 2,
  falsch: 3,
  keine_aussage_moeglich: 4,
};

type SortKey = "num" | "verdict";
interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface Props {
  myths: FaktenCardMyth[];
  onShowFactsheet?: (slug: string) => void;
}

export default function FaktenListView({ myths, onShowFactsheet }: Props) {
  // Accordion: at most one row's summary is open at a time.
  const [expandedNum, setExpandedNum] = useState<number | null>(null);
  // null = no active sort → "mix" (the default order the parent passes).
  const [sort, setSort] = useState<SortState | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return myths; // "mix" — keep the order the parent passes
    const arr = [...myths];
    arr.sort((a, b) => {
      let cmp: number;
      if (sort.key === "verdict") {
        cmp =
          VERDICT_RANK[toVerdict(a.classification)] -
          VERDICT_RANK[toVerdict(b.classification)];
        if (cmp === 0) cmp = a.mythNumber - b.mythNumber; // stable tiebreak
      } else {
        cmp = a.mythNumber - b.mythNumber;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [myths, sort]);

  // 3-state cycle per column: asc → desc → off ("mix").
  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // desc → back to mix
    });
  }, []);

  const toggleExpand = useCallback((n: number) => {
    setExpandedNum((prev) => (prev === n ? null : n));
  }, []);

  const openFactsheet = useCallback(
    (slug: string) => {
      if (onShowFactsheet) onShowFactsheet(slug);
    },
    [onShowFactsheet],
  );

  const ariaSortFor = (key: SortKey): "ascending" | "descending" | "none" =>
    sort?.key === key
      ? sort.dir === "asc"
        ? "ascending"
        : "descending"
      : "none";

  // Both arrows always render so an unsorted column still shows a neutral
  // ▲▼ pair (signalling "sortable"); the active key + direction highlights
  // the matching arrow.
  const renderSortInd = (key: SortKey) => {
    const active = sort?.key === key;
    return (
      <span className="fakten-list-sort__ind" aria-hidden="true">
        <span
          className={`fakten-list-sort__arrow${active && sort?.dir === "asc" ? " is-active" : ""}`}
        >
          ▲
        </span>
        <span
          className={`fakten-list-sort__arrow${active && sort?.dir === "desc" ? " is-active" : ""}`}
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <div className="fakten-list-panel">
      <table className="fakten-list-table">
        <thead>
          <tr>
            <th scope="col" className="col-num" aria-sort={ariaSortFor("num")}>
              <button
                type="button"
                className="fakten-list-sort"
                onClick={() => toggleSort("num")}
              >
                #
                {renderSortInd("num")}
              </button>
            </th>
            <th scope="col">Mythos</th>
            <th scope="col" className="col-verdict" aria-sort={ariaSortFor("verdict")}>
              <button
                type="button"
                className="fakten-list-sort"
                onClick={() => toggleSort("verdict")}
              >
                Wissenschaftlich
                {renderSortInd("verdict")}
              </button>
            </th>
            <th scope="col" className="col-expand" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((myth) => {
            const verdict = toVerdict(myth.classification);
            const summary = myth.cardShortSummary || myth.cardSummary;
            const isOpen = expandedNum === myth.mythNumber;
            return (
              <Fragment key={myth.mythNumber}>
                <tr
                  className={`fakten-list-row${isOpen ? " is-expanded" : ""}`}
                  data-classification={verdict}
                  onClick={() => toggleExpand(myth.mythNumber)}
                >
                  <td className="col-num">{myth.mythNumber}</td>
                  <td className="col-statement">
                    <a
                      href={`/daten-explorer/${myth.slug}/`}
                      className="fakten-list-statement"
                      onClick={(e) => {
                        if (onShowFactsheet) {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleExpand(myth.mythNumber);
                        }
                      }}
                    >
                      {myth.title}
                    </a>
                  </td>
                  <td className="col-verdict">
                    <VerdictPill verdict={verdict} size="sm" />
                  </td>
                  <td className="col-expand">
                    {summary && (
                      <button
                        type="button"
                        className={`fakten-list-expand${isOpen ? " is-open" : ""}`}
                        aria-expanded={isOpen}
                        aria-label={
                          isOpen
                            ? "Zusammenfassung ausblenden"
                            : "Zusammenfassung anzeigen"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(myth.mythNumber);
                        }}
                      >
                        <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
                {isOpen && summary && (
                  <tr
                    className="fakten-list-detail-row"
                    data-classification={verdict}
                  >
                    <td className="col-num" aria-hidden="true" />
                    <td colSpan={3} className="fakten-list-detail">
                      <p className="fakten-list-detail__text">{summary}</p>
                      <button
                        type="button"
                        className="fakten-list-detail__cta"
                        onClick={() => openFactsheet(myth.slug)}
                      >
                        Tippen für mehr →
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
