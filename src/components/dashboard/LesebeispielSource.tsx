/**
 * LesebeispielSource — Lesebeispiel-style reading example for the
 * Informationsquellen 2 (`SourcesSpannweiteView`) hover tooltip.
 *
 * Mirrors the Mythen `<Lesebeispiel>` pattern: same 7-band
 * Anteil/Niveau classifier, same per-group genitive substitution,
 * same compact heading behaviour. The data domain is different —
 * each "row" is an information source (Instagram, ARD, Schule, …)
 * scored on four metrics: search frequency, perception, trust, and
 * prevention potential. All four are 0–100 scale.
 *
 * **AI draft of the German sentence templates (2026-05-21).** No
 * pre-ship ISD review is required (CLAUDE.md German rule revised
 * 2026-05-21 — team reviews live), but these specific four sentences
 * are NEW prose synthesized from the metric semantics, NOT lifted
 * from a team-approved template. ISD should spot-check on the live
 * site and revise as needed.
 *
 * Sentence templates:
 *   - search       (Suche, %, Anteil)
 *     "In der Zielgruppe der [Group] suchen X % bei dieser Quelle
 *      Informationen über Cannabis. Das ist ein [Anteil]."
 *   - perception   (Wahrnehmung, %, Anteil)
 *     "In der Zielgruppe der [Group] nehmen X % Informationen über
 *      Cannabis von dieser Quelle wahr. Das ist ein [Anteil]."
 *   - trust        (Vertrauen, Punkte, Niveau)
 *     "Das Vertrauen der [Group] in diese Quelle hat ein [Niveau]
 *      von X Punkten."
 *   - prevention   (Präventionspotential, Punkte, Niveau)
 *     "Das Präventionspotential dieser Quelle für die [Group] hat
 *      ein [Niveau] von X Punkten."
 */

import type {
  SourceGroupId,
  SourceMetricType,
} from "../../lib/dashboard/types";
import {
  anteilLabel,
  niveauLabel,
  GROUP_INTRO_GENITIVE,
} from "../../lib/dashboard/lesebeispiel-bands";

interface LesebeispielSourceProps {
  /** 'search' | 'perception' | 'trust' | 'prevention'. */
  metric: SourceMetricType;
  /** Raw 0–100 score; the component returns null when this is null. */
  value: number | null;
  /** The Zielgruppe the hovered cell belongs to. Drives the genitive
   *  group name substitution inside the sentence. */
  group: SourceGroupId;
  /** When `true`, omit the heading (hover-tooltip context). When
   *  omitted/false, render the long heading
   *  "Lesebeispiel für die Gruppe der [Group]" — kept for symmetry
   *  with the Mythen component even though Informationsquellen has
   *  no static-block surface today. */
  compactHeading?: boolean;
}

export default function LesebeispielSource({
  metric,
  value,
  group,
  compactHeading,
}: LesebeispielSourceProps) {
  if (value === null) return null;

  const groupGenitive = GROUP_INTRO_GENITIVE[group];
  const rounded = Math.round(value);

  const headingText = compactHeading
    ? null
    : `Lesebeispiel für die Gruppe der ${groupGenitive}`;

  return (
    <aside
      className="lesebeispiel"
      aria-labelledby={headingText ? "lesebeispiel-source-heading" : undefined}
      aria-label={headingText ? undefined : "Lesebeispiel"}
    >
      {headingText && (
        <h2 id="lesebeispiel-source-heading" className="lesebeispiel__heading">
          {headingText}
        </h2>
      )}
      <p className="lesebeispiel__body">
        {metric === "search" && (
          <>
            In der Zielgruppe der {groupGenitive} suchen{" "}
            <strong>{rounded}&nbsp;%</strong> bei dieser Quelle Informationen
            über Cannabis. Das ist ein <strong>{anteilLabel(rounded)}</strong>.
          </>
        )}
        {metric === "perception" && (
          <>
            In der Zielgruppe der {groupGenitive} nehmen{" "}
            <strong>{rounded}&nbsp;%</strong> Informationen über Cannabis von
            dieser Quelle wahr. Das ist ein{" "}
            <strong>{anteilLabel(rounded)}</strong>.
          </>
        )}
        {metric === "trust" && (
          <>
            Das Vertrauen der {groupGenitive} in diese Quelle hat ein{" "}
            <strong>{niveauLabel(rounded)}</strong> von{" "}
            <strong>{rounded}&nbsp;Punkten</strong>.
          </>
        )}
        {metric === "prevention" && (
          <>
            Das Präventionspotential dieser Quelle für die {groupGenitive} hat
            ein <strong>{niveauLabel(rounded)}</strong> von{" "}
            <strong>{rounded}&nbsp;Punkten</strong>.
          </>
        )}
      </p>
    </aside>
  );
}
