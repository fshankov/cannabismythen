/**
 * VerdictTags — verdict filter row in the Daten-Explorer (v3).
 *
 * Renders six buttons:
 *   - "Alle" — a neutral pill that clears the verdict filter
 *   - Richtig / Eher richtig / Eher falsch / Falsch / Keine Aussage —
 *     one <VerdictPill as="button"> per CorrectnessClass
 *
 * Active filter = aria-pressed on the matching pill, plus the parent
 * `.pill-group--has-active` class which dims the inactive siblings to
 * opacity 0.42 (see `.pill-group--has-active button.pill` in
 * global.css). Clicking the active pill again clears the filter back
 * to 'all'.
 *
 * Migrated from the legacy `.verdict-tag` styling (dashed-border dot
 * + inline CSS vars) to the unified `.pill` system. Legacy rules in
 * `dashboard.css` are now dead code and can be removed in cleanup.
 */

import type { Lang, VerdictFilter, CorrectnessClass } from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';
import VerdictPill from '../shared/VerdictPill';

interface Props {
  lang: Lang;
  verdictFilter: VerdictFilter;
  onChange: (filter: VerdictFilter) => void;
}

const VERDICT_KEYS: CorrectnessClass[] = [
  'richtig',
  'eher_richtig',
  'eher_falsch',
  'falsch',
  'keine_aussage_moeglich',
];

export default function VerdictTags({ lang, verdictFilter, onChange }: Props) {
  const hasActive = verdictFilter !== 'all';
  const groupClass = `verdict-tags pill-group${hasActive ? ' pill-group--has-active' : ''}`;

  return (
    <div className={groupClass} role="radiogroup" aria-label="Filter by verdict">
      <button
        type="button"
        className={`pill pill--keine_aussage${verdictFilter === 'all' ? ' pill--all-active' : ''}`}
        aria-pressed={verdictFilter === 'all'}
        onClick={() => onChange('all')}
        role="radio"
        aria-checked={verdictFilter === 'all'}
      >
        <span className="pill__label">{t('verdict.all' as any, lang)}</span>
      </button>

      {VERDICT_KEYS.map((key) => {
        const isActive = verdictFilter === key;
        const label = t(`verdict.${key}` as any, lang);
        return (
          <VerdictPill
            key={key}
            verdict={key}
            label={label}
            as="button"
            aria-pressed={isActive}
            aria-label={`Filter: ${label}`}
            onClick={() => onChange(isActive ? 'all' : key)}
          />
        );
      })}
    </div>
  );
}
