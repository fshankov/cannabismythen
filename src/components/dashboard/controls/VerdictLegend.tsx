import { useState } from 'react';
import { Info } from 'lucide-react';
import type { CorrectnessClass } from '../../../lib/dashboard/types';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import VerdictArrow from '../../shared/VerdictArrow';

const VERDICTS: CorrectnessClass[] = ['richtig', 'eher_richtig', 'eher_falsch', 'falsch'];

interface Props {
  /** Layout — 'strip' (mobile horizontal) or 'sidebar' (desktop vertical). */
  variant?: 'strip' | 'sidebar';
}

/**
 * VerdictLegend renders the four-level scientific verdict scale next
 * to the chart. The arrow + canonical label combo (e.g. ↑ Richtig) is
 * the source of truth for verdict iconography across the site — keep
 * this component and `<VerdictArrow>` in sync.
 *
 * The info-button popover uses the `verdict.legend.info.*` translations
 * that paraphrase `src/content/ueber-uns/klassifikation.mdoc`.
 */
export default function VerdictLegend({ variant = 'strip' }: Props) {
  const [openInfo, setOpenInfo] = useState<CorrectnessClass | null>(null);

  return (
    <div className={`carm-verdict-legend carm-verdict-legend--${variant}`}>
      <h3 className="carm-verdict-legend__title">{t('verdict.legend.title', 'de')}</h3>
      <ul className="carm-verdict-legend__list" role="list">
        {VERDICTS.map((v) => {
          const color = getCorrectnessColor(v);
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
                <VerdictArrow verdict={v} size={11} strokeWidth={2.5} />
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
