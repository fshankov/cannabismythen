# Known cross-browser & responsive quirks

The 12 patterns identified in the **2026-05-17** parallel audit. Each
entry: the pattern, why it bites, the file(s) it lives in today (with
line numbers where useful), the canonical fix, and the skill that owns
addressing it.

When a new pattern lands, prepend it here with the audit date so future
Claude sessions can tell which findings are current vs. historical.

## Status as of 2026-05-18 (PR #30 merged)

PR #30 executed Phase 0 + ad-hoc fixes for every quirk except #4 (needs
design call) and #10 (already N/A). Status per quirk in the catalog
below.

**Recipe-vs-reality deltas surfaced during execution** (the fix recipes
below were written before the code state at the time of execution
matched their assumptions):

- **#5 — Legend portion of the recipe is a no-op.** None of
  `ScatterView`, `LollipopView`, or `BalkenView` define a
  `legend: { ... }` block in their ECharts option object — ECharts
  auto-skips legend rendering when omitted. The "move legend to bottom"
  step has nothing to act on. PR #30 implemented the height/density
  portion of the fix only (commit `039c805`). If a legend block is
  added in the future, revisit the recipe.
- **#7 — Recipe targets a pre-line-clamp card layout.** The quiz card's
  long-statement overflow today is handled by
  `-webkit-line-clamp: 8` truncation + the "Mehr" reveal button, not by
  scrolling inner content. The recipe's
  `-webkit-overflow-scrolling: touch` is therefore a no-op on the
  current code; PR #30 added it defensively per the recipe but the real
  iOS UX needs a re-read against the live QuizPlayer JSX before any
  follow-up fix.
- **#10 — N/A in the current codebase.** No raw `<img src>` exists in
  dashboard preview cards or fakten-karten flip-cards anymore. The only
  remaining raw `<img>` is `ExportDrawer.tsx:325`, which renders a
  runtime data-URL preview (`srcset` doesn't apply). Consider archiving
  quirk #10 or rewriting it to target SVG icon sizing (the closer real-
  world parallel today).

## 1. Ad-hoc breakpoints

**Status (2026-05-18):** ✅ Fixed in PR #30 commits `145837f` (tokens)
and `f4957a4` (snap of 57 literals). 22 unique widths reduced to 4
canonical token values + 3 documented exceptions (ultra-narrow 380/400,
1023/1024 boundary pairs, dashboard 1100/960/840/720 chart-density
cascade).

**Pattern.** Roughly 30 distinct media-query breakpoints scattered
across `global.css`, `dashboard.css`, `quiz.css`, and component-scoped
`<style>` blocks. Examples seen: 360, 380, 400, 420, 480, 520, 600, 640,
680, 720, 768, 820, 900, 960, 1024, 1100, 1200, 1280, 1366, 1440, 1536,
1680, 1920 px. Each block picks its own; nothing in `global.css` defines
a token.

**Why it bites.** Layout transitions land at inconsistent viewport
widths — the dashboard sidebar drops at 1024 px but the hero re-stacks
at 980 px. Reviewers see "broken" intermediate states.

**Fix.** Define a token set in `global.css`:
`--bp-sm: 480px; --bp-md: 768px; --bp-lg: 1024px; --bp-xl: 1440px;` and
rewrite each `@media` to use one of those four breakpoints. Components
that legitimately need an extra step (e.g. the dashboard at 1200 px for
the wide-table view) keep the literal but document why.

**Owned by.** `/responsive-tokens-sweep`.

## 2. `100vh` on iOS Safari

**Status (2026-05-18):** ✅ Fixed in PR #30 commit `145837f`. All 9
`100vh` declarations converted to progressive `100vh; 100dvh;` form
(scrollytelling viz cols, dashboard fullscreen + 4 drawer/modal
max-heights, login.astro body).

**Pattern.** `100vh` is used in several full-height layouts (hero,
scrollytelling, login). On iOS Safari < 17 this includes the URL bar
height, causing content to be cut off when the bar appears.

**Why it bites.** Hero CTA off-screen on iPhone 12 in portrait,
scrollytelling first frame partially scrolled, login form clipped.

**Fix.** Replace `100vh` with `100dvh` (dynamic viewport height) for new
code. For broad iOS support, prefer the progressive-enhancement form:
`min-height: 100vh; min-height: 100dvh;` (the second overrides where
supported).

**Owned by.** `/responsive-tokens-sweep` (token-level fix) and
`/safari-ios-pass` (verification).

## 3. `cqi` / container query units without a fallback

**Status (2026-05-18):** ✅ N/A — zero `cqi` matches across
`src/**/*.{css,tsx,astro}`. Confirmed during the PR #30 audit.

**Pattern.** Several component-scoped styles use `cqi` units (container
inline size) for fluid type without an `@supports (container-type:
inline-size)` fence. Container queries are baseline on iOS Safari 16+,
but the unit syntax was finalised later for some browsers.

**Why it bites.** Older WebView clients render zero-size text where the
container query unit fails to resolve, because there is no fallback
declaration.

**Fix.** Always pair `cqi` with a `vw`-based fallback declared first:

```css
font-size: clamp(1rem, 4vw, 1.5rem);
@supports (container-type: inline-size) {
  font-size: clamp(1rem, 6cqi, 1.5rem);
}
```

**Owned by.** `/responsive-tokens-sweep`.

## 4. Mobile tab bar at the 1024 boundary

**Status (2026-05-18):** ⊘ Deferred. The fix recipe requires a snapshot
of the 1023/1024 transition + a design choice between (a) extend mobile
bar to 1200 and (b) smooth the 1024 transition with a shared secondary
nav. Neither branch is safe to execute blind. Needs its own session
once Fedor can compare 1023 vs. 1024 viewport screenshots side by side.

**Pattern.** `BaseLayout.astro` hides the mobile tab bar at `≥1024 px`
and shows the desktop nav. The transition is sharp; there's no
"medium" form for tablets in landscape.

**Why it bites.** iPad Pro landscape (1366×1024) gets the desktop nav,
but iPad mini landscape (1133×744) gets the mobile bar — and the
crossover at 1023 → 1024 looks like a bug to a reviewer.

**Fix.** Two-phase fix: snapshot the transition at 1023 / 1024 to
confirm it's intentional, then either (a) extend the mobile bar up to
1200 px and the desktop nav from 1200 px, or (b) keep the boundary at
1024 px but smooth the visual transition with the same secondary nav
on both sides.

**Owned by.** future `/adapt-base-layout`.

## 5. ECharts dashboard re-layout below 480 px

**Status (2026-05-18):** ✅ Fixed (heights only) in PR #30 commit
`039c805`. New `useViewportWidth` hook in `src/lib/dashboard/` switches
density at the `--bp-sm` boundary: ScatterView height 500→260,
LollipopView floor 300→220 + per-group 80→60, BalkenView ROW_HEIGHT
28→22 + y-axis label fontSize 12→10. **Legend portion of recipe is a
no-op** — none of the three views currently define a `legend: { ... }`
block in their option object (see top-of-file deltas section).

**Pattern.** ECharts charts on `MythenExplorer` (`src/components/dashboard/`)
use a hard-coded `width: 100%, height: 320px` — but the legend and
axis labels overflow below ~420 px viewport.

**Why it bites.** The dashboard is the most-referenced URL by ISD. A
broken legend on Pixel-class viewports is a high-severity flag.

**Fix.** Two steps: (a) drop chart height to ~260 px below the 480 px
breakpoint; (b) move ECharts legend to `bottom` orientation and reduce
font-size below 480 px via the chart option overrides.

**Owned by.** future `/adapt-daten-explorer`.

## 6. D3 scrollytelling — `scroll-snap` jitter on iOS

**Status (2026-05-18):** ✅ Fixed in PR #30 commit `5bbd20b`. iOS-only
`scroll-snap-type: x proximity` fence via
`@supports (-webkit-touch-callout: none)` applied to the three actual
horizontal carousels in the codebase: `.four-paths__grid`,
`.audience-shortcut__grid`, `.quiz-selection`. The
`ScrollytellingViewer.tsx` `y mandatory` mentioned in the original
recipe does not exist in the current implementation — the scrollytelling
viewer uses an intersection-observer-driven mechanism, not CSS snap.

**Pattern.** `ScrollytellingViewer.tsx` uses `scroll-snap-type: y
mandatory` on the panel container. iOS Safari has a known rubber-band
interaction that breaks `mandatory` mid-scroll.

**Why it bites.** The reader gets stuck between two narrative frames
and has to pinch-zoom out. Disorienting on a content-heavy page.

**Fix.** Downgrade to `scroll-snap-type: y proximity` on Safari iOS via
an `@supports (-webkit-touch-callout: none)` query, or use a JS-based
intersection observer for the active frame instead of CSS snap.

**Owned by.** future `/adapt-scrollytelling` and `/safari-ios-pass`.

## 7. Quiz card transition uses non-momentum-friendly `overflow: hidden`

**Status (2026-05-18):** ✅ Fixed defensively in PR #30 commit
`b7dfd93`. `-webkit-overflow-scrolling: touch` added to
`.quiz-card__face`. **Recipe-vs-reality delta** (see top-of-file): the
current card layout truncates long statements with
`-webkit-line-clamp: 8` + "Mehr" reveal button rather than scrolling
inner content, so the deprecated property is a no-op on modern iOS.
Real iOS UX needs re-evaluation against the live QuizPlayer JSX before
any follow-up fix; consider replacing the recipe with a "clamp + reveal"
description.

**Pattern.** `QuizPlayer.tsx` wraps each card in a container with
`overflow: hidden` to clip the slide-in transition. On iOS Safari,
this disables momentum scrolling for the inner statement when it
exceeds the viewport.

**Why it bites.** Long myth statements on a Pro Max viewport feel
"stuck"; the user has to flick repeatedly.

**Fix.** Add `-webkit-overflow-scrolling: touch` on the inner card
content. Verify the slide-in animation still clips at the parent level.

**Owned by.** future `/adapt-quiz`.

## 8. Lucide React icons mis-size at small viewports

**Status (2026-05-18):** ✅ Fixed in PR #30 commit `26af2e4`. 40 chip
icons (11–14 px, all `aria-hidden`) and 13 label icons (14–20 px)
across dashboard, fakten-karten, scrollytelling, and quiz components
migrated to `size="1em"`. Per the recipe, hero/CTA/chrome icons kept at
literal pixel sizes: `VizCtaGrid.tsx:52` (56), `HeroFrageBlock.tsx:198`
(28), `VerdictScale.tsx:110` (20), close buttons in `Drawer`,
`MehrPopover`, `DashboardOnboarding`, plus the responsive
`size={isNarrow ? 16 : 18}` in `StripsView` / `SourcesStripsView`.
`VerdictArrow` / `VerdictArrowWithInfo` `size` prop type widened to
`number | string` to accept the `"1em"` literal. 4 `ExportDrawer` icons
gained `aria-hidden="true"`.

**Pattern.** Many components pass `size={24}` to Lucide icons. At zoom
levels > 150 % or on dense mobile viewports, the icon-text alignment
breaks because the icon is a fixed pixel size while the text scales.

**Why it bites.** Accessibility audit failures for users who zoom; ISD
review flagged "verdict chip icons look misaligned at 200 % zoom" on a
prior pass.

**Fix.** Size icons in `em` based on the parent font-size:
`size="1em"` plus `aria-hidden="true"`. Reserve fixed pixel sizes for
hero / chrome icons where the size is intentional.

**Owned by.** future `/icons-and-typography-pass`.

## 9. Focus rings disabled on `:focus` but no `:focus-visible` fallback

**Status (2026-05-18):** ✅ Fixed (5 sites) across PR #30 commits
`5bbd20b` and `837c5f2`. Restored visible keyboard focus rings on:
`.viz-timeline__hotspot` (scrollytelling.css), `.viz-cloud-word`
(global.css), `.viz-sr__example-cta` (scrollytelling.css),
`.viz-cta__card` (scrollytelling.css), `.carm-explorer .control-select`
(dashboard.css). Pattern used: keep existing `:focus` block, append a
sibling `:focus-visible` rule that adds a visible outline (CSS source
order ensures `:focus-visible` overrides the `outline: none` from
`:focus` for keyboard users).

**Pattern.** Several interactive elements in `quiz.css` and
`dashboard.css` set `outline: none` on `:focus` to clean up mouse focus,
but don't add a `:focus-visible` rule.

**Why it bites.** Keyboard users get no visible focus indicator —
direct accessibility regression. A11y is on Fedor's pre-launch list.

**Fix.** Replace `outline: none` on `:focus` with `outline: none` on
`:focus:not(:focus-visible)` only, and add a visible 2 px outline on
`:focus-visible` using the brand token.

**Owned by.** future `/keyboard-and-a11y-pass`.

## 10. `srcset` / `sizes` missing on dashboard and fakten-karten images

**Status (2026-05-18):** ✅ N/A in current codebase. No raw `<img src>`
exists in dashboard preview cards or fakten-karten flip-cards. The only
remaining raw `<img>` (`ExportDrawer.tsx:325`) renders a runtime
data-URL preview where `srcset` does not apply. Consider archiving this
quirk or rewriting it to target SVG icon sizing (closer real-world
parallel today). See top-of-file deltas section.

**Pattern.** Images in the dashboard preview cards and the
fakten-karten flip-cards use raw `<img src>` without `srcset` or `sizes`.

**Why it bites.** Mobile users on cellular pull the full-resolution
asset; LCP degrades; the dashboard becomes janky on 4G.

**Fix.** Migrate to Astro `<Image>` with `widths` and `sizes` props.
For dashboard preview thumbnails, `widths={[320, 640, 960]}` is
sufficient.

**Owned by.** future `/image-optimization-pass`.

## 11. Long-form German text overflow in tight containers

**Status (2026-05-18):** ✅ Fixed (4 sites) in PR #30 commit `837c5f2`.
`white-space: nowrap` → `text-wrap: balance` (+ `min-width: 0` /
`flex-shrink: 0` where chip lives in a flex parent) on:
`.carm-explorer .filter-label` (dashboard.css), `.overview-verdict-chip`
(dashboard.css), `.population-pill` (dashboard.css),
`.quiz-header-bar__title` (quiz.css). 4 of the 8 audit candidates kept
their `nowrap` deliberately: `.tab-btn` (horizontal scrolling strip
must stay single-line), `.overview-tile-bar-label` + quiz progress pill
(tabular-nums counters), `.quiz-card__btn` (button label). Note:
`text-wrap: balance` is Safari 17.5+; older Safari falls back to
default wrap (acceptable).

**Pattern.** Several verdict chips, dashboard table cells, and quiz
metadata captions use `white-space: nowrap` for visual cleanliness, but
some German classification strings ("eher_richtig" → "Eher richtig
bewertet") wrap to two lines on narrow viewports — and `nowrap` instead
overflows them.

**Why it bites.** Truncated verdict text mid-word; reviewer flags as
"broken layout" on mobile.

**Fix.** Replace `white-space: nowrap` with `text-wrap: balance` and
allow wrapping where appropriate. For chip-style elements, switch to
`flex-shrink: 0` + an explicit width-token so the chip resizes
instead of clipping.

**Owned by.** future `/adapt-typography`.

## 12. Sticky filter bar overlaps the mobile tab bar

**Status (2026-05-18):** ✅ Fixed in PR #30 commit `837c5f2`. New
`--mobile-tab-bar-height: 56px` token in `global.css :root`;
`.mobile-tab-bar` height declaration switched to the token; at
`<1024px` `.strips-readout` lifts above the bar via
`bottom: calc(var(--mobile-tab-bar-height) + env(safe-area-inset-bottom, 0))`,
and `main:has(.carm-explorer)` gains a matching `padding-bottom` so the
last data row scrolls fully visible. Sticky-top siblings (`.tabs-bar`,
`.carm-toolbar-row`) don't collide with the bottom tab bar so they
weren't touched.

**Pattern.** `MythenExplorer` and `FaktenKartenExplorer` use a sticky
filter bar at `position: sticky; top: 0`. On viewports < 1024 px, the
mobile tab bar (also fixed) overlaps the filter bar when scrolled.

**Why it bites.** Users can't reach the bottom filter controls on
mobile — they're hidden behind the tab bar.

**Fix.** Add a bottom-padding token to the filter bar's containing
section equal to the tab-bar height, and snap the sticky offset to the
tab-bar height on mobile. Tracked separately because it requires a
small JS measurement of the tab bar.

**Owned by.** future `/adapt-base-layout` (collaboration with
`/adapt-daten-explorer`).

---

## How to add a new quirk

1. Confirm the pattern reproduces on a Tier-1 viewport (see
   `browser-matrix.md`) via `/visual-screenshot-pass`.
2. Append a new section above with: pattern, file:line refs, why it
   bites, fix, owning skill.
3. Increment the date in this header and link the quirk from the
   relevant `section-playbooks/<section>.md`.
4. Open or update an Asana card so the work is tracked.
