import type { AppState, GroupId, Indicator } from '../../../lib/dashboard/types';
import { t } from '../../../lib/dashboard/translations';

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

const GROUPS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

interface Option<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Group ids that should be greyed for the current indicator. */
  disabledGroups?: GroupId[];
  /** Reason text shown on hover/tap of disabled groups. */
  disabledGroupReason?: string;
}

function PillRow<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="carm-pill-group">
      <legend className="carm-pill-group__legend">{legend}</legend>
      <div className="carm-pill-group__row" role="radiogroup" aria-label={legend}>
        {options.map((o) => {
          const isActive = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-disabled={o.disabled || undefined}
              tabIndex={isActive ? 0 : -1}
              title={o.disabled ? o.disabledReason : undefined}
              className={`carm-pill${isActive ? ' is-active' : ''}${o.disabled ? ' is-disabled' : ''}`}
              onClick={() => {
                if (!o.disabled) onChange(o.value);
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function NativeSelectRow<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="carm-native-select">
      <span className="carm-native-select__legend">{legend}</span>
      <select
        className="carm-native-select__control"
        value={value}
        onChange={(e) => {
          const next = e.target.value as T;
          const opt = options.find((o) => o.value === next);
          if (opt && !opt.disabled) onChange(next);
        }}
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            title={o.disabled ? o.disabledReason : undefined}
          >
            {o.label}
            {o.disabled ? ' —' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function IndicatorGroupSelector({
  state,
  update,
  disabledGroups = [],
  disabledGroupReason,
}: Props) {
  const indicatorOptions: Option<Indicator>[] = INDICATORS.map((i) => ({
    value: i,
    label: t(`indicator.${i}.short`, 'de'),
  }));
  const groupOptions: Option<GroupId>[] = GROUPS.map((g) => ({
    value: g,
    label: t(`igs.group.${g}`, 'de'),
    disabled: disabledGroups.includes(g),
    disabledReason: disabledGroupReason,
  }));

  const groupValue: GroupId = state.groupIds[0] ?? 'adults';

  const setIndicator = (v: Indicator) => update('indicator', v);
  const setGroup = (v: GroupId) => update('groupIds', [v]);

  return (
    <div className="carm-igs">
      <div className="carm-igs__mobile">
        <NativeSelectRow
          legend={t('igs.indicator.legend', 'de')}
          value={state.indicator}
          options={indicatorOptions}
          onChange={setIndicator}
        />
        <NativeSelectRow
          legend={t('igs.group.legend', 'de')}
          value={groupValue}
          options={groupOptions}
          onChange={setGroup}
        />
      </div>
      <div className="carm-igs__desktop">
        <PillRow
          legend={t('igs.indicator.legend', 'de')}
          value={state.indicator}
          options={indicatorOptions}
          onChange={setIndicator}
        />
        <PillRow
          legend={t('igs.group.legend', 'de')}
          value={groupValue}
          options={groupOptions}
          onChange={setGroup}
        />
      </div>
    </div>
  );
}
