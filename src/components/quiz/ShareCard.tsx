/**
 * ShareCard — unified result hero (Remediation 3).
 *
 * Replaces the old "verdict box + separate green share card" duplication
 * with one card that:
 *   • shows the band-coloured percentage hero
 *   • carries the breakdown line (X genau richtig · …)
 *   • renders the Keystatic verdict title + body inside a translucent
 *     band so editors keep their voice
 *   • shows the honest banded population sentence
 *   • carries a single share button (Web Share API + clipboard fallback)
 *
 * Visually it's still the green forest card but now it earns its place.
 */

import { useCallback, useState } from "react";
import type { QuizResult, ScoreBand } from "./types";
import { scoreBand } from "./quizData";
import { t } from "./i18n";
import { trackResultCardShared } from "./matomo";

interface ShareCardProps {
  result: QuizResult;
  quizUrl: string;
  moduleTitle: string;
  verdictTitle: string;
  verdictBody: string;
  /** "X genau richtig · Y nah dran · …" — only bands with count > 0. */
  breakdownLine: string;
  /** Honest banded population sentence (already interpolated). */
  populationLine: string;
  variant?: "square" | "vertical";
}

/** Band → emoji for the medal. */
const BAND_EMOJI: Record<ScoreBand, string> = {
  profi: "\u{1F3C6}",
  guterweg: "\u{2B50}",
  gehtnoch: "\u{1F4A1}",
  erwischt: "\u{1F331}",
};

export default function ShareCard({
  result,
  quizUrl,
  moduleTitle,
  verdictTitle,
  verdictBody,
  breakdownLine,
  populationLine,
  variant = "square",
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const band: ScoreBand = result.band ?? scoreBand(result.moduleScore);
  const emoji = BAND_EMOJI[band];

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
    <div className={`share-card share-card--${variant} share-card--${band}`}>
      <div className="share-card__visual">
        <div className="share-card__medal">
          <span className="share-card__emoji" aria-hidden="true">
            {emoji}
          </span>
        </div>

        <div
          className="share-card__score"
          aria-label={`${result.moduleScore} Prozent`}
        >
          {result.moduleScore}
          <span className="share-card__score-unit">&nbsp;%</span>
        </div>

        {breakdownLine && (
          <p className="share-card__breakdown">{breakdownLine}</p>
        )}

        <div className="share-card__verdict">
          <h2 className="share-card__verdict-title">{verdictTitle}</h2>
          <p className="share-card__verdict-body">{verdictBody}</p>
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
