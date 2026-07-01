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

import type { ReactNode } from "react";
import {
  INDICATOR_ICONS as ICONS_INDICATOR,
  AUDIENCE_ICONS_BY_GROUP,
  type IconComponent,
} from "../../../lib/icons";
import type {
  AppState,
  Group,
  GroupId,
  Indicator,
  StripsMode,
  DashboardDefinitions,
} from "../../../lib/dashboard/types";
import { t, type TranslationKey } from "../../../lib/dashboard/translations";
import PivotToggle from "./PivotToggle";
import DataPicker, { type DataPickerOption } from "./DataPicker";
import ToolbarRow from "./ToolbarRow";

const INDICATORS: Indicator[] = [
  "awareness",
  "significance",
  "correctness",
  "prevention_significance",
  "population_relevance",
];
const STRIP_GROUP_IDS: GroupId[] = [
  "adults",
  "minors",
  "consumers",
  "young_adults",
  "parents",
];

const INDICATOR_ICONS: Record<Indicator, IconComponent> = ICONS_INDICATOR;
const GROUP_ICONS: Record<GroupId, IconComponent> = AUDIENCE_ICONS_BY_GROUP;

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  groups: Group[];
  definitions?: DashboardDefinitions | null;
  sharedActions?: ReactNode;
}

export default function SpannweiteToolbar({
  state,
  update,
  groups,
  definitions,
  sharedActions,
}: Props) {
  const mode: StripsMode = state.stripsMode;

  // v5 (2026-05-26) — swap the picker semantics so the toggle name
  // matches the picker dimension: "Indikatoren" pivot = "I'm picking
  // one indicator", "Gruppen" pivot = "I'm picking one group". The
  // OTHER dimension becomes the comparison axis (columns). Resolves
  // Fedor's confusion that "Wert für: Prävention" appeared in Gruppen
  // mode when groups should be the picker, not metrics.
  const valueOptions: DataPickerOption<string>[] =
    mode === "indicator"
      ? INDICATORS.map((ind) => {
          const def = definitions?.mythIndicators?.[ind];
          const label = t(
            `indicator.${ind}.short` as TranslationKey,
            state.lang,
          );
          return {
            value: ind as string,
            label,
            Icon: INDICATOR_ICONS[ind],
            definition:
              def?.label && def?.definition
                ? { title: def.label, text: def.definition, scale: def.scale }
                : undefined,
          };
        })
      : STRIP_GROUP_IDS.map((gid) => {
          const g = groups.find((x) => x.id === gid);
          const def = definitions?.groups?.[gid];
          const fullLabel = g
            ? state.lang === "de"
              ? g.name_de
              : g.name_en
            : gid;
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
        });

  const activeId =
    mode === "indicator"
      ? state.indicator
      : (state.groupIds[0] ?? STRIP_GROUP_IDS[0]);

  const onPickerChange = (next: string) => {
    if (mode === "indicator") {
      update("indicator", next as Indicator);
    } else {
      update("groupIds", [next as GroupId]);
    }
  };

  return (
    <ToolbarRow
      aria-label={t("strips.compare.label", state.lang)}
      pickers={[
        <PivotToggle<StripsMode>
          key="mode"
          aria-label={t("strips.compare.label", state.lang)}
          value={mode}
          onChange={(v) => update("stripsMode", v)}
          options={[
            {
              value: "indicator",
              label: t("strips.mode.indicator", state.lang),
            },
            { value: "group", label: t("strips.mode.group", state.lang) },
          ]}
        />,
        <DataPicker<string>
          key="value"
          caption={t("strips.value.label", state.lang)}
          value={activeId}
          options={valueOptions}
          onChange={onPickerChange}
          aria-label={t("strips.value.label", state.lang)}
          lang={state.lang}
        />,
      ]}
      actions={sharedActions}
    />
  );
}
