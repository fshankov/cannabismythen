import { useMemo, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import type {
  CarmData,
  GroupId,
  IndicatorPhase,
  Myth,
  SampleRankedMode,
} from '../data/types';
import {
  ACTIVE_GROUPS,
  GROUP_LABEL_DE,
  INDICATOR_LABEL_DE,
  getMetric,
} from '../data/carmData';

interface Props {
  data: CarmData;
  mode: SampleRankedMode;
}

interface RankRow {
  myth: Myth;
  values: Record<GroupId, number | null>;
  avg: number;
}

const SAMPLE_GROUPS = [
  { id: 'adults', label: 'Erwachsene 18–70', n: 2097, iconCount: 42, color: 'var(--group-adults)' },
  { id: 'minors', label: 'Minderjährige 16–17', n: 555, iconCount: 11, color: 'var(--group-minors)' },
  { id: 'clubs', label: 'Anbauvereinigungs-Mitglieder', n: 143, iconCount: 3, color: 'var(--group-consumers)' },
] as const;

const INDICATORS = [
  { name: 'Kenntnis', unit: 'Anteil %', desc: 'Wie viele kennen die Aussage überhaupt?' },
  { name: 'Bedeutung', unit: 'Punkte', desc: 'Wie wichtig ist die Aussage für den eigenen Umgang mit Cannabis?' },
  { name: 'Richtigkeit', unit: 'Punkte 0–100', desc: 'Wie nahe liegt die Beurteilung an der wissenschaftlichen Klassifikation?' },
  { name: 'Präventionsbedeutung', unit: 'Punkte', desc: 'Bedeutung × Wissenslücke. Wo ist Aufklärung nötig?' },
  { name: 'Bevölkerungsrisiko', unit: 'Punkte', desc: 'Präventionsbedeutung × Kenntnisanteil. Nur Voll- + Minderjährige.' },
] as const;

const PHASE_BY_MODE: Record<SampleRankedMode, IndicatorPhase | null> = {
  sample: null,
  'ranked-1': 'awareness',
  'ranked-2': 'correctness',
  'ranked-3': 'prevention_significance',
};

const PHASE_LEAD: Record<IndicatorPhase, { lead: string; unit: string }> = {
  awareness: {
    lead: '„Cannabis lindert Schmerzen“ ist mit 77% bei Konsumierenden am bekanntesten.',
    unit: '%',
  },
  correctness: {
    lead: '„Konsum gefährdet die Verkehrssicherheit“ — 92 von 100 Punkten Übereinstimmung mit der Wissenschaft.',
    unit: 'Pkt',
  },
  prevention_significance: {
    lead: '„Cannabis lindert Schmerzen“ und „Einstiegsdroge“ haben für Erwachsene den größten Aufklärungsbedarf.',
    unit: 'Pkt',
  },
};

const GROUP_COLOR: Record<GroupId, string> = {
  adults: 'var(--group-adults)',
  minors: 'var(--group-minors)',
  consumers: 'var(--group-consumers)',
  young_adults: 'var(--group-young_adults)',
  parents: 'var(--group-parents)',
};

/**
 * Step 5+6 shared-DOM viz. Steps 5 → 6 do NOT remount; they swap the `mode`
 * prop and let CSS animate panel cross-fades + bar growth. The Stichprobe-Chip
 * stays visible across both steps to anchor "what's being measured".
 */
export function VizSampleAndRanked({ data, mode }: Props) {
  const phase = PHASE_BY_MODE[mode];
  const isSample = mode === 'sample';

  const rows: RankRow[] = useMemo(() => {
    if (!phase) return [];
    return data.myths
      .map<RankRow>((myth) => {
        const values: Record<GroupId, number | null> = {
          adults: null, minors: null, consumers: null, young_adults: null, parents: null,
        };
        for (const g of ACTIVE_GROUPS) {
          const m = getMetric(data, myth.id, g);
          values[g] = m ? m[phase] : null;
        }
        const valid = ACTIVE_GROUPS.map((g) => values[g]).filter(
          (v): v is number => v !== null && Number.isFinite(v),
        );
        const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        return { myth, values, avg };
      })
      .filter((r) => r.avg > 0)
      .sort((a, b) => b.avg - a.avg);
  }, [data, phase]);

  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows.slice(0, 42) : rows.slice(0, 10);
  const remaining = Math.max(0, rows.length - 10);
  const lead = phase ? PHASE_LEAD[phase] : null;

  return (
    <div className="viz viz-sr" data-mode={mode}>
      {/* Stichprobe-Chip — visible in both modes; large in sample, small in ranked */}
      <div className={`viz-sr__chip ${isSample ? 'viz-sr__chip--full' : 'viz-sr__chip--compact'}`}>
        <span className="viz-sr__chip-num">2.795</span>
        <span className="viz-sr__chip-label">
          {isSample ? 'Personen befragt' : 'Stichprobe'}
        </span>
      </div>

      {/* SAMPLE PANEL — visible only in sample mode */}
      <div className="viz-sr__sample" aria-hidden={!isSample} data-active={isSample}>
        <div className="viz-sr__panel">
          <h3 className="viz-sr__title">Stichprobe</h3>
          <p className="viz-sr__subtitle">Eine Person-Symbol = 50 Befragte</p>
          <div className="viz-sr__groups">
            {SAMPLE_GROUPS.map((g, gi) => (
              <div
                key={g.id}
                className="viz-sr__group"
                style={{ ['--row-delay' as string]: `${gi * 80}ms` }}
              >
                <div className="viz-sr__group-header">
                  <span className="viz-sr__group-num">{g.n.toLocaleString('de-DE')}</span>
                  <span className="viz-sr__group-label">{g.label}</span>
                </div>
                <div className="viz-sr__icon-row" aria-hidden="true">
                  {Array.from({ length: g.iconCount }, (_, i) => (
                    <Users
                      key={i}
                      size={14}
                      strokeWidth={2}
                      color={g.color}
                      style={{
                        flexShrink: 0,
                        animationDelay: `calc(var(--row-delay, 0ms) + ${i * 14}ms)`,
                      }}
                      className="viz-sr__icon"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="viz-sr__panel">
          <h3 className="viz-sr__title">Fünf Indikatoren pro These</h3>
          <ul className="viz-sr__indicators">
            {INDICATORS.map((ind, ii) => (
              <li
                key={ind.name}
                className="viz-sr__indicator"
                style={{ animationDelay: `${300 + ii * 60}ms` }}
              >
                <span className="viz-sr__indicator-name">{ind.name}</span>
                <span className="viz-sr__indicator-unit">{ind.unit}</span>
                <span className="viz-sr__indicator-desc">{ind.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RANKED PANEL — visible only in ranked-* modes */}
      <div className="viz-sr__ranked" aria-hidden={isSample} data-active={!isSample}>
        <div className="viz-sr__phase-pills" role="tablist" aria-label="Indikator-Phase">
          {(['awareness', 'correctness', 'prevention_significance'] as IndicatorPhase[]).map(
            (p) => (
              <span
                key={p}
                role="tab"
                aria-selected={phase === p}
                className={`viz-sr__phase-pill ${phase === p ? 'viz-sr__phase-pill--active' : ''}`}
              >
                {INDICATOR_LABEL_DE[p]}
              </span>
            ),
          )}
        </div>
        {lead && <p className="viz-sr__lead">{lead.lead}</p>}

        <div className="viz-sr__legend" aria-label="Zielgruppen">
          {ACTIVE_GROUPS.map((g) => (
            <span key={g} className="viz-sr__legend-item">
              <span
                className="viz-sr__legend-dot"
                style={{ background: GROUP_COLOR[g] }}
                aria-hidden="true"
              />
              {GROUP_LABEL_DE[g]}
            </span>
          ))}
        </div>

        <ol className="viz-sr__list">
          {visible.map((r, i) => (
            <RankedRow
              key={r.myth.id}
              row={r}
              index={i}
              unit={lead?.unit ?? ''}
            />
          ))}
        </ol>

        {!expanded && remaining > 0 && (
          <button className="viz-sr__expand" onClick={() => setExpanded(true)} type="button">
            Mehr ansehen <ChevronDown size={14} aria-hidden="true" />
            <span className="viz-sr__expand-count">+{remaining}</span>
          </button>
        )}
        {expanded && (
          <button className="viz-sr__expand" onClick={() => setExpanded(false)} type="button">
            Weniger anzeigen
          </button>
        )}
      </div>
    </div>
  );
}

function RankedRow({
  row,
  index,
  unit,
}: {
  row: RankRow;
  index: number;
  unit: string;
}) {
  const [hover, setHover] = useState<GroupId | null>(null);
  return (
    <li className="viz-sr__row" style={{ animationDelay: `${index * 30}ms` }}>
      <span className="viz-sr__rank" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="viz-sr__row-label" title={row.myth.text_de}>
        {row.myth.text_short_de}
      </span>
      <div className="viz-sr__bars">
        {ACTIVE_GROUPS.map((g) => {
          const v = row.values[g];
          const w = v == null ? 0 : Math.max(2, Math.min(100, v));
          const tipText =
            v == null
              ? `${row.myth.text_short_de} · ${GROUP_LABEL_DE[g]}: keine Daten`
              : `${row.myth.text_short_de} · ${GROUP_LABEL_DE[g]}: ${Math.round(v)} ${unit}`;
          return (
            <div
              key={g}
              className={`viz-sr__bar-row ${hover === g ? 'viz-sr__bar-row--hover' : ''}`}
              onMouseEnter={() => setHover(g)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(g)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={tipText}
            >
              <span className="viz-sr__bar-track">
                <span
                  className="viz-sr__bar-fill"
                  style={{ width: `${w}%`, background: GROUP_COLOR[g] }}
                />
              </span>
              <span className="viz-sr__bar-value">
                {v == null ? '–' : Math.round(v)}
              </span>
              {hover === g && (
                <span className="viz-sr__bar-tip" role="tooltip">{tipText}</span>
              )}
            </div>
          );
        })}
      </div>
    </li>
  );
}
