/**
 * ShareCard — result-hero card.
 *
 * Stage A (2026-05-16) — Pew minimalism rebuild:
 *   • Verdict title + body (Keystatic) sits in a translucent panel.
 *   • User score line: "Du hast X von Y Aussagen genau richtig
 *     eingeordnet (Z %)."
 *   • Population reference line, parallel format, partial-credit-honest.
 *   • Share button (Web Share API + clipboard fallback).
 *   • Per-band tinted background (richtig/eher-richtig/eher-falsch/falsch).
 *
 * Dropped vs. Session-3 ShareCard: the medal/emoji circle, the big
 * percentage hero, the breakdown line, the absolute-points sub-line.
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
  /** Pre-rendered user-score sentence (German, no English fallback). */
  userScoreLine: string;
  /** Pre-rendered population reference sentence (German). */
  populationLine: string;
  variant?: "square" | "vertical";
}

/** Render the verdict body with the substring "Fakten-Karten" wrapped as a
 *  link to /fakten-karten/ (BugHerd #36 — reviewer wanted that phrase to be
 *  a clickable navigation aid back to the deck). Splits on the literal
 *  string; if not present, returns the text unchanged. The link inherits
 *  the body's color and uses a subtle underline so the styling stays
 *  appropriate for the share-card aesthetic. */
function renderBodyWithFaktenKartenLink(body: string) {
  const TOKEN = "Fakten-Karten";
  const parts = body.split(TOKEN);
  if (parts.length === 1) return body;
  const out: (string | JSX.Element)[] = [];
  parts.forEach((part, i) => {
    if (i > 0) {
      out.push(
        <a
          key={`fk-${i}`}
          href="/fakten-karten/"
          className="share-card__verdict-link"
        >
          {TOKEN}
        </a>,
      );
    }
    if (part) out.push(part);
  });
  return out;
}

export default function ShareCard({
  result,
  quizUrl,
  moduleTitle,
  verdictTitle,
  verdictBody,
  userScoreLine,
  populationLine,
  variant = "square",
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const band: ScoreBand = result.band ?? scoreBand(result.moduleScore);

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
        <div className="share-card__verdict">
          <h2 className="share-card__verdict-title">{verdictTitle}</h2>
          <p className="share-card__verdict-body">
            {renderBodyWithFaktenKartenLink(verdictBody)}
          </p>
        </div>

        <p className="share-card__user-line">{userScoreLine}</p>

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
