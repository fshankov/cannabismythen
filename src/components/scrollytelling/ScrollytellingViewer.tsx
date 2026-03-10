/**
 * ScrollytellingViewer v2.0 — Interactive two-column scrollytelling component.
 *
 * Layout:
 * - Desktop (≥1024px): Left text column (40%) scrolls, right viz column (60%) is sticky.
 * - Mobile (<1024px): Viz sticky on top (40vh), text cards scroll below.
 *
 * Uses native IntersectionObserver for step detection (no external scrollama dependency).
 * Visualization placeholders are rendered per step; each will be replaced
 * with React+D3 islands in a future iteration.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ScrollyStep {
  stepNumber: number;
  heading: string;
  bodyText: string;
  hint?: string;
  vizType: "bigNumber" | "contextCloud" | "groupCloud" | "colorReveal" | "trustGap";
  ctaLabel?: string;
  ctaUrl?: string;
}

interface ScrollytellingViewerProps {
  steps: ScrollyStep[];
  title: string;
}

// ── Visualization Placeholders ─────────────────────────────────────────────

function VizBigNumber({ active }: { active: boolean }) {
  const [count, setCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [secondRevealed, setSecondRevealed] = useState(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setCount(0);
      setRevealed(false);
      setSecondRevealed(false);
      return;
    }
    const target = 25;
    const duration = 1600;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    // Auto-reveal second card after 3s
    const timer = setTimeout(() => setSecondRevealed(true), 3000);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      clearTimeout(timer);
    };
  }, [active]);

  return (
    <div className="viz-big-number">
      <div className="viz-big-number__card">
        <span className="viz-big-number__value">{count}</span>
        <span className="viz-big-number__label">von 100</span>
        <p className="viz-big-number__context">
          schätzen die häufigste Annahme über Antriebsverlust richtig ein.
        </p>
        <button
          className="viz-big-number__btn"
          onClick={() => setRevealed(!revealed)}
          aria-expanded={revealed}
        >
          {revealed ? "Annahme verbergen" : "Was ist die Annahme?"}
        </button>
        {revealed && (
          <div className="viz-reveal-card">
            <span className="viz-reveal-card__badge">⬡ Stimmt nicht</span>
            <p>
              „Cannabis macht generell antriebslos."
            </p>
            <p className="viz-reveal-card__detail">
              Ein allgemeiner Motivationsverlust durch Cannabis ist
              wissenschaftlich nicht belegt. Nur 25 von 100 Erwachsenen wissen
              das.
            </p>
          </div>
        )}
        {(secondRevealed || revealed) && (
          <div
            className="viz-reveal-card viz-reveal-card--second"
            style={{ opacity: secondRevealed || revealed ? 1 : 0 }}
          >
            <p>
              Und noch eine: Nur 25 von 100 glauben, dass nicht die Mehrheit der
              Bevölkerung Cannabis konsumiert.
            </p>
            <p className="viz-reveal-card__detail">
              Dabei sind es tatsächlich unter 10%.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VizContextCloud({ active }: { active: boolean }) {
  const myths = [
    "Antriebslos", "Sucht", "Schmerzen", "Psychose", "Gateway",
    "Alkohol", "Jugend", "Legalisierung", "Risiko", "Kreativität",
    "Abhängig", "Schlaf", "Gedächtnis", "Depressionen", "Schwangerschaft",
    "Verkehr", "Beziehungen", "Lunge", "Motivation", "Einstiegsdroge",
    "Heilpflanze", "IQ", "Konsum", "Angst", "Medizin",
    "Entspannung", "Gesellschaft", "Kriminalität", "Führerschein", "THC",
    "CBD", "Prävention", "Aufklärung", "Jugendschutz", "Anbau",
    "Regulierung", "Stigma", "Toleranz", "Dosis", "Langzeitfolgen",
    "Passivrauchen", "Fötus",
  ];
  return (
    <div className="viz-context-cloud">
      <div className="viz-stat-row">
        <div className="viz-stat-chip">
          <span className="viz-stat-chip__number">2.795</span>
          <span className="viz-stat-chip__label">Personen</span>
        </div>
        <div className="viz-stat-chip">
          <span className="viz-stat-chip__number">42</span>
          <span className="viz-stat-chip__label">Mythen</span>
        </div>
        <div className="viz-stat-chip">
          <span className="viz-stat-chip__number">5</span>
          <span className="viz-stat-chip__label">Gruppen</span>
        </div>
        <div className="viz-stat-chip">
          <span className="viz-stat-chip__number">4</span>
          <span className="viz-stat-chip__label">Skala</span>
        </div>
      </div>
      <div className="viz-cloud-words" role="img" aria-label="Wordcloud aller 42 Cannabis-Annahmen">
        {myths.map((word, i) => (
          <span
            key={word}
            className="viz-cloud-word"
            style={{
              fontSize: `${0.7 + Math.random() * 0.8}rem`,
              opacity: active ? 1 : 0,
              transitionDelay: `${i * 30}ms`,
              transform: `rotate(${Math.round((Math.random() - 0.5) * 10)}deg)`,
            }}
            tabIndex={0}
            title={word}
          >
            {word}
          </span>
        ))}
      </div>
      <ul className="sr-only">
        {myths.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

function VizGroupCloud({ active }: { active: boolean }) {
  const groups = [
    { id: "adults", label: "Erwachsene", color: "#3B82F6", icon: "👤" },
    { id: "minors", label: "Minderjährige", color: "#F97316", icon: "🔸" },
    { id: "consumers", label: "Konsumierende", color: "#14B8A6", icon: "◆" },
    { id: "youngAdults", label: "Junge Erw.", color: "#EAB308", icon: "★" },
    { id: "parents", label: "Eltern", color: "#8B5CF6", icon: "⬟" },
  ];
  const [selectedGroup, setSelectedGroup] = useState("adults");
  const selected = groups.find((g) => g.id === selectedGroup)!;

  const sampleWords = [
    "Antriebslos", "Sucht", "Gateway", "Psychose", "Legalisierung",
    "Beziehungen", "Verkehr", "Depressionen", "Alkohol", "Medizin",
    "Schmerzen", "Jugendschutz", "Kriminalität", "Schwangerschaft",
    "Kreativität", "Schlaf", "Anbau",
  ];

  return (
    <div className="viz-group-cloud">
      <div className="viz-group-tabs" role="tablist" aria-label="Zielgruppen">
        {groups.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={selectedGroup === g.id}
            className={`viz-group-tab ${selectedGroup === g.id ? "viz-group-tab--active" : ""}`}
            style={{
              borderColor: g.color,
              background: selectedGroup === g.id ? g.color : "transparent",
              color: selectedGroup === g.id ? "#fff" : g.color,
            }}
            onClick={() => setSelectedGroup(g.id)}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>
      <div
        className="viz-cloud-words viz-cloud-words--group"
        role="img"
        aria-label={`Wordcloud für ${selected.label}`}
      >
        {sampleWords.map((word, i) => (
          <span
            key={`${selectedGroup}-${word}`}
            className="viz-cloud-word viz-cloud-word--colored"
            style={{
              fontSize: `${0.7 + Math.random() * 0.9}rem`,
              color: selected.color,
              opacity: 0.4 + Math.random() * 0.6,
              transitionDelay: `${i * 25}ms`,
            }}
            tabIndex={0}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

function VizColorReveal({ active }: { active: boolean }) {
  const categories = [
    { label: "Stimmt", count: 16, color: "#047857", symbol: "●" },
    { label: "Eher richtig", count: 6, color: "#a16207", symbol: "▲" },
    { label: "Eher falsch", count: 11, color: "#c2410c", symbol: "▲" },
    { label: "Stimmt nicht", count: 7, color: "#be123c", symbol: "⬡" },
    { label: "Keine Aussage", count: 2, color: "#6B7280", symbol: "—" },
  ];

  const words = [
    { text: "Verkehr", cat: 0 }, { text: "Schwangerschaft", cat: 0 },
    { text: "Alkohol", cat: 0 }, { text: "Abhängig", cat: 0 },
    { text: "Lunge", cat: 0 }, { text: "Jugendschutz", cat: 0 },
    { text: "Schmerzen", cat: 1 }, { text: "Medizin", cat: 1 },
    { text: "Angst", cat: 2 }, { text: "Gateway", cat: 2 },
    { text: "Kreativität", cat: 2 }, { text: "Schlaf", cat: 2 },
    { text: "Antriebslos", cat: 3 }, { text: "Depressionen", cat: 3 },
    { text: "Konsum", cat: 3 }, { text: "Gesellschaft", cat: 4 },
  ];

  return (
    <div className="viz-color-reveal">
      <div
        className="viz-cloud-words viz-cloud-words--reveal"
        role="img"
        aria-label="Wordcloud mit Einfärbung nach Klassifikation"
      >
        {words.map((w, i) => (
          <span
            key={w.text}
            className="viz-cloud-word"
            style={{
              fontSize: `${0.75 + Math.random() * 0.7}rem`,
              color: active ? categories[w.cat].color : "#94A3B8",
              transition: `color 0.6s ease ${i * 80 + 500}ms, opacity 0.4s ease`,
              fontWeight: 600,
            }}
            tabIndex={0}
          >
            {w.text}
          </span>
        ))}
      </div>
      <div className="viz-legend" aria-label="Legende">
        {categories.map((c) => (
          <span key={c.label} className="viz-legend-item" style={{ color: c.color }}>
            {c.symbol} {c.label} ({c.count})
          </span>
        ))}
      </div>
      <div className="viz-cta-cards">
        <a href="/selbsttest/" className="viz-cta-card viz-cta-card--quiz">
          🎯 Quiz starten →
          <span>Teste dich selbst gegen den Wissenschaftsstand</span>
        </a>
        <a href="/zahlen-und-fakten/" className="viz-cta-card viz-cta-card--myths">
          🔍 Alle 42 Mythen erkunden →
          <span>Filtern · Vergleichen · Factsheets lesen</span>
        </a>
      </div>
    </div>
  );
}

function VizTrustGap({ active }: { active: boolean }) {
  const sources = [
    { name: "Arzt / Apotheke", trust: 92, useAdults: 60, useMinors: 23, cat: "formal" },
    { name: "Beratungsstelle", trust: 85, useAdults: 25, useMinors: 15, cat: "formal" },
    { name: "TV / Radio", trust: 72, useAdults: 45, useMinors: 12, cat: "medial" },
    { name: "Websites", trust: 65, useAdults: 35, useMinors: 22, cat: "digital" },
    { name: "Suchmaschinen", trust: 60, useAdults: 40, useMinors: 25, cat: "digital" },
    { name: "Soziale Medien", trust: 52, useAdults: 8, useMinors: 27, cat: "social" },
    { name: "Influencer:innen", trust: 49, useAdults: 3, useMinors: 17, cat: "social" },
    { name: "Verwandte", trust: 78, useAdults: 40, useMinors: 53, cat: "formal" },
  ];

  return (
    <div className="viz-trust-gap">
      <div className="viz-trust-gap__header">
        <span className="viz-trust-gap__legend-dot viz-trust-gap__legend-dot--adults" />
        Erwachsene
        <span className="viz-trust-gap__legend-dot viz-trust-gap__legend-dot--minors" />
        Minderjährige
      </div>
      <div className="viz-trust-gap__chart" role="img" aria-label="Trust-Gap-Visualisierung: Vertrauen vs. Nutzung nach Altersgruppen">
        {sources.map((s, i) => {
          const maxUse = Math.max(s.useAdults, s.useMinors);
          const minUse = Math.min(s.useAdults, s.useMinors);
          return (
            <div
              key={s.name}
              className="viz-dumbbell-row"
              style={{
                opacity: active ? 1 : 0,
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <span className="viz-dumbbell-label">{s.name}</span>
              <span className="viz-dumbbell-trust">{s.trust}p</span>
              <div className="viz-dumbbell-bar">
                <div
                  className="viz-dumbbell-line"
                  style={{ left: `${minUse}%`, width: `${maxUse - minUse}%` }}
                />
                <div
                  className="viz-dumbbell-dot viz-dumbbell-dot--adults"
                  style={{ left: `${s.useAdults}%` }}
                  title={`Erwachsene: ${s.useAdults}%`}
                />
                <div
                  className="viz-dumbbell-dot viz-dumbbell-dot--minors"
                  style={{ left: `${s.useMinors}%` }}
                  title={`Minderjährige: ${s.useMinors}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="viz-trust-gap__footer">
        <a href="/haeufige-fragen/">Häufige Fragen →</a>
        <a href="/ueber-uns/">Über das Projekt →</a>
      </div>
      <details className="viz-trust-gap__table-details">
        <summary>Daten als Tabelle anzeigen</summary>
        <table>
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Vertrauen</th>
              <th>Nutzung Erw.</th>
              <th>Nutzung Mind.</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.trust}</td>
                <td>{s.useAdults}%</td>
                <td>{s.useMinors}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// ── Viz Dispatcher ─────────────────────────────────────────────────────────

function StepVisualization({
  vizType,
  active,
}: {
  vizType: ScrollyStep["vizType"];
  active: boolean;
}) {
  switch (vizType) {
    case "bigNumber":
      return <VizBigNumber active={active} />;
    case "contextCloud":
      return <VizContextCloud active={active} />;
    case "groupCloud":
      return <VizGroupCloud active={active} />;
    case "colorReveal":
      return <VizColorReveal active={active} />;
    case "trustGap":
      return <VizTrustGap active={active} />;
    default:
      return <div className="viz-placeholder">Visualisierung wird geladen…</div>;
  }
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ScrollytellingViewer({
  steps,
  title,
}: ScrollytellingViewerProps) {
  const [activeStep, setActiveStep] = useState(1);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  const setStepRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stepsRef.current[index] = el;
    },
    []
  );

  // IntersectionObserver for scroll-driven step changes
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepsRef.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              setActiveStep(steps[i].stepNumber);
            }
          });
        },
        {
          threshold: 0.5,
          rootMargin: "-15% 0px -25% 0px",
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [steps]);

  const currentStep = steps.find((s) => s.stepNumber === activeStep) || steps[0];

  return (
    <section className="scrollytelling" aria-label={title}>
      {/* Mobile: sticky viz on top */}
      <div className="scrollytelling__viz-mobile" aria-hidden="true">
        <StepVisualization vizType={currentStep.vizType} active={true} />
      </div>

      <div className="scrollytelling__container">
        {/* Left: scrolling text column */}
        <div className="scrollytelling__text-col">
          {steps.map((step, i) => (
            <div
              key={step.stepNumber}
              ref={setStepRef(i)}
              className={`scrollytelling__step ${
                activeStep === step.stepNumber ? "scrollytelling__step--active" : ""
              }`}
              data-step={step.stepNumber}
            >
              <span className="scrollytelling__step-label">
                {String(step.stepNumber).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
              </span>
              <h2 className="scrollytelling__heading">
                {step.heading.split("\n").map((line, li) => (
                  <span key={li}>
                    {line}
                    {li < step.heading.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </h2>
              {step.bodyText.split("\n\n").map((para, pi) => (
                <p key={pi} className="scrollytelling__body">
                  {para}
                </p>
              ))}
              {step.hint && (
                <p className="scrollytelling__hint">{step.hint}</p>
              )}
              {step.ctaLabel && step.ctaUrl && (
                <a href={step.ctaUrl} className="scrollytelling__cta">
                  {step.ctaLabel} →
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Right: sticky visualization column (desktop only) */}
        <div className="scrollytelling__viz-col" id="viz-sticky" aria-live="polite">
          <StepVisualization vizType={currentStep.vizType} active={true} />
        </div>
      </div>
    </section>
  );
}
