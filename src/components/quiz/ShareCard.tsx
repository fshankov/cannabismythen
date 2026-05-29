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

import { useCallback, useRef, useState } from "react";
import type { QuizResult, ScoreBand } from "./types";
import {
  populationModuleScore,
  scoreBand,
  userExpectedPunkte,
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
 *  one fractional digit. */
function formatGermanDecimal(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (rounded === Math.trunc(rounded)) {
    return String(Math.trunc(rounded));
  }
  return rounded.toFixed(1).replace(".", ",");
}

export default function ShareCard({
  result,
  quizUrl,
  moduleTitle,
  deckMyths,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);
  const band: ScoreBand = result.band ?? scoreBand(result.moduleScore);

  // 2026-05-29 (QuizCard redesign) — result page shows the user's points
  // total + a percentage-point delta vs the Erwachsene (18–70) average.
  // Both sides are mean per-question Richtigkeit on the same 0–100 scale
  // (moduleScore vs populationModuleScore), so the gap is honest.
  // userPunkte stays on the 0–N points scale for the headline number.
  const userPunkte = userExpectedPunkte(deckMyths, result.answers);
  const populationScore = populationModuleScore(deckMyths);
  const ppDelta = result.moduleScore - populationScore;
  const deltaKey =
    ppDelta > 0 ? "above" : ppDelta < 0 ? "below" : "onpar";

  // Share text — band title + points (Newton-Youth voice). The shared URL is
  // the quiz module page, which unfurls to that module's OG preview image.
  const shareTitle = `Mein Ergebnis: ${moduleTitle}`;
  const shareText = `Ich bin „${t(`result.bandTitle.${band}`)}" im Quiz „${moduleTitle}" auf cannabismythen.de — ${formatGermanDecimal(userPunkte)} von ${result.totalQuestions} Punkten.`;
  const fullShareText = `${shareText} ${quizUrl}`;

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = fullShareText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [fullShareText]);

  // 2026-05-29 (Stage 4) — export the result card as a PNG (html-to-image),
  // then: mobile → native share sheet WITH the image file + text + the quiz
  // link; desktop → download the PNG and copy text+link. The shared link is
  // the quiz module page (unfurls to its OG preview). The share icon itself
  // is excluded from the captured image.
  const handleShare = useCallback(async () => {
    let file: File | null = null;
    try {
      const node = visualRef.current;
      if (node) {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(node, {
          pixelRatio: 2,
          cacheBust: true,
          filter: (el) =>
            !(
              el instanceof HTMLElement &&
              el.classList?.contains("share-card__share-icon")
            ),
        });
        const blob = await (await fetch(dataUrl)).blob();
        file = new File([blob], "cannabismythen-quiz.png", {
          type: "image/png",
        });
      }
    } catch {
      // image export unavailable — fall through to text/link share
    }

    // Mobile: native share sheet with the image file + text + link.
    if (
      file &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          text: shareText,
          url: quizUrl,
          title: shareTitle,
        });
        trackResultCardShared("native-image");
      } catch {
        // cancelled — not an error
      }
      return;
    }

    // Desktop with an image: download the PNG + copy the text + link.
    if (file) {
      const objUrl = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      await copyToClipboard();
      trackResultCardShared("download");
      return;
    }

    // No image: native text share (mobile) or clipboard (desktop).
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: quizUrl });
        trackResultCardShared("native");
        return;
      } catch {
        // cancelled — fall through to clipboard
      }
    }
    await copyToClipboard();
    trackResultCardShared("clipboard");
  }, [shareText, shareTitle, quizUrl, copyToClipboard]);

  return (
    <div className={`share-card share-card--${band}`}>
      <div className="share-card__visual" ref={visualRef}>
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

        <p className="share-card__band-title">
          {t(`result.bandTitle.${band}`)}
        </p>

        <h2 className="share-card__headline">
          {t(`result.achievementHeadline.${band}`)}
        </h2>

        <p className="share-card__score">
          {t("result.scoreLine.user", {
            points: formatGermanDecimal(userPunkte),
            total: result.totalQuestions,
          })}
        </p>

        <p className="share-card__population">
          {deltaKey === "onpar"
            ? t("result.scoreLine.delta.onpar")
            : t(`result.scoreLine.delta.${deltaKey}`, {
                pp: Math.abs(ppDelta),
              })}
        </p>

        <div className="share-card__branding">{t("ui.siteUrl")}</div>
      </div>
    </div>
  );
}
