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
import { ChevronDown } from "lucide-react";
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
  onToggleGroup: (group: string) => void;
  onToggleMyth: (mythNumber: number) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
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

export default function FaktenFilterBar({
  categoryGroups,
  myths,
  selectedGroups,
  selectedMyths,
  searchQuery,
  onSearchChange,
  onToggleGroup,
  onToggleMyth,
  onReset,
  totalCount,
  filteredCount,
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

  // Matches for the search autocomplete panel. Empty query → all
  // myths so the panel doubles as a browseable multi-pick list.
  const searchMatches = useMemo(() => {
    const q = normalize(searchQuery.trim());
    const sorted = [...myths].sort((a, b) => a.mythNumber - b.mythNumber);
    if (q.length === 0) return sorted;
    return sorted.filter((m) => normalize(m.title).includes(q));
  }, [myths, searchQuery]);

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
    normalize(searchQuery).length > 0;

  const hitsHint =
    searchQuery.trim().length > 0
      ? `${searchMatches.length} ${searchMatches.length === 1 ? "Treffer" : "Treffer"} · Auswahl per Klick`
      : `${totalCount} Mythen · zum Filtern anklicken`;

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
          </div>
        )}
      </div>

      <div className="fakten-filter-bar__search" ref={searchContainerRef}>
        <div className="carm-filter-search-row fakten-search">
          <input
            ref={searchInputRef}
            type="search"
            className="carm-filter-search-row__input"
            placeholder="Mythen suchen …"
            aria-label="Mythen suchen"
            aria-expanded={searchOpen}
            aria-controls="fakten-search-panel"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onClick={() => setSearchOpen(true)}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              className="carm-filter-search-row__clear"
              aria-label="Suche zurücksetzen"
              onClick={() => onSearchChange("")}
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
            <p className="fakten-search__hint">{hitsHint}</p>
            {searchMatches.length === 0 ? (
              <p className="fakten-search__empty">Keine Treffer</p>
            ) : (
              <ul className="fakten-search__list" role="presentation">
                {searchMatches.map((m) => {
                  const checked = selectedMyths.has(m.mythNumber);
                  const meta = getCategoryMeta(m.categoryGroup);
                  const Icon = meta.icon;
                  return (
                    <li
                      key={m.mythNumber}
                      className="fakten-search__row"
                      role="option"
                      aria-selected={checked}
                    >
                      <label className="fakten-search__label">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleMyth(m.mythNumber)}
                        />
                        <VerdictStatement
                          statement={m.title}
                          verdict={toVerdict(m.classification)}
                          as="span"
                          className="fakten-search__statement"
                        />
                        {/* Category icon only — no text. Sits to the
                            right of the verdict statement so the row
                            stays compact. Uses CATEGORY_META.label
                            color so it ties back to the card footer. */}
                        <span
                          className="fakten-search__cat-icon"
                          style={{ color: meta.label }}
                          aria-label={`Kategorie: ${m.categoryGroup}`}
                          title={m.categoryGroup}
                        >
                          <Icon
                            size={14}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
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
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
