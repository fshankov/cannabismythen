/**
 * SpannweiteToolbar — dashboard toolbar for the Spannweite view (v3.1).
 *
 * Two toggleable sort buttons:
 *   - Alphabetisch: A→Z ↔ Z→A (Lucide ArrowDownAZ / ArrowDownZA)
 *   - Verdict-Rang: Richtig→Falsch ↔ Falsch→Richtig
 *     (custom gradient arrow icon: emerald → rose / rose → emerald)
 *
 * Plus the Punktwolke-shared PivotToggle (Indikatoren ↔ Gruppen) and
 * "Wert für" DataPicker that drives the off-axis dimension each cell
 * reads from. Filter + Export pass through via `sharedActions`.
 */

import type { ReactNode } from 'react';
import {
  Eye, TrendingUp, Target, Shield, Globe,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
  ArrowDownAZ,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  AppState, Group, GroupId, Indicator, StripsMode,
  DashboardDefinitions, SpannweiteSort,
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

/** Custom verdict-rank sort icon — based on Lucide `ArrowDownToLine`.
 *  The vertical shaft + chevron use currentColor (matching the
 *  button's text colour); the BOTTOM HORIZONTAL RULE is recoloured to
 *  signal which verdict ends up at the bottom of the sort:
 *    - direction='r-to-f' (richtig → falsch) → bottom line ROSE-700
 *    - direction='f-to-r' (falsch → richtig) → bottom line EMERALD-700
 *  When the verdict sort is inactive, the icon still renders so the
 *  button reads the same — clicking it activates the saved direction.
 */
function VerdictArrowDownToLine({
  direction,
  size = 16,
}: {
  direction: 'r-to-f' | 'f-to-r';
  size?: number;
}) {
  // Bottom rule colour follows the verdict that ends up at the BOTTOM
  // of the sort (i.e. where the arrow's tip points).
  const lineColor = direction === 'r-to-f' ? '#be123c' : '#047857';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Vertical shaft + chevron — use currentColor. */}
      <path d="M12 17V3" />
      <path d="m6 11 6 6 6-6" />
      {/* Bottom horizontal rule — verdict-coloured. */}
      <path d="M19 21H5" stroke={lineColor} />
    </svg>
  );
}

export default function SpannweiteToolbar({
  state, update, groups, definitions, sharedActions,
}: Props) {
  const mode: StripsMode = state.stripsMode;
  const sort: SpannweiteSort = state.spannweiteSort ?? 'a-z';

  const isAlpha = sort === 'a-z';
  const isVerdict = sort === 'verdict-r-to-f' || sort === 'verdict-f-to-r';

  // Verdict button "remembers" its last-active direction so users see
  // the same colour cue every time they look at the button. Falls back
  // to richtig→falsch when verdict mode has never been used.
  const verdictDirection: 'r-to-f' | 'f-to-r' =
    sort === 'verdict-f-to-r' ? 'f-to-r' : 'r-to-f';

  /** Activate alphabetical sort. No-op if already active. */
  const onClickAlpha = () => {
    if (!isAlpha) update('spannweiteSort', 'a-z');
  };
  /** Activate or flip verdict-rank sort. */
  const onClickVerdict = () => {
    if (sort === 'verdict-r-to-f') update('spannweiteSort', 'verdict-f-to-r');
    else if (sort === 'verdict-f-to-r') update('spannweiteSort', 'verdict-r-to-f');
    else update('spannweiteSort', 'verdict-r-to-f');
  };

  const alphaTip = t('spannweite.sort.alpha.tooltip', state.lang);
  const verdictTip = isVerdict
    ? (verdictDirection === 'r-to-f'
        ? t('spannweite.sort.verdict.r-to-f.tooltip', state.lang)
        : t('spannweite.sort.verdict.f-to-r.tooltip', state.lang))
    : t('spannweite.sort.verdict.activate.tooltip', state.lang);

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
      pivot={
        <div
          className="carm-sort-group carm-sort-group--icon"
          role="group"
          aria-label={t('sort.label', state.lang)}
        >
          <button
            type="button"
            className={`carm-btn carm-sort-btn carm-sort-btn--icon${isAlpha ? ' carm-sort-btn--active' : ''}`}
            onClick={onClickAlpha}
            aria-pressed={isAlpha}
            aria-label={alphaTip}
            title={alphaTip}
          >
            <ArrowDownAZ size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`carm-btn carm-sort-btn carm-sort-btn--icon${isVerdict ? ' carm-sort-btn--active' : ''}`}
            onClick={onClickVerdict}
            aria-pressed={isVerdict}
            aria-label={verdictTip}
            title={verdictTip}
          >
            <VerdictArrowDownToLine direction={verdictDirection} />
          </button>
        </div>
      }
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
