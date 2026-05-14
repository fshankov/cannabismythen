/**
 * FaktenFilterBar — inline filter row above the Fakten-Karten grid.
 *
 * One horizontal row with two controls:
 *   1. Search input — diacritic-insensitive live-filters by myth title.
 *   2. Categories dropdown — single pill button "Kategorien (N)" opens a
 *      small popover panel anchored below it, with 8 checkbox rows
 *      (one per categoryGroup) and per-category myth counts. Multi-
 *      select.
 *
 * No drawer, no slide-out. Everything stays visible inline so the user
 * sees the filter affordances without an extra click.
 *
 * CSS uses the `.fakten-filter-*` namespace (in src/styles/quiz.css) so
 * the visual language can evolve independently from the Daten-Explorer's
 * `.carm-filter-*` family. Fedor's call (2026-05-14): the two pages may
 * use similar elements today but should not share CSS so future design
 * changes on one don't cross-affect the other.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { normalize } from '../../lib/text-normalize';

interface MythLike {
  mythNumber: number;
  title: string;
  categoryGroup: string;
}

interface Props {
  categoryGroups: readonly string[];
  myths: MythLike[];
  selectedGroups: Set<string>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleGroup: (group: string) => void;
  onReset: () => void;
}

export default function FaktenFilterBar({
  categoryGroups,
  myths,
  selectedGroups,
  searchQuery,
  onSearchChange,
  onToggleGroup,
  onReset,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Counts per group for the dropdown badges.
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of categoryGroups) map.set(g, 0);
    for (const m of myths) {
      map.set(m.categoryGroup, (map.get(m.categoryGroup) ?? 0) + 1);
    }
    return map;
  }, [categoryGroups, myths]);

  // Click-outside + Escape close the dropdown. Mirrors how OWID
  // grapher and most native menus behave.
  useEffect(() => {
    if (!dropdownOpen) return;
    const handlePointer = (e: MouseEvent) => {
      const container = dropdownContainerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('mousedown', handlePointer);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [dropdownOpen]);

  const selectedCount = selectedGroups.size;
  const hasActiveFilter =
    selectedCount > 0 || normalize(searchQuery).length > 0;

  return (
    <div className="fakten-filter-bar" role="search">
      <div className="fakten-filter-search">
        <Search
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className="fakten-filter-search__icon"
        />
        <input
          type="search"
          className="fakten-filter-search__input"
          placeholder="Mythen suchen …"
          aria-label="Mythen suchen"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            className="fakten-filter-search__clear"
            aria-label="Suche zurücksetzen"
            onClick={() => onSearchChange('')}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        className="fakten-filter-dropdown"
        ref={dropdownContainerRef}
      >
        <button
          ref={triggerRef}
          type="button"
          className={`fakten-filter-dropdown__trigger${
            dropdownOpen ? ' is-open' : ''
          }`}
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          onClick={() => setDropdownOpen((v) => !v)}
        >
          <span className="fakten-filter-dropdown__label">
            Kategorien
            {selectedCount > 0 && (
              <span
                className="fakten-filter-dropdown__count"
                aria-label={`${selectedCount} ausgewählt`}
              >
                ({selectedCount})
              </span>
            )}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="fakten-filter-dropdown__chevron"
          />
        </button>

        {dropdownOpen && (
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
                      <span className="fakten-filter-checkbox__label">
                        {group}
                      </span>
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
                    setDropdownOpen(false);
                  }}
                >
                  Zurücksetzen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
