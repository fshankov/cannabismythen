import { useEffect, useRef, useState } from "react";

export interface AudienceDeckEntry {
  emoji: string;
  cardLabel: string;
  accentColor: string;
  recommendation: string;
}

interface Props {
  audiences: ReadonlyArray<AudienceDeckEntry>;
}

const ROTATE_MS = 3000;

export default function MeineInteressenPreviewDeck({ audiences }: Props) {
  const [idx, setIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const root = wrapperRef.current;
    if (!root || audiences.length < 2) return;

    let interval: number | null = null;
    const start = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => {
        setIdx((i) => (i + 1) % audiences.length);
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
  }, [audiences.length]);

  if (audiences.length === 0) return null;
  const audience = audiences[idx];

  return (
    <div
      className="peek-stack meine-preview-deck"
      ref={wrapperRef}
      aria-hidden="true"
      style={{ ["--audience-color" as string]: audience.accentColor }}
    >
      <div className="peek-stack__face meine-preview-deck__face" key={idx}>
        <span className="meine-preview-deck__stripe" aria-hidden="true" />
        <span className="meine-preview-deck__emoji">{audience.emoji}</span>
        <span className="meine-preview-deck__label">{audience.cardLabel}</span>
        <span className="meine-preview-deck__rec">
          {audience.recommendation}
        </span>
      </div>
    </div>
  );
}
