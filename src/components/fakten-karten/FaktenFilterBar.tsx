/**
 * FaktenFilterBar — inline filter row above the Fakten-Karten grid.
 *
 * Three slots:
 *   1. Count chip (left)        — "X von 42 Mythen" / "42 Mythen".
 *   2. Search autocomplete      — visually identical to the Daten-Explorer
 *      (centre, ~440px max)         FilterDrawer search input
 *                                  (`.carm-filter-search-row__*` from
 *                                  dashboard.css). On focus, a panel
 *                                  appears below with one row per
 *                                  matching myth: checkbox + verdict
 *                                  statement + tiny category icon +
 *                                  category name. Tick rows to filter
 *                                  the grid live (AND-composed with
 *                                  category ticks).
 *   3. Categories dropdown      — same dropdown as before, but each
 *      (right)                       row now shows the category's
 *                                  Lucide icon + name in the xxx-700
 *                                  color used on the cards.
 *
 * Search behaves as an autocomplete + multi-select combobox: typing
 * narrows the list of myths in the panel; ticking persists the
 * selection across closes. Clearing the search resets the visible list
 * to all 42 (so the user can browse + pick without typing).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LayoutGrid, LayoutList } from "lucide-react";
import VerdictStatement from "../shared/VerdictStatement";
import CategoryFooter from "./CategoryFooter";
import PivotToggle from "../dashboard/controls/PivotToggle";
import { getCategoryMeta } from "../../lib/fakten-karten/categories";
import { normalize } from "../../lib/text-normalize";
import type { CorrectnessClass } from "../../lib/dashboard/types";

interface MythLike {
  mythNumber: number;
  title: string;
  classification: string;
  categoryGroup: string;
}

interface Props {
  categoryGroups: readonly string[];
  myths: MythLike[];
  selectedGroups: Set<string>;
  selectedMyths: Set<number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  /** Clears both the search text and all myth checkboxes. Used by the X
   *  button so the grid always fully resets when the user clears the input. */
  onClearSearch: () => void;
  onToggleGroup: (group: string) => void;
  onToggleMyth: (mythNumber: number) => void;
  onReset: () => void;
  view: "karten" | "liste";
  onSetView: (v: "karten" | "liste") => void;
}

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

function MythRow({
  m,
  checked,
  onToggle,
}: {
  m: MythLike;
  checked: boolean;
  onToggle: (n: number) => void;
}) {
  const meta = getCategoryMeta(m.categoryGroup);
  const Icon = meta.icon;
  return (
    <li className="fakten-search__row" role="option" aria-selected={checked}>
      <label className="fakten-search__label">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(m.mythNumber)}
        />
        <VerdictStatement
          statement={m.title}
          verdict={toVerdict(m.classification)}
          as="span"
          className="fakten-search__statement"
        />
        <span
          className="fakten-search__cat-icon"
          style={{ color: meta.label }}
          aria-label={`Kategorie: ${m.categoryGroup}`}
          title={m.categoryGroup}
        >
          <Icon size={14} strokeWidth={2} aria-hidden="true" />
        </span>
      </label>
    </li>
  );
}

export default function FaktenFilterBar({
  categoryGroups,
  myths,
  selectedGroups,
  selectedMyths,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onToggleGroup,
  onToggleMyth,
  onReset,
  view,
  onSetView,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const catContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const catTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Counts per category for the Kategorien dropdown badges.
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of categoryGroups) map.set(g, 0);
    for (const m of myths) {
      map.set(m.categoryGroup, (map.get(m.categoryGroup) ?? 0) + 1);
    }
    return map;
  }, [categoryGroups, myths]);

  // Two separate lists for the search panel:
  //   stuckMatches — ticked myths that fall outside the current query/category
  //                  scope. Always shown so the user can always untick them.
  //   textMatches  — myths in the active category scope that match the query
  //                  (or all in-scope myths when the query is empty).
  const { stuckMatches, textMatches } = useMemo(() => {
    const q = normalize(searchQuery.trim());
    const allSorted = [...myths].sort((a, b) => a.mythNumber - b.mythNumber);

    // Respect the category filter: panel only shows myths from selected categories.
    const inCategory = (m: MythLike) =>
      selectedGroups.size === 0 || selectedGroups.has(m.categoryGroup);
    const categoryFiltered = allSorted.filter(inCategory);

    if (q.length === 0) {
      // Stuck = ticked myths that are outside the selected categories.
      const stuck =
        selectedGroups.size > 0
          ? allSorted.filter((m) => selectedMyths.has(m.mythNumber) && !inCategory(m))
          : [];
      return { stuckMatches: stuck, textMatches: categoryFiltered };
    }

    const matchingNums = new Set(
      categoryFiltered.filter((m) => normalize(m.title).includes(q)).map((m) => m.mythNumber)
    );
    // Stuck = ticked myths not in matchingNums (outside category OR no text match).
    return {
      stuckMatches: allSorted.filter(
        (m) => selectedMyths.has(m.mythNumber) && !matchingNums.has(m.mythNumber)
      ),
      textMatches: categoryFiltered.filter((m) => matchingNums.has(m.mythNumber)),
    };
  }, [myths, searchQuery, selectedMyths, selectedGroups]);

  // Click-outside + Escape close each open dropdown.
  useEffect(() => {
    if (!searchOpen && !catDropdownOpen) return;
    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        searchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setSearchOpen(false);
      }
      if (
        catDropdownOpen &&
        catContainerRef.current &&
        !catContainerRef.current.contains(target)
      ) {
        setCatDropdownOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (catDropdownOpen) {
        setCatDropdownOpen(false);
        catTriggerRef.current?.focus();
        return;
      }
      if (searchOpen) {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [searchOpen, catDropdownOpen]);

  const selectedGroupCount = selectedGroups.size;
  const hasActiveFilter =
    selectedGroupCount > 0 ||
    selectedMyths.size > 0 ||
    searchQuery.trim().length > 0;

  const hitsHint =
    searchQuery.trim().length > 0
      ? `${textMatches.length} Treffer`
      : `${textMatches.length} Mythen`;

  return (
    <div className="fakten-filter-section">
      <p className="fakten-filter-section__label" aria-hidden="true">
        Kategorien &amp; Suche
      </p>
      <div className="fakten-filter-bar" role="search">
      <div
        className="fakten-filter-bar__category fakten-filter-dropdown"
        ref={catContainerRef}
      >
        <button
          ref={catTriggerRef}
          type="button"
          className={`fakten-filter-dropdown__trigger${
            catDropdownOpen ? " is-open" : ""
          }`}
          aria-haspopup="true"
          aria-expanded={catDropdownOpen}
          onClick={() => setCatDropdownOpen((v) => !v)}
        >
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="fakten-filter-dropdown__chevron"
          />
          <span className="fakten-filter-dropdown__label">
            Alle Kategorien
            {selectedGroupCount > 0 && (
              <span
                className="fakten-filter-dropdown__count"
                aria-label={`${selectedGroupCount} ausgewählt`}
              >
                ({selectedGroupCount})
              </span>
            )}
          </span>
        </button>

        {catDropdownOpen && (
          <div
            className="fakten-filter-dropdown__panel"
            role="menu"
            aria-label="Kategorien filtern"
          >
            {hasActiveFilter && (
              <div className="fakten-filter-dropdown__footer">
                <button
                  type="button"
                  className="fakten-filter-dropdown__reset"
                  onClick={() => {
                    onReset();
                    setCatDropdownOpen(false);
                  }}
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
            <ul className="fakten-filter-dropdown__list" role="none">
              {categoryGroups.map((group) => {
                const checked = selectedGroups.has(group);
                const count = groupCounts.get(group) ?? 0;
                return (
                  <li
                    key={group}
                    className="fakten-filter-dropdown__item"
                    role="none"
                  >
                    <label className="fakten-filter-checkbox">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleGroup(group)}
                      />
                      <CategoryFooter
                        categoryGroup={group}
                        className="fakten-filter-checkbox__cat"
                      />
                      <span className="fakten-filter-checkbox__count">
                        ({count})
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="fakten-filter-bar__search" ref={searchContainerRef}>
        <div className="carm-filter-search-row fakten-search">
          <input
            ref={searchInputRef}
            type="text"
            className="carm-filter-search-row__input"
            placeholder="Mythen suchen …"
            aria-label="Mythen suchen"
            aria-expanded={searchOpen}
            aria-controls="fakten-search-panel"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchOpen(true)}
          />
          {selectedMyths.size > 0 && (
            <span
              className="fakten-search-count"
              aria-label={`${selectedMyths.size} Mythen ausgewählt`}
            >
              ({selectedMyths.size})
            </span>
          )}
          {(searchQuery.length > 0 || selectedMyths.size > 0) && (
            <button
              type="button"
              className="carm-filter-search-row__clear"
              aria-label="Suche und Auswahl zurücksetzen"
              onClick={() => onClearSearch()}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
          {/* Icon last → right side, absolutely positioned + vertically
              centered via CSS. Sized to read at the field's scale. */}
          <span
            className="carm-filter-search-row__icon"
            aria-hidden="true"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
        </div>

        {searchOpen && (
          <div
            id="fakten-search-panel"
            className="fakten-search__panel"
            role="listbox"
            aria-label="Mythen auswählen"
          >
            {hasActiveFilter && (
              <div className="fakten-search__footer">
                <button
                  type="button"
                  className="fakten-search__reset"
                  onClick={() => {
                    onReset();
                    setSearchOpen(false);
                  }}
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
            <p className="fakten-search__hint">{hitsHint}</p>
            {stuckMatches.length === 0 && textMatches.length === 0 ? (
              <p className="fakten-search__empty">Keine Treffer</p>
            ) : (
              <ul className="fakten-search__list" role="presentation">
                {stuckMatches.length > 0 && (
                  <>
                    <li key="section-label" className="fakten-search__section-label" aria-hidden="true">
                      Bereits ausgewählt
                    </li>
                    {stuckMatches.map((m) => (
                      <MythRow
                        key={m.mythNumber}
                        m={m}
                        checked={true}
                        onToggle={onToggleMyth}
                      />
                    ))}
                    {textMatches.length > 0 && (
                      <li key="divider" className="fakten-search__divider" role="separator" aria-hidden="true" />
                    )}
                  </>
                )}
                {textMatches.map((m) => (
                  <MythRow
                    key={m.mythNumber}
                    m={m}
                    checked={selectedMyths.has(m.mythNumber)}
                    onToggle={onToggleMyth}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="fakten-filter-bar__view-toggle">
        <PivotToggle
          options={[
            {
              value: "karten",
              label: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <LayoutGrid size={13} aria-hidden="true" />
                  Karten
                </span>
              ),
            },
            {
              value: "liste",
              label: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <LayoutList size={13} aria-hidden="true" />
                  Liste
                </span>
              ),
            },
          ]}
          value={view}
          onChange={onSetView}
          aria-label="Ansicht wechseln"
        />
      </div>

      </div>
    </div>
  );
}
