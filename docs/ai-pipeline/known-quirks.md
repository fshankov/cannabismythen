# Known cross-browser & responsive quirks

The 12 patterns identified in the **2026-05-17** parallel audit. Each
entry: the pattern, why it bites, the file(s) it lives in today (with
line numbers where useful), the canonical fix, and the skill that owns
addressing it.

When a new pattern lands, prepend it here with the audit date so future
Claude sessions can tell which findings are current vs. historical.

## 1. Ad-hoc breakpoints

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

**Pattern.** Images in the dashboard preview cards and the
fakten-karten flip-cards use raw `<img src>` without `srcset` or `sizes`.

**Why it bites.** Mobile users on cellular pull the full-resolution
asset; LCP degrades; the dashboard becomes janky on 4G.

**Fix.** Migrate to Astro `<Image>` with `widths` and `sizes` props.
For dashboard preview thumbnails, `widths={[320, 640, 960]}` is
sufficient.

**Owned by.** future `/image-optimization-pass`.

## 11. Long-form German text overflow in tight containers

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
