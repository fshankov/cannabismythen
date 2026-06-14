/**
 * FilterDrawer — search + accordion-by-category myth filter.
 *
 * Layout (top → bottom, sticky search header):
 *   1. Search input — when non-empty, hides the accordion and shows a
 *      flat hit list with verdict arrow + statement + category meta.
 *   2. Per-category accordion. Each row carries:
 *        - the category-level checkbox (all/some/none indeterminate)
 *        - the category name + (n) count
 *        - a chevron that toggles open/close
 *      When opened, the body lists every myth in that category as a
 *      checkbox row. All accordions are collapsed by default — the
 *      user expands a category to see its myths.
 *
 * Filtering result (in `filterMyths`): a myth is shown iff
 *   - both lists are empty (no filter, default), OR
 *   - it is in a selected category, OR
 *   - its id is in `mythIds`.
 *
 * Toggling a myth that's currently included via its category expands
 * the group: the category leaves `categoryIds` and the rest of its
 * myths (minus the toggled one) move into `mythIds`. This keeps the
 * visible row count correct without surprising the user.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Layers, Search, X } from 'lucide-react';
import type { AppState, Category, Myth } from '../../../lib/dashboard/types';
import Drawer from '../../shared/Drawer';
import { t } from '../../../lib/dashboard/translations';
import { getMythText, getMythShortText } from '../../../lib/dashboard/data';
import { normalize } from '../../../lib/text-normalize';
import VerdictStatement from '../../shared/VerdictStatement';
import type { MythContentEntry } from '../FactsheetPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Multi-key state patch. Lets `toggleCategory` and `toggleMyth`
   *  update both `categoryIds` and `mythIds` in a single render —
   *  avoids the stale-closure race that two sequential `update` calls
   *  would create. */
  updateMany: (patch: Partial<AppState>) => void;
  myths: Myth[];
  categories: Category[];
  /** Map of myth ID → pre-rendered factsheet content. The drawer reads
   *  `mythContent[id].title` to show the long claim sentence next to
   *  each myth, falling back to the short label when missing. */
  mythContent?: Record<number, MythContentEntry>;
}

export default function FilterDrawer({
  open,
  onClose,
  state,
  update,
  updateMany,
  myths,
  categories,
  mythContent,
}: Props) {
  const [query, setQuery] = useState('');
  /** Set of category-ids whose accordion is currently expanded.
   *  Default: empty (all collapsed). The user expands a category to
   *  reveal its myths. */
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Focus the search field whenever the drawer opens so the user can
  // type a myth name immediately — this is the entry point for myth
  // discovery now that the toolbar's "Mythos suchen" chip is gone.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  /** Long statement (Markdoc title) when available, else the short label.
   *  This is what the drawer + autocomplete render. */
  const longText = (m: Myth): string =>
    mythContent?.[m.id]?.title?.trim() || getMythText(m, 'de');

  // Group myths by category for the accordion list.
  const mythsByCategory = useMemo(() => {
    const map = new Map<number, Myth[]>();
    for (const m of myths) {
      if (m.category_id === null) continue;
      const list = map.get(m.category_id);
      if (list) list.push(m);
      else map.set(m.category_id, [m]);
    }
    return map;
  }, [myths]);

  const filteredMyths = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length === 0) return null; // null = show full grouped list
    return myths.filter((m) => {
      const haystack = `${normalize(longText(m))} ${normalize(
        getMythShortText(m, 'de'),
      )} ${normalize(m.category_de)}`;
      return haystack.includes(q);
    });
    // longText reads from mythContent which is stable per render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myths, query, mythContent]);

  /** A myth is "included" in the chart when its category is fully
   *  selected OR its id is in `mythIds`. */
  const isMythIncluded = (m: Myth): boolean => {
    if (m.category_id !== null && state.categoryIds.includes(m.category_id))
      return true;
    return state.mythIds.includes(m.id);
  };

  /** Category-level selection state derived from categoryIds + mythIds. */
  const categoryState = (id: number): 'all' | 'some' | 'none' => {
    if (state.categoryIds.includes(id)) return 'all';
    const myths = mythsByCategory.get(id) ?? [];
    const picked = myths.filter((m) => state.mythIds.includes(m.id)).length;
    if (picked === 0) return 'none';
    if (picked === myths.length) return 'all';
    return 'some';
  };

  const toggleCategory = (id: number) => {
    const current = categoryState(id);
    const myths = mythsByCategory.get(id) ?? [];
    if (current === 'all') {
      // Was fully selected → clear it. Drop the id from `categoryIds`
      // AND drop any individual myth ids of this category from
      // `mythIds` (they were redundant before, and dropping them
      // keeps the state clean).
      updateMany({
        categoryIds: state.categoryIds.filter((c) => c !== id),
        mythIds: state.mythIds.filter(
          (mid) => !myths.some((mm) => mm.id === mid),
        ),
      });
    } else {
      // Was partial / none → fully select. Add to categoryIds and
      // drop any individual myth ids of this category from mythIds
      // (now redundant).
      updateMany({
        categoryIds: [...state.categoryIds, id],
        mythIds: state.mythIds.filter(
          (mid) => !myths.some((mm) => mm.id === mid),
        ),
      });
    }
  };

  const toggleMyth = (m: Myth) => {
    const included = isMythIncluded(m);
    if (m.category_id !== null && state.categoryIds.includes(m.category_id)) {
      // Currently included via a fully-selected category → expand the
      // group: remove the category, add every other sibling individually,
      // skip this one (which is the implicit toggle-off). Single
      // updateMany so categoryIds and mythIds change in one render.
      const sibs = (mythsByCategory.get(m.category_id) ?? []).filter(
        (sm) => sm.id !== m.id,
      );
      const merged = new Set(state.mythIds);
      for (const sm of sibs) merged.add(sm.id);
      merged.delete(m.id);
      updateMany({
        categoryIds: state.categoryIds.filter((c) => c !== m.category_id),
        mythIds: Array.from(merged),
      });
      return;
    }
    if (included) {
      update(
        'mythIds',
        state.mythIds.filter((mid) => mid !== m.id),
      );
    } else {
      const nextMythIds = [...state.mythIds, m.id];
      // If this completes a category, promote it to categoryIds for
      // cleanliness — single updateMany handles both fields.
      if (m.category_id !== null) {
        const siblings = mythsByCategory.get(m.category_id) ?? [];
        const after = new Set(nextMythIds);
        const allCovered = siblings.every((sm) => after.has(sm.id));
        if (allCovered && !state.categoryIds.includes(m.category_id)) {
          updateMany({
            categoryIds: [...state.categoryIds, m.category_id],
            mythIds: nextMythIds.filter(
              (mid) => !siblings.some((sm) => sm.id === mid),
            ),
          });
          return;
        }
      }
      update('mythIds', nextMythIds);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    updateMany({
      categoryIds: [],
      mythIds: [],
      verdictFilter: 'all',
    });
    setQuery('');
    setExpanded(new Set());
  };

  const totalSelected = useMemo(() => {
    const categoryMythIds = new Set(
      Array.from(mythsByCategory.entries())
        .filter(([id]) => state.categoryIds.includes(id))
        .flatMap(([, ms]) => ms.map((m) => m.id)),
    );
    const extraMythIds = state.mythIds.filter((id) => !categoryMythIds.has(id));
    let n = categoryMythIds.size + extraMythIds.length;
    if (state.verdictFilter !== 'all') n += 1;
    return n;
  }, [state.categoryIds, state.mythIds, state.verdictFilter, mythsByCategory]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      size="md"
      title={t('filter.title', 'de')}
      headerEnd={
        // Selection count lives next to the title — `aria-live="polite"`
        // announces changes for screen readers, the visual fade-in
        // means it doesn't pop into existence when crossing zero.
        totalSelected > 0 ? (
          <span
            className="carm-filter-count"
            role="status"
            aria-live="polite"
          >
            {totalSelected} {totalSelected === 1 ? 'Mythos' : 'Mythen'}{' '}
            <span className="carm-filter-count__suffix">ausgewählt</span>
          </span>
        ) : undefined
      }
      footer={
        <>
          <button
            type="button"
            className="carm-btn"
            onClick={reset}
          >
            <X size={13} strokeWidth={2.5} aria-hidden="true" />
            {t('filter.reset', 'de')}
          </button>
          <button
            type="button"
            className="carm-btn carm-btn--primary"
            onClick={onClose}
          >
            {t('filter.apply', 'de')}
          </button>
        </>
      }
    >
      <div className="carm-filter-search-row">
        <Search
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className="carm-filter-search-row__icon"
        />
        <input
          ref={searchInputRef}
          type="search"
          className="carm-filter-search-row__input"
          placeholder={t('filter.myths.searchPlaceholder', 'de')}
          aria-label={t('filter.myths.searchPlaceholder', 'de')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.length > 0 && (
          <button
            type="button"
            className="carm-filter-search-row__clear"
            aria-label={t('filter.reset', 'de')}
            onClick={() => setQuery('')}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Chip strip: one chip per selected category + one per individually
          selected myth. Categories show their name + count; individual myths
          show a verdict arrow + truncated label. Both can be dismissed with ✕. */}
      {(() => {
        const selectedCats = categories.filter((c) =>
          state.categoryIds.includes(c.id),
        );
        const selectedMyths = myths.filter((m) =>
          state.mythIds.includes(m.id),
        );
        if (selectedCats.length === 0 && selectedMyths.length === 0) return null;
        return (
          <div
            className="carm-filter-selected"
            aria-label="Ausgewählte Filter"
          >
            <div className="carm-filter-selected__head">
              <p className="carm-filter-selected__label">Ausgewählt</p>
              <button
                type="button"
                className="carm-filter-selected__clear-all"
                onClick={() => updateMany({ categoryIds: [], mythIds: [] })}
                aria-label="Alle Auswahlen entfernen"
              >
                Alle entfernen
                <X size={13} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
            <ul className="carm-filter-selected__chips" role="list">
              {selectedCats.map((c) => {
                const count = mythsByCategory.get(c.id)?.length ?? 0;
                const label = `${c.name_de} (${count})`;
                return (
                  <li key={`cat-${c.id}`}>
                    <span
                      className="carm-filter-selected__chip"
                      title={label}
                    >
                      <Layers
                        size={13}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="carm-filter-selected__chip-icon"
                      />
                      <span className="carm-filter-selected__chip-text">
                        {label}
                      </span>
                      <button
                        type="button"
                        className="carm-filter-selected__chip-remove"
                        onClick={() =>
                          update(
                            'categoryIds',
                            state.categoryIds.filter((id) => id !== c.id),
                          )
                        }
                        aria-label={`Kategorie entfernen: ${label}`}
                        title={`Kategorie entfernen: ${label}`}
                      >
                        <X size={11} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                );
              })}
              {selectedMyths.map((m) => {
                const txt = getMythShortText(m, 'de');
                const truncated = txt.length > 32 ? txt.slice(0, 30) + '…' : txt;
                return (
                  <li key={m.id}>
                    <span
                      className="carm-filter-selected__chip"
                      title={txt}
                    >
                      <VerdictStatement
                        statement={truncated}
                        verdict={m.correctness_class}
                        as="span"
                        className="carm-filter-selected__chip-text"
                      />
                      <button
                        type="button"
                        className="carm-filter-selected__chip-remove"
                        onClick={() =>
                          update(
                            'mythIds',
                            state.mythIds.filter((id) => id !== m.id),
                          )
                        }
                        aria-label={`Auswahl entfernen: ${txt}`}
                        title={`Auswahl entfernen: ${txt}`}
                      >
                        <X size={11} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })()}

      <section className="carm-filter-section">
        <h3 className="carm-filter-section__title">
          {filteredMyths === null
            ? t('filter.myths.label', 'de')
            : `${filteredMyths.length} ${
                filteredMyths.length === 1 ? 'Treffer' : 'Treffer'
              }`}
        </h3>
        {filteredMyths !== null && filteredMyths.length === 0 && (
          <p className="carm-filter-empty">{t('filter.myths.empty', 'de')}</p>
        )}
        {filteredMyths === null ? (
          <ul className="carm-filter-accordion" role="list">
            {categories.map((c) => {
              const cMyths = mythsByCategory.get(c.id) ?? [];
              if (cMyths.length === 0) return null;
              const sel = categoryState(c.id);
              const isOpen = expanded.has(c.id);
              const headingId = `carm-filter-acc-h-${c.id}`;
              const panelId = `carm-filter-acc-p-${c.id}`;
              return (
                <li key={c.id} className="carm-filter-accordion__item">
                  <div className="carm-filter-accordion__heading">
                    {/* Stage 6 v3: small checkbox is its own hit
                        target (toggles the category selection). The
                        REST of the heading row — name, count, chevron —
                        is one big button that toggles open/close. So:
                        click the box to select, click anywhere else to
                        expand. */}
                    <label
                      className="carm-checkbox carm-checkbox--category"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={sel === 'all'}
                        ref={(el) => {
                          if (el) el.indeterminate = sel === 'some';
                        }}
                        onChange={() => toggleCategory(c.id)}
                        aria-label={`${c.name_de} (${cMyths.length})`}
                      />
                    </label>
                    <button
                      type="button"
                      className={`carm-filter-accordion__toggle${
                        isOpen ? ' is-open' : ''
                      }`}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleExpanded(c.id)}
                    >
                      <span
                        className="carm-filter-accordion__name"
                        id={headingId}
                      >
                        {c.name_de}
                        <span className="carm-checkbox__count">
                          ({cMyths.length})
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="carm-filter-accordion__chevron"
                      />
                    </button>
                  </div>
                  {/* Panel is ALWAYS rendered so the height transition
                      can animate from 0 → content. The wrapper carries
                      the open class which drives a `grid-template-rows`
                      transition (modern browsers; degrades to instant
                      open in older ones). `inert` keeps the collapsed
                      content out of the focus order + AT tree. */}
                  <div
                    {...(isOpen ? {} : { inert: '' as unknown as boolean })}
                    className={`carm-filter-accordion__panel-wrap${
                      isOpen ? ' is-open' : ''
                    }`}
                  >
                    <ul
                      id={panelId}
                      role="list"
                      className="carm-filter-section__list carm-filter-myth-list carm-filter-accordion__panel"
                    >
                      {cMyths.map((m) => renderMythRow(m))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul
            className="carm-filter-section__list carm-filter-myth-list"
            role="list"
          >
            {filteredMyths.map((m) => renderMythRow(m))}
          </ul>
        )}
      </section>
    </Drawer>
  );

  function renderMythRow(m: Myth) {
    const checked = isMythIncluded(m);
    return (
      <li key={m.id}>
        <label className="carm-checkbox carm-checkbox--myth">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleMyth(m)}
          />
          <VerdictStatement
            statement={longText(m)}
            verdict={m.correctness_class}
            as="span"
            className="carm-checkbox__label"
          />
        </label>
      </li>
    );
  }
}
