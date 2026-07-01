import { test, expect, stabilize } from "./harness";

/**
 * One cheap interactive state, desktop-1440 only: the dashboard filter drawer —
 * a surface the default page render doesn't show and Stage 2's color sweep
 * touches. (A quiz "revealed card" state was tried but dropped: its celebration
 * FX — confetti canvas + floating emoji at random positions — can't be made
 * deterministic cheaply. The quiz card fronts and classification/verdict colors
 * are already covered by the quiz + daten-explorer route baselines.)
 */
test.beforeEach(({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-1440",
    "interactive states run on desktop-1440 only",
  );
});

test("state: dashboard filter drawer", async ({ page }) => {
  await page.goto("/daten-explorer/", { waitUntil: "load" });
  await stabilize(page, 800);
  await page.locator(".carm-explorer__filter").first().click();
  await page.waitForTimeout(600); // slide-in (CSS anims are disabled anyway)
  await stabilize(page, 200);
  await expect(page).toHaveScreenshot("dashboard-filter-drawer.png", { fullPage: true });
});
