/**
 * Step 7 — trust-vs-use scatter. X = Nutzung %, Y = Vertrauen Punkte.
 * Two dots per source connected by a thin line: Erwachsene vs. Minderjährige.
 * Diagonal y=x reference + quadrant labels make the gap legible.
 *
 * Data: hand-curated from CaRM Tab. 4.12 / 4.14 (carries v2's reviewed values).
 * Phase E port-back will swap to a typed loader from carm-data.json once the
 * sources_data.json fields are stable.
 */

interface Source {
  name: string;
  trust: number;       // 0–100 trust points (mean across groups)
  useAdults: number;   // % adults actively searching
  useMinors: number;   // % minors actively searching
  emphasize?: boolean; // highlight Apotheke + Influencer
}

const SOURCES: Source[] = [
  { name: 'Apotheke / Arzt',     trust: 92, useAdults: 60, useMinors: 37, emphasize: true },
  { name: 'Beratungsstelle',     trust: 90, useAdults: 30, useMinors: 21 },
  { name: 'Krankenkasse',        trust: 88, useAdults: 18, useMinors: 9 },
  { name: 'Angehörige',          trust: 78, useAdults: 29, useMinors: 53 },
  { name: 'Med. Internet',       trust: 75, useAdults: 50, useMinors: 41 },
  { name: 'Suchmaschinen',       trust: 62, useAdults: 50, useMinors: 46 },
  { name: 'Soziale Medien',      trust: 55, useAdults: 13, useMinors: 27 },
  { name: 'Influencer:innen',    trust: 49, useAdults: 3,  useMinors: 17, emphasize: true },
];

// SVG viewBox: 0..560 wide, 0..420 tall.
// X-axis 0..100 maps to 60..540. Y-axis 0..100 maps to 380..40.
const X0 = 60, X1 = 540;
const Y0 = 380, Y1 = 40;
const xs = (v: number) => X0 + (v / 100) * (X1 - X0);
const ys = (v: number) => Y0 - (v / 100) * (Y0 - Y1);

export function VizTrustScatter() {
  return (
    <div className="viz viz-scatter">
      <svg viewBox="0 0 560 420" preserveAspectRatio="xMidYMid meet" role="img"
           aria-label="Trust vs Nutzung von Informationsquellen, Erwachsene und Minderjährige">

        {/* Quadrant background */}
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1}
              fill="rgba(255,255,255,0.02)" />

        {/* Grid lines + axis ticks */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={`gx${v}`}>
            <line x1={xs(v)} x2={xs(v)} y1={Y1} y2={Y0}
                  stroke="#1f2937" strokeWidth={1} />
            <text x={xs(v)} y={Y0 + 16} fill="#6b7280" fontSize={10}
                  fontFamily="monospace" textAnchor="middle">{v}</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={`gy${v}`}>
            <line x1={X0} x2={X1} y1={ys(v)} y2={ys(v)}
                  stroke="#1f2937" strokeWidth={1} />
            <text x={X0 - 8} y={ys(v) + 4} fill="#6b7280" fontSize={10}
                  fontFamily="monospace" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* Diagonal reference: trust = use */}
        <line x1={xs(0)} y1={ys(0)} x2={xs(100)} y2={ys(100)}
              stroke="#3a4452" strokeWidth={1} strokeDasharray="3 4" />
        <text x={xs(72)} y={ys(78)} fill="#6b7280" fontSize={10}
              fontFamily="monospace" textAnchor="start">
          Vertrauen = Nutzung
        </text>

        {/* Quadrant labels */}
        <text x={X0 + 8} y={Y1 + 18} fill="#6b7280" fontSize={11} fontFamily="Georgia">
          vertraut, kaum genutzt
        </text>
        <text x={X1 - 8} y={Y0 - 8} fill="#6b7280" fontSize={11} fontFamily="Georgia"
              textAnchor="end">
          wenig vertraut, viel genutzt
        </text>

        {/* Sources */}
        {SOURCES.map((s) => {
          const ya = ys(s.trust);
          const xa = xs(s.useAdults);
          const xm = xs(s.useMinors);
          const isEmph = s.emphasize;

          // Label position: above-left for trust>=70, below-right otherwise
          const labelAbove = s.trust >= 70;
          const labelX = (xa + xm) / 2;
          const labelY = labelAbove ? ya - 14 : ya + 22;

          return (
            <g key={s.name} className={isEmph ? 'viz-scatter__source--emph' : undefined}>
              {/* Connecting line between adults and minors */}
              <line
                x1={xa}
                y1={ya}
                x2={xm}
                y2={ya}
                stroke={isEmph ? 'var(--classification-richtig)' : '#4b5563'}
                strokeWidth={isEmph ? 2 : 1}
                opacity={isEmph ? 0.7 : 0.5}
              />
              {/* Adults dot */}
              <circle cx={xa} cy={ya} r={isEmph ? 6 : 5}
                      fill="var(--group-adults)" stroke="#0f1318" strokeWidth={1.5}>
                <title>{s.name} · Erwachsene · Vertrauen {s.trust}, Nutzung {s.useAdults}%</title>
              </circle>
              {/* Minors dot */}
              <circle cx={xm} cy={ya} r={isEmph ? 6 : 5}
                      fill="var(--group-minors)" stroke="#0f1318" strokeWidth={1.5}>
                <title>{s.name} · Minderjährige · Vertrauen {s.trust}, Nutzung {s.useMinors}%</title>
              </circle>
              {/* Label */}
              <text
                x={labelX}
                y={labelY}
                fill={isEmph ? 'var(--classification-richtig)' : '#cbd5e1'}
                fontSize={isEmph ? 12 : 10.5}
                fontFamily="Georgia"
                fontWeight={isEmph ? 600 : 400}
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {s.name}
              </text>
              {/* Phantom hover hit area */}
              <rect
                x={Math.min(xa, xm) - 8}
                y={ya - 10}
                width={Math.abs(xm - xa) + 16}
                height={20}
                fill="transparent"
              >
                <title>{s.name}</title>
              </rect>
            </g>
          );
        })}

        {/* Axis titles */}
        <text x={(X0 + X1) / 2} y={410} fill="#9ca3af" fontSize={11}
              fontFamily="monospace" textAnchor="middle">
          Nutzung % (aktive Suche nach Gesundheitsinfos)
        </text>
        <text x={20} y={(Y0 + Y1) / 2} fill="#9ca3af" fontSize={11}
              fontFamily="monospace" textAnchor="middle"
              transform={`rotate(-90 20 ${(Y0 + Y1) / 2})`}>
          Vertrauen 0–100 Punkte
        </text>
      </svg>

      <div className="viz-scatter__legend">
        <span className="viz-scatter__legend-item">
          <span className="viz-scatter__legend-dot" style={{ background: 'var(--group-adults)' }} />
          Erwachsene
        </span>
        <span className="viz-scatter__legend-item">
          <span className="viz-scatter__legend-dot" style={{ background: 'var(--group-minors)' }} />
          Minderjährige
        </span>
      </div>
    </div>
  );
}
