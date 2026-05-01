/**
 * SortToggle — single-button sort direction toggle.
 *
 * Replaces the older trio of "↓ nach Wert / ↑ nach Wert / Nach Kategorie"
 * chips. Click flips between ascending and descending; the visible label
 * reflects the current direction so the affordance reads as a stateful
 * toggle, not a destination.
 *
 * Lives left-most in the dashboard toolbar — drives `state.balkenSort`
 * for the Balken (and Tabelle, when wired) views.
 */

import { ArrowDownZA, ArrowDownAZ } from 'lucide-react';
import type { BalkenSort } from '../../../lib/dashboard/types';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  value: BalkenSort;
  onChange: (next: BalkenSort) => void;
}

export default function SortToggle({ value, onChange }: Props) {
  const isDesc = value === 'value-desc';
  const Icon = isDesc ? ArrowDownZA : ArrowDownAZ;
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
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {label}
    </button>
  );
}
