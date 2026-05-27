/**
 * Lesebeispiel band classification + render helpers.
 *
 * Extracted from `src/components/dashboard/Lesebeispiel.tsx` so the same
 * classification + interpolation logic can be reused from non-React
 * render paths — specifically the ECharts tooltip formatter in
 * BalkenView, which only sees an HTML-string callback API.
 *
 * Thresholds and copy locked by the CaRM team (ISD review email):
 *
 *   0–10   → "sehr niedrig"
 *   11–25  → "niedrig"
 *   26–37  → "niedrig mittel"
 *   38–62  → "mittel"
 *   63–74  → "hoch mittel"
 *   75–89  → "hoch"
 *   90–100 → "sehr hoch"
 *
 * Anteil (masculine, "ein … Anteil") is reserved for Kenntnis (%-based).
 * Niveau (neuter, "ein … Niveau") is used for the four point indicators.
 */

import type { Metric, Indicator, GroupId } from "./types";

/** Structural subset of `Metric` the Lesebeispiel needs — the five
 *  indicator fields. Kept narrow so callers can pass a `MythGroupMetrics`
 *  row (no myth_id) or a full `Metric` interchangeably. */
export type LesebeispielMetric = Pick<
  Metric,
  | "awareness"
  | "significance"
  | "correctness"
  | "prevention_significance"
  | "population_relevance"
>;

/** Genitive-plural form of each Zielgruppe used inside the Lesebeispiel
 *  sentence ("In der Zielgruppe der **Erwachsenen** kennen X % …"). The
 *  team's original wording is locked for adults; the other four are
 *  mechanical German genitive-plural substitutions. */
export const GROUP_INTRO_GENITIVE: Record<GroupId, string> = {
  adults: "Erwachsenen",
  minors: "Minderjährigen",
  consumers: "Konsumierenden",
  young_adults: "jungen Erwachsenen",
  parents: "Eltern",
};

/** Demonstrative+noun phrase used in the Beurteilung (correctness)
 *  sentence: "… erreicht bei **diesen Erwachsenen ein** hohes mittleres
 *  Niveau …". Each entry is "diesen [dat-plural] ein" (or "diesen Eltern
 *  ein" — same plural form). */
export const GROUP_DEMONSTRATIVE: Record<GroupId, string> = {
  adults: "diesen Erwachsenen ein",
  minors: "diesen Minderjährigen ein",
  consumers: "diesen Konsumierenden ein",
  young_adults: "diesen jungen Erwachsenen ein",
  parents: "diesen Eltern ein",
};

/** Population noun used by the Bevölkerungsrelevanz sentence: "Mit
 *  Blick auf die gesamte **volljährige Bevölkerung** …". Only adults
 *  + minors have non-null pop_rel data in carm-data.json; the other
 *  three groups intentionally have no entry here so callers can
 *  detect "no approved wording for this group" by absence and
 *  suppress the sentence.
 *
 *  The Minderjährige variant ("minderjährige Bevölkerung") is a
 *  mechanical adjective swap of the team-approved adults wording —
 *  AI draft, marked here so ISD can spot it on the live site. */
export const GROUP_POPULATION_NOUN: Partial<Record<GroupId, string>> = {
  adults: "volljährige Bevölkerung",
  // AI draft (2026-05-21): symmetric "voll-" → "minder-" swap of the
  // team's approved adults wording. See ISD review.
  minors: "minderjährige Bevölkerung",
};

/** Lower bound (inclusive) of bands 1 through 6. Band 0 is value < 11. */
export const BAND_THRESHOLDS = [11, 26, 38, 63, 75, 90] as const;

export const ANTEIL_LABELS = [
  "sehr niedriger Anteil",
  "niedriger Anteil",
  "niedriger mittlerer Anteil",
  "mittlerer Anteil",
  "hoher mittlerer Anteil",
  "hoher Anteil",
  "sehr hoher Anteil",
] as const;

export const NIVEAU_LABELS = [
  "sehr niedriges Niveau",
  "niedriges Niveau",
  "niedriges mittleres Niveau",
  "mittleres Niveau",
  "hohes mittleres Niveau",
  "hohes Niveau",
  "sehr hohes Niveau",
] as const;

/** Pick the band index (0–6) for an integer value in 0–100. Callers must
 *  pass already-rounded integers so the label matches the displayed
 *  number at boundary values (e.g. raw 10.51 → display "11 %" → band
 *  "niedrig", not the "sehr niedrig" you'd get from classifying 10.51). */
export function bandIndex(value: number): number {
  let i = 0;
  while (i < BAND_THRESHOLDS.length && value >= BAND_THRESHOLDS[i]) i++;
  return i;
}

export function anteilLabel(value: number): string {
  return ANTEIL_LABELS[bandIndex(value)];
}

export function niveauLabel(value: number): string {
  return NIVEAU_LABELS[bandIndex(value)];
}

/** True when all five indicators on a Metric are non-null. A partial
 *  Lesebeispiel would read as misleading prose, so callers should drop
 *  the paragraph entirely when this predicate fails. */
export function isMetricComplete(
  metric: LesebeispielMetric | null | undefined,
): boolean {
  if (!metric) return false;
  return (
    metric.awareness !== null &&
    metric.significance !== null &&
    metric.correctness !== null &&
    metric.prevention_significance !== null &&
    metric.population_relevance !== null
  );
}

/** Render the Erwachsene Lesebeispiel paragraph as an HTML string. For
 *  use in contexts where React rendering isn't available (ECharts
 *  tooltip formatter). Returns null when the metric is missing or any
 *  of its five indicator values is null. */
export function lesebeispielHtml(
  metric: LesebeispielMetric | null | undefined,
): string | null {
  if (!isMetricComplete(metric)) return null;
  const m = metric as LesebeispielMetric;
  const kenntnis = Math.round(m.awareness as number);
  const bedeutung = Math.round(m.significance as number);
  const beurteilung = Math.round(m.correctness as number);
  const praevention = Math.round(m.prevention_significance as number);
  const bevoelkerung = Math.round(m.population_relevance as number);

  return (
    `<div class="lesebeispiel-tooltip">` +
    `<div class="lesebeispiel-tooltip__heading">Lesebeispiel für die Gruppe der Erwachsenen</div>` +
    `<p class="lesebeispiel-tooltip__body">` +
    `In der Zielgruppe der Erwachsenen kennen <strong>${kenntnis}&nbsp;%</strong> diesen Mythos. ` +
    `Das ist ein <strong>${anteilLabel(kenntnis)}</strong>. ` +
    `Die Bedeutung dieses Mythos für die Erwachsenen, die diesen Mythos kennen <strong>${kenntnis}&nbsp;%</strong>, ` +
    `für ihren Umgang mit Cannabis hat ein <strong>${niveauLabel(bedeutung)}</strong> ` +
    `von <strong>${bedeutung}&nbsp;Punkten</strong>. ` +
    `Die Beurteilung des Mythos in Übereinstimmung mit der wissenschaftlichen Klassifizierung erreicht ` +
    `bei diesen Erwachsenen ein <strong>${niveauLabel(beurteilung)}</strong> ` +
    `von <strong>${beurteilung}&nbsp;Punkten</strong>. ` +
    `Aus der individuellen Bedeutung und der Beurteilung der Richtigkeit resultiert ein ` +
    `<strong>${niveauLabel(praevention)}</strong> für die Präventionsbedeutung ` +
    `(<strong>${praevention}&nbsp;Punkte</strong>) für die Zielgruppe der Erwachsenen, ` +
    `die diesen Mythos kennen. ` +
    `Mit Blick auf die gesamte volljährige Bevölkerung (nicht nur diejenigen, die den Mythos schon ` +
    `kennen) ergibt sich ein <strong>${niveauLabel(bevoelkerung)}</strong> für die Präventionsbedeutung ` +
    `(Bevölkerungsrelevanz: <strong>${bevoelkerung}&nbsp;Punkte</strong>) für diesen Mythos.` +
    `</p>` +
    `</div>`
  );
}

/** Render ONE Lesebeispiel sentence — the sentence corresponding to the
 *  given indicator. Used by hover tooltips (BalkenView ECharts +
 *  SpannweiteView custom) where showing the full 5-sentence paragraph
 *  on every hover would be too much text per cell.
 *
 *  The five sentences are extracted verbatim from the team-approved
 *  full paragraph (concatenating them in indicator order = the full
 *  paragraph rendered by `lesebeispielHtml`).
 *
 *  Returns null when:
 *    - the metric is missing
 *    - the indicator's value is null
 *    - (for `significance`) the awareness value is null, since that
 *      sentence references the kenntnis % count.
 *
 *  Hardcoded to the Erwachsene wording — kept for backwards
 *  compatibility with BalkenView and SpannweiteView. New callers
 *  (e.g. the popup table) should use
 *  `lesebeispielIndicatorHtmlForGroup` below, which switches the
 *  audience phrasing per group.
 */
export function lesebeispielIndicatorHtml(
  metric: LesebeispielMetric | null | undefined,
  indicator: Indicator,
): string | null {
  return lesebeispielIndicatorHtmlForGroup(metric, indicator, "adults");
}

/** Per-group variant of `lesebeispielIndicatorHtml`. Picks the audience
 *  phrasing from `GROUP_INTRO_GENITIVE` + `GROUP_DEMONSTRATIVE` +
 *  `GROUP_POPULATION_NOUN` so the same indicator sentence reads
 *  naturally for any of the 5 Zielgruppen.
 *
 *  Returns null when:
 *    - the metric is missing
 *    - the indicator's value is null
 *    - the (indicator × group) combo is invalid (today only
 *      population_relevance × {consumers, young_adults, parents} —
 *      these groups have no approved "volljährige Bevölkerung"
 *      counterpart, so the sentence is suppressed)
 *    - (for `significance`) the awareness value is null
 *
 *  Used by the popup's `<FactsheetGroupBars>` table on the cell hover.
 */
export function lesebeispielIndicatorHtmlForGroup(
  metric: LesebeispielMetric | null | undefined,
  indicator: Indicator,
  group: GroupId,
): string | null {
  if (!metric) return null;
  const v = metric[indicator];
  if (v === null) return null;

  // Skip pop_relevance for groups without an approved population noun
  // (consumers, young_adults, parents). The caller will already be
  // rendering "k. A." in those cells.
  if (indicator === "population_relevance" && !GROUP_POPULATION_NOUN[group]) {
    return null;
  }

  const rounded = Math.round(v as number);
  const intro = GROUP_INTRO_GENITIVE[group];
  const demonstrative = GROUP_DEMONSTRATIVE[group];
  const populationNoun = GROUP_POPULATION_NOUN[group];

  let sentence = "";
  if (indicator === "awareness") {
    sentence =
      `In der Zielgruppe der ${intro} kennen <strong>${rounded}&nbsp;%</strong> diesen Mythos. ` +
      `Das ist ein <strong>${anteilLabel(rounded)}</strong>.`;
  } else if (indicator === "significance") {
    if (metric.awareness === null) return null;
    const kenntnis = Math.round(metric.awareness as number);
    sentence =
      `Die Bedeutung dieses Mythos für die ${intro}, die diesen Mythos kennen ` +
      `<strong>${kenntnis}&nbsp;%</strong>, für ihren Umgang mit Cannabis hat ein ` +
      `<strong>${niveauLabel(rounded)}</strong> von <strong>${rounded}&nbsp;Punkten</strong>.`;
  } else if (indicator === "correctness") {
    sentence =
      `Die Beurteilung des Mythos in Übereinstimmung mit der wissenschaftlichen Klassifizierung ` +
      `erreicht bei ${demonstrative} <strong>${niveauLabel(rounded)}</strong> ` +
      `von <strong>${rounded}&nbsp;Punkten</strong>.`;
  } else if (indicator === "prevention_significance") {
    sentence =
      `Aus der individuellen Bedeutung und der Beurteilung der Richtigkeit resultiert ein ` +
      `<strong>${niveauLabel(rounded)}</strong> für die Präventionsbedeutung ` +
      `(<strong>${rounded}&nbsp;Punkte</strong>) für die Zielgruppe der ${intro}, ` +
      `die diesen Mythos kennen.`;
  } else {
    // population_relevance — populationNoun is guaranteed non-null
    // by the early-return above.
    sentence =
      `Mit Blick auf die gesamte ${populationNoun} (nicht nur diejenigen, die den ` +
      `Mythos schon kennen) ergibt sich ein <strong>${niveauLabel(rounded)}</strong> für ` +
      `die Präventionsbedeutung (Bevölkerungsrelevanz: <strong>${rounded}&nbsp;Punkte</strong>) ` +
      `für diesen Mythos.`;
  }

  // The heading uses nominative ("Erwachsene", "Minderjährige", ...)
  // not genitive — derive from the existing genitive form by chopping
  // the trailing "n" where applicable.
  const groupNominative: Record<GroupId, string> = {
    adults: "Erwachsenen",
    minors: "Minderjährigen",
    consumers: "Konsumierenden",
    young_adults: "jungen Erwachsenen",
    parents: "Eltern",
  };

  return (
    `<div class="lesebeispiel-tooltip">` +
    `<div class="lesebeispiel-tooltip__heading">Lesebeispiel für die Gruppe der ${groupNominative[group]}</div>` +
    `<p class="lesebeispiel-tooltip__body">${sentence}</p>` +
    `</div>`
  );
}
