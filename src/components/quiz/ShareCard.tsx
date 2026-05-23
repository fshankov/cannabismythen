/**
 * ShareCard — consolidated result hero (Stage E commit 3, 2026-05-23).
 *
 * Single block at the top of the result page. Carries:
 *   • Tonal headline by band (code-side `result.achievementHeadline.*`).
 *     Du-form, AI draft, ISD-review-marked. Keystatic .mdoc holds an
 *     editorial-suggestion surface for the same copy; see the
 *     `internalNotes` marker on each module .mdoc.
 *   • User score line: "Du: K von N genau richtig".
 *   • Population reference line: "Erwachsene (18–70) Ø: μ von N"
 *     (Poisson-binomial expectation, single decimal).
 *   • Sign-aware delta sentence: "Du liegst Δ Aussagen über/unter
 *     dem Schnitt." / "Du liegst genau auf dem Schnitt."
 *   • Small share icon, absolute-positioned top-right of the card.
 *     Click → Web Share API on supported browsers, clipboard fallback
 *     otherwise.
 *   • Site URL branding (`cannabismythen.de`) — small uppercase footer.
 *
 * Replaces the Stage A ShareCard + Stage D standalone achievement card
 * combo. The Stage A `verdictTitle` / `verdictBody` from Keystatic is
 * no longer rendered on the page (it stays as an editorial-suggestion
 * surface in `src/content/quiz/*.mdoc`, gated by the `internalNotes`
 * marker added in Stage E commit 2).
 *
 * No band-tinted background — the page stays calm-cream / white-card.
 * Band feeling is carried by the headline tone + the wrong-myths grid
 * dots (Stage E commit 4).
 */

import { useCallback, useState } from "react";
import type { QuizResult, ScoreBand } from "./types";
import {
  exactCountDelta,
  populationExpectedExactCount,
  scoreBand,
} from "./quizData";
import { t } from "./i18n";
import { trackResultCardShared } from "./matomo";
import type { QuizMyth } from "./types";

interface ShareCardProps {
  result: QuizResult;
  quizUrl: string;
  moduleTitle: string;
  /** Myths in the user's visible deck order — needed to compute the
   *  population's expected exact-count and the user's delta sign-aware. */
  deckMyths: QuizMyth[];
}

/** Format a number the German way for body copy: integers stay bare
 *  (no trailing ",0"), non-integers use a comma decimal separator and
 *  one fractional digit. Mirrors the helper that lived in
 *  ResultScreen.tsx through Stage D. */
function formatGermanDecimal(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (rounded === Math.trunc(rounded)) {
    return String(Math.trunc(rounded));
  }
  return rounded.toFixed(1).replace(".", ",");
}

/** Singular only when count === 1 (e.g. "1 Aussage über dem Schnitt").
 *  All other values — including 0 and decimals like 1,5 — take the plural. */
function pluralizeAussage(n: number): string {
  return n === 1 ? "Aussage" : "Aussagen";
}

export default function ShareCard({
  result,
  quizUrl,
  moduleTitle,
  deckMyths,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const band: ScoreBand = result.band ?? scoreBand(result.moduleScore);

  // Population reference + delta — single decimal, Poisson-binomial mean.
  const populationExpectedCount = populationExpectedExactCount(deckMyths);
  const delta = exactCountDelta(result.breakdown.exact, deckMyths);
  const deltaSentence =
    delta === 0
      ? t("result.deltaLine.onPar")
      : delta > 0
        ? t("result.deltaLine.above", {
            count: formatGermanDecimal(delta),
            aussage: pluralizeAussage(delta),
          })
        : t("result.deltaLine.below", {
            count: formatGermanDecimal(Math.abs(delta)),
            aussage: pluralizeAussage(Math.abs(delta)),
          });

  // Share text composition — code-side (Keystatic shareCopy.{band} is
  // a per-module editorial surface but no consumer reads it yet).
  const shareText = `Ich habe ${result.moduleScore} % beim Quiz „${moduleTitle}" auf cannabismythen.de erreicht.`;
  const fullShareText = `${shareText} ${quizUrl}`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mein Ergebnis: ${moduleTitle}`,
          text: shareText,
          url: quizUrl,
        });
        trackResultCardShared("native");
      } catch {
        // user cancelled — not an error
      }
    } else {
      try {
        await navigator.clipboard.writeText(fullShareText);
        setCopied(true);
        trackResultCardShared("clipboard");
        setTimeout(() => setCopied(false), 2500);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = fullShareText;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        trackResultCardShared("clipboard");
        setTimeout(() => setCopied(false), 2500);
      }
    }
  }, [shareText, fullShareText, quizUrl, moduleTitle]);

  return (
    <div className={`share-card share-card--${band}`}>
      <div className="share-card__visual">
        {/* Stage E commit 3 (2026-05-23) — small share icon top-right
            replaces the previous big "Ergebnis teilen" button under
            the card. Touch hit area expanded via padding so the
            18 × 18 SVG sits inside a comfortable 44 × 44 target. */}
        <button
          type="button"
          className="share-card__share-icon"
          onClick={handleShare}
          aria-label={t("ui.shareButton")}
          title={copied ? t("ui.copiedToClipboard") : t("ui.shareButton")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {copied && (
            <span className="share-card__share-toast" role="status">
              {t("ui.copiedToClipboard")}
            </span>
          )}
        </button>

        <h2 className="share-card__headline">
          {t(`result.achievementHeadline.${band}`)}
        </h2>

        <p className="share-card__score">
          {t("result.scoreLine.user", {
            count: result.breakdown.exact,
            total: result.totalQuestions,
          })}
        </p>

        <p className="share-card__population">
          {t("result.scoreLine.population", {
            count: formatGermanDecimal(populationExpectedCount),
            total: result.totalQuestions,
          })}
        </p>

        <p className="share-card__delta">{deltaSentence}</p>

        <div className="share-card__branding">{t("ui.siteUrl")}</div>
      </div>
    </div>
  );
}
