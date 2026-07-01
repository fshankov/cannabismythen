import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Runs in the page BEFORE any bundle executes (context.addInitScript).
 * Two jobs:
 *  1. Deterministic Math.random (mulberry32, fixed seed) so the quiz shuffle
 *     and any render-time randomness are identical across baseline/compare runs.
 *  2. Keep the preview banner collapsed so it never overlays the nav pill.
 */
function seedAndPin() {
  let s = 0x9e3779b9 >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    sessionStorage.setItem("cm-preview-state", "collapsed");
  } catch {
    /* sessionStorage may be unavailable on some navigations — ignore */
  }
  // Neutralise the scrollytelling auto-cycle (useAutoCycleGroup: both call
  // sites use intervalMs 4000, first tick also 4000). Its 4s first-tick
  // setTimeout + steady-state setInterval would advance the active group and
  // make the frozen frame non-deterministic across runs (it can fire before
  // the settle-time freeze on slower/larger viewports). Drop long timers
  // (>= 3500ms) and all intervals; short timers still work — React
  // scheduling, reveals, and the homepage's 3000ms second-card reveal.
  const realSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = function (
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) {
    if (typeof timeout === "number" && timeout >= 3500) return 0;
    return realSetTimeout(handler, timeout, ...args);
  } as typeof window.setTimeout;
  window.setInterval = function () {
    return 0;
  } as unknown as typeof window.setInterval;
}

export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    // Block ALL third-party requests: Matomo (placeholder host that DNS-hangs),
    // the Feedbucket CDN widget, and any external asset. Fonts are bundled via
    // @fontsource and served same-origin, so blocking cross-origin is safe and
    // makes rendering deterministic + offline-stable.
    await context.route("**/*", (route) => {
      const url = route.request().url();
      const sameOrigin =
        url.startsWith("http://localhost") ||
        url.startsWith("http://127.0.0.1") ||
        (baseURL ? url.startsWith(baseURL) : false) ||
        url.startsWith("data:") ||
        url.startsWith("blob:");
      return sameOrigin ? route.continue() : route.abort();
    });
    await context.addInitScript(seedAndPin);
    await use(context);
  },
});

/**
 * Settle a page for a stable screenshot: wait for fonts, hide the Astro dev
 * toolbar overlay, let the (now third-party-blocked) network go idle, then a
 * short settle for JS-driven charts / count-ups. toHaveScreenshot's own
 * two-frame stabilisation covers residual ECharts entry animation.
 */
export async function stabilize(page: Page, extraSettleMs = 400) {
  await page.evaluate(async () => {
    try {
      await (document as unknown as { fonts: FontFaceSet }).fonts.ready;
    } catch {
      /* no FontFaceSet — ignore */
    }
  });
  await page.addStyleTag({
    content:
      "astro-dev-toolbar, #dev-toolbar-root { display: none !important; }",
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(extraSettleMs);
  // No hard rAF/timer freeze here: it cancelled bounded animations mid-flight
  // and produced run-dependent frames. Determinism instead comes from
  // reduced-motion (timeline jumps to final, sphere rotation frozen), the
  // source-level auto-cycle kill in seedAndPin, seeded Math.random, and
  // toHaveScreenshot's own two-frame stabilisation.
}

export { expect };
