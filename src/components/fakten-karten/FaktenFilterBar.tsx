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

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ChevronDown, Download } from "lucide-react";
import VerdictStatement from "../shared/VerdictStatement";
import CategoryFooter from "./CategoryFooter";
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
  /** Clears only the category group ticks (X button on the Kategorien trigger). */
  onClearGroups: () => void;
  onToggleGroup: (group: string) => void;
  onToggleMyth: (mythNumber: number) => void;
  onReset: () => void;
  /** Opens the export drawer (Liste/Karten PDF + PNG + Faktenblätter). */
  onOpenExport: () => void;
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
  active,
  id,
  onToggle,
}: {
  m: MythLike;
  checked: boolean;
  active: boolean;
  id: string;
  onToggle: (n: number) => void;
}) {
  const meta = getCategoryMeta(m.categoryGroup);
  const Icon = meta.icon;
  return (
    <li
      id={id}
      className={`fakten-search__row${active ? " is-active" : ""}`}
      role="option"
      aria-selected={checked}
    >
      <label className="fakten-search__label">
        {/* tabIndex=-1 + aria-hidden: the listbox option itself carries
            aria-selected (the source of truth for SR users), so the inner
            checkbox shouldn't compete for focus inside the combobox flow
            (a11y audit 2026-06-10). */}
        <input
          type="checkbox"
          tabIndex={-1}
          aria-hidden="true"
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
  onClearGroups,
  onToggleGroup,
  onToggleMyth,
  onReset,
  onOpenExport,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  /** Keyboard-active option in the search autocomplete (index into the flat
   *  [...stuckMatches, ...textMatches] list; -1 = none). Heuristic #7. */
  const [activeIndex, setActiveIndex] = useState(-1);
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
        // Close the autocomplete panel but KEEP focus in the input — combobox
        // pattern (a11y audit 2026-06-10). Removing the previous blur() so
        // keyboard users don't get dropped to <body> on every Esc.
        setSearchOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [searchOpen, catDropdownOpen]);

  // Reset the keyboard-active option when the visible list changes or the
  // panel toggles (Heuristic #7). selectedMyths is intentionally NOT a dep:
  // toggling a myth via Enter keeps the cursor where it is.
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery, selectedGroups, searchOpen]);

  // Keep the active option scrolled into the panel viewport while arrowing.
  useEffect(() => {
    if (activeIndex < 0) return;
    const opt = [...stuckMatches, ...textMatches][activeIndex];
    if (!opt) return;
    document
      .getElementById(`fakten-search-opt-${opt.mythNumber}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, stuckMatches, textMatches]);

  const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    const count = stuckMatches.length + textMatches.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!searchOpen) setSearchOpen(true);
      setActiveIndex((i) => (count === 0 ? -1 : (i + 1) % count));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!searchOpen) setSearchOpen(true);
      setActiveIndex((i) => (count === 0 ? -1 : i <= 0 ? count - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < count) {
        e.preventDefault();
        const opt =
          activeIndex < stuckMatches.length
            ? stuckMatches[activeIndex]
            : textMatches[activeIndex - stuckMatches.length];
        onToggleMyth(opt.mythNumber);
      }
    } else if (e.key === "Home") {
      if (searchOpen && count > 0) {
        e.preventDefault();
        setActiveIndex(0);
      }
    } else if (e.key === "End") {
      if (searchOpen && count > 0) {
        e.preventDefault();
        setActiveIndex(count - 1);
      }
    }
  };

  // id of the active option, for the input's aria-activedescendant.
  const activeOpt = [...stuckMatches, ...textMatches][activeIndex];
  const activeOptionId =
    activeIndex >= 0 && activeOpt
      ? `fakten-search-opt-${activeOpt.mythNumber}`
      : undefined;

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
      {/* Section label is a real heading-like label for the toolbar; was
          aria-hidden, restored so SR users hear the group's purpose
          (a11y audit 2026-06-10). */}
      <p className="fakten-filter-section__label" id="fakten-filter-section-label">
        Kategorien &amp; Suche
      </p>
      <div
        className="fakten-filter-bar"
        role="search"
        aria-labelledby="fakten-filter-section-label"
      >
      <div
        className="fakten-filter-bar__category fakten-filter-dropdown"
        ref={catContainerRef}
      >
        <div className="fakten-filter-dropdown__trigger-row">
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
              {/* "Alle Kategorien" only when nothing is selected. */}
              {selectedGroupCount > 0 ? "Kategorien" : "Alle Kategorien"}
            </span>
            {selectedGroupCount > 0 && (
              <span
                className="fakten-search-count fakten-filter-dropdown__count-badge"
                aria-label={`${selectedGroupCount} ausgewählt`}
              >
                ({selectedGroupCount})
              </span>
            )}
          </button>
          {selectedGroupCount > 0 && (
            <button
              type="button"
              className="fakten-filter-dropdown__clear"
              aria-label="Kategoriefilter löschen"
              onClick={() => onClearGroups()}
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
        </div>

        {catDropdownOpen && (
          // Plain disclosure pattern, not an ARIA menu — the contents are
          // checkboxes + a reset button, not menuitems. The previous
          // role="menu" + role="none" stack misled screen readers into
          // expecting menuitemcheckboxes and arrow-key navigation
          // (a11y audit 2026-06-10).
          <div
            className="fakten-filter-dropdown__panel"
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
            <ul className="fakten-filter-dropdown__list">
              {categoryGroups.map((group) => {
                const checked = selectedGroups.has(group);
                const count = groupCounts.get(group) ?? 0;
                return (
                  <li
                    key={group}
                    className="fakten-filter-dropdown__item"
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
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={searchOpen}
            // aria-controls only points at a mounted element — when the panel
            // is closed the listbox doesn't exist (a11y audit 2026-06-10).
            aria-controls={searchOpen ? "fakten-search-panel" : undefined}
            aria-activedescendant={activeOptionId}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
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
          // Combobox panel restructured (a11y audit 2026-06-10): the
          // listbox must only contain options, so the reset button + hits
          // hint live OUTSIDE the listbox. The empty-state lives inside
          // (with role="option" disabled) so the combobox association still
          // resolves when there are zero matches.
          <div
            className="fakten-search__panel"
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
              <ul
                id="fakten-search-panel"
                className="fakten-search__list"
                role="listbox"
                aria-multiselectable="true"
                aria-label="Mythen auswählen"
              >
                <li className="fakten-search__empty" role="option" aria-disabled="true">
                  Keine Treffer
                </li>
              </ul>
            ) : (
              <ul
                id="fakten-search-panel"
                className="fakten-search__list"
                role="listbox"
                aria-multiselectable="true"
                aria-label="Mythen auswählen"
              >
                {stuckMatches.length > 0 && (
                  <>
                    {/* Visible section label — restored from aria-hidden so
                        SR users hear the grouping (a11y audit 2026-06-10). */}
                    <li key="section-label" className="fakten-search__section-label" role="presentation">
                      Bereits ausgewählt
                    </li>
                    {stuckMatches.map((m, i) => (
                      <MythRow
                        key={m.mythNumber}
                        m={m}
                        checked={true}
                        active={activeIndex === i}
                        id={`fakten-search-opt-${m.mythNumber}`}
                        onToggle={onToggleMyth}
                      />
                    ))}
                    {textMatches.length > 0 && (
                      <li key="divider" className="fakten-search__divider" role="presentation" aria-hidden="true" />
                    )}
                  </>
                )}
                {textMatches.map((m, i) => (
                  <MythRow
                    key={m.mythNumber}
                    m={m}
                    checked={selectedMyths.has(m.mythNumber)}
                    active={activeIndex === stuckMatches.length + i}
                    id={`fakten-search-opt-${m.mythNumber}`}
                    onToggle={onToggleMyth}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="fakten-filter-bar__export">
        <button
          type="button"
          className="carm-btn carm-explorer__export"
          onClick={onOpenExport}
          aria-label="Mythen exportieren"
        >
          <Download size={16} strokeWidth={2} aria-hidden="true" />
          Exportieren
        </button>
      </div>

      </div>
    </div>
  );
}
