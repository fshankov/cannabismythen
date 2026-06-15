/**
 * GridLabelHeader — shared header content for the LEFT-MOST "label"
 * column (the myth/identity column) across Spannweite, Balken, and
 * Tabelle.
 *
 * Renders (post-2026-05-22 verdict-rank revival):
 *   - A-Z sort button at upper-LEFT (alphabetical sort affordance)
 *   - the column label text, centered
 *   - optional verdict-rank sort button at upper-RIGHT — when the
 *     host view passes `verdictRank` props, this second button
 *     toggles between richtig→falsch (asc) and falsch→richtig (desc)
 *
 * Headless: returns a fragment. Consumer wraps in <div> (grid views)
 * or <th> (table views) with the `carm-spannweite__cell` +
 * `carm-spannweite__cell--header` + `carm-spannweite__cell--label`
 * classes on the wrapper.
 */
import { ArrowDownAZ } from 'lucide-react';
import {
  IconVerdictRankAsc,
  IconVerdictRankDesc,
  IconCategoryRankAsc,
  IconCategoryRankDesc,
} from '../../../lib/icons';

interface Props {
  labelText: string;
  isAzActive: boolean;
  azTooltip: string;
  onAzClick: () => void;
  /** Optional verdict-rank sort affordance. When provided, renders a
   *  second button at the upper-RIGHT of the cell with stacked
   *  green/red dots indicating richtig→falsch or falsch→richtig
   *  direction. Click toggles the direction. */
  verdictRank?: {
    isActive: boolean;
    direction: 'asc' | 'desc';
    tooltip: string;
    onClick: () => void;
  };
  /** Optional source-category sort affordance — the Quellen analogue of
   *  `verdictRank`. Renders a second button at the upper-RIGHT (stacked
   *  category-rank glyph) that sorts sources by their category. A view
   *  uses either `verdictRank` (Mythen) or `categoryRank` (Quellen). */
  categoryRank?: {
    isActive: boolean;
    direction: 'asc' | 'desc';
    tooltip: string;
    onClick: () => void;
  };
}

export default function GridLabelHeader({
  labelText,
  isAzActive,
  azTooltip,
  onAzClick,
  verdictRank,
  categoryRank,
}: Props) {
  return (
    <>
      {/* A-Z button is anchored to the upper-LEFT corner of the cell
          via the `--top-left` modifier (mirrors EyeOff's position on
          data column headers). Rendered first so the keyboard tab
          order goes button → label. */}
      <button
        type="button"
        className={`carm-spannweite__col-sort-btn carm-spannweite__col-sort-btn--top-left${isAzActive ? ' is-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onAzClick();
        }}
        aria-pressed={isAzActive}
        aria-label={azTooltip}
        title={azTooltip}
      >
        <ArrowDownAZ size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="carm-spannweite__header-text">{labelText}</span>
      {verdictRank && (
        <button
          type="button"
          className={`carm-spannweite__col-sort-btn carm-spannweite__col-sort-btn--top-right${verdictRank.isActive ? ' is-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            verdictRank.onClick();
          }}
          aria-pressed={verdictRank.isActive}
          aria-label={verdictRank.tooltip}
          title={verdictRank.tooltip}
        >
          {verdictRank.direction === 'desc' ? (
            <IconVerdictRankDesc size={14} aria-hidden="true" />
          ) : (
            <IconVerdictRankAsc size={14} aria-hidden="true" />
          )}
        </button>
      )}
      {categoryRank && (
        <button
          type="button"
          className={`carm-spannweite__col-sort-btn carm-spannweite__col-sort-btn--top-right${categoryRank.isActive ? ' is-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            categoryRank.onClick();
          }}
          aria-pressed={categoryRank.isActive}
          aria-label={categoryRank.tooltip}
          title={categoryRank.tooltip}
        >
          {categoryRank.direction === 'desc' ? (
            <IconCategoryRankDesc size={14} aria-hidden="true" />
          ) : (
            <IconCategoryRankAsc size={14} aria-hidden="true" />
          )}
        </button>
      )}
    </>
  );
}
