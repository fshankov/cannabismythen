/**
 * Lesebeispiel — auto-rendered "reading example" paragraph for a myth.
 *
 * Template + thresholds locked by the CaRM team (ISD review email,
 * 2026-05). Template at `_local/team/Lesebeispiel-Harald-2026-05-07.md`.
 *
 * The component renders a 5-sentence German paragraph that walks the
 * reader through the five indicators (Kenntnis / Bedeutung / Beurteilung
 * / Präventionsbedeutung / Bevölkerungsrelevanz), classifying each value
 * into a 7-band Anteil/Niveau scale. Band classification lives in
 * `src/lib/dashboard/lesebeispiel-bands.ts`.
 *
 * Default scope is Erwachsene (18–70) — that's the team's primary
 * framing. The `group` prop substitutes the group name in each place
 * the sentence references "Erwachsene", so a Spannweite hover on a
 * Minderjährige cell renders "In der Zielgruppe der Minderjährigen
 * kennen X % …". The `population_relevance` sentence is currently
 * supported for adults + minors only — `GROUP_POPULATION_NOUN`
 * defines the team-approved phrasing for each, and callers must
 * suppress the sentence for groups absent from that map (consumers /
 * young_adults / parents — pop_rel data is null for those anyway).
 */

import type { GroupId, Indicator, Lang } from "../../lib/dashboard/types";
import {
  anteilLabel,
  niveauLabel,
  isMetricComplete,
  GROUP_INTRO_GENITIVE,
  GROUP_POPULATION_NOUN,
  type LesebeispielMetric,
} from "../../lib/dashboard/lesebeispiel-bands";

interface LesebeispielProps {
  metric: LesebeispielMetric;
  audience: GroupId;
  /** Currently only "de" is wired up; English copy waits on ISD. */
  lang?: Lang;
  /** When set, render ONLY the sentence corresponding to this indicator
   *  (used by hover tooltips). When omitted, render all five sentences
   *  as the full paragraph (used by the standalone slug page and by the
   *  static block below the bars inside the Factsheet pop-up modal). */
  onlyIndicator?: Indicator;
  /** Zielgruppe the sentence text should reference. Defaults to
   *  `audience` so the legacy callers (slug page, modal) keep their
   *  Erwachsene phrasing without changes. Hover-tooltip callers pass
   *  the hovered cell's group so the sentence and the displayed value
   *  agree on which Zielgruppe is being talked about. */
  group?: GroupId;
  /** When `true`, omit the heading entirely (hover-tooltip context —
   *  the verdict-tinted card chrome already signals what the reader
   *  is looking at). When omitted/false, render the slug-page-tuned
   *  long heading "Lesebeispiel für die Gruppe der [Group]". */
  compactHeading?: boolean;
}

export default function Lesebeispiel({
  metric,
  audience,
  lang = "de",
  onlyIndicator,
  group,
  compactHeading,
}: LesebeispielProps) {
  if (audience !== "adults") return null;
  if (lang !== "de") return null;

  // Full-paragraph mode requires every indicator to be present (partial
  // paragraphs read as misleading). Per-indicator mode only needs the
  // one indicator (and, for significance, awareness — see below).
  if (!onlyIndicator && !isMetricComplete(metric)) return null;

  // Resolved group drives sentence-internal substitutions. `audience`
  // is still the gate; `group` selects the German genitive form used
  // inside the prose. Default = audience so legacy callers don't move.
  const resolvedGroup: GroupId = group ?? audience;
  const groupGenitive = GROUP_INTRO_GENITIVE[resolvedGroup];
  // (GROUP_DEMONSTRATIVE dropped 2026-05-28 — the correctness sentence
  // switched to the audience-first "Unter den …" form in the Harald sweep.)
  // Population noun for the pop_rel sentence. Falls back to the
  // adults wording for any group without an approved entry; callers
  // (e.g. GridHoverTooltip) should already have suppressed the
  // pop_rel sentence in that case via GROUP_POPULATION_NOUN absence,
  // so this branch shouldn't fire — defensive fallback only.
  const populationNoun =
    GROUP_POPULATION_NOUN[resolvedGroup] ?? "volljährige Bevölkerung";

  // v4: compact mode (hover tooltips) drops the heading entirely —
  // the verdict-tinted card chrome already signals what the reader
  // is looking at. Full-paragraph mode (slug page, modal) keeps the
  // long "Lesebeispiel für die Gruppe der [Group]" heading.
  const headingText = compactHeading
    ? null
    : `Lesebeispiel für die Gruppe der ${groupGenitive}`;

  // Round to int for both display and classification — keeps the
  // numbers shown in the paragraph consistent with the band labels at
  // boundary values (BugHerd #31 — round-to-int site-wide).
  if (onlyIndicator) {
    const value = metric[onlyIndicator];
    if (value === null) return null;
    // The significance sentence references the kenntnis % — bail if
    // awareness is missing for this myth, to avoid a half-rendered
    // sentence with a "kennen …%" gap.
    if (onlyIndicator === "significance" && metric.awareness === null) return null;
    const rounded = Math.round(value as number);
    const kenntnis =
      metric.awareness !== null ? Math.round(metric.awareness as number) : null;

    return (
      <aside
        className="lesebeispiel"
        aria-labelledby={headingText ? "lesebeispiel-heading" : undefined}
        aria-label={headingText ? undefined : "Lesebeispiel"}
      >
        {headingText && (
          <h2 id="lesebeispiel-heading" className="lesebeispiel__heading">
            {headingText}
          </h2>
        )}
        <p className="lesebeispiel__body">
          {onlyIndicator === "awareness" && (
            <>
              Unter den {groupGenitive} kennen{" "}
              <strong>{rounded}&nbsp;%</strong> diesen Mythos. Das ist ein{" "}
              <strong>{anteilLabel(rounded)}</strong>.
            </>
          )}
          {onlyIndicator === "significance" && (
            <>
              Unter den {groupGenitive}, die diesen Mythos kennen (
              <strong>{kenntnis}&nbsp;%</strong>), hat die Bedeutung des Mythos für
              ihren Umgang mit Cannabis ein{" "}
              <strong>{niveauLabel(rounded)}</strong> von{" "}
              <strong>{rounded}&nbsp;Punkten</strong>.
            </>
          )}
          {onlyIndicator === "correctness" && (
            <>
              Unter den {groupGenitive} erreicht die Beurteilung des Mythos in
              Übereinstimmung mit der wissenschaftlichen Klassifizierung ein{" "}
              <strong>{niveauLabel(rounded)}</strong> von{" "}
              <strong>{rounded}&nbsp;Punkten</strong>.
            </>
          )}
          {onlyIndicator === "prevention_significance" && (
            <>
              Aus der individuellen Bedeutung und der Beurteilung der Richtigkeit
              resultiert ein <strong>{niveauLabel(rounded)}</strong> für die
              Präventionsbedeutung (<strong>{rounded}&nbsp;Punkte</strong>) für jene{" "}
              {groupGenitive}, die diesen Mythos kennen.
            </>
          )}
          {onlyIndicator === "population_relevance" && (
            <>
              Mit Blick auf die gesamte {populationNoun} (nicht nur diejenigen,
              die den Mythos schon kennen) ergibt sich ein{" "}
              <strong>{niveauLabel(rounded)}</strong> für die Präventionsbedeutung
              (Bevölkerungsrelevanz: <strong>{rounded}&nbsp;Punkte</strong>) für diesen
              Mythos.
            </>
          )}
        </p>
      </aside>
    );
  }

  // Full-paragraph mode (default — used by the slug page and by the
  // static block inside the Factsheet pop-up modal).
  const kenntnis = Math.round(metric.awareness as number);
  const bedeutung = Math.round(metric.significance as number);
  const beurteilung = Math.round(metric.correctness as number);
  const praevention = Math.round(metric.prevention_significance as number);
  const bevoelkerung = Math.round(metric.population_relevance as number);

  return (
    <aside
      className="lesebeispiel"
      aria-labelledby={headingText ? "lesebeispiel-heading" : undefined}
      aria-label={headingText ? undefined : "Lesebeispiel"}
    >
      {headingText && (
        <h2 id="lesebeispiel-heading" className="lesebeispiel__heading">
          {headingText}
        </h2>
      )}
      <p className="lesebeispiel__body">
        Unter den {groupGenitive} kennen{" "}
        <strong>{kenntnis}&nbsp;%</strong> diesen Mythos. Das ist ein{" "}
        <strong>{anteilLabel(kenntnis)}</strong>. Unter den {groupGenitive}, die
        diesen Mythos kennen (<strong>{kenntnis}&nbsp;%</strong>), hat die Bedeutung
        des Mythos für ihren Umgang mit Cannabis ein{" "}
        <strong>{niveauLabel(bedeutung)}</strong> von{" "}
        <strong>{bedeutung}&nbsp;Punkten</strong>. Unter den {groupGenitive} erreicht
        die Beurteilung des Mythos in Übereinstimmung mit der wissenschaftlichen
        Klassifizierung ein <strong>{niveauLabel(beurteilung)}</strong> von{" "}
        <strong>{beurteilung}&nbsp;Punkten</strong>. Aus der individuellen Bedeutung und
        der Beurteilung der Richtigkeit resultiert ein{" "}
        <strong>{niveauLabel(praevention)}</strong> für die
        Präventionsbedeutung (<strong>{praevention}&nbsp;Punkte</strong>) für jene{" "}
        {groupGenitive}, die diesen Mythos kennen. Mit Blick auf die gesamte{" "}
        {populationNoun} (nicht nur diejenigen, die den Mythos schon kennen) ergibt
        sich ein <strong>{niveauLabel(bevoelkerung)}</strong> für die
        Präventionsbedeutung (Bevölkerungsrelevanz: <strong>{bevoelkerung}&nbsp;Punkte</strong>)
        für diesen Mythos.
      </p>
    </aside>
  );
}

/** Self-test reference values from Harald's M02 example. The new
 *  thresholds [11, 26, 38, 63, 75, 90] still place each value in the
 *  same band as Harald's worked paragraph — verified inline before
 *  shipping the threshold change. */
export const HARALD_M02_REFERENCE = {
  audience: "adults" as const,
  values: {
    awareness: 18,
    significance: 53,
    correctness: 64,
    prevention_significance: 32,
    population_relevance: 7,
  },
  expectedBands: {
    awareness: "niedriger Anteil",
    significance: "mittleres Niveau",
    correctness: "hohes mittleres Niveau",
    prevention_significance: "niedriges mittleres Niveau",
    population_relevance: "sehr niedriges Niveau",
  },
} as const;
