import type { AppState, CarmData, DashboardDefinitions, GroupId, Indicator } from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';
import InfoTooltip from './InfoTooltip';

interface Props {
  state: AppState;
  data: CarmData;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
}

const INDICATORS: { id: Indicator; icon: string }[] = [
  { id: 'awareness', icon: '👁️' },
  { id: 'significance', icon: '⚖️' },
  { id: 'correctness', icon: '✅' },
  { id: 'prevention_significance', icon: '🛡️' },
];

export default function Sidebar({ state, data, update, definitions }: Props) {
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
          <InfoTooltip
            title={t('sidebar.groups', state.lang)}
            definition={
              state.lang === 'de'
                ? 'Fünf Bevölkerungsgruppen aus der CaRM-Studie (ISD Hamburg, 2025). Wählen Sie eine Gruppe, um deren Daten in der Visualisierung anzuzeigen.'
                : 'Five population groups from the CaRM study (ISD Hamburg, 2025). Select a group to display its data in the visualization.'
            }
          />
        </h3>
        <div className="sidebar-checklist">
          {data.groups.map((g) => {
            const def = definitions?.groups?.[g.id];
            return (
              <label key={g.id} className="sidebar-check-item sidebar-radio-item sidebar-group-item">
                <input
                  type="radio"
                  name="population-group"
                  checked={state.groupIds[0] === g.id}
                  onChange={() => update('groupIds', [g.id])}
                />
                <span className="sidebar-group-label">
                  <span className="sidebar-group-name">
                    {state.lang === 'de' ? g.name_de : g.name_en}
                    {g.n != null && <span className="sidebar-group-n"> (n = {g.n.toLocaleString('de-DE')})</span>}
                    {def && (
                      <InfoTooltip
                        title={def.label}
                        definition={def.definition}
                        sampleSize={def.sampleSize}
                      />
                    )}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Indicator */}
      <div className="sidebar-section">
        <h3 className="sidebar-heading">
          <span className="sidebar-icon">📊</span>
          {t('sidebar.indicator', state.lang)}
          <InfoTooltip
            title={t('sidebar.indicator', state.lang)}
            definition={
              state.lang === 'de'
                ? 'Vier Indikatoren messen verschiedene Aspekte der Mythenwahrnehmung. Wählen Sie einen Indikator für die Visualisierung.'
                : 'Four indicators measure different aspects of myth perception. Select an indicator for the visualization.'
            }
          />
        </h3>
        <div className="sidebar-checklist">
          {INDICATORS.map((ind) => {
            const def = definitions?.mythIndicators?.[ind.id];
            return (
              <label key={ind.id} className="sidebar-check-item sidebar-radio-item sidebar-group-item">
                <input
                  type="radio"
                  name="indicator"
                  checked={state.indicator === ind.id}
                  onChange={() => update('indicator', ind.id)}
                />
                <span className="sidebar-ind-icon">{ind.icon}</span>
                <span className="sidebar-group-label">
                  <span className="sidebar-group-name">
                    {t(`indicator.${ind.id}` as any, state.lang)}
                    {def && (
                      <InfoTooltip
                        title={def.label}
                        definition={def.definition}
                        scale={def.scale}
                      />
                    )}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
