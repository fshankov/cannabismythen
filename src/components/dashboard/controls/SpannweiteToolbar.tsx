/**
 * SpannweiteToolbar — dashboard toolbar for the Spannweite view (v4).
 *
 * No sort controls — sorting lives in the column headers now:
 *   - A→Z in the MYTHEN column header (upper-right)
 *   - Value asc/desc in each data column's header (upper-right)
 *
 * The toolbar renders the shared PivotToggle (Indikatoren ↔ Gruppen)
 * + "Wert für" DataPicker that drives the off-axis dimension each
 * cell reads from. Filter + Export pass through via `sharedActions`.
 */

import type { ReactNode } from 'react';
import {
  Eye, TrendingUp, Target, Shield, Globe,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  AppState, Group, GroupId, Indicator, StripsMode,
  DashboardDefinitions,
} from '../../../lib/dashboard/types';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import PivotToggle from './PivotToggle';
import DataPicker, { type DataPickerOption } from './DataPicker';
import ToolbarRow from './ToolbarRow';

const INDICATORS: Indicator[] = [
  'awareness', 'significance', 'correctness',
  'prevention_significance', 'population_relevance',
];
const STRIP_GROUP_IDS: GroupId[] = [
  'adults', 'minors', 'consumers', 'young_adults', 'parents',
];

const INDICATOR_ICONS: Record<Indicator, LucideIcon> = {
  awareness: Eye,
  significance: TrendingUp,
  correctness: Target,
  prevention_significance: Shield,
  population_relevance: Globe,
};

const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  adults: Users,
  minors: Baby,
  consumers: Cannabis,
  young_adults: GraduationCap,
  parents: UsersRound,
};

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  groups: Group[];
  definitions?: DashboardDefinitions | null;
  sharedActions?: ReactNode;
}

export default function SpannweiteToolbar({
  state, update, groups, definitions, sharedActions,
}: Props) {
  const mode: StripsMode = state.stripsMode;

  // "Wert für" picker options swap with the pivot — same pattern as
  // StripsToolbar. When columns are indicators, the picker selects the
  // GROUP each cell reads from (and vice versa).
  const valueOptions: DataPickerOption<string>[] =
    mode === 'indicator'
      ? STRIP_GROUP_IDS.map((gid) => {
          const g = groups.find((x) => x.id === gid);
          const def = definitions?.groups?.[gid];
          const fullLabel = g ? (state.lang === 'de' ? g.name_de : g.name_en) : gid;
          return {
            value: gid as string,
            label: fullLabel,
            Icon: GROUP_ICONS[gid],
            definition:
              def?.label && def?.definition
                ? { title: def.label, text: def.definition, sampleSize: def.sampleSize }
                : undefined,
          };
        })
      : INDICATORS.map((ind) => {
          const def = definitions?.mythIndicators?.[ind];
          const label = t(`indicator.${ind}.short` as TranslationKey, state.lang);
          return {
            value: ind as string,
            label,
            Icon: INDICATOR_ICONS[ind],
            definition:
              def?.label && def?.definition
                ? { title: def.label, text: def.definition, scale: def.scale }
                : undefined,
          };
        });

  const activeId =
    mode === 'indicator'
      ? state.groupIds[0] ?? STRIP_GROUP_IDS[0]
      : state.indicator;

  const onPickerChange = (next: string) => {
    if (mode === 'indicator') {
      update('groupIds', [next as GroupId]);
    } else {
      update('indicator', next as Indicator);
    }
  };

  return (
    <ToolbarRow
      aria-label={t('strips.compare.label', state.lang)}
      pickers={[
        <PivotToggle<StripsMode>
          key="mode"
          aria-label={t('strips.compare.label', state.lang)}
          value={mode}
          onChange={(v) => update('stripsMode', v)}
          options={[
            { value: 'indicator', label: t('strips.mode.indicator', state.lang) },
            { value: 'group', label: t('strips.mode.group', state.lang) },
          ]}
        />,
        <DataPicker<string>
          key="value"
          caption={t('strips.value.label', state.lang)}
          value={activeId}
          options={valueOptions}
          onChange={onPickerChange}
          aria-label={t('strips.value.label', state.lang)}
          lang={state.lang}
        />,
      ]}
      actions={sharedActions}
    />
  );
}
