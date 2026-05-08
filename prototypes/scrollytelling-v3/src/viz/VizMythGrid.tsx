import { ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CarmData, CorrectnessClass } from '../data/types';
import { sortedMyths } from '../data/carmData';

interface Props {
  data: CarmData;
  /** 'themed' = pastel category bg (step 3); 'classified' = verdict color + arrow (step 4). */
  mode: 'themed' | 'classified';
}

const VERDICT_ARROW: Record<CorrectnessClass, LucideIcon> = {
  richtig: ArrowUp,
  eher_richtig: ArrowUpRight,
  eher_falsch: ArrowDownLeft,
  falsch: ArrowDown,
  no_classification: Minus,
};

const VERDICT_COLOR: Record<CorrectnessClass, string> = {
  richtig: 'var(--classification-richtig)',
  eher_richtig: 'var(--classification-eher-richtig)',
  eher_falsch: 'var(--classification-eher-falsch)',
  falsch: 'var(--classification-falsch)',
  no_classification: 'var(--classification-keine-aussage)',
};

const VERDICT_LABEL: Record<CorrectnessClass, string> = {
  richtig: 'stimmt',
  eher_richtig: 'stimmt eher',
  eher_falsch: 'stimmt eher nicht',
  falsch: 'stimmt nicht',
  no_classification: 'keine Aussage',
};

const VERDICT_ORDER: CorrectnessClass[] = [
  'richtig',
  'eher_richtig',
  'eher_falsch',
  'falsch',
  'no_classification',
];

function themeColorFor(catId: number | null): string {
  if (catId === null) return 'var(--bg-elev)';
  const idx = ((catId - 1) % 9) + 1;
  return `var(--theme-${idx})`;
}

export function VizMythGrid({ data, mode }: Props) {
  const myths = sortedMyths(data).slice(0, 42);

  // Build ordered list of unique categories for the themed legend (step 3).
  const seenCats = new Set<number>();
  const orderedCats: { id: number; name: string }[] = [];
  for (const m of myths) {
    if (m.category_id !== null && !seenCats.has(m.category_id)) {
      seenCats.add(m.category_id);
      const cat = data.categories.find((c) => c.id === m.category_id);
      orderedCats.push({
        id: m.category_id,
        name: cat?.name_de ?? `Kategorie ${m.category_id}`,
      });
    }
  }

  // Verdict counts for the classified legend (step 4).
  const counts: Record<CorrectnessClass, number> = {
    richtig: 0,
    eher_richtig: 0,
    eher_falsch: 0,
    falsch: 0,
    no_classification: 0,
  };
  for (const m of myths) counts[m.correctness_class]++;

  return (
    <div className="viz" data-grid-mode={mode}>
      <div
        className="viz-grid"
        role="img"
        aria-label={
          mode === 'classified'
            ? '42 Cannabis-Mythen mit wissenschaftlicher Klassifikation'
            : '42 Cannabis-Mythen, sortiert nach Themenfeld'
        }
      >
        {myths.map((m, i) => {
          const Icon = VERDICT_ARROW[m.correctness_class];
          const themedBg = themeColorFor(m.category_id);
          const classifiedBg = VERDICT_COLOR[m.correctness_class];
          // Bg via CSS var so transitions stay smooth between modes.
          const bg = mode === 'classified' ? classifiedBg : themedBg;
          return (
            <div
              key={m.id}
              className={`viz-grid__cell viz-grid__cell--${mode}`}
              style={{
                backgroundColor: bg,
                ['--cell-delay' as string]: `${i * 30}ms`,
              }}
              title={
                mode === 'classified'
                  ? `${m.text_de} — ${VERDICT_LABEL[m.correctness_class]}`
                  : m.text_de
              }
              tabIndex={0}
            >
              {mode === 'classified' && (
                <Icon
                  className="viz-grid__cell-icon"
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
              <span className="viz-grid__cell-text">{m.text_short_de}</span>
            </div>
          );
        })}
      </div>

      {mode === 'themed' && (
        <div className="viz-grid__theme-legend" aria-label="Themenfelder">
          <span className="viz-grid__theme-legend-title">Themenfelder:</span>
          {orderedCats.map((c) => (
            <span key={c.id} className="viz-grid__theme-chip">
              <span
                className="viz-grid__theme-swatch"
                style={{ background: themeColorFor(c.id) }}
                aria-hidden="true"
              />
              {c.name}
            </span>
          ))}
        </div>
      )}

      {mode === 'classified' && (
        <>
          <div className="viz-grid__verdict-legend" aria-label="Klassifikationen">
            {VERDICT_ORDER.filter((c) => counts[c] > 0).map((c) => {
              const Icon = VERDICT_ARROW[c];
              return (
                <span key={c} className="viz-grid__verdict-item">
                  <span
                    className="viz-grid__verdict-pill"
                    style={{ background: VERDICT_COLOR[c] }}
                  >
                    <Icon size={12} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {VERDICT_LABEL[c]} ({counts[c]})
                </span>
              );
            })}
          </div>
          <p className="viz-grid__sources">
            39 Faktenblätter aus systematischen Reviews und Einzelstudien — PubMed,
            Web of Science, EUDA-Quellen, letzte 15 Jahre.
          </p>
        </>
      )}
    </div>
  );
}
