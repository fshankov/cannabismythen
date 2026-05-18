import { useEffect, useRef, useState } from "react";
import VerdictPill from "@components/shared/VerdictPill";
import type { CorrectnessClass } from "@lib/dashboard/types";

interface SampleMyth {
  text: string;
  verdict: CorrectnessClass;
}

/** Sample myths shown in the rotating front card. One per verdict tier
 *  so the deck demonstrates the full classification scale at a glance.
 *  Anchored to the same five myths the hero rotates through (m24, m31,
 *  m22, m23, m17). */
const SAMPLES: ReadonlyArray<SampleMyth> = [
  { text: "Cannabis verursacht Psychosen.",       verdict: "richtig" },
  { text: "Cannabis entspannt.",                  verdict: "eher_richtig" },
  { text: "Cannabis ist eine Einstiegsdroge.",    verdict: "eher_falsch" },
  { text: "Cannabis macht nicht abhängig.",       verdict: "falsch" },
  { text: "Cannabis hilft beim Abnehmen.",        verdict: "no_classification" },
];

/** Pill order matches the canonical VerdictScale row inside the quiz. */
const PILL_ORDER: ReadonlyArray<CorrectnessClass> = [
  "falsch",
  "eher_falsch",
  "eher_richtig",
  "richtig",
];

const ROTATE_MS = 4000;

export default function QuizPreviewDeck() {
  const [idx, setIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Rotate the front card on a timer, but only while visible (avoids
  // animating off-screen and pre-renders the first sample so the deck
  // shows correct content before the IntersectionObserver fires).
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const root = wrapperRef.current;
    if (!root) return;

    let interval: number | null = null;
    const start = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => {
        setIdx((i) => (i + 1) % SAMPLES.length);
      }, ROTATE_MS);
    };
    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0.5 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  const sample = SAMPLES[idx];

  return (
    <div className="peek-stack quiz-preview-deck" ref={wrapperRef} aria-hidden="true">
      <div className="peek-stack__face quiz-preview-deck__face">
        <p className="quiz-preview-deck__eyebrow">Beispielfrage</p>
        <p
          className="quiz-preview-deck__myth"
          data-verdict={sample.verdict}
          key={idx}
        >
          „{sample.text}"
        </p>
        <div className="quiz-preview-deck__pills">
          {PILL_ORDER.map((v) => (
            <VerdictPill
              key={v}
              verdict={v}
              size="sm"
              className={v === sample.verdict ? "is-correct" : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
