import type { CarmData } from '../data/types';
import { sortedMyths } from '../data/carmData';

interface Props {
  data: CarmData;
  /** 'themed' = pastel category background; 'classified' = classification colors. */
  mode: 'themed' | 'classified';
}

const CLASSIFICATION_COLOR: Record<string, string> = {
  richtig: 'var(--classification-richtig)',
  eher_richtig: 'var(--classification-eher-richtig)',
  eher_falsch: 'var(--classification-eher-falsch)',
  falsch: 'var(--classification-falsch)',
  no_classification: 'var(--classification-keine-aussage)',
};

const CLASSIFICATION_LABEL: Record<string, string> = {
  richtig: 'stimmt',
  eher_richtig: 'stimmt eher',
  eher_falsch: 'stimmt eher nicht',
  falsch: 'stimmt nicht',
  no_classification: 'keine Aussage',
};

const CLASSIFICATION_ORDER = [
  'richtig',
  'eher_richtig',
  'eher_falsch',
  'falsch',
  'no_classification',
] as const;

function themeColorFor(catId: number | null): string {
  if (catId === null) return 'var(--bg-elev)';
  // Map any category_id 1–9 onto themed pastels in tokens.css
  const idx = ((catId - 1) % 9) + 1;
  return `var(--theme-${idx})`;
}

export function VizMythGrid({ data, mode }: Props) {
  const myths = sortedMyths(data);
  // Pad/cap to 42 — defensive
  const cells = myths.slice(0, 42);

  // Counts for legend
  const counts: Record<string, number> = {};
  for (const m of cells) counts[m.correctness_class] = (counts[m.correctness_class] ?? 0) + 1;

  return (
    <div className="viz">
      <div className="viz-grid" role="img" aria-label="42 Cannabis-Mythen, sortiert nach Themenfeld">
        {cells.map((m, i) => {
          const bg =
            mode === 'classified'
              ? CLASSIFICATION_COLOR[m.correctness_class] ?? 'var(--bg-elev)'
              : themeColorFor(m.category_id);
          return (
            <div
              key={m.id}
              className={`viz-grid__cell ${mode === 'classified' ? 'viz-grid__cell--classified' : 'viz-grid__cell--themed'}`}
              style={{
                backgroundColor: bg,
                transitionDelay: mode === 'classified' ? `${i * 35}ms` : '0ms',
              }}
              title={m.text_de}
            >
              {m.text_short_de}
            </div>
          );
        })}
      </div>
      <div className="viz-grid__legend" aria-hidden="true">
        {mode === 'classified'
          ? CLASSIFICATION_ORDER.filter((c) => counts[c]).map((c) => (
              <span key={c} className="viz-grid__legend-item">
                <span
                  className="viz-grid__legend-swatch"
                  style={{ background: CLASSIFICATION_COLOR[c] }}
                />
                {CLASSIFICATION_LABEL[c]} ({counts[c] ?? 0})
              </span>
            ))
          : <span className="viz-grid__legend-item" style={{ color: 'var(--fg-muted)' }}>
              Sortiert nach Themenfeld · 42 Thesen
            </span>}
      </div>
    </div>
  );
}
