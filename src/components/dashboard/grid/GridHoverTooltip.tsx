/**
 * GridHoverTooltip — shared verdict-tinted hover card used by
 * Spannweite and Balken (the two views that show the bar+glyph value
 * cells).
 *
 * Layout (v4 — meta line dropped; heading inside Lesebeispiel hidden
 * for hover surfaces, so the card reads as continuous prose under the
 * verdict line):
 *   row 1: myth statement (left) + verdict glyph (right)
 *   row 2: "Wissenschaftlich [verdict]" (verdict-colored)
 *   divider (CSS border-top on .carm-spannweite__tooltip-lesebeispiel)
 *   row 3: Lesebeispiel sentence (no heading)  — only when an
 *          indicator is pinned and the resolved group has data
 *          + team-approved wording for that indicator.
 *
 * Position is fixed; the consumer supplies clamped (x, y) coords so
 * the card never extends past the viewport edges.
 */
import { useMemo } from 'react';
import type {
  CorrectnessClass,
  GroupId,
  Indicator,
  Lang,
  Metric,
  Myth,
} from '../../../lib/dashboard/types';
import {
  getCorrectnessColor,
  getCorrectnessBgColor,
} from '../../../lib/dashboard/colors';
import { getMythMetric, getMythText } from '../../../lib/dashboard/data';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import { GROUP_POPULATION_NOUN } from '../../../lib/dashboard/lesebeispiel-bands';
import Lesebeispiel from '../Lesebeispiel';

interface Props {
  myth: Myth;
  metrics: Metric[];
  lang: Lang;
  x: number;
  y: number;
  /** The indicator to pin the Lesebeispiel paragraph to. Pass null
   *  when no indicator is pinned (row-label hover) → the Lesebeispiel
   *  section is omitted. */
  lesebeispielIndicator: Indicator | null;
  /** The Zielgruppe whose data + group-name should drive the
   *  Lesebeispiel sentence. Should match the hovered cell's group so
   *  the numbers and labels agree with what the user sees on screen.
   *  Default 'adults' so legacy callers (none today) keep the team's
   *  Erwachsene framing. Population_relevance is only rendered when
   *  the resolved group has a `GROUP_POPULATION_NOUN` entry — i.e.
   *  adults or minors. Other groups have null pop_rel data. */
  lesebeispielGroup?: GroupId;
}

export default function GridHoverTooltip({
  myth,
  metrics,
  lang,
  x,
  y,
  lesebeispielIndicator,
  lesebeispielGroup = 'adults',
}: Props) {
  const verdict = myth.correctness_class as CorrectnessClass;
  const verdictColor = getCorrectnessColor(verdict);
  const verdictBg = getCorrectnessBgColor(verdict);

  const wissenschaftlich = useMemo(() => {
    if (verdict === 'no_classification') {
      return lang === 'de'
        ? 'Wissenschaftlich: keine Einordnung möglich'
        : 'Scientific verdict: not classified';
    }
    const verdictLabel = t(
      `verdict.${verdict}` as TranslationKey,
      lang,
    ).toLowerCase();
    return `${lang === 'de' ? 'Wissenschaftlich' : 'Scientifically'}: ${verdictLabel}`;
  }, [verdict, lang]);

  // Pull the metric for the resolved Lesebeispiel group (matches the
  // hovered cell), not always Erwachsene. Suppress the Lesebeispiel
  // section for Bevölkerungsrelevanz × groups without an approved
  // population noun — i.e. consumers / young_adults / parents (data
  // is null for those three anyway).
  const lesebeispielMetric = getMythMetric(metrics, myth.id, lesebeispielGroup);
  const lesebeispielHidden =
    lesebeispielIndicator === 'population_relevance' &&
    !GROUP_POPULATION_NOUN[lesebeispielGroup];

  return (
    <div
      className="carm-spannweite__tooltip"
      role="tooltip"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: verdictBg,
        borderLeft: `3px solid ${verdictColor}`,
      }}
    >
      <div className="carm-spannweite__tooltip-row">
        <div className="carm-spannweite__tooltip-myth">
          {getMythText(myth, lang)}
        </div>
        <span
          className="carm-spannweite__tooltip-glyph"
          style={{ color: verdictColor }}
          aria-hidden="true"
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <use href={`#strips-arrow-${verdict}`} width="24" height="24" />
          </svg>
        </span>
      </div>
      <div
        className="carm-spannweite__tooltip-verdict"
        style={{ color: verdictColor }}
      >
        {wissenschaftlich}
      </div>
      {lesebeispielMetric && lesebeispielIndicator && !lesebeispielHidden && (
        <div className="carm-spannweite__tooltip-lesebeispiel">
          <Lesebeispiel
            metric={lesebeispielMetric}
            audience="adults"
            group={lesebeispielGroup}
            onlyIndicator={lesebeispielIndicator}
            compactHeading
          />
        </div>
      )}
    </div>
  );
}
