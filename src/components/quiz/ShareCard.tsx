/**
 * ShareCard — Bold, dark shareable result card.
 *
 * Visual style: deep forest green (#2d6a4f) background, white text,
 * CSS medal/badge shape, achievement style.
 *
 * "Ergebnis teilen" button uses native Web Share API with clipboard fallback.
 */

import { useState, useCallback } from "react";
import type { QuizResult, ResultTierIndex } from "./types";
import { RESULT_TIERS } from "./quizData";
import { t } from "./i18n";
import { trackResultCardShared } from "./matomo";

interface ShareCardProps {
  result: QuizResult;
  quizUrl: string;
}

/** Emoji for each tier */
const TIER_EMOJI: Record<ResultTierIndex, string> = {
  0: "\u{1F331}", // 🌱
  1: "\u{1F4A1}", // 💡
  2: "\u{2B50}",  // ⭐
  3: "\u{1F3C6}", // 🏆
};

export default function ShareCard({ result, quizUrl }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const tier = RESULT_TIERS[result.tierIndex];
  const tierTitle = t(tier.titleKey);
  const emoji = TIER_EMOJI[result.tierIndex];

  const shareText = t("ui.shareText", {
    correct: result.correctCount,
    total: result.totalQuestions,
    pct: result.percentile,
  });
  const fullShareText = `${shareText} ${quizUrl}`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("ui.shareTitle"),
          text: shareText,
          url: quizUrl,
        });
        trackResultCardShared("native");
      } catch {
        // User cancelled — not an error
      }
    } else {
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(fullShareText);
        setCopied(true);
        trackResultCardShared("clipboard");
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Fallback for older browsers
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
  }, [shareText, fullShareText, quizUrl]);

  return (
    <div className="share-card">
      <div className="share-card__visual">
        {/* CSS medal badge */}
        <div className="share-card__medal">
          <span className="share-card__emoji">{emoji}</span>
        </div>

        <div className="share-card__tier-title">{tierTitle}</div>

        <div className="share-card__score">
          {result.correctCount} / {result.totalQuestions}
        </div>

        <p className="share-card__pct">
          {t("ui.correctPctLine", { pct: result.correctPct })}
        </p>

        <p className="share-card__percentile">
          {t("ui.percentileLine", { pct: result.percentile })}
        </p>

        <div className="share-card__branding">
          {t("ui.siteUrl")}
        </div>
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
