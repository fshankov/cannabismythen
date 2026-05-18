import { useEffect, useState } from "react";

/**
 * Returns the current viewport width in pixels. `undefined` during SSR
 * and on the first client render before the layout effect runs.
 *
 * Used by ECharts view components to switch chart density at the
 * `--bp-sm` (480px) boundary (docs/ai-pipeline/known-quirks.md quirk #5).
 */
export function useViewportWidth(): number | undefined {
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}
