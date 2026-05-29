/**
 * SourcesBalkenToolbar — panel-level toolbar for the Quellen-Balken view
 * (Informationsquellen / state.view === 'sources').
 *
 * 2026-05-29: extracted out of `SourcesBalkenView` so the Quellen-Balken
 * toolbar renders at the panel level like every other dashboard tab
 * (Mythen-Balken's ToolbarRow, Spannweite/Sources2's toolbars). Before
 * this, its toolbar was nested INSIDE chart-area, which left the
 * chart-area's hairline top border showing as a stray line ABOVE the
 * filter menu. Lifting it out makes all six tabs structurally identical.
 *
 * Mirrors SourcesSpannweiteToolbar but with NO PivotToggle — Quellen-
 * Balken, like Mythen-Balken, just exposes the Indikatoren + Gruppe
 * pickers (writes state.sourceMetric / state.sourceGroup). The right-side
 * actions slot (search + Exportieren + Rundgang badge) comes from the
 * parent via `sharedActions`.
 */

import type { ReactNode } from 'react';
import {
  AUDIENCE_ICONS_BY_GROUP,
  SOURCE_METRIC_ICONS,
} from '../../../lib/icons/lookups';
import type {
  AppState,
  SourceGroupId,
  SourceMetricType,
} from '../../../lib/dashboard/types';
import { t } from '../../../lib/dashboard/translations';
import DataPicker, { type DataPickerOption } from './DataPicker';
import ToolbarRow from './ToolbarRow';

const METRIC_OPTIONS: DataPickerOption<SourceMetricType>[] = [
  { value: 'search', label: 'Suche', Icon: SOURCE_METRIC_ICONS.search },
  { value: 'perception', label: 'Wahrnehmung', Icon: SOURCE_METRIC_ICONS.perception },
  { value: 'trust', label: 'Vertrauen', Icon: SOURCE_METRIC_ICONS.trust },
  { value: 'prevention', label: 'Prävention', Icon: SOURCE_METRIC_ICONS.prevention },
];

const GROUP_OPTIONS: DataPickerOption<SourceGroupId>[] = [
  { value: 'adults', label: 'Erwachsene (18–70)', Icon: AUDIENCE_ICONS_BY_GROUP.adults },
  { value: 'minors', label: 'Minderjährige (16–17)', Icon: AUDIENCE_ICONS_BY_GROUP.minors },
  { value: 'consumers', label: 'Konsumierende', Icon: AUDIENCE_ICONS_BY_GROUP.consumers },
  { value: 'young_adults', label: 'Junge Erwachsene (18–26)', Icon: AUDIENCE_ICONS_BY_GROUP.young_adults },
  { value: 'parents', label: 'Eltern', Icon: AUDIENCE_ICONS_BY_GROUP.parents },
];

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  sharedActions?: ReactNode;
}

export default function SourcesBalkenToolbar({ state, update, sharedActions }: Props) {
  return (
    <ToolbarRow
      aria-label={t('filter.title', 'de')}
      pickers={[
        <DataPicker<SourceMetricType>
          key="metric"
          caption={t('igs.indicator.legend', state.lang)}
          value={state.sourceMetric}
          options={METRIC_OPTIONS}
          onChange={(v) => update('sourceMetric', v)}
          aria-label={t('igs.indicator.legend', state.lang)}
          lang={state.lang}
        />,
        <DataPicker<SourceGroupId>
          key="group"
          caption={t('igs.group.legend', state.lang)}
          value={state.sourceGroup}
          options={GROUP_OPTIONS}
          onChange={(v) => update('sourceGroup', v)}
          aria-label={t('igs.group.legend', state.lang)}
          lang={state.lang}
        />,
      ]}
      actions={sharedActions}
    />
  );
}
