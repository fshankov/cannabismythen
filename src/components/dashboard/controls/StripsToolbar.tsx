/**
 * StripsToolbar — dashboard toolbar for the Punktwolke (Streifen) view.
 *
 * Stage 6 v3: hoisted out of StripsView so all four dashboard tabs
 * render their toolbar at the SAME page-level position (alongside
 * Balken / Tabelle / Sources). Eliminates the visual misalignment
 * caused by Punktwolke nesting its toolbar inside chart-area while
 * Balken / Tabelle render at app-layout level.
 *
 * Pivot toggle (Indikatoren | Gruppen) drives `state.stripsMode`.
 * The dropdown ("Wert für: …") swaps content based on mode:
 *  - mode === 'indicator' → group picker (active group = state.groupIds[0])
 *  - mode === 'group'     → indicator picker (active = state.indicator)
 */

import type { ReactNode } from 'react';
import {
  Eye, TrendingUp, Target, Shield, Globe,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  AppState,
  Group,
  GroupId,
  Indicator,
  StripsMode,
  DashboardDefinitions,
} from '../../../lib/dashboard/types';
import { t, type TranslationKey } from '../../../lib/dashboard/translations';
import PivotToggle from './PivotToggle';
import DataPicker, { type DataPickerOption } from './DataPicker';
import ToolbarRow from './ToolbarRow';

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

const STRIP_GROUP_IDS: GroupId[] = [
  'adults',
  'minors',
  'consumers',
  'young_adults',
  'parents',
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

const GROUP_SHORT_DE: Record<GroupId, string> = {
  adults: 'Erw.',
  minors: 'Minderj.',
  consumers: 'Konsum.',
  young_adults: 'Junge Erw.',
  parents: 'Eltern',
};
const GROUP_SHORT_EN: Record<GroupId, string> = {
  adults: 'Adults',
  minors: 'Minors',
  consumers: 'Cons.',
  young_adults: 'Y. Adults',
  parents: 'Parents',
};

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  groups: Group[];
  definitions?: DashboardDefinitions | null;
  /** Right-aligned action chips (Mythos suchen, Filter, Exportieren). */
  sharedActions?: ReactNode;
}

export default function StripsToolbar({
  state,
  update,
  groups,
  definitions,
  sharedActions,
}: Props) {
  const mode: StripsMode = state.stripsMode;

  // Build the option list for the "Wert für" picker. Content depends
  // on the active pivot — when the pivot is "Indikatoren" the strips
  // are indicators, so the user picks the GROUP from this dropdown
  // (and vice versa).
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
                ? {
                    title: def.label,
                    text: def.definition,
                    sampleSize: def.sampleSize,
                  }
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
                ? {
                    title: def.label,
                    text: def.definition,
                    scale: def.scale,
                  }
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

  // Mobile-friendly short labels live on the picker options' label —
  // we keep the long label for the dropdown menu and rely on the
  // shared `.carm-toolbar-row__picker` ellipsis rule to truncate the
  // active value at narrow widths.
  void GROUP_SHORT_DE;
  void GROUP_SHORT_EN;

  return (
    <ToolbarRow
      aria-label={t('strips.compare.label', state.lang)}
      pivot={
        <PivotToggle<StripsMode>
          aria-label={t('strips.compare.label', state.lang)}
          value={mode}
          onChange={(v) => update('stripsMode', v)}
          options={[
            { value: 'indicator', label: t('strips.mode.indicator', state.lang) },
            { value: 'group', label: t('strips.mode.group', state.lang) },
          ]}
        />
      }
      pickers={[
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
