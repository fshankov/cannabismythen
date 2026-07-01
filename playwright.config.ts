import { defineConfig } from "@playwright/test";

/**
 * Visual-regression baseline (Stage 1 safety net).
 *
 * IMPORTANT: there is intentionally NO `webServer` block. Fedor starts the dev
 * server with `./_local/render.sh` (Astro picks the port — usually 4321, sometimes
 * 4322+). This config drives that ALREADY-RUNNING server. Point it at the right
 * port with PW_BASE_URL, e.g.:
 *
 *   PW_BASE_URL=http://localhost:4322 npx playwright test
 *
 * Baselines are rendered by macOS Chromium and are NOT portable to Linux — this
 * gate is a Fedor's-Mac-only tool. Regenerate intentionally with
 * `--update-snapshots`; never use that flag to paper over an unexpected diff.
 */
const baseURL = process.env.PW_BASE_URL || "http://localhost:4321";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1, // single dev server — keep it calm, avoid races
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    reducedMotion: "reduce", // neutralises the whole scroll-reveal engine
  },
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0, // exact; if AA noise forces a tiny threshold, document why
    },
  },
  projects: [
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
    { name: "mobile-360", use: { viewport: { width: 360, height: 740 } } },
  ],
});
