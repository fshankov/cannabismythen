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

import type { ReactNode } from "react";
import {
  SOURCE_METRIC_ICONS,
  AUDIENCE_ICONS_BY_GROUP,
  type IconComponent,
} from "../../../lib/icons";
import type {
  AppState,
  DashboardDefinitions,
  SourceMetricType,
  SourceGroupId,
  SourcesStripsMode,
} from "../../../lib/dashboard/types";
import { t } from "../../../lib/dashboard/translations";
import PivotToggle from "./PivotToggle";
import DataPicker, { type DataPickerOption } from "./DataPicker";
import ToolbarRow from "./ToolbarRow";

const METRICS: SourceMetricType[] = [
  "search",
  "perception",
  "trust",
  "prevention",
];
const GROUPS: SourceGroupId[] = [
  "adults",
  "minors",
  "consumers",
  "young_adults",
  "parents",
];

const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: "Suche",
  perception: "Wahrnehmung",
  trust: "Vertrauen",
  prevention: "Prävention",
};

const METRIC_ICONS: Record<SourceMetricType, IconComponent> =
  SOURCE_METRIC_ICONS;

const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: "Volljährige (18–70)",
  minors: "Minderjährige (16–17)",
  consumers: "Konsument:innen",
  young_adults: "Junge Erwachsene (18–26)",
  parents: "Eltern",
};

const GROUP_ICONS: Record<SourceGroupId, IconComponent> =
  AUDIENCE_ICONS_BY_GROUP;

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
  sharedActions?: ReactNode;
}

export default function SourcesSpannweiteToolbar({
  state,
  update,
  definitions,
  sharedActions,
}: Props) {
  const mode: SourcesStripsMode = state.sourcesStripsMode;
  // (Fedor 2026-05-15) — A–Z sort relocated INTO the QUELLEN column
  // header so it lives next to the per-column value sort affordances.
  // The toolbar's pivot slot is left empty intentionally; the
  // PivotToggle moves down into the pickers row.

  // v5 (2026-05-26) — same swap as SpannweiteToolbar: the toggle name
  // names the picker dimension. "Indikatoren" pivot → picker = metric,
  // columns = 5 groups. "Gruppen" pivot → picker = group (population
  // selector — Fedor's term), columns = 4 metrics. The picker and the
  // columns are always different dimensions; the toggle dictates which.
  const valueOptions: DataPickerOption<string>[] =
    mode === "metric"
      ? METRICS.map((m) => {
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
        })
      : GROUPS.map((gid) => {
          const def = definitions?.groups?.[gid];
          return {
            value: gid as string,
            label: GROUP_LABELS[gid],
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

  const activeId = mode === "metric" ? state.sourceMetric : state.sourceGroup;

  const onPickerChange = (next: string) => {
    if (mode === "metric") {
      update("sourceMetric", next as SourceMetricType);
    } else {
      update("sourceGroup", next as SourceGroupId);
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
          onChange={(v) => update("sourcesStripsMode", v)}
          options={[
            { value: "metric", label: "Indikatoren" },
            { value: "group", label: "Gruppen" },
          ]}
        />,
        <DataPicker<string>
          key="value"
          // v4 (2026-05-26): unify with SpannweiteToolbar's "Wert für"
          // caption so Quellen-Spannweite + Quellen-Tabelle read the
          // same as Mythen-Spannweite + Mythen-Tabelle. The picker's
          // options swap by pivot (groups vs metrics) but the caption
          // stays put — it's always "the off-axis dimension".
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
