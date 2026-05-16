import { useEffect, useState, useCallback, useRef } from "react";
import type { CSSProperties, MouseEvent } from "react";

export type HeroVerdict =
  | "richtig"
  | "eher_richtig"
  | "eher_falsch"
  | "falsch"
  | "keine_aussage";

export interface HeroPair {
  belief: string;
  science: string;
  mythSlug: string;
  verdict: HeroVerdict;
}

export interface Props {
  eyebrow: string;
  beliefLabel: string;
  scienceLabel: string;
  backgroundQuestions: ReadonlyArray<string>;
  pairs: ReadonlyArray<HeroPair>;
  rotationSeconds: number;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
}

const VERDICT_LABEL: Record<HeroVerdict, string> = {
  richtig: "Richtig",
  eher_richtig: "Eher richtig",
  eher_falsch: "Eher falsch",
  falsch: "Falsch",
  keine_aussage: "Keine Aussage",
};

const VERDICT_COLOR_VAR: Record<HeroVerdict, string> = {
  richtig: "--classification-richtig",
  eher_richtig: "--classification-eher-richtig",
  eher_falsch: "--classification-eher-falsch",
  falsch: "--classification-falsch",
  keine_aussage: "--classification-keine-aussage",
};

const VERDICT_BG_VAR: Record<HeroVerdict, string> = {
  richtig: "--classification-richtig-bg",
  eher_richtig: "--classification-eher-richtig-bg",
  eher_falsch: "--classification-eher-falsch-bg",
  falsch: "--classification-falsch-bg",
  keine_aussage: "--classification-keine-aussage-bg",
};

export default function HeroFrageBlock({
  eyebrow,
  beliefLabel,
  scienceLabel,
  backgroundQuestions,
  pairs,
  rotationSeconds,
  primaryCtaLabel,
  primaryCtaUrl,
  secondaryCtaLabel,
  secondaryCtaUrl,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const advance = useCallback(() => {
    if (pairs.length === 0) return;
    setIdx((i) => (i + 1) % pairs.length);
  }, [pairs.length]);

  useEffect(() => {
    if (pairs.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ms = Math.max(2000, rotationSeconds * 1000);
    const id = window.setInterval(() => {
      if (!pausedRef.current) advance();
    }, ms);

    return () => window.clearInterval(id);
  }, [advance, rotationSeconds, pairs.length]);

  if (pairs.length === 0) return null;

  const pair = pairs[idx];
  const verdict = pair.verdict;
  const cardStyle = {
    ["--science-color" as string]: `var(${VERDICT_COLOR_VAR[verdict]})`,
    ["--science-color-bg" as string]: `var(${VERDICT_BG_VAR[verdict]})`,
  } as CSSProperties;

  const handleDotClick = (i: number) => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIdx(i);
  };

  return (
    <section
      className="hero-frage"
      aria-label="Cannabis-Mythen — Glaube und Wissenschaft"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-frage__fog hero-frage__fog--a" aria-hidden="true" />
      <div className="hero-frage__fog hero-frage__fog--b" aria-hidden="true" />

      <div className="hero-frage__bg" aria-hidden="true">
        {backgroundQuestions.slice(0, 8).map((q, i) => (
          <span key={i} className={`hero-frage__question hero-frage__question--p${i}`}>
            {q}
          </span>
        ))}
      </div>

      <div className="hero-frage__foreground">
        <p className="hero-frage__eyebrow">{eyebrow}</p>

        <article
          className="hero-frage__card"
          style={cardStyle}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="hero-frage__half hero-frage__half--belief">
            <span className="hero-frage__half-label">{beliefLabel}</span>
            <p className="hero-frage__statement" key={`b-${idx}`}>
              „{pair.belief}"
            </p>
          </div>

          <div className="hero-frage__divider" aria-hidden="true">
            <span className="hero-frage__divider-chevron">→</span>
          </div>

          <div className="hero-frage__half hero-frage__half--science">
            <span className="hero-frage__half-label">{scienceLabel}</span>
            <p className="hero-frage__statement" key={`s-${idx}`}>
              {pair.science}
            </p>
            <span className="hero-frage__verdict-chip">
              {VERDICT_LABEL[verdict]}
            </span>
          </div>
        </article>

        {pairs.length > 1 && (
          <ol className="hero-frage__dots" role="tablist" aria-label="Vergleichs-Paar wählen">
            {pairs.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="hero-frage__dot"
                  aria-current={i === idx ? "true" : "false"}
                  aria-label={`Paar ${i + 1} von ${pairs.length}`}
                  onClick={handleDotClick(i)}
                />
              </li>
            ))}
          </ol>
        )}

        <div className="hero-frage__ctas">
          <a className="hero-frage__cta-primary" href={primaryCtaUrl}>
            {primaryCtaLabel}
            <span aria-hidden="true">→</span>
          </a>
          <a className="hero-frage__cta-secondary" href={secondaryCtaUrl}>
            {secondaryCtaLabel}
          </a>
        </div>

        <span className="hero-frage__scroll-cue" aria-hidden="true" />
      </div>
    </section>
  );
}
