import { Users } from 'lucide-react';

/** Each icon = 50 people. Approximations chosen so the bar reads cleanly. */
const SAMPLE_GROUPS = [
  {
    id: 'adults',
    label: 'Erwachsene 18–70',
    n: 2097,
    iconCount: 42,
    color: 'var(--group-adults)',
  },
  {
    id: 'minors',
    label: 'Minderjährige 16–17',
    n: 555,
    iconCount: 11,
    color: 'var(--group-minors)',
  },
  {
    id: 'clubs',
    label: 'Anbauvereinigungs-Mitglieder',
    n: 143,
    iconCount: 3,
    color: 'var(--group-consumers)',
  },
] as const;

const INDICATORS = [
  {
    name: 'Kenntnis',
    unit: 'Anteil %',
    desc: 'Wie viele kennen die Aussage überhaupt?',
  },
  {
    name: 'Bedeutung',
    unit: 'Punkte',
    desc: 'Wie wichtig ist die Aussage für den eigenen Umgang mit Cannabis?',
  },
  {
    name: 'Richtigkeit',
    unit: 'Punkte 0–100',
    desc: 'Wie nahe liegt die Beurteilung an der wissenschaftlichen Klassifikation?',
  },
  {
    name: 'Präventionsbedeutung',
    unit: 'Punkte',
    desc: 'Bedeutung × Wissenslücke. Wo ist Aufklärung nötig?',
  },
  {
    name: 'Bevölkerungsrisiko',
    unit: 'Punkte',
    desc: 'Präventionsbedeutung × Kenntnisanteil. Nur Voll- + Minderjährige.',
  },
] as const;

export function VizSampleAndIndicators() {
  return (
    <div className="viz viz-sample">
      {/* Sample-size visualization */}
      <div className="viz-sample__panel">
        <h3 className="viz-sample__title">Stichprobe</h3>
        <p className="viz-sample__subtitle">Eine Person-Symbol = 50 Befragte</p>
        <div className="viz-sample__groups">
          {SAMPLE_GROUPS.map((g) => (
            <div key={g.id} className="viz-sample__group">
              <div className="viz-sample__group-header">
                <span className="viz-sample__group-num">{g.n.toLocaleString('de-DE')}</span>
                <span className="viz-sample__group-label">{g.label}</span>
              </div>
              <div className="viz-sample__icon-row" aria-hidden="true">
                {Array.from({ length: g.iconCount }, (_, i) => (
                  <Users
                    key={i}
                    size={14}
                    strokeWidth={2}
                    color={g.color}
                    style={{ flexShrink: 0 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="viz-sample__total">Gesamt: 2.795 Personen</p>
      </div>

      {/* Indicator definitions */}
      <div className="viz-sample__panel">
        <h3 className="viz-sample__title">Fünf Indikatoren pro These</h3>
        <ul className="viz-sample__indicators">
          {INDICATORS.map((ind) => (
            <li key={ind.name} className="viz-sample__indicator">
              <span className="viz-sample__indicator-name">{ind.name}</span>
              <span className="viz-sample__indicator-unit">{ind.unit}</span>
              <span className="viz-sample__indicator-desc">{ind.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
