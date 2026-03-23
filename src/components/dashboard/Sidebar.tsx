import type { AppState, CarmData, GroupId, Indicator } from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';

interface Props {
  state: AppState;
  data: CarmData;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

const INDICATORS: { id: Indicator; icon: string }[] = [
  { id: 'awareness', icon: '👁️' },
  { id: 'significance', icon: '⚖️' },
  { id: 'correctness', icon: '✅' },
  { id: 'prevention_significance', icon: '🛡️' },
];

export default function Sidebar({ state, data, update }: Props) {
  const toggleCategory = (catId: number) => {
    const current = state.categoryIds;
    if (current.includes(catId)) {
      update('categoryIds', current.filter((c) => c !== catId));
    } else {
      update('categoryIds', [...current, catId]);
    }
  };

  const allCatIds = data.categories.map((c) => c.id);
  const allCatsSelected = state.categoryIds.length === 0;

  return (
    <aside className="carm-sidebar" role="complementary" aria-label="Filters">
      {/* Categories */}
      <div className="sidebar-section">
        <h3 className="sidebar-heading">
          <span className="sidebar-icon">🏷️</span>
          {t('sidebar.categories', state.lang)}
        </h3>
        <div className="sidebar-check-actions">
          <button
            className={`sidebar-mini-btn ${allCatsSelected ? 'active' : ''}`}
            onClick={() => update('categoryIds', [])}
          >
            {t('sidebar.selectAll', state.lang)}
          </button>
          <button
            className="sidebar-mini-btn"
            onClick={() => update('categoryIds', [allCatIds[0]])}
          >
            {t('sidebar.deselectAll', state.lang)}
          </button>
        </div>
        <div className="sidebar-checklist">
          {data.categories.map((cat) => (
            <label key={cat.id} className="sidebar-check-item">
              <input
                type="checkbox"
                checked={state.categoryIds.length === 0 || state.categoryIds.includes(cat.id)}
                onChange={() => {
                  if (state.categoryIds.length === 0) {
                    update('categoryIds', allCatIds.filter((c) => c !== cat.id));
                  } else {
                    toggleCategory(cat.id);
                    const next = state.categoryIds.includes(cat.id)
                      ? state.categoryIds.filter((c) => c !== cat.id)
                      : [...state.categoryIds, cat.id];
                    if (next.length === allCatIds.length) {
                      update('categoryIds', []);
                    }
                  }
                }}
              />
              <span className="sidebar-cat-label">
                {state.lang === 'de' ? cat.name_de : cat.name_en}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Population Groups */}
      <div className="sidebar-section">
        <h3 className="sidebar-heading">
          <span className="sidebar-icon">👥</span>
          {t('sidebar.groups', state.lang)}
        </h3>
        <div className="sidebar-checklist">
          {data.groups.map((g) => (
            <label key={g.id} className="sidebar-check-item sidebar-radio-item">
              <input
                type="radio"
                name="population-group"
                checked={state.groupIds[0] === g.id}
                onChange={() => update('groupIds', [g.id])}
              />
              <span>{state.lang === 'de' ? g.name_de : g.name_en}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Indicator */}
      <div className="sidebar-section">
        <h3 className="sidebar-heading">
          <span className="sidebar-icon">📊</span>
          {t('sidebar.indicator', state.lang)}
        </h3>
        <div className="sidebar-checklist">
          {INDICATORS.map((ind) => (
            <label key={ind.id} className="sidebar-check-item sidebar-radio-item">
              <input
                type="radio"
                name="indicator"
                checked={state.indicator === ind.id}
                onChange={() => update('indicator', ind.id)}
              />
              <span className="sidebar-ind-icon">{ind.icon}</span>
              <span>{t(`indicator.${ind.id}` as any, state.lang)}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
