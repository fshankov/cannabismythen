import type { CarmData, GroupId, IndicatorPhase } from '../data/types';
import {
  ACTIVE_GROUPS,
  GROUP_LABEL_DE,
  INDICATOR_LABEL_DE,
  getIndicatorValue,
  sortedMyths,
} from '../data/carmData';

interface Props {
  data: CarmData;
  /** null = empty (step 5 intro). Indicator name = colored phase. */
  phase: IndicatorPhase | null;
}

/** Map an indicator value (0–100) to a CSS color via per-indicator HSL hue. */
function cellColor(phase: IndicatorPhase | null, value: number | null): string {
  if (phase === null || value === null) return 'var(--bg-elev-2)';
  const hue = {
    awareness: 218, // blue
    correctness: 152, // green
    prevention_significance: 32, // amber
  }[phase];
  // Saturation 0 → 95% as value 0 → 100; lightness 18% → 55%.
  const t = Math.min(1, Math.max(0, value / 100));
  const sat = (10 + 85 * t).toFixed(0);
  const light = (18 + 35 * t).toFixed(0);
  return `hsl(${hue}deg ${sat}% ${light}%)`;
}

/** Foreground color for cell text — white if dark bg, near-black if pale */
function textColor(phase: IndicatorPhase | null, value: number | null): string {
  if (phase === null || value === null) return 'var(--fg-muted)';
  return value >= 50 ? '#fff' : 'var(--fg)';
}

export function VizIndicatorStrip({ data, phase }: Props) {
  const myths = sortedMyths(data);

  const phases: IndicatorPhase[] = ['awareness', 'correctness', 'prevention_significance'];

  return (
    <div className="viz viz-strip">
      {/* Sample-size chips — visible in step 5 + carry into step 6 */}
      <div className="viz-strip__chips">
        <div className="viz-strip__chip">
          <span className="viz-strip__chip-num">2.097</span>
          <span className="viz-strip__chip-label">Erwachsene 18–70</span>
        </div>
        <div className="viz-strip__chip">
          <span className="viz-strip__chip-num">555</span>
          <span className="viz-strip__chip-label">Minderjährige 16–17</span>
        </div>
        <div className="viz-strip__chip">
          <span className="viz-strip__chip-num">143</span>
          <span className="viz-strip__chip-label">Anbauvereinigungen</span>
        </div>
      </div>

      {/* Phase pill strip */}
      {phase !== null && (
        <div className="viz-strip__phase-strip" role="tablist" aria-label="Indikator-Phasen">
          {phases.map((p) => (
            <span
              key={p}
              role="tab"
              aria-selected={phase === p}
              className={`viz-strip__phase-dot ${phase === p ? 'viz-strip__phase-dot--active' : ''}`}
            >
              {INDICATOR_LABEL_DE[p]}
            </span>
          ))}
        </div>
      )}

      {/* 5×42 heatmap (vertical orientation: rows = myths, cols = groups) */}
      <div
        className="viz-strip__heatmap"
        role="img"
        aria-label={
          phase === null
            ? 'Heatmap-Vorschau: 5 Zielgruppen × 42 Mythen, noch keine Werte'
            : `Heatmap: ${INDICATOR_LABEL_DE[phase]} pro Mythos und Zielgruppe`
        }
      >
        {/* Header row */}
        <div className="viz-strip__row-label" />
        {ACTIVE_GROUPS.map((g) => (
          <div key={g} className="viz-strip__col-label" title={GROUP_LABEL_DE[g]}>
            {GROUP_LABEL_DE[g].slice(0, 6)}
          </div>
        ))}

        {/* 42 myth rows */}
        {myths.slice(0, 42).map((m) => (
          <ContentsRow key={m.id} myth={m} groups={ACTIVE_GROUPS} data={data} phase={phase} />
        ))}
      </div>
    </div>
  );
}

function ContentsRow({
  myth,
  groups,
  data,
  phase,
}: {
  myth: { id: number; text_short_de: string; text_de: string };
  groups: GroupId[];
  data: CarmData;
  phase: IndicatorPhase | null;
}) {
  return (
    <>
      <div className="viz-strip__row-label" title={myth.text_de}>
        {myth.text_short_de}
      </div>
      {groups.map((g) => {
        const v = phase ? getIndicatorValue(data, myth.id, g, phase) : null;
        return (
          <div
            key={g}
            className="viz-strip__cell"
            style={{
              backgroundColor: cellColor(phase, v),
              color: textColor(phase, v),
            }}
            title={
              phase
                ? `${myth.text_short_de} · ${GROUP_LABEL_DE[g]} · ${INDICATOR_LABEL_DE[phase]}: ${v ?? '–'}`
                : `${myth.text_short_de} · ${GROUP_LABEL_DE[g]}`
            }
          >
            {phase && v !== null ? Math.round(v) : ''}
          </div>
        );
      })}
    </>
  );
}
