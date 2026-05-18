import { useEffect, useRef, useState } from 'react';
import type { CarmData, CorrectnessClass, Myth } from './types';
import {
  ON_VERDICT_BG_GLYPH,
  VERDICT_COLOR,
  VERDICT_LABEL_DE,
  sortedMyths,
  themeColorFor,
} from './dataLoaders';
import { MehrPopover } from './MehrPopover';
import VerdictArrow from '../shared/VerdictArrow';

interface Props {
  data: CarmData;
  /** 'themed' = pastel category bg (step 3); 'classified' = verdict color + arrow (step 4). */
  mode: 'themed' | 'classified';
}

// Iter-20: hover-card, detail popover, and aria-label all use the
// canonical 4-level verdict labels — `richtig / eher richtig / eher
// falsch / falsch` — keyed by `correctness_class` from
// `public/data/carm-data.json`. Previously a local
// `VERDICT_LABEL_LONG` map rendered "stimmt / stimmt eher / stimmt
// eher nicht / stimmt nicht" which Fedor flagged as inconsistent
// with the rest of the site (step-4 legend, daten-explorer filters,
// myth factsheet headings all use the canonical names). Now we
// import the single source of truth from `dataLoaders.ts`.

interface MythSummary {
  summary_de: string;
  classification_label: string;
}
type MythSummaryMap = Record<string, MythSummary>;

export function VizMythGrid({ data, mode }: Props) {
  const myths = sortedMyths(data).slice(0, 42);
  const [summaries, setSummaries] = useState<MythSummaryMap | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [openMyth, setOpenMyth] = useState<Myth | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/myth-summaries.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: MythSummaryMap) => {
        if (!cancelled) setSummaries(json);
      })
      .catch(() => {
        // Hover card falls back to text_de only on fetch error.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Iter-11: themed-legend (orderedCats) + classified counts (counts)
  // are now derived in ScrollytellingViewer via shared helpers in
  // dataLoaders.ts. The viz column itself no longer renders them.

  const hoveredMyth = hoverId !== null ? myths.find((m) => m.id === hoverId) ?? null : null;
  const hoveredSummary = hoveredMyth && summaries ? summaries[String(hoveredMyth.id)] : null;

  function onCellEnter(mythId: number, e: React.MouseEvent | React.FocusEvent) {
    const target = e.currentTarget as HTMLElement;
    const grid = gridRef.current;
    if (!grid) return;
    const cellRect = target.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    setHoverPos({
      x: cellRect.left - gridRect.left + cellRect.width / 2,
      y: cellRect.top - gridRect.top,
    });
    setHoverId(mythId);
  }

  function onCellLeave() {
    setHoverId(null);
  }

  return (
    <div className="viz" data-grid-mode={mode}>
      <div
        ref={gridRef}
        className="viz-grid"
        role="img"
        aria-label={
          mode === 'classified'
            ? '42 Cannabis-Mythen mit wissenschaftlicher Klassifikation'
            : '42 Cannabis-Mythen, sortiert nach Themenfeld'
        }
        style={{ position: 'relative' }}
      >
        {myths.map((m, i) => {
          const themedBg = themeColorFor(m.category_id);
          const classifiedBg = VERDICT_COLOR[m.correctness_class];
          const bg = mode === 'classified' ? classifiedBg : themedBg;
          return (
            <div
              key={m.id}
              className={`viz-grid__cell viz-grid__cell--${mode}`}
              style={{
                backgroundColor: bg,
                ['--cell-delay' as string]: `${i * 30}ms`,
                cursor: mode === 'classified' ? 'pointer' : 'default',
              }}
              tabIndex={0}
              role={mode === 'classified' ? 'button' : undefined}
              onMouseEnter={(e) => onCellEnter(m.id, e)}
              onMouseLeave={onCellLeave}
              onFocus={(e) => onCellEnter(m.id, e)}
              onBlur={onCellLeave}
              onClick={() => {
                if (mode === 'classified') setOpenMyth(m);
              }}
              onKeyDown={(e) => {
                if (mode === 'classified' && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  setOpenMyth(m);
                }
              }}
              aria-label={
                mode === 'classified'
                  ? `${m.text_de} — ${VERDICT_LABEL_DE[m.correctness_class]} — Details öffnen`
                  : m.text_de
              }
            >
              {/* Icon slot is ALWAYS rendered — empty placeholder in themed
                  mode, actual verdict arrow in classified mode. This keeps the
                  cell's flex-column layout identical between modes so the
                  myth text below it doesn't shift down when crossing 3 → 4. */}
              {mode === 'classified' ? (
                <VerdictArrow
                  verdict={m.correctness_class}
                  className="viz-grid__cell-icon"
                  size="1em"
                  strokeWidth={2.5}
                  colorOverride={ON_VERDICT_BG_GLYPH}
                />
              ) : (
                <span className="viz-grid__cell-icon-slot" aria-hidden="true" />
              )}
              <span className="viz-grid__cell-text">{m.text_short_de}</span>
            </div>
          );
        })}

        {hoveredMyth && hoverPos && (
          <MythHoverCard
            myth={hoveredMyth}
            mode={mode}
            summary={hoveredSummary}
            x={hoverPos.x}
            y={hoverPos.y}
            categoryName={
              data.categories.find((c) => c.id === hoveredMyth.category_id)?.name_de ?? null
            }
          />
        )}
      </div>

      {/* Iter-11: theme + verdict legends moved to the LEFT text
          column (rendered by ScrollytellingViewer based on step.gridMode).
          The viz column now shows ONLY the data — no metadata blocks. */}

      <MehrPopover
        open={openMyth !== null}
        onClose={() => setOpenMyth(null)}
        title={openMyth?.text_de ?? ''}
        subtitle={openMyth?.category_de ?? undefined}
      >
        {openMyth && (
          <>
            <div
              className="mehr-popover__verdict-pill"
              style={{ background: VERDICT_COLOR[openMyth.correctness_class] }}
            >
              {VERDICT_LABEL_DE[openMyth.correctness_class]}
            </div>
            {(() => {
              const summary = summaries?.[String(openMyth.id)];
              if (summary?.summary_de) return <p>{summary.summary_de}</p>;
              if (openMyth.classification_de) return <p>{openMyth.classification_de}</p>;
              return (
                <p>
                  Eine ausführliche Erklärung mit Quellen findest du in der
                  Faktenkarte zu diesem Mythos.
                </p>
              );
            })()}
            <a
              className="mehr-popover__cta-link"
              href={`/fakten-karten/?myth=m${String(openMyth.id).padStart(2, '0')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Zur vollständigen Faktenkarte →
            </a>
          </>
        )}
      </MehrPopover>
    </div>
  );
}

interface HoverCardProps {
  myth: { id: number; text_de: string; correctness_class: CorrectnessClass; category_id: number | null };
  mode: 'themed' | 'classified';
  summary: MythSummary | null;
  x: number;
  y: number;
  categoryName: string | null;
}

function MythHoverCard({ myth, mode, summary, x, y, categoryName }: HoverCardProps) {
  const verdictColor = VERDICT_COLOR[myth.correctness_class];
  return (
    <div
      className="viz-grid__hover"
      role="tooltip"
      style={{
        left: x,
        top: Math.max(0, y - 12),
        transform: 'translate(-50%, -100%)',
      }}
    >
      <p className="viz-grid__hover-statement">{myth.text_de}</p>
      {mode === 'classified' && (
        <div className="viz-grid__hover-verdict" style={{ color: verdictColor }}>
          <VerdictArrow verdict={myth.correctness_class} size="1em" strokeWidth={2.5} />
          <span>{VERDICT_LABEL_DE[myth.correctness_class]}</span>
        </div>
      )}
      {mode === 'themed' && categoryName && (
        <div className="viz-grid__hover-category">{categoryName}</div>
      )}
      {summary && mode === 'classified' && (
        <p className="viz-grid__hover-summary">{summary.summary_de}</p>
      )}
    </div>
  );
}
