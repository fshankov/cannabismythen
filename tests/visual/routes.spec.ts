import { test, expect, stabilize } from "./harness";

/**
 * Full-page visual baseline for the top-level routes, across 4 viewports
 * (see playwright.config.ts projects). Interactive states (dashboard detail
 * drawer, revealed quiz card) live in states.spec.ts.
 *
 * quiz-schnellcheck is deliberately EXCLUDED — its deck is randomised by design.
 */
type Route = {
  name: string;
  path: string;
  mask?: string[]; // selectors masked out (irreducibly random regions)
  settle?: number; // extra ms for JS-driven charts / count-ups / reveals
};

const ROUTES: Route[] = [
  // Homepage hero word-clouds use per-render Math.random for size/rotation/opacity
  // — masked out. Count-up (→25) + 3s second-card reveal settle within ~3.6s.
  { name: "home", path: "/", mask: [".viz-cloud-words"], settle: 3600 },
  { name: "daten-explorer", path: "/daten-explorer/", settle: 1500 }, // ECharts
  { name: "fakten-karten", path: "/fakten-karten/" },
  // /meine-interessen/ 301-redirects to the default audience page.
  { name: "meine-interessen-eltern", path: "/meine-interessen/eltern/" },
  // Scrollytelling: the sticky StepVisualization (sphere / strips / timeline)
  // renders inside .scrolly__viz-canvas (both desktop .scrolly__viz-col and
  // mobile .scrolly__viz-mobile) and animates continuously in ways
  // reduced-motion doesn't fully quiet. Mask it; the text column + layout
  // (what color/breakpoint changes affect) stays covered.
  {
    name: "projekt",
    path: "/projekt/",
    mask: [".scrolly__viz-canvas"],
    settle: 1500,
  },
  { name: "quiz-index", path: "/quiz/" },
  {
    name: "quiz-medizinischer-nutzen",
    path: "/quiz/quiz-medizinischer-nutzen/",
  },
  {
    name: "quiz-risiken-koerper-psyche",
    path: "/quiz/quiz-risiken-koerper-psyche/",
  },
  {
    name: "quiz-stimmung-wahrnehmung",
    path: "/quiz/quiz-stimmung-wahrnehmung/",
  },
  {
    name: "quiz-soziales-bevoelkerung",
    path: "/quiz/quiz-soziales-bevoelkerung/",
  },
  { name: "quiz-gefaehrlichkeit", path: "/quiz/quiz-gefaehrlichkeit/" },
];

for (const r of ROUTES) {
  test(`route: ${r.name}`, async ({ page }) => {
    await page.goto(r.path, { waitUntil: "load" });
    await stabilize(page, r.settle);
    await expect(page).toHaveScreenshot(`${r.name}.png`, {
      fullPage: true,
      mask: (r.mask ?? []).map((sel) => page.locator(sel)),
    });
  });
}
