/**
 * DashboardChart — Interactive D3 visualization component (React).
 *
 * TODO: Implement D3 visualizations:
 * - Bar charts comparing indicators across myths
 * - Audience segment comparison views
 * - Sortable/filterable indicator tables
 * - Tooltip interactivity
 *
 * This component will be embedded in dashboard pages
 * to provide interactive data exploration.
 */

interface DashboardChartProps {
  audienceSegment: string;
  title: string;
}

export default function DashboardChart({
  audienceSegment,
  title,
}: DashboardChartProps) {
  return (
    <div className="dashboard-chart">
      <p className="dashboard-chart__placeholder">
        <em>
          Interaktive Visualisierung für „{title}" ({audienceSegment})
          wird in einer zukünftigen Version implementiert.
        </em>
      </p>
    </div>
  );
}
