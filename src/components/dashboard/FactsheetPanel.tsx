/**
 * FactsheetPanel — Slide-in panel showing a myth's full factsheet content.
 *
 * Reuses the same layout and styling as the Quiz FactsheetPanel:
 *   1. Myth statement (title)
 *   2. Evidence-based verdict (classification badge)
 *   3. Einordnung (open)
 *   4. Synthese (open)
 *   5. Zentrale Erkenntnisse (collapsible)
 *   6. Referenzen (collapsible, shows count)
 *   7. Daten nach Zielgruppen table (at bottom)
 *   8. Link to full factsheet page
 *
 * Desktop: slides in from the right (~480px wide).
 * Mobile: slides up from the bottom as a sheet.
 * Closes on X button, clicking the backdrop, or pressing Escape.
 *
 * CSS classes reuse the quiz's .factsheet-panel__* styles (from quiz.css).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Myth } from '../../lib/dashboard/types';
import type { MythContentEntry } from './MythenExplorer';

interface FactsheetPanelProps {
  myth: Myth;
  mythContentEntry?: MythContentEntry;
  factsheetSlug?: string;
  onClose: () => void;
}

interface Section {
  title: string;
  html: string;
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

export default function FactsheetPanel({
  myth,
  mythContentEntry,
  factsheetSlug,
  onClose,
}: FactsheetPanelProps) {
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
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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

  // Ordered sections to render
  const orderedSections = SECTION_ORDER
    .map((title) => sectionMap.get(title))
    .filter((s): s is Section => !!s);

  const renderSection = (section: Section, i: number) => {
    const isCollapsible = COLLAPSIBLE.has(section.title);
    const isExpanded = expandedSections.has(section.title);

    if (isCollapsible) {
      const countLabel =
        section.title === 'Referenzen'
          ? `${mythContentEntry?.refCount || 0} Quellen`
          : '';

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
              {countLabel && (
                <span className="factsheet-panel__section-count">({countLabel})</span>
              )}
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
      className="factsheet-panel__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={myth.text_de}
    >
      <div ref={panelRef} className="factsheet-panel" tabIndex={-1}>
        <div className="factsheet-panel__header">
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
              {/* 1. Myth statement */}
              <p className="factsheet-panel__statement">{mythContentEntry.title}</p>

              {/* 2. Evidence-based verdict */}
              <div className="factsheet-panel__classification">
                <span className="factsheet-panel__label">Wissenschaftliches Urteil:</span>
                <span className={`classification classification--${myth.correctness_class}`}>
                  {mythContentEntry.classificationLabel}
                </span>
              </div>

              {/* 3-7. Ordered sections */}
              {orderedSections.map((section, i) => renderSection(section, i))}

              {/* Link to full page */}
              {factsheetSlug && (
                <a
                  href={`/zahlen-und-fakten/${factsheetSlug}/`}
                  className="factsheet-panel__link"
                >
                  Zur vollständigen Seite &rarr;
                </a>
              )}
            </>
          ) : (
            <>
              {/* Fallback if no pre-rendered content */}
              <p className="factsheet-panel__statement">{myth.text_de}</p>

              <div className="factsheet-panel__classification">
                <span className="factsheet-panel__label">Wissenschaftliches Urteil:</span>
                <span className={`classification classification--${myth.correctness_class}`}>
                  {myth.classification_de || myth.correctness_class}
                </span>
              </div>

              {factsheetSlug && (
                <a
                  href={`/zahlen-und-fakten/${factsheetSlug}/`}
                  className="factsheet-panel__link"
                >
                  Zur vollständigen Seite &rarr;
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
