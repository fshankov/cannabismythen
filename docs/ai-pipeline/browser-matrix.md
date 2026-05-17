# Browser & viewport matrix

What we test on for cross-browser / responsive passes. Three tiers, with
viewports per tier. When `/visual-screenshot-pass` runs without explicit
viewport overrides, it iterates Tier 1.

## Tier 1 — must work

These are the audiences Fedor explicitly targets for the ISD review and
the public launch. Visual regressions here block a PR.

| Browser | Version floor | Viewports |
|---|---|---|
| Safari iOS | 16+ | 375×667 (iPhone SE), 390×844 (iPhone 12-15), 430×932 (Pro Max) |
| Chrome Android | 110+ | 360×800 (Pixel-class), 412×915 (large Android) |
| Chrome desktop | last 2 majors | 1024×768 (tablet-ish), 1440×900 (laptop), 1920×1080 (desktop) |
| Safari macOS | 17+ | 1280×800, 1680×1050 |
| Firefox | 120+ | 1280×800, 1920×1080 |

Notes:

- iOS Safari 16 is the floor because 15 is below 2 % share in DE and
  drops `:has()` selector support. If we ever use `:has()` un-guarded,
  bump the floor or @supports-fence it.
- The 360-wide Android viewport is the smallest viewport we explicitly
  design for. Below that, the hero and the dashboard table go into
  "best effort" mode (Tier 3).
- The 1024 viewport sits right on the tablet/desktop boundary. The
  mobile tab bar in `BaseLayout.astro` is hidden ≥1024 px; the dashboard
  sidebar appears ≥1024 px. Snapshot both 1023 and 1024 when reviewing
  layout transitions.

## Tier 2 — degrade gracefully

Spot-check after Tier 1 is green. A pixel-perfect match is not required
as long as content is readable and nothing is broken.

| Browser | Notes |
|---|---|
| Edge desktop (current) | Chromium-based, usually matches Chrome. Snapshot only if Tier 1 surfaced Chromium-only issues. |
| Firefox 115 ESR | The version typical of enterprise / education deployments. |
| In-app browsers (Instagram, LinkedIn) | Where most social referrals land. Sniff the user agent only if a real regression is reported. |

## Tier 3 — best effort

We don't promise pixel-perfect rendering here, but the site must remain
navigable and the password gate must not break.

| Surface | Notes |
|---|---|
| iPad Safari, older split-screen mode | Especially landscape with the keyboard visible. |
| Old Android WebView | Below ~360 px viewport. |
| Reader mode / screen readers | A11y pass tracked separately under future `/keyboard-and-a11y-pass`. |

## Hard exclusions

- **IE 11** — explicit non-target. Don't add `-ms-` prefixes or polyfills.
- **Opera Mini extreme mode** — JavaScript-disabled rendering is out of
  scope; the site is SSR but the dashboard, quiz, scrollytelling, and
  hero all require JS.

## How `visual-screenshot-pass` uses this

The skill iterates each page in the section's URL list across Tier 1
viewports by default. Override viewports per-call when zooming on a
specific regression (e.g. only 375×667 for an iOS Safari issue).

Browser engine choice: Playwright MCP defaults to Chromium. For Safari
iOS quirks (dvh, momentum scroll, rubber-banding), use the `webkit`
engine explicitly — the visual-reviewer agent will pick that when the
URL list includes flagged-iOS pages.
