import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CarmData, GroupId, IndicatorPhase, Myth } from '../data/types';
import { ACTIVE_GROUPS, GROUP_LABEL_DE, INDICATOR_LABEL_DE, getMetric } from '../data/carmData';

interface Props {
  data: CarmData;
  phase: IndicatorPhase;
}

interface RankRow {
  myth: Myth;
  values: Record<GroupId, number | null>;
  /** Average across the 5 active groups, used for ranking. */
  avg: number;
}

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

export function VizIndicatorRanked({ data, phase }: Props) {
  const rows: RankRow[] = useMemo(() => {
    return data.myths
      .map<RankRow>((myth) => {
        const values: Record<GroupId, number | null> = {
          adults: null,
          minors: null,
          consumers: null,
          young_adults: null,
          parents: null,
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

  const lead = PHASE_LEAD[phase];

  return (
    <div className="viz viz-ranked">
      <div className="viz-ranked__header">
        <div className="viz-ranked__phase-pills" role="tablist" aria-label="Indikator-Phase">
          {(['awareness', 'correctness', 'prevention_significance'] as IndicatorPhase[]).map(
            (p) => (
              <span
                key={p}
                role="tab"
                aria-selected={phase === p}
                className={`viz-ranked__phase-pill ${
                  phase === p ? 'viz-ranked__phase-pill--active' : ''
                }`}
              >
                {INDICATOR_LABEL_DE[p]}
              </span>
            ),
          )}
        </div>
        <p className="viz-ranked__lead">{lead.lead}</p>
      </div>

      <div className="viz-ranked__legend" aria-label="Zielgruppen">
        {ACTIVE_GROUPS.map((g) => (
          <span key={g} className="viz-ranked__legend-item">
            <span
              className="viz-ranked__legend-dot"
              style={{ background: GROUP_COLOR[g] }}
              aria-hidden="true"
            />
            {GROUP_LABEL_DE[g]}
          </span>
        ))}
      </div>

      <ol className="viz-ranked__list">
        {visible.map((r, i) => (
          <RankedRow key={r.myth.id} row={r} index={i} unit={lead.unit} />
        ))}
      </ol>

      {!expanded && remaining > 0 && (
        <button
          className="viz-ranked__expand"
          onClick={() => setExpanded(true)}
          type="button"
        >
          Mehr ansehen <ChevronDown size={14} aria-hidden="true" />
          <span className="viz-ranked__expand-count">+{remaining}</span>
        </button>
      )}
      {expanded && (
        <button
          className="viz-ranked__expand"
          onClick={() => setExpanded(false)}
          type="button"
        >
          Weniger anzeigen
        </button>
      )}
    </div>
  );
}

function RankedRow({ row, index, unit }: { row: RankRow; index: number; unit: string }) {
  return (
    <li className="viz-ranked__row" style={{ animationDelay: `${index * 30}ms` }}>
      <span className="viz-ranked__rank" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="viz-ranked__label" title={row.myth.text_de}>
        {row.myth.text_short_de}
      </span>
      <div className="viz-ranked__bars">
        {ACTIVE_GROUPS.map((g) => {
          const v = row.values[g];
          const w = v == null ? 0 : Math.max(2, Math.min(100, v));
          return (
            <div
              key={g}
              className="viz-ranked__bar-row"
              title={`${GROUP_LABEL_DE[g]}: ${v == null ? '–' : Math.round(v)} ${unit}`}
            >
              <span className="viz-ranked__bar-track">
                <span
                  className="viz-ranked__bar-fill"
                  style={{
                    width: `${w}%`,
                    background: GROUP_COLOR[g],
                  }}
                />
              </span>
              <span className="viz-ranked__bar-value">
                {v == null ? '–' : Math.round(v)}
              </span>
            </div>
          );
        })}
      </div>
    </li>
  );
}
