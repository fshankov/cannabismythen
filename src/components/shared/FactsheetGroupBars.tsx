/**
 * FactsheetGroupBars — interactive replacement for the "Daten nach
 * Zielgruppen" markdown table that used to render inside the
 * FactsheetPanel popup on every myth surface (Fakten-Karten,
 * Daten-Explorer, Quiz post-answer).
 *
 * Travel pipeline 4D (2026-05-23) redesign: the previous 5-bar stack
 * (one bar per Zielgruppe, single indicator picked via the 4A dropdown)
 * gives way to a 5-row × 5-column matrix table — populations across
 * the top (with audience icons), indicators down the left side (with
 * indicator icons). Each cell shows the rounded value plus a thin
 * verdict-tinted mini-bar so the eye can scan both magnitude AND
 * relative comparisons across the matrix at a glance.
 *
 * Why a matrix:
 *   - The single-indicator-at-a-time dropdown hid 80 % of the data
 *     behind a click. Most readers stayed on the default indicator
 *     and never saw the rest.
 *   - A 5×5 matrix surfaces the full Bevölkerungsbefragung slice for
 *     the myth in one read, with verdict-tinted micro-bars giving the
 *     same "more vs. less" cue the single-indicator bars used to.
 *   - Population icons in column headers + indicator icons in row
 *     headers make the matrix scannable on mobile even with abbreviated
 *     text labels.
 *
 * Invalid combos (population_relevance × consumers/young_adults/parents
 * per POP_REL_INVALID_GROUPS) still render "k. A." italic — matches the
 * dashboard's missing-data convention.
 *
 * No dependency on ECharts / D3 / canvas — pure CSS bars. Keeps the
 * fakten-karten + quiz bundles small (those pages don't otherwise load
 * the dashboard's chart libraries).
 */

import type {
  CorrectnessClass,
  GroupId,
  Indicator,
  MythGroupMetrics,
} from '../../lib/dashboard/types';
import { POP_REL_INVALID_GROUPS } from '../../lib/dashboard/data';
import { t } from '../../lib/dashboard/translations';
import {
  AUDIENCE_ICONS_BY_GROUP,
  INDICATOR_ICONS,
} from '../../lib/icons/lookups';

interface Props {
  /** Pre-computed metrics for the open myth — one entry per Zielgruppe.
   *  Built at build-time from carm-data.json and passed through as a
   *  JSON prop on every popup surface. */
  metrics: MythGroupMetrics;

  /** Verdict for the open myth. Drives the bar fill color so the matrix
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

/** Display order for the Zielgruppe columns. Same canonical order the
 *  Daten-Explorer uses everywhere (Volljährige first, Eltern last). */
const GROUP_ORDER: GroupId[] = [
  'adults',
  'minors',
  'consumers',
  'young_adults',
  'parents',
];

/** Full Zielgruppe labels — match the daten-explorer Balken view's
 *  GROUP_LABELS verbatim. Used as the column-header `title` tooltip. */
const GROUP_LABELS: Record<GroupId, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

/** Compact column-header labels — sized so 5 columns fit inside the
 *  ~480 px popup on desktop and ~340 px popup body on mobile. Full
 *  label appears as the column-header `title` tooltip. */
const GROUP_SHORT: Record<GroupId, string> = {
  adults: 'Erw.',
  minors: 'Min.',
  consumers: 'Kons.',
  young_adults: 'Junge E.',
  parents: 'Eltern',
};

/** Indicator row labels — same wording the 4A dropdown used so editors
 *  who memorised the picker order recognise the matrix instantly. */
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

export default function FactsheetGroupBars({ metrics, verdict }: Props) {
  // Build a quick lookup so we can render cells in the canonical
  // GROUP_ORDER even if the metrics array arrived in a different order.
  const byGroup = new Map<GroupId, MythGroupMetrics[number]>();
  for (const m of metrics) byGroup.set(m.group_id, m);

  const fill = VERDICT_FILL_TOKEN[verdict];
  const track = VERDICT_TRACK_TOKEN[verdict];

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

      <div className="factsheet-group-bars__matrix-wrap">
        <table
          className="factsheet-group-bars__matrix"
          role="table"
          aria-label="5 Indikatoren × 5 Bevölkerungsgruppen"
        >
          <thead>
            <tr>
              {/* Top-left corner cell — empty but semantically the
                  spacer for the row/column header intersection. */}
              <th
                className="factsheet-group-bars__corner"
                scope="col"
                aria-label="Indikator"
              />
              {GROUP_ORDER.map((g) => {
                const GroupIcon = AUDIENCE_ICONS_BY_GROUP[g];
                return (
                  <th
                    key={g}
                    scope="col"
                    className="factsheet-group-bars__col-header"
                    title={GROUP_LABELS[g]}
                  >
                    <span className="factsheet-group-bars__col-icon" aria-hidden="true">
                      <GroupIcon size={18} strokeWidth={1.75} />
                    </span>
                    <span className="factsheet-group-bars__col-label">
                      {GROUP_SHORT[g]}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((indicator) => {
              const IndIcon = INDICATOR_ICONS[indicator];
              const fullIndicatorLabel = t(`indicator.${indicator}`, 'de');
              return (
                <tr key={indicator}>
                  <th
                    scope="row"
                    className="factsheet-group-bars__row-header"
                    title={fullIndicatorLabel}
                  >
                    <span className="factsheet-group-bars__row-icon" aria-hidden="true">
                      <IndIcon size={14} strokeWidth={1.75} />
                    </span>
                    <span className="factsheet-group-bars__row-label">
                      {INDICATOR_PILL_LABELS[indicator]}
                    </span>
                  </th>
                  {GROUP_ORDER.map((g) => {
                    const entry = byGroup.get(g);
                    const rawValue = entry ? (entry[indicator] as number | null) : null;
                    // Force null for invalid pop_relevance combos so stray
                    // data values don't render as bars (BugHerd #33 — see
                    // POP_REL_INVALID_GROUPS).
                    const value =
                      indicator === 'population_relevance' &&
                      POP_REL_INVALID_GROUPS.has(g)
                        ? null
                        : rawValue;
                    const hasValue = typeof value === 'number';
                    // Values are 0–100 across every indicator — same scale
                    // the daten-explorer's Balken view uses (max 100).
                    const pct = hasValue ? Math.max(0, Math.min(100, value)) : 0;
                    return (
                      <td
                        key={g}
                        className={
                          hasValue
                            ? 'factsheet-group-bars__cell'
                            : 'factsheet-group-bars__cell factsheet-group-bars__cell--na'
                        }
                        aria-label={
                          hasValue
                            ? `${INDICATOR_PILL_LABELS[indicator]} für ${GROUP_LABELS[g]}: ${Math.round(value!)} %`
                            : `${INDICATOR_PILL_LABELS[indicator]} für ${GROUP_LABELS[g]}: keine Daten`
                        }
                      >
                        {hasValue ? (
                          <>
                            <span
                              className="factsheet-group-bars__cell-value"
                              style={{ color: fill }}
                            >
                              {/* BugHerd #31 — round-to-int site-wide. */}
                              {Math.round(value!)}
                            </span>
                            <span
                              className="factsheet-group-bars__cell-bar"
                              aria-hidden="true"
                              style={{ background: track }}
                            >
                              <span
                                className="factsheet-group-bars__cell-fill"
                                style={{ width: `${pct}%`, background: fill }}
                              />
                            </span>
                          </>
                        ) : (
                          <span
                            className="factsheet-group-bars__cell-na"
                            title="Dieser Indikator wurde nur für Erwachsene (18–70) und Minderjährige (16–17) erhoben."
                          >
                            k. A.
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
