/**
 * ScrollytellingViewer — production version for the /projekt/ page.
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

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import type { ReactNode } from "react";
import type {
  CarmData,
  InformationSourcesData,
  SampleRankedMode,
  ScrollyContent,
} from "./types";
import { STEP_DEFINITIONS, type StepStructure } from "./stepDefinitions";
import {
  loadCarmData,
  loadInformationSources,
  orderedCategoriesFromData,
  scrollyCategoryAccent,
  verdictCountsFromData,
  VERDICT_ORDER,
  VERDICT_LABEL_DE,
} from "./dataLoaders";
import { VizTimeline } from "./VizTimeline";
import { VizPeopleVoices } from "./VizPeopleVoices";
import { VizMythGrid } from "./VizMythGrid";
import { VizSampleAndRanked } from "./VizSampleAndRanked";
import { VizSingleMythBalken } from "./VizSingleMythBalken";
import { VizSourcesStrips } from "./VizSourcesStrips";
import { VizSourcesSpannweite } from "./VizSourcesSpannweite";
import { VizCtaGrid } from "./VizCtaGrid";
import { VizTeamRow } from "./VizTeamRow";
import VerdictPill from "../shared/VerdictPill";
import VerdictArrow from "../shared/VerdictArrow";
import type { CorrectnessClass } from "../../lib/dashboard/types";
import type { ComponentType } from "react";
import {
  AUDIENCE_ICONS_BY_GROUP,
  AUDIENCE_COLOR_VAR_BY_GROUP,
  INDICATOR_ICONS,
} from "../../lib/icons";
import { CATEGORY_META } from "../../lib/fakten-karten/categories";
import { FileText, Brain, Table, CircleHelp } from "lucide-react";

/**
 * Iter-22: inline `{icon:KEY}` tokens for the left-column body copy.
 * Maps a token key → its icon component + (optional) color. Audience
 * icons reuse the dashboard accent vars so they match the right-column
 * viz ("in line with the icons on the right"); indicator + section
 * icons inherit a muted tone. SECTION_ICONS mirror the mobile-tab-bar
 * glyphs (Fakten-Karten / Quiz / Daten-Explorer / Meine Interessen).
 */
type InlineIconEntry = {
  // Custom IconComponent (audiences/indicators) and Lucide icons
  // (sections) have different prop signatures; `any` lets both into one
  // registry. Rendered with size + an aria-hidden wrapper below.
  Icon: ComponentType<any>;
  color?: string;
};
const SCROLLY_INLINE_ICONS: Record<string, InlineIconEntry> = {
  adults: {
    Icon: AUDIENCE_ICONS_BY_GROUP.adults,
    color: `var(${AUDIENCE_COLOR_VAR_BY_GROUP.adults})`,
  },
  minors: {
    Icon: AUDIENCE_ICONS_BY_GROUP.minors,
    color: `var(${AUDIENCE_COLOR_VAR_BY_GROUP.minors})`,
  },
  consumers: {
    Icon: AUDIENCE_ICONS_BY_GROUP.consumers,
    color: `var(${AUDIENCE_COLOR_VAR_BY_GROUP.consumers})`,
  },
  young_adults: {
    Icon: AUDIENCE_ICONS_BY_GROUP.young_adults,
    color: `var(${AUDIENCE_COLOR_VAR_BY_GROUP.young_adults})`,
  },
  parents: {
    Icon: AUDIENCE_ICONS_BY_GROUP.parents,
    color: `var(${AUDIENCE_COLOR_VAR_BY_GROUP.parents})`,
  },
  awareness: { Icon: INDICATOR_ICONS.awareness },
  significance: { Icon: INDICATOR_ICONS.significance },
  correctness: { Icon: INDICATOR_ICONS.correctness },
  prevention_significance: { Icon: INDICATOR_ICONS.prevention_significance },
  population_relevance: { Icon: INDICATOR_ICONS.population_relevance },
  faktenkarten: { Icon: FileText },
  quiz: { Icon: Brain },
  "daten-explorer": { Icon: Table },
  "meine-interessen": { Icon: CircleHelp },
};

/** Inline matchers for body copy:
 *   - `[↑ richtig]`  → <VerdictPill>  (arrow glyph + verdict label)
 *   - `{↑ richtig}`  → <VerdictArrow> (arrow glyph ONLY, no label —
 *                       for tally lists like "{↓ falsch} 7 stimmen nicht")
 *   - `**bold**`     → <strong>
 *
 * Both bracket forms accept the same set of arrow/verdict pairs so the
 * editor can pick "with label" vs "icon only" depending on context. */
// Iter-23b (2026-06-02): the inline verdict-puck token accepts both the
// new canonical label "keine Aussage möglich" (Harald's Feedbucket
// #796936) and the legacy short form "keine Aussage" so historical
// content still renders correctly until each surface is re-edited.
const INLINE_RE =
  /\[([↑↗↙↓—])\s+(richtig|eher richtig|eher falsch|falsch|keine Aussage möglich|keine Aussage)\]|\{([↑↗↙↓—])\s+(richtig|eher richtig|eher falsch|falsch|keine Aussage möglich|keine Aussage)\}|\*\*([^*]+)\*\*|\{icon:([a-z_-]+)\}/g;
const VERDICT_LABEL_TO_CLASS: Record<string, CorrectnessClass> = {
  richtig: "richtig",
  "eher richtig": "eher_richtig",
  "eher falsch": "eher_falsch",
  falsch: "falsch",
  "keine Aussage möglich": "keine_aussage_moeglich",
  "keine Aussage": "keine_aussage_moeglich",
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
      // `[↑ richtig]` — Iter-11: now renders as a small COLORED PUCK
      // (verdict-colored circle + white arrow inside, no label) so
      // inline body copy carries the verdict signal without the
      // tinted-rounded-rect-with-text look of the daten-explorer pill.
      const verdict = VERDICT_LABEL_TO_CLASS[match[2]];
      if (verdict) {
        out.push(
          <VerdictPill
            key={key++}
            verdict={verdict}
            size="sm"
            variant="puck"
          />,
        );
      }
    } else if (match[3]) {
      // `{↑ richtig}` — bare verdict glyph, inline with surrounding text
      const verdict = VERDICT_LABEL_TO_CLASS[match[4]];
      if (verdict) {
        out.push(
          <VerdictArrow
            key={key++}
            verdict={verdict}
            size={14}
            strokeWidth={2.25}
            className="scrolly__body-arrow"
          />,
        );
      }
    } else if (match[5]) {
      out.push(
        <strong key={key++} className="scrolly__body-strong">
          {match[5]}
        </strong>,
      );
    } else if (match[6]) {
      // `{icon:KEY}` — inline icon (Iter-22). Unknown keys render nothing.
      const entry = SCROLLY_INLINE_ICONS[match[6]];
      if (entry) {
        const { Icon, color } = entry;
        out.push(
          <span
            key={key++}
            className="scrolly__body-icon"
            style={color ? { color } : undefined}
            aria-hidden="true"
          >
            <Icon size={16} />
          </span>,
        );
      }
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return out;
}

/**
 * Iter-22: render one `\n\n`-delimited paragraph. Single `\n` lines become
 * separate lines. A paragraph whose every line starts with `{icon:…}` is
 * rendered as an icon list (flex rows: icon + text, wrapped text aligns
 * under the text) — used for the Step-5 target groups and Step-10 offerings.
 */
function renderParagraph(para: string): ReactNode {
  const lines = para.split("\n").filter((l) => l.trim().length > 0);
  const isIconList =
    lines.length >= 2 && lines.every((l) => l.trimStart().startsWith("{icon:"));
  if (isIconList) {
    return (
      <span className="scrolly__body-list">
        {lines.map((line, i) => (
          <span key={i} className="scrolly__body-li">
            {renderBodyWithVerdicts(line.trim())}
          </span>
        ))}
      </span>
    );
  }
  const out: ReactNode[] = [];
  lines.forEach((line, i) => {
    out.push(<Fragment key={`l${i}`}>{renderBodyWithVerdicts(line)}</Fragment>);
    if (i < lines.length - 1) out.push(<br key={`b${i}`} />);
  });
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
    case "timeline":
      return (
        <VizTimeline active={active} tooltips={content.timelineTooltips} />
      );
    case "peopleVoices":
      return <VizPeopleVoices active={active} />;
    case "mythGrid":
      return <VizMythGrid data={data} mode={step.gridMode ?? "themed"} />;
    case "sampleAndRanked":
      return <VizSampleAndRanked data={data} mode={sampleRankedMode} />;
    case "singleMythBalken":
      return (
        <VizSingleMythBalken
          data={data}
          revealedRows={step.revealedRows ?? 3}
          step={step.stepNumber === 7 ? 7 : 6}
        />
      );
    case "sourcesStrips":
      return (
        <VizSourcesStrips data={sources} revealedColumns={revealedColumns} />
      );
    case "sourcesSpannweite":
      return (
        <VizSourcesSpannweite
          data={sources}
          revealedColumns={revealedColumns}
          step={step.stepNumber === 9 ? 9 : 8}
        />
      );
    case "ctaGrid":
      return <VizCtaGrid data={data} />;
    case "teamRow":
      return (
        <VizTeamRow
          teamMembers={content.teamMembers}
          landesstellenCredit={content.landesstellenCredit}
        />
      );
    default:
      return <div>Unknown viz: {step.vizName}</div>;
  }
}

/**
 * Top-level component for the /projekt/ page. Loads carm-data +
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
      <p style={{ padding: "2rem", color: "#be123c" }}>
        Datensätze konnten nicht geladen werden: {error}
      </p>
    );
  }
  if (!data || !sources) {
    return <p style={{ padding: "2rem", color: "#9ca3af" }}>Lade Daten …</p>;
  }

  return (
    <ScrollytellingViewerInner
      data={data}
      sources={sources}
      content={content}
    />
  );
}

function ScrollytellingViewerInner({ data, sources, content }: InnerProps) {
  const [activeStep, setActiveStep] = useState(1);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  const setStepRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stepsRef.current[index] = el;
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
            if (e.isIntersecting) setActiveStep(STEP_DEFINITIONS[i].stepNumber);
          });
        },
        { threshold: 0, rootMargin: "-45% 0px -54.99% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const currentStep =
    STEP_DEFINITIONS.find((s) => s.stepNumber === activeStep) ??
    STEP_DEFINITIONS[0];

  // Iter-10: the 5-indicator story is split across Steps 6 (3 raw) and
  // Step 7 (5 = + 2 derived). Each step's structural definition carries
  // its `sampleRankedMode` directly — no phase-idx machinery needed.
  const sampleRankedMode: SampleRankedMode =
    currentStep.sampleRankedMode ?? "sample";

  // Iter-12: Steps 8 and 9 split the sources story (active vs passive).
  // Step 8 → cols 1 + 2 (Suche + Vertrauen). Step 9 → cols 3 + 4 added
  // (Wahrnehmung + Prävention). Applies to both the legacy
  // `sourcesStrips` viz (kept for reference) and the new
  // `sourcesSpannweite` viz.
  const revealedColumns: 0 | 1 | 2 | 3 | 4 = (() => {
    if (currentStep.stepNumber === 8) return 2;
    if (currentStep.stepNumber === 9) return 4;
    return 4;
  })();

  return (
    <>
      <section
        className="scrolly"
        aria-label="Scrollytelling: Forschungsprozess"
      >
        {/* Mobile sticky-top viz */}
        <div
          className="scrolly__viz-mobile"
          aria-hidden="true"
          key={`mob-${currentStep.vizName}-${currentStep.gridMode ?? ""}`}
        >
          <div className="scrolly__viz-canvas">
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
                      ? "scrolly__step--active"
                      : ""
                  }`}
                >
                  <span className="scrolly__step-label">
                    {String(step.stepNumber).padStart(2, "0")} /{" "}
                    {String(STEP_DEFINITIONS.length).padStart(2, "0")}
                  </span>
                  <h2 className="scrolly__heading">
                    {editorial.heading.split("\n").map((line, li, arr) => (
                      <span key={li}>
                        {line}
                        {li < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </h2>
                  {/* Iter-10: all 11 steps render through one branch.
                      Step 6's old `---` phase-marker mechanism is gone
                      because the synthesis lives in its own Step 7 now. */}
                  {editorial.bodyText.split("\n\n").map((para, pi) => (
                    <p key={pi} className="scrolly__body">
                      {renderParagraph(para)}
                    </p>
                  ))}
                  {/* Iter-11: themed grid (Step 3) gets a Themenfelder
                      legend in the LEFT text column instead of below
                      the viz. Inline-wrap of swatch + name, smaller
                      print than body. */}
                  {step.gridMode === "themed" && (
                    <div
                      className="scrolly__theme-legend"
                      aria-label="Themenfelder"
                    >
                      {orderedCategoriesFromData(data).map((c) => {
                        // #3 (2026-06-08): category shown as a colored SQUARE
                        // (palette B, scrollyCategoryAccent) with a WHITE icon,
                        // then the name. The previous tinted-icon-on-dark was
                        // invisible on the forest backdrop.
                        const CatIcon = CATEGORY_META[c.name]?.icon ?? null;
                        return (
                          <span key={c.id} className="scrolly__theme-chip">
                            <span
                              className="scrolly__theme-tile"
                              style={{
                                background: scrollyCategoryAccent(c.name),
                              }}
                              aria-hidden="true"
                            >
                              {CatIcon && <CatIcon size={13} color="#ffffff" />}
                            </span>
                            <span className="scrolly__theme-name">
                              {c.name}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* Iter-11: classified grid (Step 4) gets a verdict
                      tally in the LEFT text column. Each row =
                      colored puck + verdict name + (count), in
                      falsch → richtig order. Replaces the old
                      `{verb} stimmen` lines + the viz-column legend. */}
                  {step.gridMode === "classified" &&
                    (() => {
                      const counts = verdictCountsFromData(data);
                      return (
                        <div
                          className="scrolly__verdict-legend"
                          aria-label="Klassifikationen"
                        >
                          {VERDICT_ORDER.filter((v) => counts[v] > 0).map(
                            (v) => (
                              <div key={v} className="scrolly__verdict-row">
                                <VerdictPill
                                  verdict={v}
                                  size="sm"
                                  variant="puck"
                                />
                                <span className="scrolly__verdict-label">
                                  {VERDICT_LABEL_DE[v]}
                                </span>
                                <span className="scrolly__verdict-count">
                                  ({counts[v]})
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      );
                    })()}
                  {editorial.legend && (
                    <p className="scrolly__legend">{editorial.legend}</p>
                  )}
                  {editorial.hint && (
                    <p className="scrolly__hint">{editorial.hint}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="scrolly__viz-col" aria-live="polite">
            <div className="scrolly__viz-stage" key={vizFamilyKey(currentStep)}>
              <div className="scrolly__viz-canvas">
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
        </div>
      </section>
    </>
  );
}

/** Steps that share a viz instance must produce the same key. */
function vizFamilyKey(step: StepStructure): string {
  switch (step.vizName) {
    case "mythGrid":
      return "family-mythGrid";
    case "sampleAndRanked":
      return "family-sampleAndRanked";
    case "singleMythBalken":
      return "family-singleMythBalken";
    case "sourcesStrips":
      return "family-sourcesStrips";
    case "sourcesSpannweite":
      return "family-sourcesSpannweite";
    default:
      return `family-${step.vizName}`;
  }
}
