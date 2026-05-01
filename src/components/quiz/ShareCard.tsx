/**
 * ShareCard — Stage 5 refresh.
 *
 * Visual style: deep forest green (--color-richtig) background, white text,
 * lightbulb mark. Replaces the old "X / Y" + "Bevölkerung in Deutschland"
 * framing with the Schritte percentage hero + the honest banded population
 * sentence the result page already shows. The share text passed to
 * navigator.share / clipboard stays short — comparison number lives on
 * the page, not in the blurb.
 */

import { useState, useCallback } from "react";
import type { QuizResult, ScoreBand } from "./types";
import { scoreBand } from "./quizData";
import { t } from "./i18n";
import { trackResultCardShared } from "./matomo";

interface ShareCardProps {
  result: QuizResult;
  quizUrl: string;
  moduleTitle: string;
  /** Verdict band title from Keystatic (or fallback). Subhead under the
   *  lightbulb. */
  verdictTitle: string;
  /** Honest population sentence (e.g. "Du liegst leicht über dem Schnitt
   *  der Erwachsenen 18–70 in der CaRM-Studie."). Drives the share blurb
   *  on the card itself; share-text for navigator.share stays short. */
  populationLine: string;
  /** Stage 8 will use `variant: "vertical"` for 1080×1350 OG. Stage 5
   *  ships only the in-app square preview. */
  variant?: "square" | "vertical";
}

/** Per-band emoji on the medal — mirrors the scientific verdict emoji
 *  language used elsewhere on the site (lightbulb-anchored). */
const BAND_EMOJI: Record<ScoreBand, string> = {
  profi: "\u{1F3C6}", // 🏆
  guterweg: "\u{2B50}", // ⭐
  gehtnoch: "\u{1F4A1}", // 💡
  erwischt: "\u{1F331}", // 🌱
};

export default function ShareCard({
  result,
  quizUrl,
  moduleTitle,
  verdictTitle,
  populationLine,
  variant = "square",
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const band: ScoreBand = result.band ?? scoreBand(result.moduleScore);
  const emoji = BAND_EMOJI[band];

  // Stage 5: share blurb is intentionally short — comparison lives on
  // the page, not in the message. Keeps WhatsApp/Twitter previews tidy.
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
    <div className={`share-card share-card--${variant}`}>
      <div className="share-card__visual">
        <div className="share-card__medal">
          <span className="share-card__emoji" aria-hidden="true">
            {emoji}
          </span>
        </div>

        <div className="share-card__tier-title">{verdictTitle}</div>

        <div className="share-card__score">
          {result.moduleScore}
          <span className="share-card__score-unit">&nbsp;%</span>
        </div>

        <p className="share-card__pop-line">{populationLine}</p>

        <div className="share-card__branding">{t("ui.siteUrl")}</div>
      </div>

      <button
        className="share-card__btn"
        onClick={handleShare}
        aria-label={t("ui.shareButton")}
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
        {copied ? t("ui.copiedToClipboard") : t("ui.shareButton")}
      </button>
    </div>
  );
}
