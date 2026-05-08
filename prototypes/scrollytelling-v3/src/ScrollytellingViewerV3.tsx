import { useState, useEffect, useRef, useCallback } from 'react';
import type { CarmData, SampleRankedMode, ScrollyStep } from './data/types';
import { STEPS } from './data/steps';
import { VizTimeline } from './viz/VizTimeline';
import { VizPeopleVoices } from './viz/VizPeopleVoices';
import { VizMythGrid } from './viz/VizMythGrid';
import { VizSampleAndRanked } from './viz/VizSampleAndRanked';
import { VizSourcesStrips } from './viz/VizSourcesStrips';
import { VizCtaGrid } from './viz/VizCtaGrid';
import { VizTeamRow } from './viz/VizTeamRow';

interface Props {
  data: CarmData;
}

interface VizDispatchProps {
  step: ScrollyStep;
  active: boolean;
  data: CarmData;
  sampleRankedMode: SampleRankedMode;
}

function StepVisualization({ step, active, data, sampleRankedMode }: VizDispatchProps) {
  switch (step.vizName) {
    case 'timeline':
      return <VizTimeline active={active} />;
    case 'peopleVoices':
      return <VizPeopleVoices active={active} />;
    case 'mythGrid':
      return <VizMythGrid data={data} mode={step.gridMode ?? 'themed'} />;
    case 'sampleAndRanked':
      return <VizSampleAndRanked data={data} mode={sampleRankedMode} />;
    case 'sourcesStrips':
      return <VizSourcesStrips pair={step.sourcesPair ?? 'search-trust'} />;
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
  /** Step 6 has 3 phase markers driving sub-mode ranked-1/2/3. Step 5 forces 'sample'. */
  const [phaseIdx, setPhaseIdx] = useState(0);
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

  // Step-level IntersectionObserver
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

  // Step-6 phase markers — 3 internal triggers
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    phaseMarkersRef.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setPhaseIdx(i);
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

  // Compute the sample-ranked mode based on current step + phase index
  const sampleRankedMode: SampleRankedMode = (() => {
    if (currentStep.stepNumber === 5) return 'sample';
    if (currentStep.stepNumber === 6) {
      return (['ranked-1', 'ranked-2', 'ranked-3'] as const)[phaseIdx] ?? 'ranked-1';
    }
    // For other steps, fall back to the step's declared mode if any (so the
    // shared-DOM viz preserves a sensible state when scrolling away).
    return currentStep.sampleRankedMode ?? 'sample';
  })();

  return (
    <section className="scrolly" aria-label="Scrollytelling: Forschungsprozess">
      {/* Mobile sticky-top viz */}
      <div className="scrolly__viz-mobile" aria-hidden="true" key={`mob-${currentStep.vizName}-${currentStep.gridMode ?? ''}-${currentStep.sourcesPair ?? ''}`}>
        <StepVisualization
          step={currentStep}
          active
          data={data}
          sampleRankedMode={sampleRankedMode}
        />
      </div>

      <div className="scrolly__container">
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

        <div className="scrolly__viz-col" aria-live="polite">
          {/*
            Cross-fade wrapper: a single child keyed by viz family. When scrolling
            within a "family" (mythGrid 3↔4, sampleAndRanked 5↔6, sourcesStrips
            7↔8), the key stays the same → DOM persists, props animate. When
            crossing into a different family, key changes → CSS cross-fade kicks in.
          */}
          <div
            className="scrolly__viz-stage"
            key={vizFamilyKey(currentStep)}
          >
            <StepVisualization
              step={currentStep}
              active
              data={data}
              sampleRankedMode={sampleRankedMode}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Steps that share a viz instance must produce the same key. */
function vizFamilyKey(step: ScrollyStep): string {
  switch (step.vizName) {
    case 'mythGrid':
      return 'family-mythGrid';
    case 'sampleAndRanked':
      return 'family-sampleAndRanked';
    case 'sourcesStrips':
      return 'family-sourcesStrips';
    default:
      return `family-${step.vizName}`;
  }
}
