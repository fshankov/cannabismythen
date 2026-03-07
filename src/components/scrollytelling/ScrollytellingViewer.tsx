/**
 * ScrollytellingViewer — Interactive scrollytelling component (React + D3).
 *
 * TODO: Implement scroll-driven narrative:
 * - Intersection Observer for scroll triggers
 * - D3 charts that animate between steps
 * - Step-by-step narrative text panels
 * - Chart type switching per step (bar, dot array, etc.)
 * - Mobile-responsive layout
 *
 * This component will replace the static Markdoc rendering
 * on scrollytelling detail pages once implemented.
 */

interface ScrollytellingViewerProps {
  versionLabel: string;
  title: string;
  stepCount: number;
}

export default function ScrollytellingViewer({
  versionLabel,
  title,
  stepCount,
}: ScrollytellingViewerProps) {
  return (
    <div className="scrollytelling-viewer">
      <p className="scrollytelling-viewer__placeholder">
        <em>
          Interaktives Scrollytelling „{title}" (Version {versionLabel},{" "}
          {stepCount} Schritte) wird in einer zukünftigen Version implementiert.
        </em>
      </p>
    </div>
  );
}
