import { useState, useEffect, useRef, useCallback } from 'react';
import type { CarmData, IndicatorPhase, ScrollyStep } from './data/types';
import { STEPS } from './data/steps';
import { VizLawDateBadge } from './viz/VizLawDateBadge';
import { VizPeopleVoices } from './viz/VizPeopleVoices';
import { VizMythGrid } from './viz/VizMythGrid';
import { VizIndicatorStrip } from './viz/VizIndicatorStrip';
import { VizTrustGap } from './viz/VizTrustGap';
import { VizCtaGrid } from './viz/VizCtaGrid';
import { VizTeamRow } from './viz/VizTeamRow';

interface Props {
  data: CarmData;
}

interface VizDispatchProps {
  step: ScrollyStep;
  active: boolean;
  data: CarmData;
  phase: IndicatorPhase;
}

function StepVisualization({ step, active, data, phase }: VizDispatchProps) {
  switch (step.vizName) {
    case 'lawDateBadge':
      return <VizLawDateBadge active={active} />;
    case 'peopleVoices':
      return <VizPeopleVoices active={active} />;
    case 'mythGrid':
      return <VizMythGrid data={data} mode="themed" />;
    case 'classificationReveal':
      return <VizMythGrid data={data} mode={active ? 'classified' : 'themed'} />;
    case 'indicatorStrip':
      return <VizIndicatorStrip data={data} phase={null} />;
    case 'indicatorStripLive':
      return <VizIndicatorStrip data={data} phase={phase} />;
    case 'trustGap':
      return <VizTrustGap />;
    case 'ctaGrid':
      return <VizCtaGrid />;
    case 'teamRow':
      return <VizTeamRow />;
    default:
      return <div>Unknown viz: {step.vizName}</div>;
  }
}

export function ScrollytellingViewerV3({ data }: Props) {
  const [activeStep, setActiveStep] = useState(1);
  const [phase, setPhase] = useState<IndicatorPhase>('awareness');
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const phaseMarkersRef = useRef<(HTMLDivElement | null)[]>([]);

  const setStepRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stepsRef.current[index] = el;
    },
    [],
  );

  const setPhaseMarkerRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      phaseMarkersRef.current[index] = el;
    },
    [],
  );

  // Step-level IntersectionObserver — same pattern as v2 ScrollytellingViewer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepsRef.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActiveStep(STEPS[i].stepNumber);
          });
        },
        { threshold: 0.3, rootMargin: '-20% 0px -30% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Step-6 phase markers — three internal triggers driving the heatmap recolor
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const phaseOrder: IndicatorPhase[] = [
      'awareness',
      'correctness',
      'prevention_significance',
    ];
    phaseMarkersRef.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setPhase(phaseOrder[i]);
          });
        },
        { threshold: 0.5, rootMargin: '-40% 0px -40% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const currentStep = STEPS.find((s) => s.stepNumber === activeStep) ?? STEPS[0];

  return (
    <section className="scrolly" aria-label="Scrollytelling: Forschungsprozess">
      {/* Mobile sticky-top viz */}
      <div className="scrolly__viz-mobile" aria-hidden="true">
        <StepVisualization step={currentStep} active data={data} phase={phase} />
      </div>

      <div className="scrolly__container">
        {/* Left text column */}
        <div className="scrolly__text-col">
          {STEPS.map((step, i) => (
            <div
              key={step.stepNumber}
              ref={setStepRef(i)}
              data-step={step.stepNumber}
              className={`scrolly__step ${activeStep === step.stepNumber ? 'scrolly__step--active' : ''}`}
            >
              <span className="scrolly__step-label">
                {String(step.stepNumber).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
              </span>
              <h2 className="scrolly__heading">
                {step.heading.split('\n').map((line, li, arr) => (
                  <span key={li}>
                    {line}
                    {li < arr.length - 1 && <br />}
                  </span>
                ))}
              </h2>
              {step.bodyText.split('\n\n').map((para, pi) => (
                <p key={pi} className="scrolly__body">
                  {para}
                </p>
              ))}
              {step.hint && <p className="scrolly__hint">{step.hint}</p>}
              {step.ctaLabel && step.ctaUrl && (
                <a href={step.ctaUrl} className="scrolly__cta">
                  {step.ctaLabel} →
                </a>
              )}
              {/* Step 6 — three phase markers for heatmap sub-phases */}
              {step.stepNumber === 6 && (
                <>
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      ref={setPhaseMarkerRef(idx)}
                      className="scrolly__phase-marker"
                      data-phase-idx={idx}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Right viz column — sticky on desktop */}
        <div className="scrolly__viz-col" aria-live="polite">
          <StepVisualization step={currentStep} active data={data} phase={phase} />
        </div>
      </div>
    </section>
  );
}
