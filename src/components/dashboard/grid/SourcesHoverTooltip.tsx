/**
 * SourcesHoverTooltip — Quellen-flavored variant of GridHoverTooltip.
 *
 * v3 (2026-05-26) — content overhaul. Replaces the v2 "metric × group
 * line + cross-group strip" pairing (which duplicated info already
 * visible in the row + cell) with:
 *
 *   row 1: source name + category icon (kept)
 *   row 2: per-category description (NEW — from
 *          `source-descriptions.ts`, 6 short blurbs)
 *   divider
 *   row 3: LesebeispielSource sentence for the active metric × group
 *          (the existing component used by SourcesSpannweiteView)
 *
 * Mirrors the Mythen-side hover hierarchy (myth statement → verdict
 * line → Lesebeispiel). The cross-group strip was retired in v3 —
 * Fedor's call.
 */
import type {
  InformationSource,
  InformationSourcesData,
  SourceMetricType,
  SourceGroupId,
} from '../../../lib/dashboard/types';
import {
  SOURCE_CATEGORY_ICONS,
  type SourceCategoryId,
} from '../../../lib/icons/lookups';
import {
  getCategoryColor,
  getCategoryBgColor,
} from '../../../lib/dashboard/colors';
import { getCategoryDescription } from '../../../lib/dashboard/source-descriptions';
import LesebeispielSource from '../LesebeispielSource';

interface Props {
  source: InformationSource;
  /** Full sources dataset — used to look up the active cell's value
   *  so LesebeispielSource has a number to interpret. */
  sourceData: InformationSourcesData;
  /** Active metric (column the user is currently viewing). */
  metric: SourceMetricType;
  /** Active Zielgruppe (row group). */
  group: SourceGroupId;
  /** Viewport-clamped hover coords from the consumer. */
  x: number;
  y: number;
}

export default function SourcesHoverTooltip({
  source,
  sourceData,
  metric,
  group,
  x,
  y,
}: Props) {
  const categoryId = source.category as SourceCategoryId;
  const accent = getCategoryColor(categoryId);
  const bg = getCategoryBgColor(categoryId);
  const CategoryIcon = SOURCE_CATEGORY_ICONS[categoryId];
  const description = getCategoryDescription(categoryId);

  // Look up the active cell's value so the Lesebeispiel sentence has
  // a number to interpret. Null → LesebeispielSource silently returns
  // null and the divider/Lesebeispiel block is skipped.
  const metricDef = sourceData.metrics[metric];
  const rawValue = metricDef?.data?.[group]?.[String(source.id)];
  const value = typeof rawValue === 'number' ? rawValue : null;

  return (
    <div
      className="carm-spannweite__tooltip carm-sources-tooltip"
      role="tooltip"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: bg,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div className="carm-spannweite__tooltip-row">
        <div className="carm-spannweite__tooltip-myth">{source.name}</div>
        {CategoryIcon && (
          <span
            className="carm-spannweite__tooltip-glyph"
            style={{ color: accent }}
            aria-hidden="true"
          >
            <CategoryIcon size={20} strokeWidth={1.75} />
          </span>
        )}
      </div>

      {description && (
        <div className="carm-sources-tooltip__desc">{description}</div>
      )}

      {value !== null && (
        <div className="carm-spannweite__tooltip-lesebeispiel">
          <LesebeispielSource
            metric={metric}
            value={value}
            group={group}
            compactHeading
          />
        </div>
      )}
    </div>
  );
}
