import { useState } from 'react';
import { Info } from 'lucide-react';
import type { CorrectnessClass } from '../../../lib/dashboard/types';
import { getCorrectnessColor, getCorrectnessIcon } from '../../../lib/dashboard/colors';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';

const VERDICTS: CorrectnessClass[] = ['richtig', 'eher_richtig', 'eher_falsch', 'falsch'];

interface Props {
  /** Layout — 'strip' (mobile horizontal) or 'sidebar' (desktop vertical). */
  variant?: 'strip' | 'sidebar';
}

export default function VerdictLegend({ variant = 'strip' }: Props) {
  const [openInfo, setOpenInfo] = useState<CorrectnessClass | null>(null);

  return (
    <div className={`carm-verdict-legend carm-verdict-legend--${variant}`}>
      <h3 className="carm-verdict-legend__title">{t('verdict.legend.title', 'de')}</h3>
      <ul className="carm-verdict-legend__list" role="list">
        {VERDICTS.map((v) => {
          const color = getCorrectnessColor(v);
          const icon = getCorrectnessIcon(v);
          const labelKey: TranslationKey = `verdict.${v}` as TranslationKey;
          const infoKey: TranslationKey = `verdict.legend.info.${v}` as TranslationKey;
          const isOpen = openInfo === v;
          return (
            <li key={v} className="carm-verdict-legend__item">
              <span
                className="carm-verdict-legend__swatch"
                aria-hidden="true"
                style={{ background: color }}
              >
                <span className="carm-verdict-legend__icon">{icon}</span>
              </span>
              <span className="carm-verdict-legend__label">{t(labelKey, 'de')}</span>
              <button
                type="button"
                className="carm-verdict-legend__info-btn"
                aria-expanded={isOpen}
                aria-label={`${t(labelKey, 'de')} — Erklärung`}
                onClick={() => setOpenInfo(isOpen ? null : v)}
              >
                <Info size={14} strokeWidth={2} aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="carm-verdict-legend__info" role="note">
                  {t(infoKey, 'de')}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
