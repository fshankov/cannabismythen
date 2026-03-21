import type { Lang, VerdictFilter, CorrectnessClass } from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';
import { CORRECTNESS_COLORS } from '../../lib/dashboard/colors';

interface Props {
  lang: Lang;
  verdictFilter: VerdictFilter;
  onChange: (filter: VerdictFilter) => void;
}

const VERDICTS: { key: VerdictFilter; tKey: string }[] = [
  { key: 'all', tKey: 'verdict.all' },
  { key: 'richtig', tKey: 'verdict.richtig' },
  { key: 'eher_richtig', tKey: 'verdict.eher_richtig' },
  { key: 'eher_falsch', tKey: 'verdict.eher_falsch' },
  { key: 'falsch', tKey: 'verdict.falsch' },
  { key: 'no_classification', tKey: 'verdict.no_classification' },
];

function getTagColor(key: VerdictFilter): string {
  if (key === 'all') return '#475569';
  return CORRECTNESS_COLORS[key as CorrectnessClass] || '#6b7280';
}

export default function VerdictTags({ lang, verdictFilter, onChange }: Props) {
  return (
    <div className="verdict-tags" role="radiogroup" aria-label="Filter by verdict">
      {VERDICTS.map((v) => {
        const isActive = verdictFilter === v.key;
        const color = getTagColor(v.key);
        return (
          <button
            key={v.key}
            className={`verdict-tag ${isActive ? 'active' : ''}`}
            style={{
              '--tag-color': color,
              '--tag-bg': isActive ? color : 'transparent',
              '--tag-text': isActive ? '#ffffff' : color,
              opacity: isActive || verdictFilter === 'all' ? 1 : 0.35,
            } as React.CSSProperties}
            onClick={() => onChange(verdictFilter === v.key ? 'all' : v.key)}
            role="radio"
            aria-checked={isActive}
          >
            {v.key !== 'all' && (
              <span
                className="verdict-tag-dot"
                style={{ backgroundColor: color }}
              />
            )}
            {t(v.tKey as any, lang)}
          </button>
        );
      })}
    </div>
  );
}
