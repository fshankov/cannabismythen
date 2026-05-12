/**
 * ScrollytellingViewer — production version for the /ueber-uns/ page.
 *
 * Two-column scrollytelling: text scrolls on the left, sticky viz on the right
 * (desktop ≥1024px). Mobile: viz pinned to top (45vh), text scrolls below.
 *
 * Editorial content is passed in via the `content` prop (sourced from the
 * Keystatic singleton `ueberUnsScrolly` in src/content/ueber-uns-scrolly.yaml).
 * Code-side structural definitions live in stepDefinitions.ts.
 *
 * Ported from prototypes/scrollytelling-v3 (Iter-4, 2026-05-11).
 */

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import type { ReactNode } from 'react';
import type {
  CarmData,
  InformationSourcesData,
  SampleRankedMode,
  ScrollyContent,
} from './types';
import { STEP_DEFINITIONS, type StepStructure } from './stepDefinitions';
import { loadCarmData, loadInformationSources } from './dataLoaders';
import { VizTimeline } from './VizTimeline';
import { VizPeopleVoices } from './VizPeopleVoices';
import { VizMythGrid } from './VizMythGrid';
import { VizSampleAndRanked } from './VizSampleAndRanked';
import { VizSourcesStrips } from './VizSourcesStrips';
import { VizCtaGrid } from './VizCtaGrid';
import { VizTeamRow } from './VizTeamRow';
import { MehrPopover } from './MehrPopover';

/** Inline matcher for verdict tags [↑ richtig] and **bold** spans in body copy. */
const INLINE_RE =
  /\[([↑↗↙↓—])\s+(richtig|eher richtig|eher falsch|falsch|keine Aussage)\]|\*\*([^*]+)\*\*/g;
const VERDICT_LABEL_TO_CLASS: Record<string, string> = {
  richtig: 'verdict-tag--richtig',
  'eher richtig': 'verdict-tag--eher-richtig',
  'eher falsch': 'verdict-tag--eher-falsch',
  falsch: 'verdict-tag--falsch',
  'keine Aussage': 'verdict-tag--keine-aussage',
};

function renderBodyWithVerdicts(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      out.push(<Fragment key={key++}>{text.slice(lastIndex, start)}</Fragment>);
    }
    if (match[1]) {
      const arrow = match[1];
      const label = match[2];
      const cls = VERDICT_LABEL_TO_CLASS[label] ?? '';
      out.push(
        <span key={key++} className={`verdict-tag ${cls}`}>
          {arrow} {label}
        </span>,
      );
    } else if (match[3]) {
      out.push(
        <strong key={key++} className="scrolly__body-strong">
          {match[3]}
        </strong>,
      );
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return out;
}

interface Props {
  content: ScrollyContent;
}

interface InnerProps {
  data: CarmData;
  sources: InformationSourcesData;
  content: ScrollyContent;
}

interface VizDispatchProps {
  step: StepStructure;
  active: boolean;
  data: CarmData;
  sources: InformationSourcesData;
  content: ScrollyContent;
  sampleRankedMode: SampleRankedMode;
  revealedColumns: 0 | 1 | 2 | 3 | 4;
}

function StepVisualization({
  step,
  active,
  data,
  sources,
  content,
  sampleRankedMode,
  revealedColumns,
}: VizDispatchProps) {
  switch (step.vizName) {
    case 'timeline':
      return <VizTimeline active={active} tooltips={content.timelineTooltips} />;
    case 'peopleVoices':
      return <VizPeopleVoices active={active} />;
    case 'mythGrid':
      return <VizMythGrid data={data} mode={step.gridMode ?? 'themed'} />;
    case 'sampleAndRanked':
      return <VizSampleAndRanked data={data} mode={sampleRankedMode} />;
    case 'sourcesStrips':
      return <VizSourcesStrips data={sources} revealedColumns={revealedColumns} />;
    case 'ctaGrid':
      return <VizCtaGrid />;
    case 'teamRow':
      return (
        <VizTeamRow
          teamMembers={content.teamMembers}
          namedExperts={content.namedExperts}
          landesstellenCredit={content.landesstellenCredit}
        />
      );
    default:
      return <div>Unknown viz: {step.vizName}</div>;
  }
}

/**
 * Top-level component for the /ueber-uns/ page. Loads carm-data +
 * information-sources from /data/ on mount, then renders the inner viewer
 * once both datasets are ready.
 */
export function ScrollytellingViewer({ content }: Props) {
  const [data, setData] = useState<CarmData | null>(null);
  const [sources, setSources] = useState<InformationSourcesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadCarmData(), loadInformationSources()])
      .then(([cd, is]) => {
        setData(cd);
        setSources(is);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p style={{ padding: '2rem', color: '#be123c' }}>
        Datensätze konnten nicht geladen werden: {error}
      </p>
    );
  }
  if (!data || !sources) {
    return (
      <p style={{ padding: '2rem', color: '#9ca3af' }}>Lade Daten …</p>
    );
  }

  return <ScrollytellingViewerInner data={data} sources={sources} content={content} />;
}

function ScrollytellingViewerInner({ data, sources, content }: InnerProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [chipPopover, setChipPopover] = useState<'methodik' | null>(null);
  /** Previous activeStep — used to detect scroll direction so we can snap
   *  phaseIdx to the right initial value when entering a phase-marker step.
   *  Without this snap the phase-marker observer fires *after* the step
   *  observer, briefly leaving the new step with the old step's phase idx. */
  const prevActiveStep = useRef(1);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const phaseMarkersRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const setStepRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stepsRef.current[index] = el;
    },
    [],
  );

  const setPhaseMarkerRef = useCallback(
    (stepNumber: number, index: number) => (el: HTMLDivElement | null) => {
      const key = stepNumber * 100 + index;
      if (el === null) phaseMarkersRef.current.delete(key);
      else phaseMarkersRef.current.set(key, el);
    },
    [],
  );

  // Step-level IntersectionObserver — 0.01%-tall band at viewport y=45%.
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepsRef.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting)
              setActiveStep(STEP_DEFINITIONS[i].stepNumber);
          });
        },
        { threshold: 0, rootMargin: '-45% 0px -54.99% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Direction-aware phaseIdx snap when activeStep changes.
  useEffect(() => {
    const direction: 'forward' | 'backward' =
      activeStep > prevActiveStep.current ? 'forward' : 'backward';
    if (activeStep === 6) {
      setPhaseIdx(direction === 'forward' ? 0 : 4);
    } else if (activeStep === 7) {
      setPhaseIdx(direction === 'forward' ? 0 : 1);
    } else if (activeStep === 8) {
      setPhaseIdx(direction === 'forward' ? 0 : 1);
    }
    prevActiveStep.current = activeStep;
  }, [activeStep]);

  // Phase-marker IntersectionObserver — 30%-tall band centered on viewport.
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    phaseMarkersRef.current.forEach((el, key) => {
      if (!el) return;
      const localIdx = key % 100;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setPhaseIdx(localIdx);
          });
        },
        { threshold: 0, rootMargin: '-35% 0px -35% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const currentStep =
    STEP_DEFINITIONS.find((s) => s.stepNumber === activeStep) ??
    STEP_DEFINITIONS[0];

  const sampleRankedMode: SampleRankedMode = (() => {
    if (currentStep.stepNumber === 5) return 'sample';
    if (currentStep.stepNumber === 6) {
      return (
        (
          [
            'ranked-1',
            'ranked-2',
            'ranked-3',
            'ranked-4',
            'ranked-5',
          ] as const
        )[phaseIdx] ?? 'ranked-1'
      );
    }
    return currentStep.sampleRankedMode ?? 'sample';
  })();

  const revealedColumns: 0 | 1 | 2 | 3 | 4 = (() => {
    if (currentStep.stepNumber === 7) return (phaseIdx + 1) as 1 | 2;
    if (currentStep.stepNumber === 8) return (phaseIdx + 3) as 3 | 4;
    return 4;
  })();

  return (
    <>
      <section className="scrolly" aria-label="Scrollytelling: Forschungsprozess">
        {/* Mobile sticky-top viz */}
        <div
          className="scrolly__viz-mobile"
          aria-hidden="true"
          key={`mob-${currentStep.vizName}-${currentStep.gridMode ?? ''}`}
        >
          <StepVisualization
            step={currentStep}
            active
            data={data}
            sources={sources}
            content={content}
            sampleRankedMode={sampleRankedMode}
            revealedColumns={revealedColumns}
          />
        </div>

        <div className="scrolly__container">
          <div className="scrolly__text-col">
            {STEP_DEFINITIONS.map((step, i) => {
              const editorial = content.steps[i];
              if (!editorial) return null;
              return (
                <div
                  key={step.stepNumber}
                  ref={setStepRef(i)}
                  data-step={step.stepNumber}
                  className={`scrolly__step ${
                    activeStep === step.stepNumber
                      ? 'scrolly__step--active'
                      : ''
                  }`}
                >
                  <span className="scrolly__step-label">
                    {String(step.stepNumber).padStart(2, '0')} /{' '}
                    {String(STEP_DEFINITIONS.length).padStart(2, '0')}
                  </span>
                  <h2 className="scrolly__heading">
                    {editorial.heading.split('\n').map((line, li, arr) => (
                      <span key={li}>
                        {line}
                        {li < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </h2>
                  {step.stepNumber === 6 ||
                  step.stepNumber === 7 ||
                  step.stepNumber === 8 ? (
                    <>
                      {editorial.bodyText.split('\n\n').map((para, pi) => (
                        <div className="scrolly__phase-block" key={pi}>
                          <div
                            ref={setPhaseMarkerRef(step.stepNumber, pi)}
                            className="scrolly__phase-marker"
                            data-phase-idx={pi}
                          />
                          <p className="scrolly__body">
                            {renderBodyWithVerdicts(para)}
                          </p>
                        </div>
                      ))}
                      {editorial.hint && (
                        <p className="scrolly__hint">{editorial.hint}</p>
                      )}
                    </>
                  ) : (
                    <>
                      {editorial.bodyText.split('\n\n').map((para, pi) => (
                        <p key={pi} className="scrolly__body">
                          {renderBodyWithVerdicts(para)}
                        </p>
                      ))}
                      {step.chips && step.chips.length > 0 && (
                        <div className="scrolly__chip-row">
                          {step.chips.map((chip) => (
                            <button
                              key={chip.popoverKey}
                              type="button"
                              className="scrolly__mehr-chip"
                              onClick={() => setChipPopover(chip.popoverKey)}
                            >
                              {chip.label} →
                            </button>
                          ))}
                        </div>
                      )}
                      {editorial.hint && (
                        <p className="scrolly__hint">{editorial.hint}</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="scrolly__viz-col" aria-live="polite">
            <div className="scrolly__viz-stage" key={vizFamilyKey(currentStep)}>
              <StepVisualization
                step={currentStep}
                active
                data={data}
                sources={sources}
                content={content}
                sampleRankedMode={sampleRankedMode}
                revealedColumns={revealedColumns}
              />
            </div>
          </div>
        </div>

        <MehrPopover
          open={chipPopover === 'methodik'}
          onClose={() => setChipPopover(null)}
          title="Methodik im Detail"
          subtitle="Drei Phasen + Expert:innenrunde"
        >
          {content.methodikPhases.map((p) => (
            <section key={p.label} className="mehr-popover__section">
              <h3 className="mehr-popover__section-title">
                {p.label} · {p.title}
              </h3>
              {p.body.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </section>
          ))}
        </MehrPopover>
      </section>

      <footer className="scrolly-page-footer" aria-label="Projektinformationen">
        <div className="scrolly-page-footer__inner">
          <div className="scrolly-page-footer__block">
            <p className="scrolly-page-footer__label">
              {content.footerKontakt.label}
            </p>
            <p className="scrolly-page-footer__body">
              {content.footerKontakt.lines.map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
              <a href={`mailto:${content.footerKontakt.email}`}>
                {content.footerKontakt.email}
              </a>
            </p>
          </div>
          <div className="scrolly-page-footer__block">
            <p className="scrolly-page-footer__label">
              {content.footerFoerderung.label}
            </p>
            <p className="scrolly-page-footer__body">
              {content.footerFoerderung.body}
            </p>
          </div>
          <div className="scrolly-page-footer__block">
            <p className="scrolly-page-footer__label">
              {content.footerZitierweise.label}
            </p>
            <p className="scrolly-page-footer__body">
              {content.footerZitierweise.body}
            </p>
          </div>
          <div className="scrolly-page-footer__block">
            <p className="scrolly-page-footer__label">
              {content.footerAbschlussbericht.label}
            </p>
            <p className="scrolly-page-footer__body">
              {content.footerAbschlussbericht.body}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

/** Steps that share a viz instance must produce the same key. */
function vizFamilyKey(step: StepStructure): string {
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
