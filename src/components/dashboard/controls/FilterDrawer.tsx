/**
 * FilterDrawer — unified search + Kategorien + einzelne Mythen multi-select.
 *
 * Layout (top → bottom, sticky search header):
 *   1. Search input — filters the visible myth list below it.
 *   2. Mythos-Kategorien checkboxes — selecting a category implicitly
 *      includes every myth that belongs to it. The category checkbox is
 *      derived from `state.categoryIds` (clean group selection) and the
 *      myth list is derived from `state.mythIds` (individual additions
 *      that aren't covered by a fully-selected category).
 *   3. Einzelne Mythen — checkbox per myth, grouped by category. Filtered
 *      live by the search input.
 *
 * Filtering result (in `filterMyths`): a myth is shown iff
 *   - both lists are empty (no filter, default), OR
 *   - it is in a selected category, OR
 *   - its id is in `mythIds`.
 *
 * Toggling a myth that's currently included via its category expands the
 * group: the category leaves `categoryIds` and the rest of its myths
 * (minus the toggled one) move into `mythIds`. This keeps the visible
 * row count correct without surprising the user.
 */

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { AppState, Category, Myth } from '../../../lib/dashboard/types';
import Drawer from '../../shared/Drawer';
import { t } from '../../../lib/dashboard/translations';
import { getMythText, getMythShortText } from '../../../lib/dashboard/data';
import VerdictArrow from '../../shared/VerdictArrow';
import type { MythContentEntry } from '../FactsheetPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
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
  myths,
  categories,
  mythContent,
}: Props) {
  const [query, setQuery] = useState('');

  /** Long statement (Markdoc title) when available, else the short label.
   *  This is what the drawer + autocomplete render. */
  const longText = (m: Myth): string =>
    mythContent?.[m.id]?.title?.trim() || getMythText(m, 'de');

  // Group myths by category for the einzelne-Mythen list.
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
      // Was fully selected → clear it. categoryIds loses the id; any
      // myths from this category in mythIds are dropped too (they were
      // redundant before, and dropping them keeps the state clean).
      update(
        'categoryIds',
        state.categoryIds.filter((c) => c !== id),
      );
      update(
        'mythIds',
        state.mythIds.filter((mid) => !myths.some((mm) => mm.id === mid)),
      );
    } else {
      // Was partial / none → fully select. Add to categoryIds and drop
      // any individual myth ids of this category from mythIds (now
      // redundant).
      update('categoryIds', [...state.categoryIds, id]);
      update(
        'mythIds',
        state.mythIds.filter((mid) => !myths.some((mm) => mm.id === mid)),
      );
    }
  };

  const toggleMyth = (m: Myth) => {
    const included = isMythIncluded(m);
    if (m.category_id !== null && state.categoryIds.includes(m.category_id)) {
      // Currently included via a fully-selected category → expand the
      // group: remove the category, add every other sibling individually,
      // skip this one (which is the implicit toggle-off).
      const sibs = (mythsByCategory.get(m.category_id) ?? []).filter(
        (sm) => sm.id !== m.id,
      );
      update(
        'categoryIds',
        state.categoryIds.filter((c) => c !== m.category_id),
      );
      const merged = new Set(state.mythIds);
      for (const sm of sibs) merged.add(sm.id);
      merged.delete(m.id);
      update('mythIds', Array.from(merged));
      return;
    }
    if (included) {
      update(
        'mythIds',
        state.mythIds.filter((mid) => mid !== m.id),
      );
    } else {
      update('mythIds', [...state.mythIds, m.id]);
      // If this completes a category, promote it to categoryIds for cleanliness.
      if (m.category_id !== null) {
        const siblings = mythsByCategory.get(m.category_id) ?? [];
        const after = new Set([...state.mythIds, m.id]);
        const allCovered = siblings.every((sm) => after.has(sm.id));
        if (allCovered && !state.categoryIds.includes(m.category_id)) {
          update('categoryIds', [...state.categoryIds, m.category_id]);
          update(
            'mythIds',
            [...state.mythIds, m.id].filter(
              (mid) => !siblings.some((sm) => sm.id === mid),
            ),
          );
        }
      }
    }
  };

  const reset = () => {
    update('categoryIds', []);
    update('mythIds', []);
    update('verdictFilter', 'all');
    setQuery('');
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

      {totalSelected > 0 && (
        <p className="carm-filter-summary" role="status">
          {totalSelected} {totalSelected === 1 ? 'Mythos' : 'Mythen'} ausgewählt
        </p>
      )}

      {/* Categories: hidden when the user is searching — search results
          show individual myths instead. */}
      {filteredMyths === null && (
        <section className="carm-filter-section">
          <h3 className="carm-filter-section__title">
            {t('filter.categories.label', 'de')}
          </h3>
          <ul className="carm-filter-section__list" role="list">
            {categories.map((c) => {
              const s = categoryState(c.id);
              const count = mythsByCategory.get(c.id)?.length ?? 0;
              return (
                <li key={c.id}>
                  <label className="carm-checkbox">
                    <input
                      type="checkbox"
                      checked={s === 'all'}
                      ref={(el) => {
                        if (el) el.indeterminate = s === 'some';
                      }}
                      onChange={() => toggleCategory(c.id)}
                    />
                    <span className="carm-checkbox__label">
                      {c.name_de}
                      <span className="carm-checkbox__count">
                        ({count})
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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
          <ul className="carm-filter-myth-groups" role="list">
            {categories.map((c) => {
              const cMyths = mythsByCategory.get(c.id) ?? [];
              if (cMyths.length === 0) return null;
              return (
                <li key={c.id} className="carm-filter-myth-group">
                  <p className="carm-filter-myth-group__heading">
                    {c.name_de}
                  </p>
                  <ul
                    className="carm-filter-section__list carm-filter-myth-list"
                    role="list"
                  >
                    {cMyths.map((m) => renderMythRow(m))}
                  </ul>
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
            aria-hidden="true"
          >
            <VerdictArrow
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
