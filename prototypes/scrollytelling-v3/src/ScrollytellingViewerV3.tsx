import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import type { ReactNode } from 'react';
import type { CarmData, InformationSourcesData, SampleRankedMode, ScrollyStep } from './data/types';
import { STEPS } from './data/steps';

/** Combined matcher: catches both bracketed verdict tags and **bold**
 *  markdown spans in step body copy. The 'kind' capture groups determine
 *  the render branch.
 *    Group 1 (verdict-arrow), 2 (verdict-label)
 *    Group 3 (bold inner text)
 */
const INLINE_RE = /\[([↑↗↙↓—])\s+(richtig|eher richtig|eher falsch|falsch|keine Aussage)\]|\*\*([^*]+)\*\*/g;
const VERDICT_LABEL_TO_CLASS: Record<string, string> = {
  'richtig': 'verdict-tag--richtig',
  'eher richtig': 'verdict-tag--eher-richtig',
  'eher falsch': 'verdict-tag--eher-falsch',
  'falsch': 'verdict-tag--falsch',
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
      // verdict tag
      const arrow = match[1];
      const label = match[2];
      const cls = VERDICT_LABEL_TO_CLASS[label] ?? '';
      out.push(
        <span key={key++} className={`verdict-tag ${cls}`}>
          {arrow} {label}
        </span>,
      );
    } else if (match[3]) {
      // **bold** indicator name
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
import { VizTimeline } from './viz/VizTimeline';
import { VizPeopleVoices } from './viz/VizPeopleVoices';
import { VizMythGrid } from './viz/VizMythGrid';
import { VizSampleAndRanked } from './viz/VizSampleAndRanked';
import { VizSourcesStrips } from './viz/VizSourcesStrips';
import { VizCtaGrid } from './viz/VizCtaGrid';
import { VizTeamRow } from './viz/VizTeamRow';
import { MehrPopover } from './components/MehrPopover';
import { METHODIK_PHASES, FOOTER_BLOCKS } from './data/mehrContent';

interface Props {
  data: CarmData;
  sources: InformationSourcesData;
}

interface VizDispatchProps {
  step: ScrollyStep;
  active: boolean;
  data: CarmData;
  sources: InformationSourcesData;
  sampleRankedMode: SampleRankedMode;
  /** 0..4 — how many of the 4 source-metric columns are revealed in the
   *  shared step 7 + 8 viz. Only meaningful when the active step uses the
   *  sourcesStrips viz. */
  revealedColumns: 0 | 1 | 2 | 3 | 4;
}

function StepVisualization({
  step,
  active,
  data,
  sources,
  sampleRankedMode,
  revealedColumns,
}: VizDispatchProps) {
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
      return <VizSourcesStrips data={sources} revealedColumns={revealedColumns} />;
    case 'ctaGrid':
      return <VizCtaGrid />;
    case 'teamRow':
      return <VizTeamRow />;
    default:
      return <div>Unknown viz: {step.vizName}</div>;
  }
}

export function ScrollytellingViewerV3({ data, sources }: Props) {
  const [activeStep, setActiveStep] = useState(1);
  /** Sub-phase index within the currently-active step. Updated by the
   *  phase-marker IntersectionObserver. Step 6 cycles 0..4 (5 indicators);
   *  steps 7 + 8 cycle 0..1 (2-column reveal). */
  const [phaseIdx, setPhaseIdx] = useState(0);
  /** Iter-4: which inline-chip popover is open (currently only 'methodik'). */
  const [chipPopover, setChipPopover] = useState<'methodik' | null>(null);
  /** Previous activeStep — used to detect scroll direction so we can snap
   *  phaseIdx to the right initial value when entering a phase-marker step.
   *  Without this snap, the phase-marker IntersectionObserver fires *after*
   *  the step IntersectionObserver, leaving a brief frame where the new
   *  step renders with the previous step's phase index (e.g. entering step
   *  7 with phaseIdx=4 left over from step 6 → revealedColumns=5, out of
   *  range). Iter-4-bugfix. */
  const prevActiveStep = useRef(1);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  /** Phase markers keyed as `stepNumber * 100 + indexInStep`. Step 6 + 7 + 8
   *  all share this map; each step gets its own contiguous index block. */
  const phaseMarkersRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const setStepRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stepsRef.current[index] = el;
    },
    [],
  );

  /** Build a ref callback keyed by `stepNumber * 100 + indexInStep`. Each
   *  step's phase markers occupy a distinct namespace so step 6's markers
   *  (indices 0..4) don't collide with step 7's (5..6) or step 8's (7..8). */
  const setPhaseMarkerRef = useCallback(
    (stepNumber: number, index: number) =>
      (el: HTMLDivElement | null) => {
        const key = stepNumber * 100 + index;
        if (el === null) phaseMarkersRef.current.delete(key);
        else phaseMarkersRef.current.set(key, el);
      },
    [],
  );

  // Step-level IntersectionObserver. We use a 1-pixel-tall trigger line at
  // ~45% of the viewport (rootMargin -45% top / -54.99% bottom). Any step
  // container whose pixels currently cross this line is "intersecting" — and
  // since the line is essentially zero-height, exactly one step crosses at a
  // time. This is robust to step containers of any height (step 6 has 3
  // phase markers and ends up several thousand px tall, so threshold-based
  // observers can't satisfy a 30% threshold there).
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
        { threshold: 0, rootMargin: '-45% 0px -54.99% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Snap phaseIdx whenever activeStep changes, so the new step renders with
  // a correct reveal count immediately — not 1–2 frames later when the
  // phase-marker observer fires. Direction-aware: scrolling forward into a
  // phase-marker step starts at phase 0 (build up); scrolling backward
  // starts at the maximum phase (already-built-up).
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

  // Phase-marker IntersectionObserver. 30%-tall detection band centered on
  // the viewport (rootMargin -35% top, -35% bottom). Marker keys are
  // `stepNum * 100 + indexInStep`, so we decode `index = key % 100` when a
  // marker fires and update `phaseIdx` to that local index. Steps don't
  // interfere because only one step's markers can be inside the band at a
  // time (each step's container spans the full viewport). One additional
  // pass after mount so refs registered after the first paint get observed.
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

  const currentStep = STEPS.find((s) => s.stepNumber === activeStep) ?? STEPS[0];

  // Compute the sample-ranked mode based on current step + phase index.
  // Step 6 has 5 sub-phases — one per indicator (Kenntnis → Bedeutung →
  // Richtigkeit → Präventionsbedeutung → Bevölkerungsrisiko). Each new
  // strip slides in below the previous; nothing above shifts.
  const sampleRankedMode: SampleRankedMode = (() => {
    if (currentStep.stepNumber === 5) return 'sample';
    if (currentStep.stepNumber === 6) {
      return (
        ['ranked-1', 'ranked-2', 'ranked-3', 'ranked-4', 'ranked-5'] as const
      )[phaseIdx] ?? 'ranked-1';
    }
    return currentStep.sampleRankedMode ?? 'sample';
  })();

  // Step 7 + 8 share the 4-column sources viz. Each step contributes 2
  // sub-phases:
  //   step 7 phase 0 → 1 col revealed (Suche)
  //   step 7 phase 1 → 2 cols (+ Vertrauen)
  //   step 8 phase 0 → 3 cols (+ Wahrnehmung)
  //   step 8 phase 1 → 4 cols (+ Prävention)
  // Before reaching step 7 the viz isn't rendered, so the value is moot.
  const revealedColumns: 0 | 1 | 2 | 3 | 4 = (() => {
    if (currentStep.stepNumber === 7) return (phaseIdx + 1) as 1 | 2;
    if (currentStep.stepNumber === 8) return (phaseIdx + 3) as 3 | 4;
    // Other steps that happen to render sourcesStrips fall back to fully
    // revealed (visible whilst scrolling away).
    return 4;
  })();

  return (
    <>
    <section className="scrolly" aria-label="Scrollytelling: Forschungsprozess">
      {/* Mobile sticky-top viz */}
      <div className="scrolly__viz-mobile" aria-hidden="true" key={`mob-${currentStep.vizName}-${currentStep.gridMode ?? ''}`}>
        <StepVisualization
          step={currentStep}
          active
          data={data}
          sources={sources}
          sampleRankedMode={sampleRankedMode}
          revealedColumns={revealedColumns}
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
              {step.stepNumber === 6 || step.stepNumber === 7 || step.stepNumber === 8 ? (
                /* Steps 6, 7, 8: each paragraph is a "phase block" — its own
                   scroll real-estate with a phase-marker sentinel at the top.
                   Step 6 has 5 phases (one per indicator); steps 7 + 8 have
                   2 phases each (one per column reveal). The viewer's
                   phaseMarkersRef collects refs across all visible phase
                   markers for the active step. */
                <>
                  {step.bodyText.split('\n\n').map((para, pi) => (
                    <div className="scrolly__phase-block" key={pi}>
                      <div
                        ref={setPhaseMarkerRef(step.stepNumber, pi)}
                        className="scrolly__phase-marker"
                        data-phase-idx={pi}
                      />
                      <p className="scrolly__body">{renderBodyWithVerdicts(para)}</p>
                    </div>
                  ))}
                  {step.hint && <p className="scrolly__hint">{step.hint}</p>}
                </>
              ) : (
                <>
                  {step.bodyText.split('\n\n').map((para, pi) => (
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
                  {step.hint && <p className="scrolly__hint">{step.hint}</p>}
                  {step.ctaLabel && step.ctaUrl && (
                    <a href={step.ctaUrl} className="scrolly__cta">
                      {step.ctaLabel} →
                    </a>
                  )}
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
              sources={sources}
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
        {METHODIK_PHASES.map((p) => (
          <section key={p.label} className="mehr-popover__section">
            <h3 className="mehr-popover__section-title">{p.label} · {p.title}</h3>
            {p.body.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>
        ))}
      </MehrPopover>
    </section>

    {/* Iter-4: project footer moved out of Step 10's right-side viz. Lives
        below the scrollytelling, full-width, with the four mandatory
        blocks (Kontakt · Förderung · Zitierweise · Abschlussbericht). */}
    <footer className="scrolly-page-footer" aria-label="Projektinformationen">
      <div className="scrolly-page-footer__inner">
        <div className="scrolly-page-footer__block">
          <p className="scrolly-page-footer__label">{FOOTER_BLOCKS.kontakt.label}</p>
          <p className="scrolly-page-footer__body">
            {FOOTER_BLOCKS.kontakt.lines.map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
            <a href={`mailto:${FOOTER_BLOCKS.kontakt.email}`}>
              {FOOTER_BLOCKS.kontakt.email}
            </a>
          </p>
        </div>
        <div className="scrolly-page-footer__block">
          <p className="scrolly-page-footer__label">{FOOTER_BLOCKS.foerderung.label}</p>
          <p className="scrolly-page-footer__body">{FOOTER_BLOCKS.foerderung.body}</p>
        </div>
        <div className="scrolly-page-footer__block">
          <p className="scrolly-page-footer__label">{FOOTER_BLOCKS.zitierweise.label}</p>
          <p className="scrolly-page-footer__body">{FOOTER_BLOCKS.zitierweise.body}</p>
        </div>
        <div className="scrolly-page-footer__block">
          <p className="scrolly-page-footer__label">{FOOTER_BLOCKS.abschlussbericht.label}</p>
          <p className="scrolly-page-footer__body">{FOOTER_BLOCKS.abschlussbericht.body}</p>
        </div>
      </div>
    </footer>
    </>
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
