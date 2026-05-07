/**
 * Step 7 — dumbbell trust-vs-usage chart. Ported from v2's ScrollytellingViewer
 * VizTrustGap (lines 305–389), simplified for the prototype. Real percentages
 * come from CaRM Tab. 4.12 / 4.14; values reused from v2 (already team-reviewed).
 */

interface Source {
  name: string;
  trust: number;       // 0–100 trust points
  useAdults: number;   // % adults actively using
  useMinors: number;   // % minors actively using
}

const SOURCES: Source[] = [
  { name: 'Apotheke / Arzt', trust: 92, useAdults: 60, useMinors: 37 },
  { name: 'Beratungsstelle', trust: 90, useAdults: 30, useMinors: 21 },
  { name: 'Krankenkasse', trust: 88, useAdults: 18, useMinors: 9 },
  { name: 'Angehörige', trust: 78, useAdults: 29, useMinors: 53 },
  { name: 'Med. Internet', trust: 75, useAdults: 50, useMinors: 41 },
  { name: 'Suchmaschinen', trust: 62, useAdults: 50, useMinors: 46 },
  { name: 'Soziale Medien', trust: 55, useAdults: 13, useMinors: 27 },
  { name: 'Influencer:innen', trust: 49, useAdults: 3, useMinors: 17 },
];

export function VizTrustGap() {
  return (
    <div className="viz viz-trust">
      <div className="viz-trust__header">
        <span>
          <span className="viz-trust__legend-dot viz-trust__legend-dot--adults" />
          Erwachsene
        </span>
        <span>
          <span className="viz-trust__legend-dot viz-trust__legend-dot--minors" />
          Minderjährige
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
          Vertrauen <span style={{ color: 'var(--fg-dim)' }}>· Punkte</span>
        </span>
      </div>
      <div role="img" aria-label="Vertrauen vs. Nutzung von Informationsquellen, Erwachsene vs. Minderjährige">
        {SOURCES.map((s) => {
          const minUse = Math.min(s.useAdults, s.useMinors);
          const maxUse = Math.max(s.useAdults, s.useMinors);
          return (
            <div key={s.name} className="viz-trust__row">
              <div className="viz-trust__label">{s.name}</div>
              <div className="viz-trust__trust">{s.trust}p</div>
              <div className="viz-trust__bar">
                <div
                  className="viz-trust__line"
                  style={{ left: `${minUse}%`, width: `${maxUse - minUse}%` }}
                />
                <div
                  className="viz-trust__dot viz-trust__dot--adults"
                  style={{ left: `${s.useAdults}%` }}
                  title={`Erwachsene Nutzung: ${s.useAdults}%`}
                />
                <div
                  className="viz-trust__dot viz-trust__dot--minors"
                  style={{ left: `${s.useMinors}%` }}
                  title={`Minderjährige Nutzung: ${s.useMinors}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
