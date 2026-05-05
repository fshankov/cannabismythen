/**
 * FactsheetGroupBars — interactive replacement for the "Daten nach
 * Zielgruppen" markdown table that used to render inside the
 * FactsheetPanel popup on every myth surface (Fakten-Karten,
 * Daten-Explorer, Quiz post-answer).
 *
 * Layout:
 *   [ Indicator pills ]                           ← 5 pills, one per metric
 *   ┌──────────────────────────────────────┐
 *   │ Erwachsene (18–70)   ████████····  18.0│   ← 5 horizontal bars,
 *   │ Minderjährige (16–17) ██████████··· 21.3│     one per Zielgruppe
 *   │ Konsumierende        ████████████  33.4│
 *   │ Junge Erwachsene     ████████····  21.2│
 *   │ Eltern               ████████····  21.1│
 *   └──────────────────────────────────────┘
 *   [ Indicator description hint ]
 *
 * Behaviour:
 *   - Default indicator on first open is `awareness` (Kenntnis %).
 *   - Subsequent opens remember the last-used indicator via
 *     localStorage (`fakten-popup-indicator`).
 *   - Bars use the myth's verdict color so the chart visually echoes
 *     the verdict badge above. Same colors the daten-explorer Balken
 *     view uses (single source of truth: --classification-* tokens).
 *   - When an indicator is unavailable for a group (today only the
 *     `population_relevance` × consumers/young_adults/parents combos),
 *     the bar renders as a neutral muted track and shows "k. A." (the
 *     same copy the daten-explorer uses for not-available cells).
 *
 * No dependency on ECharts / D3 / canvas — pure CSS bars. Keeps
 * fakten-karten + quiz bundles small (those pages don't otherwise
 * load the dashboard's chart libraries).
 */

import { useEffect, useState } from 'react';
import type {
  CorrectnessClass,
  GroupId,
  Indicator,
  MythGroupMetrics,
} from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';

interface Props {
  /** Pre-computed metrics for the open myth — one entry per Zielgruppe.
   *  Built at build-time from carm-data.json and passed through as a
   *  JSON prop on every popup surface. */
  metrics: MythGroupMetrics;

  /** Verdict for the open myth. Drives the bar fill color so the chart
   *  visually echoes the verdict badge above. */
  verdict: CorrectnessClass;
}

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

/** Display order for the Zielgruppe rows. Mirrors the order in the
 *  retired markdown table so editors who looked at the old layout
 *  still see the same five rows in the same order. */
const GROUP_ORDER: GroupId[] = [
  'adults',
  'minors',
  'consumers',
  'young_adults',
  'parents',
];

/** Full Zielgruppe labels — match the daten-explorer Balken view's
 *  GROUP_LABELS verbatim (single source of voice). */
const GROUP_LABELS: Record<GroupId, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

/** Compact pill labels for the indicator picker — match the on-card
 *  language of the daten-explorer. The full names live in the hint
 *  line below the bars. */
const INDICATOR_PILL_LABELS: Record<Indicator, string> = {
  awareness: 'Kenntnis',
  significance: 'Bedeutung',
  correctness: 'Richtigkeit',
  prevention_significance: 'Prävention',
  population_relevance: 'Bev. Relevanz',
};

/** Verdict → CSS-token map, kept inline so the component is
 *  self-contained. Mirrors --classification-* / --classification-*-bg
 *  in `src/styles/global.css`. */
const VERDICT_FILL_TOKEN: Record<CorrectnessClass, string> = {
  richtig: 'var(--classification-richtig)',
  eher_richtig: 'var(--classification-eher-richtig)',
  eher_falsch: 'var(--classification-eher-falsch)',
  falsch: 'var(--classification-falsch)',
  no_classification: 'var(--classification-keine-aussage)',
};

const VERDICT_TRACK_TOKEN: Record<CorrectnessClass, string> = {
  richtig: 'var(--classification-richtig-bg)',
  eher_richtig: 'var(--classification-eher-richtig-bg)',
  eher_falsch: 'var(--classification-eher-falsch-bg)',
  falsch: 'var(--classification-falsch-bg)',
  no_classification: 'var(--classification-keine-aussage-bg)',
};

const STORAGE_KEY = 'fakten-popup-indicator';

function readStoredIndicator(): Indicator {
  if (typeof window === 'undefined') return 'awareness';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && INDICATORS.includes(raw as Indicator)) return raw as Indicator;
  } catch {
    // Storage may be unavailable (Safari private mode etc.) — fall through
    // to the default. The widget still works without persistence.
  }
  return 'awareness';
}

function persistIndicator(indicator: Indicator) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, indicator);
  } catch {
    // Same swallow as above — persistence is a nice-to-have.
  }
}

export default function FactsheetGroupBars({ metrics, verdict }: Props) {
  const [indicator, setIndicator] = useState<Indicator>(() =>
    readStoredIndicator(),
  );

  // Persist user's selection so the next popup opens on the same indicator.
  useEffect(() => {
    persistIndicator(indicator);
  }, [indicator]);

  // Build a quick lookup so we can render rows in our preferred order
  // even if `metrics` arrives in a different order.
  const byGroup = new Map<GroupId, MythGroupMetrics[number]>();
  for (const m of metrics) byGroup.set(m.group_id, m);

  const fill = VERDICT_FILL_TOKEN[verdict];
  const track = VERDICT_TRACK_TOKEN[verdict];

  // Indicator description (short hint shown beneath the bars). Matches the
  // copy used inside the dashboard's indicator info popovers — keeps the
  // editorial voice consistent across surfaces.
  const hint = t(`indicator.${indicator}.description`, 'de');
  const fullIndicatorLabel = t(`indicator.${indicator}`, 'de');

  return (
    <section
      className="factsheet-group-bars"
      aria-labelledby="factsheet-group-bars-heading"
    >
      <h3
        id="factsheet-group-bars-heading"
        className="factsheet-panel__section-heading"
      >
        Daten nach Zielgruppen
      </h3>

      <div
        className="factsheet-group-bars__pills"
        role="tablist"
        aria-label="Indikator wählen"
      >
        {INDICATORS.map((i) => {
          const isActive = i === indicator;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`factsheet-group-bars__pill${
                isActive ? ' factsheet-group-bars__pill--active' : ''
              }`}
              onClick={() => setIndicator(i)}
            >
              {INDICATOR_PILL_LABELS[i]}
            </button>
          );
        })}
      </div>

      <ul className="factsheet-group-bars__list" role="presentation">
        {GROUP_ORDER.map((g) => {
          const entry = byGroup.get(g);
          const value = entry ? (entry[indicator] as number | null) : null;
          const hasValue = typeof value === 'number';
          // Values are 0–100 across every indicator — same scale the
          // daten-explorer's Balken view uses (formatValue + 100 max).
          const pct = hasValue ? Math.max(0, Math.min(100, value)) : 0;
          return (
            <li key={g} className="factsheet-group-bars__row">
              <span className="factsheet-group-bars__group-label">
                {GROUP_LABELS[g]}
              </span>
              <div
                className="factsheet-group-bars__track"
                style={{ background: track }}
                aria-hidden="true"
              >
                {hasValue && (
                  <div
                    className="factsheet-group-bars__fill"
                    style={{ width: `${pct}%`, background: fill }}
                  />
                )}
              </div>
              {hasValue ? (
                <span
                  className="factsheet-group-bars__value"
                  style={{ color: fill }}
                >
                  {value!.toFixed(1)}
                </span>
              ) : (
                <span
                  className="factsheet-group-bars__value factsheet-group-bars__value--na"
                  title="Dieser Indikator wurde nur für Erwachsene (18–70) und Minderjährige (16–17) erhoben."
                >
                  k. A.
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="factsheet-group-bars__hint">
        <strong className="factsheet-group-bars__hint-label">
          {fullIndicatorLabel}:
        </strong>{' '}
        {hint}
      </p>
    </section>
  );
}
