/**
 * SortToggle — single-button sort direction toggle.
 *
 * Replaces the older trio of "↓ nach Wert / ↑ nach Wert / Nach Kategorie"
 * chips. Click flips between ascending and descending; the visible label
 * (e.g. "Wert ↓") includes the arrow itself, so a separate Lucide icon
 * would only repeat what the label already says.
 *
 * Lives left-most in the dashboard toolbar — drives `state.balkenSort`
 * for the Balken view (Tabelle has its own column-click sort and hides
 * this control).
 */

import type { BalkenSort } from '../../../lib/dashboard/types';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  value: BalkenSort;
  onChange: (next: BalkenSort) => void;
}

export default function SortToggle({ value, onChange }: Props) {
  const isDesc = value === 'value-desc';
  const label = isDesc
    ? t('sort.toggle.label.desc', 'de')
    : t('sort.toggle.label.asc', 'de');
  return (
    <button
      type="button"
      className="carm-btn carm-btn--ghost carm-sort-toggle"
      aria-label={t('sort.toggle.aria', 'de').replace('{dir}', label)}
      aria-pressed={isDesc}
      onClick={() => onChange(isDesc ? 'value-asc' : 'value-desc')}
    >
      {label}
    </button>
  );
}
