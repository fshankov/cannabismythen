/**
 * Lesebeispiel band classification + sentence builders.
 *
 * Direct port of `cannabismythen/src/lib/dashboard/lesebeispiel-bands.ts`
 * (locked by the ISD team review 2026-05). Kept self-contained inside
 * `src/components/scrollytelling/` so a future port-back is a one-line
 * import path swap.
 *
 * Thresholds + label arrays + group-name lookups are byte-for-byte
 * identical to the live site. Adjusted to the scrolly's type names
 * (`Indicator`, `GroupId`, `Metric`) which already match cannabismythen's
 * shape (see `src/components/scrollytelling/types.ts`).
 */
import type { GroupId, Indicator, Metric, SourceMetricId } from "./types";

/** Structural subset of `Metric` the Lesebeispiel needs. */
export type LesebeispielMetric = Pick<
  Metric,
  | "awareness"
  | "significance"
  | "correctness"
  | "prevention_significance"
  | "population_relevance"
>;

/** Genitive-plural form of each Zielgruppe used inside the Lesebeispiel
 *  sentence ("In der Zielgruppe der **Erwachsenen** kennen X % …"). */
export const GROUP_INTRO_GENITIVE: Record<GroupId, string> = {
  adults: "Erwachsenen",
  minors: "Minderjährigen",
  consumers: "Konsumierenden",
  young_adults: "jungen Erwachsenen",
  parents: "Eltern",
};

/** Demonstrative+noun phrase used in the Beurteilung (correctness)
 *  sentence: "… erreicht bei **diesen Erwachsenen ein** hohes mittleres
 *  Niveau …". */
export const GROUP_DEMONSTRATIVE: Record<GroupId, string> = {
  adults: "diesen Erwachsenen ein",
  minors: "diesen Minderjährigen ein",
  consumers: "diesen Konsumierenden ein",
  young_adults: "diesen jungen Erwachsenen ein",
  parents: "diesen Eltern ein",
};

/** Population noun used by the Bevölkerungsrelevanz sentence. Only
 *  adults + minors have non-null pop_rel data in carm-data.json. */
export const GROUP_POPULATION_NOUN: Partial<Record<GroupId, string>> = {
  adults: "volljährige Bevölkerung",
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
 *  number at boundary values. */
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

/** Render the single Lesebeispiel sentence for one (indicator, group)
 *  pair. Returns null when the data isn't suitable for prose:
 *    - metric missing
 *    - the indicator's value is null
 *    - significance × awareness === null (the sentence references the
 *      Kenntnis-%)
 *    - population_relevance × {consumers, young_adults, parents} —
 *      these groups have no approved population-noun phrasing.
 */
export function lesebeispielSentence(
  metric: LesebeispielMetric | null | undefined,
  indicator: Indicator,
  group: GroupId,
): string | null {
  if (!metric) return null;
  const v = metric[indicator];
  if (v === null) return null;

  if (indicator === "population_relevance" && !GROUP_POPULATION_NOUN[group]) {
    return null;
  }

  const rounded = Math.round(v);
  const intro = GROUP_INTRO_GENITIVE[group];
  const demonstrative = GROUP_DEMONSTRATIVE[group];
  const populationNoun = GROUP_POPULATION_NOUN[group];

  switch (indicator) {
    case "awareness":
      return (
        `In der Zielgruppe der ${intro} kennen ${rounded} % diesen Mythos. ` +
        `Das ist ein ${anteilLabel(rounded)}.`
      );
    case "significance": {
      if (metric.awareness === null) return null;
      const kenntnis = Math.round(metric.awareness);
      return (
        `Die Bedeutung dieses Mythos für die ${intro}, die diesen Mythos ` +
        `kennen (${kenntnis} %), für ihren Umgang mit Cannabis hat ein ` +
        `${niveauLabel(rounded)} von ${rounded} Punkten.`
      );
    }
    case "correctness":
      return (
        `Die Beurteilung des Mythos in Übereinstimmung mit der ` +
        `wissenschaftlichen Klassifizierung erreicht bei ${demonstrative} ` +
        `${niveauLabel(rounded)} von ${rounded} Punkten.`
      );
    case "prevention_significance":
      return (
        `Aus der individuellen Bedeutung und der Beurteilung der ` +
        `Richtigkeit resultiert ein ${niveauLabel(rounded)} für die ` +
        `Präventionsbedeutung (${rounded} Punkte) für die Zielgruppe der ` +
        `${intro}, die diesen Mythos kennen.`
      );
    case "population_relevance":
      return (
        `Mit Blick auf die gesamte ${populationNoun} (nicht nur diejenigen, ` +
        `die den Mythos schon kennen) ergibt sich ein ${niveauLabel(rounded)} ` +
        `für die Präventionsbedeutung (Bevölkerungsrelevanz: ${rounded} Punkte) ` +
        `für diesen Mythos.`
      );
    default:
      return null;
  }
}

/** Per-source-metric variant — used by the Sources Spannweite hover. */
export function lesebeispielSourceSentence(
  value: number | null,
  metric: SourceMetricId,
  group: GroupId,
): string | null {
  if (value === null) return null;
  const intro = GROUP_INTRO_GENITIVE[group];
  const rounded = Math.round(value);
  switch (metric) {
    case "search":
      return (
        `In der Zielgruppe der ${intro} suchen ${rounded} % bei dieser ` +
        `Quelle Informationen über Cannabis. Das ist ein ${anteilLabel(rounded)}.`
      );
    case "perception":
      return (
        `In der Zielgruppe der ${intro} nehmen ${rounded} % Informationen ` +
        `über Cannabis von dieser Quelle wahr. Das ist ein ${anteilLabel(rounded)}.`
      );
    case "trust":
      return (
        `Das Vertrauen der ${intro} in diese Quelle hat ein ` +
        `${niveauLabel(rounded)} von ${rounded} Punkten.`
      );
    case "prevention":
      return (
        `Das Präventionspotenzial dieser Quelle für die ${intro} hat ein ` +
        `${niveauLabel(rounded)} von ${rounded} Punkten.`
      );
    default:
      return null;
  }
}
