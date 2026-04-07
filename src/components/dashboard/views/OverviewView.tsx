/**
 * OverviewView — Visual summary of all myths at a glance.
 *
 * Shows all myths as color-coded tiles, grouped by category.
 * Each tile displays the myth name, a verdict badge, and a small metric bar.
 * This is the ideal entry point for visitors: they can immediately see
 * the verdict distribution, identify patterns, and click to explore.
 *
 * Design principles:
 * - Instant comprehension: color = verdict, size = uniform for fairness
 * - Category grouping tells the thematic story
 * - Metric micro-bar shows the selected indicator at a glance
 * - Click any tile to open the factsheet panel
 */

import { useMemo, useState } from 'react';
import type { Myth, Metric, AppState, Category } from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText, formatValue } from '../../../lib/dashboard/data';
import { getCorrectnessColor, getCorrectnessBgColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onSelectMyth: (id: number) => void;
  categories: Category[];
}

const VERDICT_LABELS: Record<string, string> = {
  richtig: 'Fakt',
  eher_richtig: 'Eher Fakt',
  eher_falsch: 'Eher Falsch',
  falsch: 'Falsch',
  no_classification: 'Keine Aussage',
};

export default function OverviewView({ myths, metrics, state, update, onSelectMyth, categories }: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const groupId = state.groupIds[0] || 'adults';
  const indicator = state.indicator;

  // Find the max value for the selected indicator (for scaling bars)
  const maxVal = useMemo(() => {
    let max = 0;
    for (const myth of myths) {
      const metric = getMythMetric(metrics, myth.id, groupId);
      const val = getIndicatorValue(metric, indicator);
      if (val !== null && val > max) max = val;
    }
    return max || 100;
  }, [myths, metrics, groupId, indicator]);

  // Group myths by category
  const grouped = useMemo(() => {
    const catMap = new Map<number, { category: Category; myths: Myth[] }>();

    // Initialize with actual category objects
    for (const cat of categories) {
      catMap.set(cat.id, { category: cat, myths: [] });
    }

    for (const myth of myths) {
      const catId = myth.category_id;
      if (catId !== null && catMap.has(catId)) {
        catMap.get(catId)!.myths.push(myth);
      }
    }

    // Return only categories that have myths, sorted by category ID
    return Array.from(catMap.values())
      .filter((g) => g.myths.length > 0)
      .sort((a, b) => a.category.id - b.category.id);
  }, [myths, categories]);

  // Summary stats
  const verdictCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const myth of myths) {
      counts[myth.correctness_class] = (counts[myth.correctness_class] || 0) + 1;
    }
    return counts;
  }, [myths]);

  return (
    <div className="overview-view">
      {/* Summary strip */}
      <div className="overview-summary">
        <span className="overview-summary-count">{myths.length} Mythen</span>
        <div className="overview-summary-verdicts">
          {Object.entries(verdictCounts)
            .sort(([a], [b]) => {
              const order = ['richtig', 'eher_richtig', 'eher_falsch', 'falsch', 'no_classification'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([verdict, count]) => (
              <span
                key={verdict}
                className="overview-verdict-chip"
                style={{
                  backgroundColor: getCorrectnessBgColor(verdict as any),
                  color: getCorrectnessColor(verdict as any),
                }}
              >
                {count}× {VERDICT_LABELS[verdict] || verdict}
              </span>
            ))}
        </div>
      </div>

      {/* Category groups */}
      {grouped.map(({ category, myths: catMyths }) => (
        <div key={category.id} className="overview-category">
          <h3 className="overview-category-title">
            {category.name_de}
            <span className="overview-category-count">{catMyths.length}</span>
          </h3>
          <div className="overview-tiles">
            {catMyths.map((myth) => {
              const metric = getMythMetric(metrics, myth.id, groupId);
              const value = getIndicatorValue(metric, indicator);
              const barWidth = value !== null ? Math.max(2, (value / maxVal) * 100) : 0;
              const color = getCorrectnessColor(myth.correctness_class);
              const bgColor = getCorrectnessBgColor(myth.correctness_class);
              const isHovered = hoveredId === myth.id;

              return (
                <button
                  key={myth.id}
                  className={`overview-tile ${isHovered ? 'overview-tile--hover' : ''}`}
                  style={{
                    borderColor: isHovered ? color : bgColor,
                    backgroundColor: isHovered ? bgColor : 'white',
                  }}
                  onClick={() => onSelectMyth(myth.id)}
                  onMouseEnter={() => setHoveredId(myth.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  title={`${getMythShortText(myth, 'de')} — ${VERDICT_LABELS[myth.correctness_class] || myth.correctness_class}`}
                >
                  <div className="overview-tile-header">
                    <span
                      className="overview-tile-verdict"
                      style={{ backgroundColor: color }}
                    />
                    <span className="overview-tile-name">
                      {getMythShortText(myth, 'de')}
                    </span>
                  </div>
                  <div className="overview-tile-bar-track">
                    <div
                      className="overview-tile-bar-fill"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                      }}
                    />
                    {value !== null && (
                      <span className="overview-tile-bar-label" style={{ color }}>
                        {formatValue(value, indicator)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
