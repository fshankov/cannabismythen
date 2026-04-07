import { useState } from 'react';
import { Eye, TrendingUp, Target, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppState, CarmData, DashboardDefinitions, Indicator } from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';
import InfoTooltip from './InfoTooltip';

interface Props {
  state: AppState;
  data: CarmData;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
}

const INDICATORS: { id: Indicator; Icon: LucideIcon }[] = [
  { id: 'awareness', Icon: Eye },
  { id: 'significance', Icon: TrendingUp },
  { id: 'correctness', Icon: Target },
  { id: 'prevention_significance', Icon: Shield },
];

export default function FilterBar({ state, data, update, definitions }: Props) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const allCatIds = data.categories.map((c) => c.id);
  const allCatsSelected = state.categoryIds.length === 0;

  const toggleCategory = (catId: number) => {
    const current = state.categoryIds;
    if (current.length === 0) {
      // All selected → deselect this one
      update('categoryIds', allCatIds.filter((c) => c !== catId));
    } else if (current.includes(catId)) {
      const next = current.filter((c) => c !== catId);
      // If all would be selected again, reset to empty (= all)
      update('categoryIds', next.length === allCatIds.length ? [] : next);
    } else {
      const next = [...current, catId];
      update('categoryIds', next.length === allCatIds.length ? [] : next);
    }
  };

  return (
    <div className="filter-bar">
      {/* Indicator tags */}
      <div className="filter-section filter-section--indicators">
        <span className="filter-label">{t('sidebar.indicator', state.lang)}</span>
        <div className="filter-tags">
          {INDICATORS.map(({ id, Icon }) => {
            const def = definitions?.mythIndicators?.[id];
            return (
              <button
                key={id}
                className={`indicator-tag ${state.indicator === id ? 'active' : ''}`}
                onClick={() => update('indicator', id)}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                {t(`indicator.${id}.short` as any, state.lang)}
                {def && (
                  <InfoTooltip
                    title={def.label}
                    definition={def.definition}
                    scale={def.scale}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Population group */}
      <div className="filter-section filter-section--group">
        <span className="filter-label">{t('sidebar.groups', state.lang)}</span>
        <div className="filter-tags">
          {data.groups.map((g) => {
            const def = definitions?.groups?.[g.id];
            return (
              <button
                key={g.id}
                className={`indicator-tag ${state.groupIds[0] === g.id ? 'active' : ''}`}
                onClick={() => update('groupIds', [g.id])}
              >
                {state.lang === 'de' ? g.name_de : g.name_en}
                {def && (
                  <InfoTooltip
                    title={def.label}
                    definition={def.definition}
                    sampleSize={def.sampleSize}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories (collapsible) */}
      <div className="filter-section filter-section--categories">
        <button
          className="filter-label filter-label--toggle"
          onClick={() => setCategoriesOpen(!categoriesOpen)}
        >
          {t('sidebar.categories', state.lang)}
          {!allCatsSelected && (
            <span className="filter-cat-count">
              {state.categoryIds.length}/{allCatIds.length}
            </span>
          )}
          {categoriesOpen
            ? <ChevronUp size={14} strokeWidth={2} aria-hidden="true" />
            : <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
          }
        </button>
        {categoriesOpen && (
          <div className="filter-categories">
            <div className="filter-cat-actions">
              <button
                className={`filter-cat-action ${allCatsSelected ? 'active' : ''}`}
                onClick={() => update('categoryIds', [])}
              >
                {t('sidebar.selectAll', state.lang)}
              </button>
              <button
                className="filter-cat-action"
                onClick={() => update('categoryIds', [allCatIds[0]])}
              >
                {t('sidebar.deselectAll', state.lang)}
              </button>
            </div>
            <div className="filter-cat-chips">
              {data.categories.map((cat) => {
                const isSelected = state.categoryIds.length === 0 || state.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    className={`filter-cat-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {state.lang === 'de' ? cat.name_de : cat.name_en}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
