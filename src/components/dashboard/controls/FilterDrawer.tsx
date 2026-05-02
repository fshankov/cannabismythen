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

import { useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import type { AppState, Category, Myth } from '../../../lib/dashboard/types';
import Drawer from '../../shared/Drawer';
import { t } from '../../../lib/dashboard/translations';
import { getMythText, getMythShortText } from '../../../lib/dashboard/data';
import VerdictArrowWithInfo from '../VerdictArrowWithInfo';
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

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
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
    let n = state.mythIds.length;
    for (const id of state.categoryIds) {
      n += mythsByCategory.get(id)?.length ?? 0;
    }
    return n;
  }, [state.categoryIds, state.mythIds, mythsByCategory]);

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
            className="carm-btn carm-btn--ghost"
            onClick={reset}
          >
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
                    {/* The category-level checkbox is its own focusable
                        label so it stays a clean checkbox affordance —
                        the chevron next to it controls open/close
                        independently. Two distinct hit areas matches
                        the GitHub / Notion accordion-with-multiselect
                        pattern. */}
                    <label className="carm-checkbox carm-checkbox--category">
                      <input
                        type="checkbox"
                        checked={sel === 'all'}
                        ref={(el) => {
                          if (el) el.indeterminate = sel === 'some';
                        }}
                        onChange={() => toggleCategory(c.id)}
                        aria-label={`${c.name_de} (${cMyths.length})`}
                      />
                      <span className="carm-checkbox__label" id={headingId}>
                        {c.name_de}
                        <span className="carm-checkbox__count">
                          ({cMyths.length})
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      className={`carm-filter-accordion__toggle${
                        isOpen ? ' is-open' : ''
                      }`}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      aria-labelledby={headingId}
                      onClick={() => toggleExpanded(c.id)}
                    >
                      <ChevronRight
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
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
          <span
            className={`carm-checkbox__verdict classification--${m.correctness_class}`}
            onClick={(e) => e.stopPropagation()}
          >
            <VerdictArrowWithInfo
              verdict={m.correctness_class}
              size={12}
              strokeWidth={2.25}
            />
          </span>
          <span
            className={`carm-checkbox__label statement--${m.correctness_class}`}
          >
            {longText(m)}
          </span>
        </label>
      </li>
    );
  }
}
