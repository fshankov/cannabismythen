/**
 * GridDataHeader — shared header content for any indicator/group data
 * column across Spannweite, Balken, and Tabelle.
 *
 * Renders the canonical Spannweite header chrome:
 *   - EyeOff hide button (top-left)
 *   - Icon + label + InfoTooltip cluster (center)
 *   - Sort button (top-right) — ArrowDown01/10 with .is-active state
 *
 * Headless: returns a fragment. Consumer wraps in <div> (grid views)
 * or <th> (table views) and applies the `carm-spannweite__cell` +
 * `carm-spannweite__cell--header` classes on the wrapper.
 *
 * For hidden columns (collapsed 28px placeholder), use the
 * `GridHiddenHeader` component instead.
 */
import type { ReactNode } from 'react';
import { EyeOff, ArrowDown01, ArrowDown10 } from 'lucide-react';
import InfoTooltip from '../InfoTooltip';
import type { IconComponent } from '../../../lib/icons';

interface Props {
  Icon: IconComponent;
  label: string;
  fullLabel: string;
  defTitle?: string;
  defText?: string;
  defScale?: string;
  defSampleSize?: string;
  hideLabel: string;
  onHide: () => void;
  /** True when this column is the active sort column. Drives is-active
   *  styling on the sort button and the asc/desc icon swap. */
  isSortActive: boolean;
  /** Only meaningful when isSortActive=true. */
  sortDir?: 'asc' | 'desc';
  sortTooltip: string;
  onSortClick: () => void;
  /** Optional extra cluster slot (rarely used) rendered before the
   *  sort button. */
  trailingExtra?: ReactNode;
}

export default function GridDataHeader({
  Icon,
  label,
  fullLabel,
  defTitle,
  defText,
  defScale,
  defSampleSize,
  hideLabel,
  onHide,
  isSortActive,
  sortDir,
  sortTooltip,
  onSortClick,
  trailingExtra,
}: Props) {
  const isDesc = isSortActive && sortDir === 'desc';
  return (
    <>
      {/* Upper-LEFT sort button (2026-05-21 swap). */}
      <button
        type="button"
        className={`carm-spannweite__col-sort-btn${isSortActive ? ' is-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSortClick();
        }}
        aria-pressed={isSortActive}
        aria-label={sortTooltip}
        title={sortTooltip}
      >
        {isDesc ? (
          <ArrowDown10 size={14} strokeWidth={2} aria-hidden="true" />
        ) : (
          <ArrowDown01 size={14} strokeWidth={2} aria-hidden="true" />
        )}
      </button>
      <span
        className="carm-spannweite__header-inner"
        title={defText ? `${fullLabel} — ${defText}` : fullLabel}
      >
        <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
        <span className="carm-spannweite__header-text">{label}</span>
        {defTitle && defText && (
          <span className="carm-spannweite__info-inline">
            <InfoTooltip
              title={defTitle}
              definition={defText}
              scale={defScale}
              sampleSize={defSampleSize}
            />
          </span>
        )}
      </span>
      {trailingExtra}
      {/* Upper-RIGHT EyeOff hide button (2026-05-21 swap). */}
      <button
        type="button"
        className="carm-spannweite__hide-btn"
        onClick={(e) => {
          e.stopPropagation();
          onHide();
        }}
        aria-label={hideLabel}
        title={hideLabel}
      >
        <EyeOff size={11} strokeWidth={2} aria-hidden="true" />
      </button>
    </>
  );
}
