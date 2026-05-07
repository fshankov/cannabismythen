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
  breakdownLine,
  populationLine,
  variant = "square",
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const band: ScoreBand = result.band ?? scoreBand(result.moduleScore);
  const emoji = BAND_EMOJI[band];

  // BugHerd #37 + #38 — show absolute score below the percentage hero.
  // Reviewer wanted "X von Y möglichen Punkten" (X of Y possible points).
  // Recompute raw points from the breakdown counts so we don't rely on
  // a new field in QuizResult: each "exact" (0 Schritte) = 1 pt, "near"
  // (1) = 0.66 pt, "off" (2) = 0.33 pt, "far" (3) = 0 pt — matches
  // pointsForSchritte() in quizData.ts. Total questions answered = sum
  // of the four counts; max points = that × 1.
  const breakdown = result.breakdown ?? {
    exact: 0,
    near: 0,
    off: 0,
    far: 0,
  };
  const totalAnswered =
    breakdown.exact + breakdown.near + breakdown.off + breakdown.far;
  const rawPoints =
    breakdown.exact * 1 + breakdown.near * 0.66 + breakdown.off * 0.33;
  // German decimal separator (comma); 1 dp keeps the reviewer's example
  // "2,6 von 6 möglichen Punkten" intact while matching the rest of the
  // site's formatting.
  const formattedPoints = rawPoints.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const absoluteScoreLine =
    totalAnswered > 0
      ? `${formattedPoints} von ${totalAnswered} möglichen Punkten`
      : "";

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

        {/* BugHerd #37 + #38: absolute score directly below the % hero. */}
        {absoluteScoreLine && (
          <p className="share-card__absolute-score">{absoluteScoreLine}</p>
        )}

        {breakdownLine && (
          <p className="share-card__breakdown">{breakdownLine}</p>
        )}

        <div className="share-card__verdict">
          <h2 className="share-card__verdict-title">{verdictTitle}</h2>
          <p className="share-card__verdict-body">
            {renderBodyWithFaktenKartenLink(verdictBody)}
          </p>
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
