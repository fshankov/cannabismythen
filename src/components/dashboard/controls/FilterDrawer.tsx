import type { AppState, BalkenSort, Category, Myth } from '../../../lib/dashboard/types';
import Drawer from '../../shared/Drawer';
import MythosSearch from './MythosSearch';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  open: boolean;
  onClose: () => void;
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  myths: Myth[];
  categories: Category[];
  /** Selecting a myth from the search auto-closes the drawer and opens the
   *  factsheet panel via the parent's selectMyth callback. */
  onSelectMyth: (id: number) => void;
}

const SORT_OPTIONS: BalkenSort[] = ['value-desc', 'value-asc', 'category'];

export default function FilterDrawer({
  open,
  onClose,
  state,
  update,
  myths,
  categories,
  onSelectMyth,
}: Props) {
  const toggleCategory = (id: number) => {
    const next = state.categoryIds.includes(id)
      ? state.categoryIds.filter((c) => c !== id)
      : [...state.categoryIds, id];
    update('categoryIds', next);
  };

  const reset = () => {
    update('categoryIds', []);
    update('search', '');
    update('balkenSort', 'value-desc');
    update('verdictFilter', 'all');
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      size="md"
      title={t('filter.title', 'de')}
      footer={
        <>
          <button type="button" className="carm-btn carm-btn--ghost" onClick={reset}>
            {t('filter.reset', 'de')}
          </button>
          <button type="button" className="carm-btn carm-btn--primary" onClick={onClose}>
            {t('filter.apply', 'de')}
          </button>
        </>
      }
    >
      <section className="carm-filter-section">
        <MythosSearch
          myths={myths}
          value={state.search}
          onChange={(q) => update('search', q)}
          onSelectMyth={(id) => {
            onSelectMyth(id);
            onClose();
          }}
        />
      </section>

      <section className="carm-filter-section">
        <h3 className="carm-filter-section__title">{t('filter.categories.label', 'de')}</h3>
        <ul className="carm-filter-section__list" role="list">
          {categories.map((c) => {
            const checked = state.categoryIds.includes(c.id);
            return (
              <li key={c.id}>
                <label className="carm-checkbox">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(c.id)}
                  />
                  <span>{c.name_de}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="carm-filter-section">
        <h3 className="carm-filter-section__title">{t('sort.label', 'de')}</h3>
        <ul className="carm-filter-section__list" role="list">
          {SORT_OPTIONS.map((s) => (
            <li key={s}>
              <label className="carm-radio">
                <input
                  type="radio"
                  name="balken-sort"
                  value={s}
                  checked={state.balkenSort === s}
                  onChange={() => update('balkenSort', s)}
                />
                <span>{t(`sort.${s}`, 'de')}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </Drawer>
  );
}
