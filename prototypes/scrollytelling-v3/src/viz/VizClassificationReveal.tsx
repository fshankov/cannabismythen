import { ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CarmData, CorrectnessClass } from '../data/types';
import { sortedMyths } from '../data/carmData';

interface Props {
  data: CarmData;
  active: boolean;
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

export function VizClassificationReveal({ data, active }: Props) {
  const myths = sortedMyths(data).slice(0, 42);

  const counts: Record<CorrectnessClass, number> = {
    richtig: 0,
    eher_richtig: 0,
    eher_falsch: 0,
    falsch: 0,
    no_classification: 0,
  };
  for (const m of myths) counts[m.correctness_class]++;

  return (
    <div className="viz">
      <div
        className="viz-grid viz-grid--larger"
        role="img"
        aria-label="42 Cannabis-Mythen mit wissenschaftlicher Klassifikation"
      >
        {myths.map((m, i) => {
          const Icon = VERDICT_ARROW[m.correctness_class];
          const fill = active ? VERDICT_COLOR[m.correctness_class] : 'var(--bg-elev)';
          return (
            <div
              key={m.id}
              className="viz-grid__cell viz-grid__cell--classified"
              style={{
                backgroundColor: fill,
                transitionDelay: `${i * 30}ms`,
              }}
              title={`${m.text_de} — ${VERDICT_LABEL[m.correctness_class]}`}
            >
              <Icon
                className="viz-grid__cell-icon"
                size={14}
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="viz-grid__cell-text">{m.text_short_de}</span>
            </div>
          );
        })}
      </div>
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
    </div>
  );
}
