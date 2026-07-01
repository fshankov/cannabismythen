import { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type {
  Myth,
  Metric,
  AppState,
  Indicator,
} from "../../../lib/dashboard/types";
import {
  getMythMetric,
  getIndicatorValue,
  buildTooltipHtml,
  formatValue,
} from "../../../lib/dashboard/data";
import { getCorrectnessColor } from "../../../lib/dashboard/colors";
import { t } from "../../../lib/dashboard/translations";

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onSelectMyth: (id: number) => void;
}

const INDICATORS: Indicator[] = [
  "awareness",
  "significance",
  "correctness",
  "prevention_significance",
];

export default function ScatterView({
  myths,
  metrics,
  state,
  update,
  onSelectMyth,
}: Props) {
  const groupId = state.groupIds[0] || "adults";

  // Responsive chart: tighten margins/height below 480px so the rotated axis
  // names don't crowd the plot. SSR-safe (starts false → matches the server
  // render under client:load, no hydration mismatch) and resize-reactive.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const groupName = useMemo(() => {
    const groups = [
      { id: "adults", de: "Volljährige", en: "Adults" },
      { id: "minors", de: "Minderjährige", en: "Minors" },
      {
        id: "consumers",
        de: "Konsumierende (letzte 30 Tage)",
        en: "Consumers (past 30 days)",
      },
      { id: "young_adults", de: "Junge Erwachsene", en: "Young Adults" },
      { id: "parents", de: "Eltern", en: "Parents" },
    ];
    const g = groups.find((g) => g.id === groupId);
    return g ? (state.lang === "de" ? g.de : g.en) : groupId;
  }, [groupId, state.lang]);

  const chartData = useMemo(() => {
    return myths
      .map((myth) => {
        const metric = getMythMetric(metrics, myth.id, groupId);
        const xVal = getIndicatorValue(metric, state.scatterX);
        const yVal = getIndicatorValue(metric, state.scatterY);
        return { myth, x: xVal, y: yVal };
      })
      .filter((d) => d.x !== null && d.y !== null);
  }, [myths, metrics, groupId, state.scatterX, state.scatterY]);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item" as const,
        formatter: (params: any) => {
          const d = chartData[params.dataIndex];
          if (!d) return "";
          const yLabel = t(
            `indicator.${state.scatterY}.short` as any,
            state.lang,
          );
          return buildTooltipHtml({
            myth: d.myth,
            lang: state.lang,
            groupName,
            indicator: state.scatterX,
            value: d.x,
            extraLines: [
              `${yLabel}: <strong>${formatValue(d.y, state.scatterY)}</strong>`,
            ],
          });
        },
      },
      grid: {
        left: narrow ? 52 : 80,
        right: narrow ? 16 : 30,
        top: 20,
        bottom: narrow ? 52 : 65,
      },
      xAxis: {
        type: "value" as const,
        name: t(`indicator.${state.scatterX}` as any, state.lang),
        nameLocation: "middle" as const,
        nameGap: narrow ? 26 : 40,
        max: state.scatterX === "awareness" ? 100 : undefined,
        min: 0,
        splitLine: {
          show: true,
          lineStyle: { type: "dashed" as const, color: "#e5e7eb" },
        },
      },
      yAxis: {
        type: "value" as const,
        name: t(`indicator.${state.scatterY}` as any, state.lang),
        nameLocation: "middle" as const,
        nameGap: narrow ? 34 : 55,
        max: state.scatterY === "awareness" ? 100 : undefined,
        min: 0,
        splitLine: {
          show: true,
          lineStyle: { type: "dashed" as const, color: "#e5e7eb" },
        },
      },
      series: [
        {
          type: "scatter",
          data: chartData.map((d) => ({
            value: [d.x, d.y],
            itemStyle: { color: getCorrectnessColor(d.myth.correctness_class) },
          })),
          symbolSize: 14,
          emphasis: { scale: 1.6 },
        },
      ],
    }),
    [chartData, state.lang, state.scatterX, state.scatterY, groupName, narrow],
  );

  const handleClick = (params: any) => {
    const idx = params.dataIndex;
    if (idx !== undefined && chartData[idx]) {
      onSelectMyth(chartData[idx].myth.id);
    }
  };

  return (
    <div>
      <div className="scatter-controls">
        <div className="control-group">
          <label className="control-label">
            {t("scatter.xAxis", state.lang)}
          </label>
          <select
            className="control-select"
            value={state.scatterX}
            onChange={(e) => update("scatterX", e.target.value as Indicator)}
          >
            {INDICATORS.map((ind) => (
              <option key={ind} value={ind}>
                {t(`indicator.${ind}` as any, state.lang)}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">
            {t("scatter.yAxis", state.lang)}
          </label>
          <select
            className="control-select"
            value={state.scatterY}
            onChange={(e) => update("scatterY", e.target.value as Indicator)}
          >
            {INDICATORS.map((ind) => (
              <option key={ind} value={ind}>
                {t(`indicator.${ind}` as any, state.lang)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ReactECharts
        option={option}
        style={{ height: narrow ? 380 : 500 }}
        onEvents={{ click: handleClick }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
}
