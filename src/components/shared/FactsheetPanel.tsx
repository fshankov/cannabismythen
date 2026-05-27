/**
 * FactsheetPanel — Unified slide-in panel showing a myth's full factsheet.
 * (Decision G: Merged from quiz and dashboard implementations)
 *
 * Layout:
 *   1. Myth statement (title)
 *   2. Evidence-based verdict (classification badge with icon)
 *   3. Einordnung (open)
 *   4. Synthese (open)
 *   5. Zentrale Erkenntnisse (collapsible)
 *   6. Referenzen (collapsible)
 *   7. Daten nach Zielgruppen table (at bottom)
 *   8. Link to full factsheet page
 *
 * Desktop: slides in from the right (~480px wide).
 * Mobile: slides up from the bottom as a sheet.
 * Closes on X button, clicking the backdrop, or pressing Escape.
 *
 * CSS classes use the .factsheet-panel__* namespace (from quiz.css).
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import FactsheetGroupBars from './FactsheetGroupBars';
import VerdictStatement from './VerdictStatement';
import VerdictArrow from './VerdictArrow';
import VerdictPill from './VerdictPill';
import type {
  CorrectnessClass,
  MythGroupMetrics,
} from '../../lib/dashboard/types';
import {
  AUDIENCE_ICONS_BY_FAQ_ID,
  type FaqAudienceId,
} from '../../lib/icons/lookups';

/** Travel pipeline 4C (2026-05-23) — full audience label, used as the
 *  tooltip on the audience icon beside each FAQ-backlink row.
 *  (The 2-char "El/Ju/Ko/Le/Fa" chips were replaced by the audience
 *   icons themselves on 2026-05-25 — see FAQ backlinks block below.) */
const FAQ_AUDIENCE_LABEL: Record<string, string> = {
  eltern: 'Eltern',
  jugendliche: 'Jugendliche',
  konsumierende: 'Konsumierende',
  lehrkraefte: 'Lehrkräfte',
  fachkraefte: 'Fachkräfte',
};

/** Reference to a related myth — surfaced inside the popup as a click
 *  target that swaps the panel to the related myth. Pre-resolved at
 *  build-time so the popup never round-trips for title/verdict lookups.
 *  Travel pipeline 4B (2026-05-23). */
export interface RelatedMythRef {
  mythId: string;          // e.g. "m04"
  mythNumber: number;      // e.g. 4
  title: string;           // canonical short title, "Mythos N:" prefix stripped
  classification: string;  // "richtig" | "eher_richtig" | …
}

/** Backlink from a FAQ question inside Meine Interessen → this myth.
 *  Pre-resolved at build-time via `getQuestionsForMyth` in `src/lib/faq.ts`.
 *  Travel pipeline 4C (2026-05-23). */
export interface FaqBacklink {
  slug: string;
  title: string;     // questionLong (or title fallback)
  audience: string;  // 'eltern' | 'jugendliche' | 'konsumierende' | …
  href: string;      // /meine-interessen/{audience}/#frage-{slug}
}

/** Pre-rendered factsheet content from Keystatic (passed from Astro at build time). */
export interface MythContentEntry {
  html: string;
  title: string;
  classification: string;
  classificationLabel: string;
  refCount: number;
  /** Resolved references to related myths declared via `relatedMyths` on
   *  the .mdoc. Travel pipeline 4B. Optional so legacy build outputs
   *  without the field still render. */
  relatedMyths?: RelatedMythRef[];
  /** FAQ questions that cite this myth via `primaryMyth` or
   *  `relatedMyths`. Travel pipeline 4C. Optional for same reason. */
  faqBacklinks?: FaqBacklink[];
}

interface Section {
  title: string;
  html: string;
}

/**
 * Context-specific configuration.
 * - 'quiz': Uses quiz z-index, body scroll is NOT locked (quiz manages its own scroll)
 * - 'dashboard': Locks body scroll, higher z-index for dashboard overlay
 */
type PanelContext = 'quiz' | 'dashboard' | 'fakten-karten';

interface FactsheetPanelProps {
  /** Panel context — controls z-index, scroll-lock, and animation timing */
  context: PanelContext;

  /** The myth's display text (title/statement) */
  mythText: string;

  /** Classification key, e.g. 'richtig', 'eher_falsch' */
  classificationKey: string;

  /** Human-readable classification label, e.g. 'Falsch' */
  classificationLabel: string;

  /** Pre-rendered factsheet content from Keystatic */
  mythContentEntry?: MythContentEntry;

  /** Slug for linking to the full factsheet page */
  factsheetSlug?: string;

  /** Label for the verdict row (e.g. "Wissenschaftliches Urteil:" or i18n key) */
  verdictLabel?: string;

  /** Called when the panel should close */
  onClose: () => void;

  /** Optional fallback explanation (quiz only — shown when no pre-rendered content) */
  fallbackExplanation?: string;

  /** Optional accessory rendered next to the verdict label — used by the
   *  dashboard wrapper to slot a `<VerdictArrowWithInfo>` so the verdict
   *  explanation popover shows on hover. Other surfaces leave it
   *  undefined and render the existing label-only treatment. */
  verdictAccessory?: ReactNode;

  /** Per-Zielgruppe metric slice for this myth. When provided, the
   *  panel renders the interactive `<FactsheetGroupBars>` chart in
   *  place of the static "Daten nach Zielgruppen" markdown table that
   *  used to be baked into the .mdoc HTML. Pre-computed at build-time
   *  on every call site so the popup never round-trips to the network.
   *
   *  When omitted (e.g. a myth without a metric record yet), the panel
   *  falls back to whatever "Daten nach Zielgruppen" markdown is present
   *  in `mythContentEntry.html` so legacy content keeps rendering. */
  groupMetrics?: MythGroupMetrics;

  /** Stage D (2026-05-22): quiz-only — the user's chosen classification
   *  for this myth. When provided, the panel renders a "Deine Antwort:
   *  <pill>" line directly above the "Wissenschaftlich:" line so the
   *  comparison is visible inside the popup (the back-of-card chip pair
   *  is being replaced by a popup-first pattern). Dashboard +
   *  fakten-karten callsites leave this undefined; nothing renders. */
  userAnswer?: CorrectnessClass | null;

  /** Travel pipeline 4B (2026-05-23): clicking a related myth inside
   *  the "Verwandte Mythen" collapsed section calls this callback so the
   *  parent surface (dashboard / fakten-karten / quiz) can swap the
   *  panel to the new myth. When undefined, related-myth chips render
   *  as plain text (no click affordance). */
  onSelectRelatedMyth?: (mythNumber: number) => void;
}

/**
 * Split pre-rendered HTML into sections by <h2> headings.
 */
function splitSections(html: string): Section[] {
  const parts = html.split(/<h2[^>]*>/);
  const sections: Section[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      if (parts[i].trim()) {
        sections.push({ title: '__intro__', html: parts[i] });
      }
      continue;
    }

    const closingIndex = parts[i].indexOf('</h2>');
    if (closingIndex === -1) continue;

    const title = parts[i].slice(0, closingIndex).replace(/<[^>]+>/g, '').trim();
    const content = parts[i].slice(closingIndex + 5).trim();

    sections.push({ title, html: content });
  }

  return sections;
}

/** Sections that are collapsible by default */
const COLLAPSIBLE = new Set(['Zentrale Erkenntnisse', 'Referenzen']);

/** Desired display order for sections */
const SECTION_ORDER = [
  'Einordnung',
  'Synthese',
  'Zentrale Erkenntnisse',
  'Referenzen',
  'Daten nach Zielgruppen',
];

/** Section heading whose markdown table is replaced by the interactive
 *  <FactsheetGroupBars> when build-time metrics are wired in. The
 *  markdown stays in the .mdoc so the full factsheet page (under
 *  `/daten-explorer/<slug>/`) still renders the table for accessibility
 *  and print readers — only the popup swaps it out. */
const GROUP_METRICS_SECTION = 'Daten nach Zielgruppen';

export default function FactsheetPanel({
  context,
  mythText,
  classificationKey,
  mythContentEntry,
  // factsheetSlug intentionally not destructured — the "Zur vollständigen
  // Seite" link was removed (travel pipeline Stage 1, 2026-05-23) since
  // the popup is now the source of truth for myth content. Stage 5 plans
  // to repurpose this slug as a ?myth=<id> URL param; the prop stays on
  // the interface so callers don't need to change.
  factsheetSlug: _factsheetSlug,
  onClose,
  fallbackExplanation,
  groupMetrics,
  userAnswer,
  onSelectRelatedMyth,
  // v3 (2026-05-13): verdict is now carried by the colored statement +
  // trailing arrow inside <VerdictStatement>. These three props from the
  // legacy "separate verdict block" pattern are kept in the type so the
  // 3 wrapper FactsheetPanels (quiz/, dashboard/, fakten-karten/) don't
  // need to change, but they're no longer rendered. Remove the props +
  // wrapper plumbing in a follow-up cleanup.
  classificationLabel: _classificationLabel,
  verdictLabel: _verdictLabel,
  verdictAccessory: _verdictAccessory,
}: FactsheetPanelProps) {
  void _classificationLabel;
  void _verdictLabel;
  void _verdictAccessory;
  void _factsheetSlug;
  const panelRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    // Dashboard context locks body scroll; quiz manages its own
    if (context === 'dashboard') {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (context === 'dashboard') {
        document.body.style.overflow = '';
      }
    };
  }, [onClose, context]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  // Parse sections and build a lookup
  const allSections = mythContentEntry ? splitSections(mythContentEntry.html) : [];
  const sectionMap = new Map<string, Section>();
  for (const s of allSections) {
    sectionMap.set(s.title, s);
  }

  // Ordered sections to render. When build-time `groupMetrics` are wired
  // in, the static "Daten nach Zielgruppen" markdown table is hidden
  // here and the interactive <FactsheetGroupBars> renders below the
  // ordered list instead. Falling back to the markdown when metrics
  // aren't wired keeps legacy editor content rendering.
  const hasInteractiveBars = !!groupMetrics && groupMetrics.length > 0;
  const orderedSections = SECTION_ORDER
    .filter((title) => !(hasInteractiveBars && title === GROUP_METRICS_SECTION))
    .map((title) => sectionMap.get(title))
    .filter((s): s is Section => !!s);

  const renderSection = (section: Section, i: number) => {
    const isCollapsible = COLLAPSIBLE.has(section.title);
    const isExpanded = expandedSections.has(section.title);

    if (isCollapsible) {
      return (
        <div key={i} className="factsheet-panel__section factsheet-panel__section--collapsible">
          <button
            type="button"
            className="factsheet-panel__section-toggle"
            onClick={() => toggleSection(section.title)}
            aria-expanded={isExpanded}
          >
            <span className="factsheet-panel__section-title">
              {section.title}
            </span>
            <span
              className={`factsheet-panel__chevron ${isExpanded ? 'factsheet-panel__chevron--open' : ''}`}
            >
              &#9662;
            </span>
          </button>
          {isExpanded && (
            <div
              className="factsheet-panel__section-content"
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          )}
        </div>
      );
    }

    // Regular open section
    return (
      <div key={i} className="factsheet-panel__section">
        <h3 className="factsheet-panel__section-heading">{section.title}</h3>
        <div
          className="factsheet-panel__section-content"
          dangerouslySetInnerHTML={{ __html: section.html }}
        />
      </div>
    );
  };

  return (
    <div
      className={`factsheet-panel__backdrop factsheet-panel__backdrop--${context}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={mythText}
    >
      <div ref={panelRef} className="factsheet-panel" tabIndex={-1}>
        {/* Header carries the statement + scientific verdict (Fedor
            2026-05-25). Previously the statement + "Wissenschaftlich:"
            line sat at the top of the body; moving them into the
            header places the verdict above the fold and frees the body
            to start directly with Einordnung. The close X is
            absolutely positioned top-right of the header so the
            statement + verdict can wrap freely without colliding. */}
        <div className="factsheet-panel__header">
          <div className="factsheet-panel__header-content">
            <VerdictStatement
              statement={mythContentEntry?.title ?? mythText}
              verdict={classificationKey as CorrectnessClass}
              as="p"
              className="factsheet-panel__statement"
              arrowSize={18}
            />

            {/* Stage D (2026-05-22): quiz popup-first pattern — when the
                user opened the panel after answering, surface their
                pick directly next to the scientific verdict so the
                comparison is visible without scrolling. Dashboard +
                fakten-karten leave userAnswer undefined → this block
                doesn't render. */}
            {userAnswer && (
              <p className="factsheet-panel__verdict-line">
                <span className="factsheet-panel__verdict-label">
                  Deine Antwort:
                </span>{' '}
                <VerdictPill verdict={userAnswer} size="md" />
              </p>
            )}

            {/* "Wissenschaftlich: <pill>" line. "Wissenschaftlich" (not
                "Wissenschaftliches Urteil") follows the BugHerd #30
                UI-label rule. */}
            <p className="factsheet-panel__verdict-line">
              <span className="factsheet-panel__verdict-label">
                Wissenschaftlich:
              </span>{' '}
              <VerdictPill
                verdict={classificationKey as CorrectnessClass}
                size="md"
              />
            </p>
          </div>

          <button
            type="button"
            className="factsheet-panel__close"
            onClick={onClose}
            aria-label="Schließen"
          >
            &times;
          </button>
        </div>

        <div className="factsheet-panel__body">
          {mythContentEntry ? (
            <>
              {/* 3-7. Ordered sections (markdown table hidden when bars wired) */}
              {orderedSections.map((section, i) => renderSection(section, i))}

              {/* Interactive replacement for the "Daten nach Zielgruppen"
                  markdown table. Rendered last so it sits in the same
                  visual position the table used to occupy, just above
                  the link to the full factsheet page. */}
              {hasInteractiveBars && (
                <FactsheetGroupBars
                  metrics={groupMetrics!}
                  verdict={classificationKey as CorrectnessClass}
                />
              )}

              {/* Travel pipeline 4B + 4C (2026-05-23): collapsed
                  Related Myths + FAQ-backlinks blocks at popup bottom.
                  Both <details> closed by default — match the existing
                  Zentrale Erkenntnisse / Referenzen collapsed pattern.
                  Data pre-resolved at build-time via buildMythContentMap
                  in src/lib/myth-content.ts. Sections only render when
                  the entry has non-empty arrays. */}
              {mythContentEntry.relatedMyths && mythContentEntry.relatedMyths.length > 0 && (
                <details className="factsheet-panel__section factsheet-panel__section--collapsible factsheet-panel__extras factsheet-panel__related">
                  <summary className="factsheet-panel__section-toggle">
                    <span className="factsheet-panel__section-title">
                      Verwandte Mythen
                    </span>
                    <span className="factsheet-panel__chevron" aria-hidden="true">
                      &#9662;
                    </span>
                  </summary>
                  <ul className="factsheet-panel__extras-list">
                    {mythContentEntry.relatedMyths.map((r) => {
                      const inner = (
                        <>
                          <VerdictArrow
                            verdict={r.classification as CorrectnessClass}
                            size={14}
                            strokeWidth={2}
                          />
                          <span className="factsheet-panel__extras-label">
                            {r.title}
                          </span>
                        </>
                      );
                      return (
                        <li key={r.mythId} className="factsheet-panel__extras-item">
                          {onSelectRelatedMyth ? (
                            <button
                              type="button"
                              className="factsheet-panel__extras-link"
                              onClick={() => onSelectRelatedMyth(r.mythNumber)}
                            >
                              {inner}
                            </button>
                          ) : (
                            <span className="factsheet-panel__extras-link factsheet-panel__extras-link--static">
                              {inner}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}

              {mythContentEntry.faqBacklinks && mythContentEntry.faqBacklinks.length > 0 && (
                <details className="factsheet-panel__section factsheet-panel__section--collapsible factsheet-panel__extras factsheet-panel__backlinks">
                  <summary className="factsheet-panel__section-toggle">
                    <span className="factsheet-panel__section-title">
                      In Meine Interessen referenziert
                    </span>
                    <span className="factsheet-panel__chevron" aria-hidden="true">
                      &#9662;
                    </span>
                  </summary>
                  <ul className="factsheet-panel__extras-list">
                    {mythContentEntry.faqBacklinks.map((b) => {
                      // Look up the audience icon component (Fedor 2026-05-25:
                      // the 2-char EL/JU/KO/LE/FA chips were replaced by the
                      // real audience icons from src/lib/icons/audiences.ts).
                      // Fallback to a neutral chip if the audience id isn't
                      // in the known set — shouldn't happen but defensive.
                      const AudienceIcon =
                        AUDIENCE_ICONS_BY_FAQ_ID[b.audience as FaqAudienceId];
                      return (
                        <li key={`${b.audience}-${b.slug}`} className="factsheet-panel__extras-item">
                          <a href={b.href} className="factsheet-panel__extras-link">
                            <span
                              className={`factsheet-panel__extras-audience-icon factsheet-panel__extras-audience-icon--${b.audience}`}
                              aria-hidden="true"
                              title={FAQ_AUDIENCE_LABEL[b.audience] ?? b.audience}
                            >
                              {AudienceIcon ? (
                                <AudienceIcon size={16} strokeWidth={1.75} />
                              ) : (
                                <span className="factsheet-panel__extras-audience-fallback">
                                  {b.audience.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span className="factsheet-panel__extras-label">
                              {b.title}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}

            </>
          ) : (
            <>
              {/* Fallback when the .mdoc didn't load. The statement +
                  verdict already live in the header above, so the body
                  starts directly with the fallback explanation (if any)
                  and the interactive bars. */}

              {fallbackExplanation && (
                <div className="factsheet-panel__section">
                  <div className="factsheet-panel__section-content">
                    <p>{fallbackExplanation}</p>
                  </div>
                </div>
              )}

              {/* Bars work even without prerendered HTML, so render them
                  in the fallback branch too. */}
              {hasInteractiveBars && (
                <FactsheetGroupBars
                  metrics={groupMetrics!}
                  verdict={classificationKey as CorrectnessClass}
                />
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
