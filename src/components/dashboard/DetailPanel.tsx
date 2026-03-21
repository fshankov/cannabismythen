import { useEffect, useCallback } from 'react';
import type { Myth, Metric, Group, AppState, Indicator } from '../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythText, getCategoryName, formatValue } from '../../lib/dashboard/data';
import { t } from '../../lib/dashboard/translations';

interface Props {
  myth: Myth;
  metrics: Metric[];
  groups: Group[];
  state: AppState;
  onClose: () => void;
  /** Map from myth ID to factsheet slug, for linking to full factsheet pages */
  mythSlugMap?: Map<number, string>;
}

const INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance'];

export default function DetailPanel({ myth, metrics, groups, state, onClose, mythSlugMap }: Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const primaryGroup = state.groupIds[0] || 'adults';
  const factsheetSlug = mythSlugMap?.get(myth.id);

  return (
    <div
      className="detail-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={t('detail.title', state.lang)}
    >
      <div className="detail-panel">
        <button className="detail-close-btn" onClick={onClose} aria-label={t('detail.close', state.lang)}>
          ✕
        </button>

        <h2>{getMythText(myth, state.lang)}</h2>

        {state.lang === 'en' && (
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16, fontStyle: 'italic' }}>
            {myth.text_de}
          </p>
        )}

        <div className="detail-section">
          <div className="detail-section-title">{t('detail.verdict', state.lang)}</div>
          <span className={`class-chip ${myth.correctness_class}`}>
            {t(`verdict.${myth.correctness_class}` as any, state.lang)}
          </span>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">{t('detail.category', state.lang)}</div>
          <span className="cat-chip">{getCategoryName(myth, state.lang)}</span>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">{t('detail.checked', state.lang)}</div>
          <span>
            {myth.scientifically_checked
              ? t('detail.yes', state.lang)
              : t('detail.notChecked', state.lang)}
          </span>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">{t('detail.groupComparison', state.lang)}</div>
          <table className="data-table" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ position: 'static' }}>{t('sidebar.groups', state.lang)}</th>
                {INDICATORS.map((ind) => (
                  <th key={ind} style={{ textAlign: 'right', position: 'static' }}>
                    {t(`indicator.${ind}.short` as any, state.lang)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const metric = getMythMetric(metrics, myth.id, group.id);
                return (
                  <tr key={group.id} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: group.id === primaryGroup ? 700 : 400 }}>
                      {state.lang === 'de' ? group.name_de : group.name_en}
                    </td>
                    {INDICATORS.map((ind) => {
                      const val = getIndicatorValue(metric, ind);
                      return (
                        <td key={ind} className={`value-cell ${val === null ? 'na-value' : ''}`}>
                          {formatValue(val, ind)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {factsheetSlug && (
          <div className="detail-section" style={{ marginTop: 16 }}>
            <a
              href={`/zahlen-und-fakten/${factsheetSlug}/`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#2d6a4f',
                color: 'white',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'background 150ms ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#1b4332')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#2d6a4f')}
            >
              {t('detail.factsheet', state.lang)} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
