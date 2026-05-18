/**
 * SourcesSpannweiteToolbar — dashboard toolbar for the new
 * "Informationsquellen-Spannweite" view (sources2).
 *
 * Layout mirrors SpannweiteToolbar:
 *   - pivot slot: single A–Z icon button (.carm-sort-group--icon)
 *   - pickers:    PivotToggle<SourcesStripsMode> + "Wert für" DataPicker
 *   - actions:    sharedActions (Exportieren chip)
 *
 * Pivot state (state.sourcesStripsMode) is shared with the legacy
 * Sources view so flipping between tabs preserves the user's
 * orientation. No verdict-rank sort here — sources aren't classified.
 */

import type { ReactNode } from 'react';
import {
  SOURCE_METRIC_ICONS,
  AUDIENCE_ICONS_BY_GROUP,
  type IconComponent,
} from '../../../lib/icons';
import type {
  AppState,
  DashboardDefinitions,
  SourceMetricType,
  SourceGroupId,
  SourcesStripsMode,
} from '../../../lib/dashboard/types';
import { t } from '../../../lib/dashboard/translations';
import PivotToggle from './PivotToggle';
import DataPicker, { type DataPickerOption } from './DataPicker';
import ToolbarRow from './ToolbarRow';

const METRICS: SourceMetricType[] = ['search', 'perception', 'trust', 'prevention'];
const GROUPS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Prävention',
};

const METRIC_ICONS: Record<SourceMetricType, IconComponent> = SOURCE_METRIC_ICONS;

const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: 'Volljährige (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsument:innen',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

const GROUP_ICONS: Record<SourceGroupId, IconComponent> = AUDIENCE_ICONS_BY_GROUP;

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
  sharedActions?: ReactNode;
}

export default function SourcesSpannweiteToolbar({
  state, update, definitions, sharedActions,
}: Props) {
  const mode: SourcesStripsMode = state.sourcesStripsMode;
  // (Fedor 2026-05-15) — A–Z sort relocated INTO the QUELLEN column
  // header so it lives next to the per-column value sort affordances.
  // The toolbar's pivot slot is left empty intentionally; the
  // PivotToggle moves down into the pickers row.

  // "Wert für" picker — when columns = metrics, picker selects a group;
  // when columns = groups, picker selects a metric. Same shape as
  // SpannweiteToolbar.
  const valueOptions: DataPickerOption<string>[] =
    mode === 'metric'
      ? GROUPS.map((gid) => {
          const def = definitions?.groups?.[gid];
          return {
            value: gid as string,
            label: GROUP_LABELS[gid],
            Icon: GROUP_ICONS[gid],
            definition:
              def?.label && def?.definition
                ? { title: def.label, text: def.definition, sampleSize: def.sampleSize }
                : undefined,
          };
        })
      : METRICS.map((m) => {
          const def = definitions?.sourcesIndicators?.[m];
          return {
            value: m as string,
            label: METRIC_LABELS[m],
            Icon: METRIC_ICONS[m],
            definition:
              def?.label && def?.definition
                ? { title: def.label, text: def.definition, scale: def.scale }
                : undefined,
          };
        });

  const activeId = mode === 'metric' ? state.sourceGroup : state.sourceMetric;

  const onPickerChange = (next: string) => {
    if (mode === 'metric') {
      update('sourceGroup', next as SourceGroupId);
    } else {
      update('sourceMetric', next as SourceMetricType);
    }
  };

  return (
    <ToolbarRow
      aria-label="Informationsquellen-Spannweite-Steuerung"
      pickers={[
        <PivotToggle<SourcesStripsMode>
          key="mode"
          aria-label="Pivot wählen"
          value={mode}
          onChange={(v) => update('sourcesStripsMode', v)}
          options={[
            { value: 'metric', label: 'Indikatoren' },
            { value: 'group', label: 'Gruppen' },
          ]}
        />,
        <DataPicker<string>
          key="value"
          caption={mode === 'metric' ? 'Bevölkerungsgruppe' : 'Indikator'}
          value={activeId}
          options={valueOptions}
          onChange={onPickerChange}
          aria-label={mode === 'metric' ? 'Bevölkerungsgruppe' : 'Indikator'}
          lang={state.lang}
        />,
      ]}
      actions={sharedActions}
    />
  );
}
