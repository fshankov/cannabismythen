import { useEffect, useState, useCallback, useRef } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import VerdictArrow from "../shared/VerdictArrow";
import VerdictPill from "../shared/VerdictPill";
import type { CorrectnessClass } from "../../lib/dashboard/types";

export interface HeroPair {
  belief: string;
  science: string;
  mythSlug: string;
  /** Verdict key — matches CorrectnessClass site-wide. */
  verdict: CorrectnessClass;
}

export interface Props {
  eyebrow: string;
  beliefLabel: string;
  scienceLabel: string;
  backgroundQuestions: ReadonlyArray<string>;
  pairs: ReadonlyArray<HeroPair>;
  rotationSeconds: number;
}

/** Time the auto-rotate pauses after a manual click before resuming. */
const RESUME_AFTER_INTERACTION_MS = 10_000;

/** Fold a positive offset into a symmetric range around 0.
 *  e.g. for length 5: 0→0, 1→1, 2→2, 3→-2, 4→-1. */
function symmetricOffset(
  idx: number,
  activeIdx: number,
  length: number,
): number {
  const raw = (idx - activeIdx + length) % length;
  return raw > length / 2 ? raw - length : raw;
}

/** CSS variables that the fan stylesheet reads to position each card. */
function fanStyle(offset: number, totalPairs: number): CSSProperties {
  const abs = Math.abs(offset);
  return {
    ["--card-offset" as string]: String(offset),
    ["--card-abs" as string]: String(abs),
    ["--card-sign" as string]: String(offset === 0 ? 0 : offset / abs),
    ["--card-z" as string]: String(totalPairs - abs),
  } as CSSProperties;
}

export default function HeroFrageBlock({
  eyebrow,
  beliefLabel,
  scienceLabel,
  backgroundQuestions,
  pairs,
  rotationSeconds,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const lastInteractionRef = useRef<number>(0);

  const advance = useCallback(() => {
    setActiveIdx((i) => (i + 1) % pairs.length);
  }, [pairs.length]);

  // Auto-rotation. No hover-pause (that was the v1 bug). We only pause
  // briefly after an explicit click/keypress so manual nav isn't fought
  // by the timer.
  useEffect(() => {
    if (pairs.length < 2) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const periodMs = Math.max(2500, rotationSeconds * 1000);
    const id = window.setInterval(() => {
      const sinceInteraction = performance.now() - lastInteractionRef.current;
      if (sinceInteraction >= RESUME_AFTER_INTERACTION_MS) {
        advance();
      }
    }, periodMs);
    return () => window.clearInterval(id);
  }, [advance, rotationSeconds, pairs.length]);

  const setActive = useCallback(
    (next: number) => {
      lastInteractionRef.current = performance.now();
      setActiveIdx(((next % pairs.length) + pairs.length) % pairs.length);
    },
    [pairs.length],
  );

  // Scroll the next section into view when the user taps the down-chevron
  // that replaces the old "Quiz starten" / "Alle 42 Mythen" CTA pair.
  // The hero's next sibling is the NumbersStripBlock on the home page;
  // using nextElementSibling keeps this independent of section IDs.
  const handleScrollCue = useCallback(() => {
    const hero = document.querySelector(".hero-frage");
    const next = hero?.nextElementSibling as HTMLElement | null;
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleCardKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIdx + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIdx - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(pairs.length - 1);
    }
  };

  // Touch swipe support for mobile. We track horizontal delta on touchmove
  // and commit a swipe at touchend.
  const touchStartXRef = useRef<number | null>(null);
  const SWIPE_THRESHOLD_PX = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const dx = endX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    setActive(activeIdx + (dx < 0 ? 1 : -1));
  };

  if (pairs.length === 0) return null;

  const activePair = pairs[activeIdx];

  return (
    <section
      className="hero-frage"
      aria-label="Cannabis-Mythen — Glaube und Befund"
    >
      <div className="hero-frage__fog" aria-hidden="true" />

      <div className="hero-frage__bg" aria-hidden="true">
        {/* Two scrolling columns of mythen-questions flanking the fan.
            First half of the YAML array → left column (scrolls DOWN,
            left-aligned). Second half → right column (scrolls UP,
            right-aligned). Each column duplicates its slice in the
            DOM so the CSS keyframe (translateY 0 ↔ -50%) loops
            seamlessly — at -50% the second copy is exactly where the
            first started. The animation pauses entirely under
            prefers-reduced-motion (handled in CSS). */}
        {(() => {
          const half = Math.ceil(backgroundQuestions.length / 2);
          const left = backgroundQuestions.slice(0, half);
          const right = backgroundQuestions.slice(half);
          // [...left, ...left] — render each slice twice for the
          // seamless scroll. React keys stay unique by prefixing
          // 'a' / 'b' so the duplication doesn't trip the reconciler.
          const renderColumn = (
            slice: ReadonlyArray<string>,
            side: "left" | "right",
          ) => (
            <div className={`hero-frage__column hero-frage__column--${side}`}>
              {[...slice, ...slice].map((q, i) => (
                <span
                  key={`${side}-${i < slice.length ? "a" : "b"}-${i % slice.length}`}
                  className="hero-frage__question"
                >
                  {q}
                </span>
              ))}
            </div>
          );
          return (
            <>
              {renderColumn(left, "left")}
              {renderColumn(right, "right")}
            </>
          );
        })()}
      </div>

      <div className="hero-frage__foreground">
        <p className="hero-frage__eyebrow">{eyebrow}</p>

        {/* Mobile-only verdict-icon indicator. Each pip carries its
            pair's verdict glyph so the indicator means something rather
            than just showing position. Buttons jump to that card on
            tap; auto-rotate resumes after the standard idle window. */}
        <div
          className="hero-frage__indicator"
          role="tablist"
          aria-label="Mythos auswählen"
        >
          {pairs.map((p, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              className={`hero-frage__pip hero-frage__pip--${p.verdict}`}
              data-active={i === activeIdx ? "true" : "false"}
              aria-selected={i === activeIdx}
              aria-label={`Mythos ${i + 1} von ${pairs.length}`}
              tabIndex={i === activeIdx ? 0 : -1}
              onClick={() => setActive(i)}
            >
              <VerdictArrow verdict={p.verdict} size={20} strokeWidth={2.25} />
            </button>
          ))}
        </div>

        <div
          className="hero-frage__stage"
          aria-live="polite"
          aria-atomic="true"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {pairs.map((p, i) => {
            const offset = symmetricOffset(i, activeIdx, pairs.length);
            const isFront = offset === 0;
            return (
              <button
                key={i}
                type="button"
                className={`hero-frage__card hero-frage__card--${p.verdict}`}
                style={fanStyle(offset, pairs.length)}
                data-front={isFront ? "true" : "false"}
                aria-current={isFront ? "true" : undefined}
                aria-hidden={Math.abs(offset) > 1 ? "true" : undefined}
                tabIndex={isFront ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={handleCardKey}
                aria-label={`Mythos ${i + 1} von ${pairs.length}: ${p.belief}. Befund: ${p.science}.`}
              >
                <span className="hero-frage__verdict-icon" aria-hidden="true">
                  <VerdictArrow
                    verdict={p.verdict}
                    size={28}
                    strokeWidth={2.25}
                  />
                </span>

                <span className="hero-frage__half-label hero-frage__half-label--belief">
                  {beliefLabel}
                </span>
                <p className="hero-frage__belief">„{p.belief}"</p>

                <span
                  className="hero-frage__divider"
                  data-verdict={p.verdict}
                  aria-hidden="true"
                />

                <span className="hero-frage__half-label hero-frage__half-label--science">
                  {scienceLabel}
                </span>
                <p className="hero-frage__science">{p.science}</p>

                <span className="hero-frage__pill-anchor">
                  <VerdictPill verdict={p.verdict} size="sm" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="hero-frage__scroll-cue-wrap">
          <button
            type="button"
            className="hero-frage__scroll-cue"
            onClick={handleScrollCue}
            aria-label="Weiter zur Übersicht"
          >
            <ChevronDown size={32} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
