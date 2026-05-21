# Cannabis: Mythen & Evidenz — Design System Spec

> **Last synced:** 2026-05-21 · **HEAD:** `5420b21` · **Source repo:** [`cannabismythen`](https://github.com/fshankov/cannabismythen) (private)
> **Audience for this document:** Claude design, when updating the artifact **'Cannabis Mythen – Design System'**.
> **Maintainer:** Fedor Shankov (`fshankov@gmail.com`). Tone in this doc is descriptive ("the code does X"), not aspirational.

---

## 0. How to use this document

This is a faithful inventory of the **live website** as of HEAD `5420b21`, structured for paste-in to Claude design. The design system lives in three files in this folder, **committed to the repo** so it travels with the code and is versioned alongside changes:

```
docs/design-system/
├── spec.md       ← this file. Full prose reference: tokens, components, screens, enums, round-trip protocol.
├── tokens.json   ← machine-readable mirror of every token, with src/styles/global.css line numbers.
├── tokens.css    ← paste-ready :root block, mirrors the live CSS verbatim.
```

When to attach which file to Claude design:

| Goal | Attach |
|---|---|
| Re-baseline the whole design system | `spec.md` |
| Work on tokens specifically (color, type, spacing) | `tokens.json` + `tokens.css` |
| Compose a new component or screen | `spec.md` (sections §4 + §5) |
| Quick color/spacing reference | `tokens.css` alone |

There are four ways to use this folder:

1. **Seed pass** (one-time, what we're doing now). Paste `spec.md` into a fresh Claude design conversation alongside the existing 'Cannabis Mythen – Design System' artifact and ask Claude design to re-baseline tokens, components, and screens against it. Sections are sized so you can also paste them one at a time if the artifact context gets tight.
2. **Iterate in Claude design.** Edit tokens, propose component variants, draft new screens — all in Claude design. The artifact stays the design playground.
3. **Round-trip back to code.** When you change a **token** value (color, spacing, type scale, radius, shadow, motion duration) in Claude design, paste the diff back to Claude Code in this repo. Section §2 of this spec and `tokens.json` give every token its `src/styles/global.css` line number, so the edit becomes a one-line surgical change. Component/screen changes are *not* 1:1 — those need a normal feature-dev pass (use the `feature-dev:feature-dev` skill).
4. **Re-sync the spec.** After applying a round-trip change in code, bump the "Last synced" header (date + new HEAD SHA) at the top of this file *and* in `tokens.json` `$meta` so drift is detectable.

A few conventions used throughout:

- File citations use `path:line` so you can click through in any markdown viewer that supports it (and so Claude Code can locate them instantly).
- Verdict palette is the **load-bearing semantic palette** for the entire site. Touch it carefully.
- "Audience" everywhere means one of the **five Zielgruppen** (data slices), not a reader-persona for content. They're a CaRM-survey concept first, a design concept second.
- The product is in **German**; this design system speaks English about it. Where copy strings matter, they're quoted in German with no translation — Claude design should preserve them verbatim.

---

## 1. Brand & product framing

**What this is.** Cannabis: Mythen & Evidenz is an evidence-based, German-language site that debunks 42 cannabis myths from the CaRM research project (ISD Hamburg). Content is presented in five formats:
- Myth factsheets (the 42 mNN entries)
- FAQs grouped by audience ("Meine Interessen")
- An interactive quiz (Selbsttest, ~6 themes × ~6–10 questions)
- Audience-specific data dashboards (Daten-Explorer)
- A long-form scrollytelling narrative about the project itself (Projekt)

**Two product principles that constrain every design decision:**

1. **Classification is 4-level, never binary.** Every myth resolves to one of `richtig | eher_richtig | eher_falsch | falsch` (plus `keine_aussage` when there's no scientific verdict). Never collapse to true/false in copy, UI, or data. The 4-level palette in §2 carries this.
2. **Five Zielgruppen** are CaRM data slices, not reader-personas: Volljährige (18–70), Minderjährige (16–17), Konsumierende, Junge Erwachsene (18–26), Eltern. They drive dashboard filters and the FAQ structure ("Meine Interessen" audiences); they are *not* swimlanes the editorial picks between.

**Voice & tone:**
- **Du baseline site-wide** (as of 2026-05-08 flip).
- **Sie pockets only** in three Meine-Interessen FAQ sections targeting adult professionals: **Eltern**, **Fachkräfte**, **Lehrkräfte** (identified by `id` in `src/content/faq/audiences.yaml`).
- Konsumierende and Jugendliche audiences use Du like the rest of the site.

**Protected strings (do not paraphrase, do not translate in UI):**
- Brand name "Cannabis: Mythen & Evidenz" (appears in `BaseLayout` title suffix, login page, `ui.siteName`, CSS comments).
- "Evidenz" stays in body copy of myth explanations, methodology and glossary pages, but UI labels that mean "evidence-based" use *Wissenschaftlich…* instead.
- "Erwachsene (18–70)…" framing is the canonical way to refer to the CaRM sample. Never "Bevölkerung in Deutschland" alone, never "Befragten" without the qualifier. Sanctioned exception: the homepage credibility lede says "in einer umfangreichen Befragung in Deutschland" (the qualifier sits in the headline above).
- The word "repräsentativ" / "representative" must **not** appear in user-visible copy (per ISD ruling, BugHerd #28). The survey IS methodologically representative, but the word is dropped at editorial request.

---

## 2. Design tokens (the round-trip surface)

Every token below cites the line in [`src/styles/global.css`](src/styles/global.css) where it lives. When you change a token in Claude design, the round-trip edit is a one-line replacement at that location.

### 2.1 Colors — neutrals & surfaces

| Token | Value | Use | Line |
|---|---|---|---|
| `--color-bg` | `#f4f4f0` | Page background — **warm ivory, NOT white** | [src/styles/global.css:14](src/styles/global.css:14) |
| `--color-surface` | `#ffffff` | Card / panel background | [src/styles/global.css:15](src/styles/global.css:15) |
| `--color-text` | `#1a1a2e` | Primary body text | [src/styles/global.css:16](src/styles/global.css:16) |
| `--color-text-secondary` | `#4a5568` | Default `<p>` color, muted labels | [src/styles/global.css:17](src/styles/global.css:17) |
| `--color-text-muted` | `#718096` | Captions, metadata | [src/styles/global.css:18](src/styles/global.css:18) |
| `--color-border` | `#e2e8f0` | Standard borders | [src/styles/global.css:19](src/styles/global.css:19) |
| `--color-bg-subtle` | `#eeeee8` | Section dividers, alternate rows | [src/styles/global.css:65](src/styles/global.css:65) |
| `--color-surface-raised` | `#f8fafc` | Sidebar / toolbar backgrounds | [src/styles/global.css:66](src/styles/global.css:66) |
| `--color-border-strong` | `#cbd5e1` | Emphasized borders | [src/styles/global.css:67](src/styles/global.css:67) |
| `--color-text-inverse` | `#ffffff` | Text on dark / accent backgrounds | [src/styles/global.css:68](src/styles/global.css:68) |

### 2.2 Colors — brand accent

Forest green, carried from the original login page.

| Token | Value | Use | Line |
|---|---|---|---|
| `--color-accent` | `#2d6a4f` | Primary action, links | [src/styles/global.css:22](src/styles/global.css:22) |
| `--color-accent-hover` | `#1f4f3a` | Darkened hover state | [src/styles/global.css:23](src/styles/global.css:23) |
| `--color-accent-light` | `#e8f5ef` | Light tint background | [src/styles/global.css:24](src/styles/global.css:24) |
| `--color-accent-muted` | `#95c4ad` | Disabled / decorative | [src/styles/global.css:69](src/styles/global.css:69) |
| `--color-primary*` | (alias of accent) | Legacy dashboard naming; prefer `--color-accent*` in new code | [src/styles/global.css:30-32](src/styles/global.css:30) |

### 2.3 Colors — verdict classifications (load-bearing)

The semantic palette. Unified Emerald / Lime / Amber / Rose system — deuteranopia-safe; avoids traffic-light association. Used by `VerdictPill`, `VerdictArrow`, `VerdictStatement`, `VerdictScale`, every chart, every chip.

| Verdict | Text color | Background | Lines |
|---|---|---|---|
| **Richtig** (Correct) | `--classification-richtig: #047857` (Emerald-700) | `--classification-richtig-bg: #ecfdf5` (Emerald-50) | [40](src/styles/global.css:40), [45](src/styles/global.css:45) |
| **Eher richtig** (Mostly correct) | `--classification-eher-richtig: #4d7c0f` (Lime-700) | `--classification-eher-richtig-bg: #f7fee7` (Lime-50) | [41](src/styles/global.css:41), [46](src/styles/global.css:46) |
| **Eher falsch** (Mostly false) | `--classification-eher-falsch: #b45309` (Amber-700) | `--classification-eher-falsch-bg: #fffbeb` (Amber-50) | [42](src/styles/global.css:42), [47](src/styles/global.css:47) |
| **Falsch** (False) | `--classification-falsch: #be123c` (Rose-700) | `--classification-falsch-bg: #fff1f2` (Rose-50) | [43](src/styles/global.css:43), [48](src/styles/global.css:48) |
| **Keine Aussage** (No verdict) | `--classification-keine-aussage: #6b7280` (Gray-500) | `--classification-keine-aussage-bg: #f3f4f6` (Gray-100) | [44](src/styles/global.css:44), [49](src/styles/global.css:49) |

Each token has a `--color-{verdict}` and `--color-{verdict}-bg` legacy alias ([53–62](src/styles/global.css:53)). Prefer the `--classification-` names in new code.

**Glyph mapping** (used by `VerdictArrow`):
- Richtig → arrow up (↑, 180° rotation in the SVG)
- Eher richtig → arrow up-right (↗, -135°)
- Eher falsch → arrow down-left (↙, 45°)
- Falsch → arrow down (↓, 0°)
- Keine Aussage → horizontal shadow line only, no arrow

This makes verdicts readable by direction alone (deuteranopia-friendly), color is reinforcement.

### 2.4 Colors — audience segments (five Zielgruppen)

| Token | Value | Audience | Emoji | Line |
|---|---|---|---|---|
| `--audience-eltern` | `#4f46e5` (Indigo-600) | Eltern | 👨‍👩‍👧 | [src/styles/global.css:1057](src/styles/global.css:1057) |
| `--audience-jugendliche` | `#f97316` (Orange-500) | Jugendliche | 🧑 | [src/styles/global.css:1058](src/styles/global.css:1058) |
| `--audience-konsumierende` | `#16a34a` (Green-600) | Konsumierende | 🌿 | [src/styles/global.css:1059](src/styles/global.css:1059) |
| `--audience-lehrkraefte` | `#0891b2` (Cyan-600) | Lehrkräfte | 🧑‍🏫 | [src/styles/global.css:1060](src/styles/global.css:1060) |
| `--audience-fachkraefte` | `#7c3aed` (Violet-600) | Fachkräfte | 🔬 | [src/styles/global.css:1061](src/styles/global.css:1061) |

Source-of-truth for emoji + label per audience: [`src/content/faq/audiences.yaml`](src/content/faq/audiences.yaml).

### 2.5 Typography

**Font loading** ([src/layouts/BaseLayout.astro:3-4](src/layouts/BaseLayout.astro:3)):
```ts
import "@fontsource-variable/inter";    // used by --font-display
import "@fontsource/dm-serif-display";  // imported but never used — flag as dead import
```

**Font stacks:**

| Token | Value | Where applied | Line |
|---|---|---|---|
| `--font-display` | `'Inter Variable', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif` | All headings `h1–h4` | [src/styles/global.css:98](src/styles/global.css:98) |
| `--font-body` | `'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif` | Default body (NOT Inter — Segoe UI on Windows, system stack elsewhere) | [src/styles/global.css:99-100](src/styles/global.css:99) |
| `--font-mono` | `'SF Mono', SFMono-Regular, ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, Monaco, Consolas, monospace` | Code blocks, data display | [src/styles/global.css:101-102](src/styles/global.css:101) |

> **Note for Claude design:** The body uses the **system font** (Segoe UI on Windows, San Francisco on macOS, Roboto on Android, etc.) — not Inter. Only headings are Inter. If you mock screens in a Figma-like canvas, use *system-ui* or *Segoe UI* for body text or you will misrepresent the live site.

**Type scale** (all headings use `--font-display`, weight 700, line-height 1.25, letter-spacing -0.01em — see [src/styles/global.css:157-163](src/styles/global.css:157)):

| Element | Size | Weight | Line-height | Line |
|---|---|---|---|---|
| h1 | 2rem (32px) | 700 | 1.25 | [166](src/styles/global.css:166) |
| h2 | 1.5rem (24px) | 700 | 1.25 | [171](src/styles/global.css:171) |
| h3 | 1.15rem (~18px) | 700 | 1.25 | [177](src/styles/global.css:177) |
| h4 | inherits h3 styling (no override) | 700 | 1.25 | (inherits [157](src/styles/global.css:157)) |
| body (`p`) | 1rem (16px) | 400 | 1.65 | [181-184](src/styles/global.css:181) |
| `.caption` | 0.85rem | 500 | 1.4 | (search global.css for `.caption`) |
| `.eyebrow` | 0.84rem | 600 | 1.4 (uppercase tracking) | (search global.css for `.eyebrow`) |

### 2.6 Spacing scale

7-step ladder. Mobile override at `≤640px` shrinks the upper four steps.

| Token | Desktop | Mobile (`≤640px`) | Line |
|---|---|---|---|
| `--space-xs` | 0.25rem (4px) | — | [73](src/styles/global.css:73) |
| `--space-sm` | 0.5rem (8px) | — | [74](src/styles/global.css:74) |
| `--space-md` | 1rem (16px) | — | [75](src/styles/global.css:75) |
| `--space-lg` | 1.5rem (24px) | 1.25rem (20px) | [76](src/styles/global.css:76), 1612 |
| `--space-xl` | 2rem (32px) | 1.5rem (24px) | [77](src/styles/global.css:77), 1613 |
| `--space-2xl` | 3rem (48px) | 2rem (32px) | [78](src/styles/global.css:78), 1614 |
| `--space-3xl` | 4rem (64px) | 2.5rem (40px) | [79](src/styles/global.css:79), 1615 |

### 2.7 Radii

| Token | Value | Use | Line |
|---|---|---|---|
| `--radius-sm` | 4px | Small inputs, chips | [87](src/styles/global.css:87) |
| `--radius-md` | 8px | Buttons, small cards | [88](src/styles/global.css:88) |
| `--radius-lg` | 12px | Cards, panels (`--card-radius` defaults here) | [89](src/styles/global.css:89) |
| `--radius-full` | 9999px | Pills, circular badges | [90](src/styles/global.css:90) |

### 2.8 Shadows

| Token | Value | Use | Line |
|---|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.05)` | Subtle elevation | [93](src/styles/global.css:93) |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.07)` | Card / panel default (`--card-shadow` defaults here) | [94](src/styles/global.css:94) |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,.10)` | Modal / overlay | [95](src/styles/global.css:95) |

### 2.9 Motion

| Token | Value | Use | Line |
|---|---|---|---|
| `--transition-fast` | 0.15s ease | Hover, focus | [105](src/styles/global.css:105) |
| `--transition` | 0.25s ease | Standard state change | [106](src/styles/global.css:106) |
| `--ease-card` | `cubic-bezier(0.22, 1, 0.36, 1)` | Card flip easing | [109](src/styles/global.css:109) |
| `--dur-flip` | 600ms | Quiz/Fakten card flip | [110](src/styles/global.css:110) |
| `--dur-slide` | 320ms | Quiz card slide between questions | [111](src/styles/global.css:111) |
| `--lift-md` | 6px | Hover-lift vertical offset | [112](src/styles/global.css:112) |

`@media (prefers-reduced-motion: reduce)` rules in global.css and dashboard.css disable transitions — preserve this in any motion variants you propose.

### 2.10 Layout primitives

| Token | Value | Use | Line |
|---|---|---|---|
| `--nav-height` | 56px | Fixed header height; main content top-padding offset | [82](src/styles/global.css:82) |
| `--max-width` | 1100px | Content container (`<main>`, header nav) | [83](src/styles/global.css:83) |
| `--max-width-prose` | 740px | Prose blocks (article body, FAQ answers) | [84](src/styles/global.css:84) |

### 2.11 Card system tokens

The Fakten-Karten card is the source of truth for every card-shaped surface on the home page. Change one value here and the hero fan, four-paths tiles, audience shortcut cards, and inner-preview decks re-proportion together.

| Token | Value | Use | Line |
|---|---|---|---|
| `--card-aspect-ratio` | `1 / 1.4` | Portrait (Fakten-Karten standard) | [118](src/styles/global.css:118) |
| `--card-width-max` | 280px | Maximum card width before grid wraps | [119](src/styles/global.css:119) |
| `--card-padding` | `var(--space-lg)` (24px) | Inner padding | [120](src/styles/global.css:120) |
| `--card-radius` | `var(--radius-lg)` (12px) | Corner radius | [121](src/styles/global.css:121) |
| `--card-shadow` | `var(--shadow-md)` | Default elevation | [122](src/styles/global.css:122) |
| `--card-border-color` | `var(--color-border)` | Border tint | [123](src/styles/global.css:123) |

### 2.12 Breakpoints (PROPOSED — not yet in code)

The codebase has **~71 ad-hoc media queries across ~30 distinct breakpoint values** (`global.css` + `dashboard.css` + `quiz.css`). Most-used: `640px` (23x), `720px` (10x), `1024px` (mobile/desktop pivot), `480px` (6x), `768px` (6x). Most-used breakpoint **decisions**:

- **`max-width: 1023px`** — mobile bottom tab bar visibility (show below, hide above)
- **`max-width: 640px`** — most responsive tweaks (spacing tightening, chart heights, text reflow)
- **`max-width: 480px`** — smallest viewport refinements (chart legends, filter bars)

**Proposed token set** for a future consolidation (not yet in `:root`):
```css
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1440px;
```

This is the proposed consolidation target referenced by the `responsive-tokens-sweep` skill / `docs/ai-pipeline/known-quirks.md` finding #1. Claude design should adopt these four breakpoints as the canonical responsive system; the codebase will catch up via a dedicated refactor pass.

---

## 3. Iconography

**Library:** Lucide React (`lucide-react`) — installed and imported across ~20+ component files.

**Custom glyph system** (this is the one that matters for design):

- [`VerdictArrow`](src/components/shared/VerdictArrow.tsx) — directional SVG arrow (24×24 viewBox, sized in px by `size` prop, default 14px). The verdict-glyph paths live in [`src/components/shared/verdictGlyph.tsx`](src/components/shared/verdictGlyph.tsx). Used wherever a verdict needs visual representation: pills, statements, chart cells, factsheet headers, scrollytelling.
- Each verdict has a **shadow line** (perceptually lighter shade) underneath the arrow, used for layering in dense viz (e.g. scrollytelling grid cells where the glyph sits on a colored background).
- `colorOverride` prop lets the same SVG render white-on-color (for tinted backgrounds like scrollytelling step 4).

**Recurring Lucide icons** (treat these as the de-facto icon set):

| Category | Icons | Notes |
|---|---|---|
| **Verdict arrows** | `ArrowUp`, `ArrowUpRight`, `ArrowDownLeft`, `ArrowDown`, `Minus` | Used by `VerdictScale` directly (it does NOT use the custom glyph) |
| **Navigation chrome** | `FileText`, `Grid`, `Brain`, `Info`, `HelpCircle` | Mobile bottom tab bar uses **inline SVG**, not Lucide — see §4 |
| **Dashboard** | `BarChart3`, `Eye`, `TrendingUp`, `Target`, `Shield`, `MapPin` | Indicator tags, view tabs |
| **UI chrome** | `X`, `ChevronDown`, `ChevronUp`, `Search` | Drawer close, accordion, filter |
| **Rich content** | `User`, `FileText` | Scrollytelling avatars / source markers |

**Known issue (carry to Claude design):** Icons are sized with fixed pixel `size={24}`. At zoom ≥150% they misalign with surrounding text. Recommendation when you mock new components: use relative sizing (1em with `aria-hidden`) where icons sit inline with text. See [`docs/ai-pipeline/known-quirks.md`](docs/ai-pipeline/known-quirks.md) finding #8.

---

## 4. Component library

Sized for paste-in. Each component lists: anatomy → variants → states → file:line.

### 4.1 Verdict primitives

These three are the **core** of the design system. Every other component composes from them.

#### `VerdictArrow`
[`src/components/shared/VerdictArrow.tsx:1-73`](src/components/shared/VerdictArrow.tsx:1)

- **Anatomy:** `<svg>` (24×24 viewBox) with verdict-glyph paths — chevron + shaft + shadow line.
- **Props:** `verdict` (required), `size?` (default 14px), `strokeWidth?` (default 2), `colorOverride?: { main: string; shadow: string }`.
- **Variants:** none — color and direction are functions of `verdict`.
- **Used in:** `VerdictPill`, `VerdictStatement`, dashboard chart cells, factsheet headers, scrollytelling step 4 grid (with `colorOverride` for white-on-color).

#### `VerdictPill`
[`src/components/shared/VerdictPill.tsx:1-169`](src/components/shared/VerdictPill.tsx:1)

The **canonical verdict marker** site-wide.

- **Anatomy:** `<span class="pill__icon">` (VerdictArrow) + `<span class="pill__label">` (German label) on tinted background.
- **Variants:**
  - `variant: 'pill' | 'puck'` — pill = rounded rectangle with label; puck = colored circle with white arrow, no label (used in scrollytelling grid cells & tally rows).
  - `size: 'sm' | 'md' | 'lg'` — icon scales 11 / 13 / 15px (pill), 12 / 14 / 18px (puck).
  - `as: 'span' | 'button'` — when button, accepts `onClick`, `aria-pressed`.
- **States:** default, hover (darker tint), active (`aria-pressed`), disabled (muted).
- **Label override:** `label?` prop replaces the default German label (rarely used).
- **Used in:** quiz reveal chips ("Ihre Antwort" / "Wissenschaftlich"), dashboard `VerdictTags`, factsheet verdict line, FAQ rail, anywhere a stand-alone verdict label is needed.

#### `VerdictStatement`
[`src/components/shared/VerdictStatement.tsx:1-94`](src/components/shared/VerdictStatement.tsx:1)

The **"title carries the verdict"** pattern — myth statement in bold + verdict color with the arrow glued to the last word so it never orphans on line wrap.

- **Anatomy:** head text (all but last word) + tail (`<span class="stmt-tail">` wrapping last word + `VerdictArrow` with `white-space: nowrap`).
- **Props:** `statement`, `verdict`, `as?: 'p' | 'h1' | 'h2' | 'h3' | 'span'` (default `'p'`), `arrowSize?`.
- **Used in:** `FaktenCard` front face, Daten-Explorer myth-card list, factsheet detail page H1.

### 4.2 Chips, pills, tags

#### `VerdictTags`
[`src/components/dashboard/VerdictTags.tsx:1-73`](src/components/dashboard/VerdictTags.tsx:1)

Filter row in Daten-Explorer. Radio-group behavior — clicking an active pill clears the filter back to "Alle".

- **Anatomy:** one "Alle" neutral button + five `<VerdictPill as="button">` (Richtig, Eher richtig, Eher falsch, Falsch, Keine Aussage).
- **Container behavior:** `.pill-group--has-active` class dims inactive siblings to opacity 0.42 (gives the "this filter is on" cue).

#### `StreakChip`
[`src/components/quiz/StreakChip.tsx:1-33`](src/components/quiz/StreakChip.tsx:1)

Tiny "🔥 N richtig in Folge" chip pinned to the QuizCard front face when streak ≥ 2.

- **Critical placement:** Mounted INSIDE the front-face div (not on card root) so the 3D flip doesn't mirror it on the back. **Preserve this in any Figma component layering.**

#### `IndicatorTag`, `CategoryFilterChip`, `AudiencePill`
Three closely-related compact chips that share styling but ship in different files:

- **IndicatorTag** ([`FilterBar.tsx:56-76`](src/components/dashboard/FilterBar.tsx:56)) — Lucide icon (Eye, TrendingUp, Target, Shield, 14px) + label, radio behavior.
- **CategoryFilterChip** ([`FilterBar.tsx:142-154`](src/components/dashboard/FilterBar.tsx:142), also used by FaktenFilterBar) — `.filter-cat-chip` class, toggle behavior, supports "Select All" / "Deselect All".
- **AudiencePill** — colored pill using `--audience-{id}` token + emoji prefix; pattern from `FaqRelatedRail` and the audience-shortcut cards on home.

### 4.3 Cards

#### `FaktenCard`
[`src/components/fakten-karten/FaktenCard.tsx:1-118`](src/components/fakten-karten/FaktenCard.tsx:1)

Editorial card on `/fakten-karten/`. 3D Y-axis flip on desktop hover; tap-to-open factsheet on touch devices.

- **Anatomy (front):** left-edge category stripe (color per category) + `VerdictStatement` (myth title) + `CategoryFooter` (category name + icon).
- **Anatomy (back):** same stripe + `cardShortSummary` text + "Tippen für mehr →" CTA.
- **3D layering:** `.fakten-card__face` + `.fakten-card__inner` for transform; stripe preserved through flip.

#### `QuizCard`
[`src/components/quiz/QuizCard.tsx:1-447`](src/components/quiz/QuizCard.tsx:1)

The question/answer surface — flippable front/back with randomized 4-segment scale.

- **Anatomy (front):**
  - Topbar (question counter + category label)
  - `StreakChip` if active
  - Myth statement (plain text, no color)
  - `VerdictScale` (4-segment radio)
  - Swipe-edge overlays (← / → arrows, mobile only)
- **Anatomy (back, after answer):**
  - Topbar (same counter)
  - Statement re-tinted by scientific verdict via `statement--{verdict}` class
  - Answer chip pair: "Ihre Antwort: [VerdictPill]" + "Wissenschaftlich: [VerdictPill]"
  - Schritte verdict line (large monochrome text — e.g. "Genau richtig", "Knapp daneben")
  - Explanation paragraph (scrollable)
  - Population stat bar (e.g. "62% der Erwachsenen (18–70) wussten das")
  - Action buttons ("Mehr Info" secondary / "Nächste Frage →" primary)
- **Idle tilt:** deterministic per `mythId`, ±1.5°, shuffled-deck feel.
- **Swipe gesture:** left = prev, right = next (mobile only).

#### Deck card (quiz-select / audience-hub)
- Quiz select: [`src/pages/quiz/index.astro:1-135`](src/pages/quiz/index.astro:1)
- Audience hub: [`src/pages/meine-interessen/index.astro:1-57`](src/pages/meine-interessen/index.astro:1)

Layered "deck stack" appearance via CSS pseudo-elements. **Depth rule by question count** (quiz only): ≤6 questions → 1 card; 7–9 → 2 cards (`::before`); ≥10 → 3 cards (`::before` + `::after`).

- **Anatomy:** emoji + title + question count + optional "Zuletzt: X/Y · Z%" chip (read from `localStorage` key `cm-quiz-score-{slug}` — inline script in the page).
- **Idle tilt:** `hash(slug) % 1000` mapped to ±1.6°.

### 4.4 Tabs & segmented controls

#### `ViewTabs`
[`src/components/dashboard/ViewTabs.tsx:1-76`](src/components/dashboard/ViewTabs.tsx:1)

Daten-Explorer view switcher.

- **Anatomy:** `<nav class="tabs-bar" role="tablist">` + multiple `<button class="tab-btn" role="tab">` + visual divider before "Quellen" tab (signals IA shift from viz type to content type) + optional "Rundgang" chip at the right end (MapPin icon + label).
- **State:** `aria-selected` marks active tab.

#### `VerdictScale`
[`src/components/quiz/VerdictScale.tsx:1-130`](src/components/quiz/VerdictScale.tsx:1)

4-segment horizontal verdict spectrum, left to right: **Falsch → Eher Falsch → Eher Richtig → Richtig**.

- **Anatomy:** optional gradient hairline at top + `<div role="radiogroup">` + four `<button class="verdict-scale__seg--{verdict}">`, each with:
  - Lucide arrow icon (ArrowDown / ArrowDownLeft / ArrowUpRight / ArrowUp)
  - Label ("Falsch", "Eher falsch", "Eher richtig", "Richtig")
  - Keyboard hint ("Taste 1" / "2" / "3" / "4")
- **Variants:**
  - `full` (default) — labels + keyboard hints visible.
  - `compact` (read-only) — labels hidden, used in ResultScreen review rows.

### 4.5 Filter & search

#### `FilterBar`
[`src/components/dashboard/FilterBar.tsx:1-163`](src/components/dashboard/FilterBar.tsx:1)

Three-section dashboard filter: indicators + population groups + collapsible categories.

- **Categories section:** chevron toggle + selection count + "Select All"/"Deselect All" actions + grid of `CategoryFilterChip`.
- **Hide props:** `hideIndicators`, `hideGroups`, `hideCategories` for context-specific use (e.g. Sources views hide indicators).

#### `FaktenFilterBar`
[`src/components/fakten-karten/FaktenFilterBar.tsx:1-400`](src/components/fakten-karten/FaktenFilterBar.tsx:1)

Inline filter row on Fakten-Karten (no drawer — always visible).

- **Anatomy (left → center → right):**
  - Count chip ("X von 42 Mythen" or "42 Mythen")
  - Search autocomplete: focus opens dropdown with one row per matching myth (checkbox + `VerdictStatement` + tiny category icon). Multi-select combobox — selections persist across close.
  - Kategorien dropdown: trigger button + chevron + count badge + panel with category checkboxes + per-category count + reset button.
- **Filter composition:** AND across search-selected myths + selected categories.

#### `InfoTooltip`
[`src/components/dashboard/InfoTooltip.tsx:1-95`](src/components/dashboard/InfoTooltip.tsx:1)

Hover/focus info icon → tooltip card.

- **Anatomy:** Lucide `Info` (13px) trigger + fixed-positioned card (flips to stay in viewport): title + optional sample size + definition + optional scale info.
- **Used in:** `FilterBar` (indicators and groups have explainer tooltips).

### 4.6 Overlays

#### `FactsheetPanel`
[`src/components/shared/FactsheetPanel.tsx:1-399`](src/components/shared/FactsheetPanel.tsx:1)

Slide-in myth factsheet panel. **Unified** from previous quiz + dashboard implementations — one shared component, two context wrappers.

- **Layout:**
  - Desktop: slides in from right (~480px wide).
  - Mobile: bottom sheet (slides up).
- **Anatomy:**
  - Backdrop (semi-transparent, click to close)
  - Header (× close button)
  - Body (scrollable):
    - `VerdictStatement` (`<p>`, 18px arrow)
    - "Wissenschaftlich: [VerdictPill]" verdict line
    - Ordered collapsible sections (Einordnung, Synthese, Zentrale Erkenntnisse, Referenzen)
    - `FactsheetGroupBars` chart (interactive — replaces static markdown table when build-time metrics are provided)
    - Link to full factsheet page
- **Context wrappers:** [`src/components/quiz/FactsheetPanel.tsx`](src/components/quiz/FactsheetPanel.tsx), [`src/components/dashboard/FactsheetPanel.tsx`](src/components/dashboard/FactsheetPanel.tsx), `MythPopupHost` for FAQ.

#### `Drawer`
[`src/components/shared/Drawer.tsx:1-154`](src/components/shared/Drawer.tsx:1)

Generic modal/sheet primitive.

- **Variants:**
  - `side` (default) — desktop side slide-out (`left` | `right`), mobile bottom-sheet. Sizes `sm` / `md` / `lg`.
  - `modal` — centered modal on desktop (max 720px), bottom-sheet on mobile.
  - `bottom-sheet` — forced bottom-sheet at all breakpoints.
- **Anatomy:** backdrop + header (title + description + optional header-end slot + close ×) + scrollable body + sticky footer (optional).
- **Behavior:** close on backdrop click, X, or Escape; focus trap enabled.

#### `MehrPopover`
[`src/components/scrollytelling/MehrPopover.tsx`](src/components/scrollytelling/MehrPopover.tsx) — lightweight popover for scrollytelling supplementary content.

### 4.7 Progress & status

#### `ProgressBar`
[`src/components/quiz/ProgressBar.tsx:1-105`](src/components/quiz/ProgressBar.tsx:1)

Quiz header progress (portal-mounted into the site header).

- **Anatomy:** title label + thin horizontal bar (0–100% fill) + score chip + progress label ("X von Y beantwortet").
- **Score chip:** color class `quiz-score__value--positive` (≥80%), `--neutral` (40–79%), `--negative` (<40%). Flashes (600ms) on each new answer; flash class depends on point delta (great / good / warn / bad).

### 4.8 Buttons & CTAs

Single class system: `.carm-btn` base + modifiers.

| Modifier | Use |
|---|---|
| `--primary` | Full-color CTA, dominant action |
| `--secondary` | Outlined, less prominent |
| `--ghost` | Text-only, lowest prominence |
| `--icon` | Icon-only (close, etc.) |

**Recommended consolidation** (Claude design should codify, code will catch up):
- Add explicit size modifiers `--sm` / `--md` / `--lg` since the same primary renders at three distinct visual sizes today ("Nächste Frage →" on QuizCard back, Rundgang chip on ViewTabs, "Ergebnis ansehen →" on ResultScreen).
- States: default / hover / active / disabled / focus-visible (the last one is currently inconsistent — see Known divergences §7).

### 4.9 Layout chrome

#### Desktop header / nav
[`src/layouts/BaseLayout.astro:110-120`](src/layouts/BaseLayout.astro:110), styled at [`src/styles/global.css:224-312`](src/styles/global.css:224)

- Fixed at top, height `--nav-height: 56px`.
- Contents: brand link (left) + 5 main nav links (Fakten-Karten · Daten-Explorer · Meine Interessen · Quiz · Über das Projekt) + optional quiz progress slot (right).
- **Hero-aware:** `body.has-hero > header:not(.is-scrolled)` shows transparent background + white text until user scrolls past 85% viewport.
- Hidden on viewports `<1024px`, **except** during the quiz, where it stays visible to show the `ProgressBar`.

#### Mobile bottom tab bar
[`src/layouts/BaseLayout.astro:183-204`](src/layouts/BaseLayout.astro:183), styled at [`src/styles/global.css:2295-2365`](src/styles/global.css:2295)

- Visible only on `<1024px`.
- Fixed at bottom; frosted-glass background (`backdrop-filter: blur(24px)`).
- **Five items, each with inline SVG icon (NOT Lucide) + label:**
  1. Fakten-Karten (document icon)
  2. Daten-Explorer (grid icon)
  3. Quiz (brain icon)
  4. Meine Interessen (info icon)
  5. Projekt (info icon)
- Icons: 20×20px.
- Active state: brand accent color.

#### Footer
[`src/layouts/BaseLayout.astro:124-135`](src/layouts/BaseLayout.astro:124)

Inside `<main>`. Small/muted typography. Contains: copyright + "Feedback geben" link (triggers Feedbucket widget). On mobile, sits above the tab bar with safe-area inset padding.

---

## 5. Page templates (screens)

Ten templates. Each cross-references components from §4 by name; no re-documentation.

### 5.1 Home `/`
Entry: [`src/pages/index.astro`](src/pages/index.astro)

Long-scroll narrative, full-bleed blocks stacked vertically. No persistent chrome between blocks.

**Block sequence:**
1. **HeroFrageBlock** (React, [`src/components/hero/HeroBlock.tsx`](src/components/hero/HeroBlock.tsx) and friends) — full-bleed; rotating card fan (CSS-offset stack); auto-rotate 6s; pauseable by click/keypress; two CTAs. Data: [`src/content/hero-block.yaml`](src/content/hero-block.yaml).
2. **NumbersStripBlock** — three large numerals + labels + subline + optional link. Data: [`src/content/numbers-strip.yaml`](src/content/numbers-strip.yaml).
3. **FourPathsBlock** — hook quote + 4 preview tiles (Quiz / Fakten-Karten / Daten-Explorer / Meine Interessen) each with an inline preview. Data: [`src/content/headline-finding.yaml`](src/content/headline-finding.yaml), [`src/content/four-paths.yaml`](src/content/four-paths.yaml).
4. **AudienceShortcutBlock** — 5 audience cards (one per Zielgruppe), each with emoji + recommendation copy + CTA. Data: [`src/content/audience-shortcut.yaml`](src/content/audience-shortcut.yaml).
5. **ProjectStripBlock** — credit + funding-partner link grid. Data: [`src/content/project-strip.yaml`](src/content/project-strip.yaml).

**Responsive:** desktop ≥1024px = full-width with multi-col grids; tablet 768–1023px = 2-col; mobile <768px = single-col stack.

### 5.2 Daten-Explorer `/daten-explorer/`
Entry: [`src/pages/daten-explorer/index.astro`](src/pages/daten-explorer/index.astro), root component [`MythenExplorer.tsx`](src/components/dashboard/MythenExplorer.tsx)

**Layout:** sidebar (left, sticky, ~280–320px) + main flex-grow.

**Sidebar:** `FilterBar` + `VerdictTags` + `DashboardOnboarding` tooltip (shown once, dismiss-persisted).

**Main:** `ViewTabs` switches between 12 views, each in [`src/components/dashboard/views/`](src/components/dashboard/views/):
`balken`, `balken2`, `table`, `scatter`, `lollipop`, `overview`, `circular`, `ladder`, `strips`, `spannweite`, `sources`, `sources2`. View handle refs expose `export()` for PNG download via `ExportDrawer`.

**Overlays:** `FactsheetPanel` (on row/cell click), `ExportDrawer` (download options).

**State:** URL state sync via `src/lib/dashboard/url-state.ts` (`urlToState()` / `pushState()`) — filter, view, sort, indicator, group, pivot mode persist in query params. Back button works.

**Data load:** client-side fetch of `/data/carm-data.json` on mount (treat as immutable upstream artifact — never modify without ask).

**Mobile:** sidebar collapses to drawer (hamburger); tabs may scroll horizontally; chart height capped.

### 5.3 Daten-Explorer detail `/daten-explorer/[slug]/`
Entry: [`src/pages/daten-explorer/[slug].astro`](src/pages/daten-explorer/[slug].astro)

Single-column article.

**Anatomy (top to bottom):**
- Header: myth ID (e.g. "Mythos 14") + `VerdictStatement` as h1 + tags
- Body sections:
  - **Einordnung** (always visible — Grundlagen layer)
  - **Synthese** (always visible)
  - **Zentrale Erkenntnisse** (collapsible `<details>` — Fachebene layer)
  - **Referenzen** (collapsible `<details>` — Fachebene layer)
- **Lesebeispiel** ([`Lesebeispiel.tsx`](src/components/shared/Lesebeispiel.tsx)) — interactive bar chart (per-group metric example)
- Related-myths list (link grid, same category)
- FAQ-backlinks rail — colored audience pills + emoji + question snippet + link to `/meine-interessen/{audienceId}/#faq-{questionSlug}`

### 5.4 Fakten-Karten `/fakten-karten/`
Entry: [`src/pages/fakten-karten/index.astro`](src/pages/fakten-karten/index.astro), root [`FaktenKartenExplorer.tsx`](src/components/fakten-karten/FaktenKartenExplorer.tsx)

**Anatomy:** intro (h1 + description) → `FaktenFilterBar` (inline, sticky) → responsive card grid of `FaktenCard`.

**Responsive grid:** desktop 4-col, tablet 2-col, mobile 1-col.

**Overlay:** `FactsheetPanel` on card click (touch devices) or "Mehr erfahren" (desktop after flip).

**Categories:** 8 myth category groups, source-of-truth [`src/components/fakten-karten/FaktenKartenExplorer.tsx:41-50`](src/components/fakten-karten/FaktenKartenExplorer.tsx:41).

### 5.5 Quiz select `/quiz/`
Entry: [`src/pages/quiz/index.astro`](src/pages/quiz/index.astro)

**Anatomy:** intro + deck-card grid (5 themes + 1 featured Schnellcheck).

**Themes** (from [`quizMeta` at quiz/index.astro:18-26](src/pages/quiz/index.astro:18)):

| Slug | Emoji | Questions |
|---|---|---|
| `quiz-medizinischer-nutzen` | 💊 | 7 |
| `quiz-risiken-koerper-psyche` | ⚠️ | 10 |
| `quiz-stimmung-wahrnehmung` | 🧠 | 6 |
| `quiz-soziales-bevoelkerung` | 🏛️ | 10 |
| `quiz-gefaehrlichkeit` | 🚨 | 7 |
| `quiz-schnellcheck` (featured) | 🎲 | 7 (randomized) |

Inline script reads `cm-quiz-score-{slug}` from `localStorage` to populate the "Zuletzt: X/Y · Z%" chip on each tile.

### 5.6 Quiz player `/quiz/[slug]/`
Entry: [`src/pages/quiz/[slug].astro`](src/pages/quiz/[slug].astro), root [`QuizPlayer.tsx`](src/components/quiz/QuizPlayer.tsx)

**Flow (single full-bleed React app):**
1. `TitleCard` — title + emoji + question count + Start CTA
2. `QuizCard` × N — flip on answer; "Mehr Info" opens `FactsheetPanel`; "Nächste Frage →" advances
3. `ResultScreen` — score band verdict + verdict intro + retrospective list (each row uses `VerdictScale variant="compact"`) + `ShareCard` + cross-links (Daten-Explorer, Fakten-Karten)

**Chrome:** sticky `ProgressBar` (portal-mounted in header).

**Persistence:** `localStorage` key `cm-quiz-progress::{slug}` stores `{ currentIndex, answers: CardAnswer[] }`. On reload, restored synchronously via lazy `useState` initializer (no flash).

**Scoring** — all per-question math goes through these functions in [`src/components/quiz/quizData.ts`](src/components/quiz/quizData.ts):
- `schritte(userVerdict, correctVerdict)` — 0/1/2 distance on the 4-level scale
- `pointsForSchritte(steps)` — points lookup
- `moduleScore(answers)` — weighted total
- `breakdownCounts(answers)` — count per-verdict-class
- `scoreBand(score)` — band: `profi | guterweg | gehtnoch | erwischt`

**Verdict intro copy** (4 bands, German):
- `profi` — top tier (90–100)
- `guterweg` — strong (70–89)
- `gehtnoch` — middling (50–69)
- `erwischt` — bottom (0–49)

**Fallback chain for band copy:** per-module `verdicts.{band}` override → global singleton [`src/content/share-copy.yaml`](src/content/share-copy.yaml) → hardcoded fallback in `ResultScreen.tsx`. Same chain for `shareCopy`.

### 5.7 Meine Interessen hub `/meine-interessen/`
Entry: [`src/pages/meine-interessen/index.astro`](src/pages/meine-interessen/index.astro)

5 audience deck cards (same depth-card styling as quiz-select). Includes a collapsible "Methodische Anmerkung" explaining CaRM and the 4-level classification.

**Audiences** (source-of-truth [`src/content/faq/audiences.yaml`](src/content/faq/audiences.yaml)):

| ID | Emoji | Color | Voice |
|---|---|---|---|
| `eltern` | 👨‍👩‍👧 | `--audience-eltern` | **Sie** |
| `jugendliche` | 🧑 | `--audience-jugendliche` | Du |
| `konsumierende` | 🌿 | `--audience-konsumierende` | Du |
| `lehrkraefte` | 🧑‍🏫 | `--audience-lehrkraefte` | **Sie** |
| `fachkraefte` | 🔬 | `--audience-fachkraefte` | **Sie** |

### 5.8 Meine Interessen detail `/meine-interessen/[slug]/`
Entry: `src/pages/meine-interessen/[slug].astro`

**Anatomy:** `AudienceHeader` (emoji + cardLabel + description + `WeiterfuehrendList` + conditional `HelplineBox`) → FAQ accordion list (`FaqQuestion`, each with collapsible answer + optional `FaqVerdictPill` for referenced myths) → `FaqRelatedRail` (sidebar link rail to related myth detail pages).

### 5.9 Projekt `/projekt/`
Entry: [`src/pages/projekt/index.astro`](src/pages/projekt/index.astro), root [`ScrollytellingViewer.tsx`](src/components/scrollytelling/ScrollytellingViewer.tsx)

Two-column scrollytelling.

**Layout:**
- Desktop ≥1024px: left text column (~40%) scrolls; right viz column (~60%, **45vh pinned**) updates per step.
- Mobile <1024px: viz pinned to top (45vh); text scrolls below in single column.

**8 step viz types** (from `stepDefinitions.ts`):
1. `VizTimeline` — D3/SVG horizontal timeline
2. `VizPeopleVoices` — quote/avatar grid
3. `VizMythGrid` — 42-myth grid; highlights specific rows per step
4. `VizSampleAndRanked` — sample distribution + ranked metrics
5. `VizSourcesStrips` — colored strips per information source
6. `VizCtaGrid` — 4 navigation tiles
7. `VizTeamRow` — team member cards
8. (+1 additional)

**Inline verdict markers in body copy:**
- `[↑ richtig]` → renders as full `VerdictPill` (colored puck + label)
- `{↑ richtig}` → renders as `VerdictArrow` only
- Parser: `renderBodyWithVerdicts()` in `ScrollytellingViewer`.

### 5.10 Login `/login`
Entry: [`src/pages/login.astro`](src/pages/login.astro)

Centered single-card form. Plain HTML + vanilla JS (no React). Gates the whole site when `SITE_PASSWORD` env var is set; middleware exempts `/login` and `/api/*`.

**Anatomy:** title + subline + password input + submit button + error message (hidden by default).

---

## 6. Enums & content tokens (chip libraries for Claude design)

These recurring sets should be **variant enums** in the design system — every chip / pill / filter / sort dropdown / dashboard slicer composes from one of them.

### 6.1 `CorrectnessClass` (4 verdicts + 1 keine_aussage)
Source: [`src/lib/dashboard/types.ts`](src/lib/dashboard/types.ts)
```ts
'richtig' | 'eher_richtig' | 'eher_falsch' | 'falsch' | 'no_classification'
```
**Note:** code uses `no_classification`; content uses `keine_aussage`. Same concept, different surfaces.

### 6.2 `GroupId` — five Zielgruppen
Source: `src/lib/dashboard/types.ts`
```ts
'adults' | 'minors' | 'consumers' | 'young_adults' | 'parents'
```
German labels: Volljährige (18–70), Minderjährige (16–17), Konsumierende, Junge Erwachsene (18–26), Eltern.

### 6.3 `Indicator` — five dashboard metrics
Source: `src/lib/dashboard/types.ts`
```ts
'awareness' | 'significance' | 'correctness' | 'prevention_significance' | 'population_relevance'
```

### 6.4 `ViewTab` — 12 dashboard views
Source: `src/lib/dashboard/types.ts`
```ts
'balken' | 'balken2' | 'table' | 'scatter' | 'lollipop' | 'overview'
 | 'circular' | 'ladder' | 'strips' | 'spannweite' | 'sources' | 'sources2'
```

### 6.5 `FaqAudienceId` — five audiences
Source: [`src/content/faq/audiences.yaml`](src/content/faq/audiences.yaml)
```ts
'eltern' | 'jugendliche' | 'konsumierende' | 'lehrkraefte' | 'fachkraefte'
```

### 6.6 Quiz score bands
Source: [`src/components/quiz/quizData.ts`](src/components/quiz/quizData.ts)
```ts
'profi' | 'guterweg' | 'gehtnoch' | 'erwischt'
```

### 6.7 Eight myth category groups
Source: [`src/components/fakten-karten/FaktenKartenExplorer.tsx:41-50`](src/components/fakten-karten/FaktenKartenExplorer.tsx:41)
1. Medizinischer und therapeutischer Nutzen
2. Risiken für den Körper und die Entwicklung
3. Risiken für die psychische Gesundheit
4. Einfluss auf Stimmung und Wahrnehmung
5. Soziale Auswirkungen und Leistungsfähigkeit
6. Risiken durch Dosierung und Qualität
7. Verbreitung in der Bevölkerung und Gesetzgebung
8. Allgemeine Einschätzung der Gefährlichkeit

### 6.8 Six quiz themes
Source: [`src/pages/quiz/index.astro:18-26`](src/pages/quiz/index.astro:18) — see §5.5 table above.

---

## 7. Known divergences & opportunities

Honest list. **Do not canonize these in Claude design as patterns** — these are the things the design system should *fix*, not *preserve*. Each is referenced from [`docs/ai-pipeline/known-quirks.md`](docs/ai-pipeline/known-quirks.md) where applicable.

| # | Divergence | Fix direction |
|---|---|---|
| 1 | **~71 ad-hoc media queries / ~30 distinct breakpoint values** in `global.css` + `dashboard.css` + `quiz.css` | Adopt the 4-token system in §2.12; pending `responsive-tokens-sweep` skill (known-quirks #1) |
| 2 | **`.carm-btn` sizes are implicit** — same `--primary` renders at three visual sizes in practice | Add explicit `--sm/--md/--lg` size modifiers + canonical state palette (see §4.8) |
| 3 | **DM Serif Display imported but never used** ([`BaseLayout.astro:4`](src/layouts/BaseLayout.astro:4)) | Remove the import |
| 4 | **No shared form components** — native `<input type="checkbox">` / `<input type="search">` everywhere | Create `Checkbox`, `Radio`, `SearchInput` primitives if Claude design wants form controls |
| 5 | **`.quiz-card__cell` reused by Fakten-Karten** — works but the name misleads | Rename to `.card-cell` if/when a touch happens |
| 6 | **100vh on iOS Safari** (hero, scrollytelling) | Use `100dvh` (or `min-height: 100vh; min-height: 100dvh` fallback) (known-quirks #2) |
| 7 | **Fixed `size={24}` Lucide icons** misalign at zoom ≥150% | Use `size="1em"` with `aria-hidden` for inline icons (known-quirks #8) |
| 8 | **Focus rings disabled without `:focus-visible`** in some surfaces | Add `:focus-visible` rules everywhere `outline: none` lives (known-quirks #9) |
| 9 | **No `srcset`/`sizes` on images** | Use Astro `<Image>` with widths/sizes (known-quirks #10) |
| 10 | **Sticky filter bar overlaps mobile tab bar** on some viewports | Add tab-bar-height padding (known-quirks #12) |
| 11 | **Scroll-snap jitter on iOS** in scrollytelling | Downgrade `scroll-snap-type: y mandatory` → `proximity` (known-quirks #6) |
| 12 | **`overflow: hidden` disables touch momentum** on QuizCard inner | Add `-webkit-overflow-scrolling: touch` (known-quirks #7) |

Full file: [`docs/ai-pipeline/known-quirks.md`](docs/ai-pipeline/known-quirks.md).

---

## 8. Round-trip token-diff protocol

Operational workflow for changes that originate in Claude design and need to flow back to code.

**When you change a token in Claude design:**

1. **In Claude design:** make the edit (e.g. nudge `--color-accent` from `#2d6a4f` to `#2f7355`).
2. **Copy a diff snippet** in any clear format — three equally good options:
   - Plain text: `--color-accent: #2f7355  (was #2d6a4f)`
   - JSON entry from `tokens.json`: `"default": { "name": "--color-accent", "value": "#2f7355", "line": 22 }`
   - Whole table row from `spec.md` §2.2
3. **Paste into a fresh Claude Code conversation** in this repo. Prompt: *"Apply the token diff from §2.2 of `docs/design-system/spec.md`."* (or *"from tokens.json color.accent"*).
4. **Claude Code locates the exact line** using the citations (e.g. `src/styles/global.css:22` for `--color-accent`) and applies a one-line `Edit` tool change.
5. **Visual check:** run `./_local/render.sh` (or `npm run dev`) and eyeball the change. Optionally use the `/visual-screenshot-pass` skill for a before/after bundle.
6. **Bump the Last-synced header** in both `spec.md` (top) and `tokens.json` (`$meta.lastSynced` + `$meta.headSha`) so drift is detectable next session.

**When you change a *component* in Claude design:**

That's *not* 1:1 round-trippable. Components live across `.tsx`, `.astro`, and CSS in this repo — they need a normal feature-dev pass. Use the `feature-dev:feature-dev` skill and describe the design-system change in plain language; Claude Code will plan the actual code edits.

**Don't try to round-trip:**

- ❌ Page-template changes (use feature-dev)
- ❌ Adding/removing components (use feature-dev + brainstorming)
- ❌ Changing breakpoint *strategy* (this is a refactor, use `responsive-tokens-sweep`)
- ❌ The Verdict palette itself unless you're certain — it's load-bearing for accessibility (deuteranopia safety) and for data-viz semantics; changing it cascades to every chart

**Do round-trip freely:**

- ✅ Color values within an existing token
- ✅ Spacing/radius/shadow numeric values
- ✅ Typography sizes within the existing scale slots
- ✅ Motion durations and easings
- ✅ Adding a *new* color/spacing/radius token (Claude Code will append at the end of `:root` and update this spec)

---

## Out of scope (for now)

- **No JSON token export** (Tokens Studio / Style Dictionary format) — Claude design only.
- **No screenshot bundle** — request `/visual-screenshot-pass` separately if Claude design needs reference pixels.
- **No code changes triggered by this spec** — §2.12 (breakpoints) and §7 (divergences) are recommendations, not enacted changes.
- **No update to the 'Cannabis Mythen – Design System' artifact itself** — that step happens inside Claude design with this document as input.

---

*End of spec. Last synced 2026-05-21 against HEAD `5420b21`.*
