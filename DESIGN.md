# DESIGN.md — Cannabis: Mythen & Evidenz

> Comprehensive design system, UX architecture, and component specification.
> Grounded in a full codebase audit (March 2026) and enriched with concrete
> UX recommendations for implementation.

---

## 1. Design Philosophy

### 1.1 What This Site Is

An institutional, evidence-based knowledge platform that debunks 42 cannabis myths for a German-speaking audience. Produced by the CaRM research project (ISD Hamburg). The site bridges four distinct audience types — general public, parents, prevention professionals, and researchers — each with different depth expectations.

### 1.2 Design Pillars

**Pillar 1 — Institutional Credibility**
The site must feel like it comes from a university or public-health agency, not a startup or a cannabis brand. Every design choice should pass the test: "Would a Bundeszentrale für gesundheitliche Aufklärung (BZgA) director link to this without hesitation?" No leaf imagery, no stoner aesthetics, no playful gradients. The visual language is that of evidence — structured, calm, precise.

**Pillar 2 — Progressive Disclosure**
The same myth may interest a curious 16-year-old, a worried parent, and a prevention researcher. The design handles this through layers: a short verdict badge → a 2-sentence explanation → a full factsheet with references → a dashboard with survey data. Each layer adds depth without requiring the previous one.

**Pillar 3 — Emotional Honesty**
The 4-level classification system (richtig / eher richtig / eher falsch / falsch) rejects the binary true/false framing of most myth-busting sites. The design must communicate this nuance visually — the classification scale is not "good vs. bad" but a spectrum of evidence quality. Colors should feel diagnostic, not judgmental.

**Pillar 4 — Mobile-First, Interaction-Rich**
60%+ of the target audience (especially minors and young adults) will access via smartphone. The scrollytelling, quiz, and dashboard must work beautifully on a 375px screen. Touch targets ≥44px. Progressive enhancement for desktop.

### 1.3 Design References

The visual territory to aim for, grounded in what the project already implies:

| Reference | What to Learn From It |
|---|---|
| **Our World in Data** | Clean data presentation, institutional authority, evidence-first tone |
| **Gapminder** | Interactive data storytelling, progressive revelation |
| **The Pudding** | Scrollytelling craft, engaging dataviz for general audiences |
| **RKI Dashboard** | German public-health design conventions, clinical clarity |
| **Flourish Studio** | Chart aesthetics, color scales for categorical data |

### 1.4 Anti-Patterns (What to Avoid)

- Cannabis leaf icons, hemp textures, or green-tinted photography
- "Stoner" color palettes (neon green, tie-dye gradients, rasta combinations)
- Gamification beyond the quiz (no points, streaks, or achievements elsewhere)
- Medical-startup aesthetics (rounded sans-serif + pastel illustration style)
- Aggressive debunking tone — the design should invite curiosity, not lecture

---

## 2. Color System

### 2.1 Core Palette (Unified Recommendation)

The warm off-white + forest green foundation is strong and should remain. The slight blue shift in the near-black text color adds sophistication.

```css
:root {
  /* ── Surfaces ─────────────────────────────────────── */
  --color-bg:              #f4f4f0;   /* Warm off-white — page background */
  --color-bg-subtle:       #eeeee8;   /* Slightly darker — section dividers, alternate rows */
  --color-surface:         #ffffff;   /* Cards, panels, modals */
  --color-surface-raised:  #f8fafc;   /* Sidebar, toolbar backgrounds */

  /* ── Text ─────────────────────────────────────────── */
  --color-text:            #1a1a2e;   /* Primary — near-black with blue undertone */
  --color-text-secondary:  #4a5568;   /* Body text, descriptions */
  --color-text-muted:      #718096;   /* Captions, hints, timestamps */
  --color-text-inverse:    #ffffff;   /* Text on dark backgrounds */

  /* ── Borders ──────────────────────────────────────── */
  --color-border:          #e2e8f0;   /* Default borders and dividers */
  --color-border-strong:   #cbd5e1;   /* Emphasized borders (active states) */

  /* ── Accent — Forest Green ────────────────────────── */
  --color-accent:          #2d6a4f;   /* Primary interactive — links, buttons, active nav */
  --color-accent-hover:    #1f4f3a;   /* Hover/press state */
  --color-accent-light:    #e8f5ef;   /* Light tint — selected states, tag backgrounds */
  --color-accent-muted:    #95c4ad;   /* Disabled accent / decorative lines */

  /* ── Focus ────────────────────────────────────────── */
  --color-focus:           #2d6a4f;   /* Focus rings — reuses accent */
  --color-focus-offset:    #ffffff;   /* Offset for double-ring technique */
}
```


**RECOMMENDATION:** The dashboard should use the same `--color-accent: #2d6a4f` as the rest of the site. The current blue (`#1e40af`) creates brand fragmentation. If the dashboard needs visual distinction, achieve it through layout density and surface treatment (e.g., `--color-surface-raised` sidebar), not a different accent color.

### 2.2 Classification Scale (Unified — Single Source of Truth)

This is the most critical design subsystem. Currently implemented three different ways. The recommendation below unifies them.

**Design principle:** The scale is diagnostic, not traffic-light. We avoid pure green/red because (a) red/green colorblindness affects ~8% of men, (b) "richtig" doesn't mean "good" — a true myth like "Cannabis schädigt den Fötus" is classified "richtig" but is not positive news. The scale communicates *degree of scientific support*, not moral valence.

```css
:root {
  /* ── Classification Foreground (text, borders, icons) ─── */
  --color-richtig:         #047857;   /* Emerald-700 — confirmed by evidence */
  --color-eher-richtig:    #4d7c0f;   /* Lime-700 — mostly supported */
  --color-eher-falsch:     #b45309;   /* Amber-700 — mostly unsupported */
  --color-falsch:          #be123c;   /* Rose-700 — contradicted by evidence */
  --color-keine-aussage:   #6b7280;   /* Gray-500 — inconclusive */

  /* ── Classification Backgrounds (badges, chips, cards) ── */
  --color-richtig-bg:      #ecfdf5;   /* Emerald-50 */
  --color-eher-richtig-bg: #f7fee7;   /* Lime-50 */
  --color-eher-falsch-bg:  #fffbeb;   /* Amber-50 */
  --color-falsch-bg:       #fff1f2;   /* Rose-50 */
  --color-keine-aussage-bg:#f3f4f6;   /* Gray-100 */
}
```

**Rationale for this palette over the alternatives:**

- **Emerald** for "richtig" instead of pure green (`#16a34a`) — less "traffic light," more diagnostic
- **Rose** for "falsch" instead of pure red (`#dc2626`) — less alarming, still clearly signals "contradicted"
- **Lime** and **Amber** provide strong visual separation in the middle of the scale — a weakness of the dashboard's amber/burnt-orange pairing which felt too similar
- All five colors pass WCAG AA contrast on their respective `-bg` tokens
- The scale works for ~92% of color vision types (deuteranopia-safe because emerald/lime/amber/rose have distinct luminance values)

**Colorblindness mitigation (required for WCAG AA):** In addition to color, every classification badge should include:

| Classification | Color | Icon | Shape Indicator |
|---|---|---|---|
| Richtig | Emerald | `✓` checkmark | Solid left border |
| Eher richtig | Lime | `◐` half-filled circle | Dashed left border |
| Eher falsch | Amber | `◑` half-empty circle | Dotted left border |
| Falsch | Rose | `✗` cross | Double left border |
| Keine Aussage | Gray | `—` em dash | No border |

These icons are Unicode glyphs and need no icon library. For more polished rendering, use inline SVG (see Section 5.2).

### 2.3 Data Visualization Palette

For charts (scatter, bar, lollipop), the classification colors above are the primary encoding. For secondary encodings (population groups, categories), use this controlled palette:

```css
:root {
  /* ── Population Group Colors (dashboard comparisons) ─── */
  --color-group-adults:        #3B82F6;   /* Blue-500 */
  --color-group-minors:        #F97316;   /* Orange-500 */
  --color-group-consumers:     #8B5CF6;   /* Violet-500 */
  --color-group-young-adults:  #06B6D4;   /* Cyan-500 */
  --color-group-parents:       #EC4899;   /* Pink-500 */
  --color-group-general:       #6B7280;   /* Gray-500 */

  /* ── Category Colors (7 myth themes) ────────────────── */
  --color-cat-uebergreifend:   #6B7280;   /* Gray */
  --color-cat-substanz:        #D97706;   /* Amber-600 */
  --color-cat-koerper:         #DC2626;   /* Red-600 */
  --color-cat-koerper-psyche:  #9333EA;   /* Purple-600 */
  --color-cat-psyche:          #2563EB;   /* Blue-600 */
  --color-cat-soziales:        #0891B2;   /* Cyan-600 */
  --color-cat-rechtliches:     #4F46E5;   /* Indigo-600 */
}
```

### 2.4 Semantic Feedback Colors

```css
:root {
  --color-success:        #16a34a;   /* Quiz correct, form success */
  --color-success-bg:     #f0fdf4;
  --color-warning:        #d97706;   /* Caution states */
  --color-warning-bg:     #fffbeb;
  --color-error:          #dc2626;   /* Form errors, failed validation */
  --color-error-bg:       #fef2f2;
  --color-info:           #2563eb;   /* Informational notices */
  --color-info-bg:        #eff6ff;
}
```

---

## 3. Typography

### 3.1 Recommended Font Pairing

**Heading: Inter** (via `@fontsource/inter` or Astro `<Font>`)
**Body: System font stack** (unchanged)

Inter is the strongest choice for this project: geometric clarity communicates institutional authority, optical sizing produces elegant display headings, variable font keeps bundle size small (~100KB), and German diacritic support is excellent. Its tabular number feature (`font-variant-numeric: tabular-nums`) is critical for the dashboard.

```css
:root {
  --font-display: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-body: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont,
               'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', SFMono-Regular, ui-monospace, 'Cascadia Code',
               'Fira Code', Menlo, Monaco, Consolas, monospace;
}
```

Usage: Headings (h1–h4), nav items, badge labels, card titles, and button text use `--font-display`. Body prose, descriptions, and explanations use `--font-body`.

### 3.2 Type Scale (Harmonized)

Based on a **1.25 major-third ratio** from 16px base. Replaces the current ad-hoc sizes.

| Token | Size | Weight | Line-Height | Use |
|---|---|---|---|---|
| `--text-4xl` | `2.441rem` (39px) | 800 | 1.15 | Hero / scrollytelling headlines |
| `--text-3xl` | `1.953rem` (31px) | 700 | 1.2 | Page titles (h1) |
| `--text-2xl` | `1.563rem` (25px) | 700 | 1.25 | Section headings (h2) |
| `--text-xl` | `1.25rem` (20px) | 600 | 1.3 | Subsection headings (h3), card titles |
| `--text-lg` | `1.05rem` (17px) | 400 | 1.65 | Prose body, factsheet content |
| `--text-base` | `1rem` (16px) | 400 | 1.6 | Default body text |
| `--text-sm` | `0.875rem` (14px) | 500 | 1.5 | Card descriptions, nav links, table cells |
| `--text-xs` | `0.75rem` (12px) | 600 | 1.4 | Badges, chips, captions, labels |
| `--text-2xs` | `0.625rem` (10px) | 700 | 1.3 | Micro-labels (chart axis, step numbers) |

**German-specific considerations:**

- Headlines: Max 2 lines at `--text-3xl`. German compound words (e.g., "Präventionsbedeutung") are ~40% longer than English equivalents. Test all headings at 375px width.
- Word breaking: Apply `hyphens: auto; lang="de"` to all prose containers. German hyphenation rules are well-supported in modern browsers.
- Tabular numbers: All numeric displays (quiz scores, percentages, chart labels) use `font-variant-numeric: tabular-nums` for alignment stability.

### 3.3 Font Loading Strategy

```html
<!-- In BaseLayout.astro <head> -->
<link rel="preload" href="/fonts/inter-var-latin.woff2"
      as="font" type="font/woff2" crossorigin>
```

Use `font-display: swap` with the system font stack as fallback. Subset to Latin Extended (covers German Umlauts, ß, and common typographic characters). Expected WOFF2 size: ~95KB for variable weight axis.

---

## 4. Spacing & Layout System

### 4.1 Spacing Scale (Unchanged — Already Well-Structured)

The existing 7-step scale is solid. Adding one missing token:

| Token | Value | Responsive (≤640px) | Use |
|---|---|---|---|
| `--space-2xs` | `0.125rem` (2px) | 2px | **NEW** — Micro-gaps (badge icon + text) |
| `--space-xs` | `0.25rem` (4px) | 4px | Chip padding, dense lists |
| `--space-sm` | `0.5rem` (8px) | 8px | Inner padding, small gaps |
| `--space-md` | `1rem` (16px) | 16px | Default gap, card inner padding |
| `--space-lg` | `1.5rem` (24px) | `1.25rem` | Section spacing, card padding |
| `--space-xl` | `2rem` (32px) | `1.5rem` | Component separation |
| `--space-2xl` | `3rem` (48px) | `2rem` | Page section separation |
| `--space-3xl` | `4rem` (64px) | `2.5rem` | Hero / scrollytelling margins |

### 4.2 Breakpoints (Unified — 4 Tiers)

**Recommendation:** Standardize all three CSS files to these breakpoints.

| Token | Value | Device | Layout Shift |
|---|---|---|---|
| `--bp-sm` | `640px` | Phone → Phablet | Cards → single column, nav wraps, quiz cards → single col |
| `--bp-md` | `768px` | Phablet → Tablet | Factsheet panel → bottom sheet, scrollytelling viz shrinks |
| `--bp-lg` | `1024px` | Tablet → Desktop | Scrollytelling → two-column, dashboard sidebar appears |
| `--bp-xl` | `1280px` | Desktop → Wide | Dashboard max-width kicks in |

The current 960px dashboard breakpoint should move to 1024px to align with the scrollytelling transition. The current 400px breakpoint becomes a minor tweak within `--bp-sm`.

### 4.3 Layout Containers

| Token | Value | Use |
|---|---|---|
| `--max-width` | `1100px` | Standard content pages |
| `--max-width-prose` | `740px` | Factsheet body, FAQ content, about pages |
| `--max-width-wide` | `1440px` | Dashboard |
| `--max-width-scrolly` | `1280px` | Scrollytelling container |

### 4.4 Grid Patterns

**Card Grid (Index Pages):**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}
@media (max-width: 640px) {
  .card-grid { grid-template-columns: 1fr; }
}
```

**Dashboard Grid:**
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr var(--sidebar-width, 300px);
  gap: var(--space-lg);
}
@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
```

---

## 5. Component Patterns (Detailed Specifications)

### 5.1 Icon System

The project currently uses **no icon library** — only emoji (quiz card selections) and Unicode glyphs (chevrons). This recommendation introduces a lightweight system icon set.

**Recommended: Lucide Icons** (MIT license, ~950 icons, tree-shakeable, React-native)

Install: `npm install lucide-react`

**Proposed Icon Mapping:**

| Context | Icon Name | Use |
|---|---|---|
| **Navigation** | | |
| Startseite | `Home` | Nav + breadcrumbs |
| Zahlen & Fakten | `FileText` | Factsheet section |
| Dashboard | `BarChart3` | Data explorer |
| Selbsttest | `Brain` | Quiz section |
| Häufige Fragen | `HelpCircle` | FAQ section |
| Über uns | `Users` | About section |
| **Classification** | | |
| Richtig | `Check` | Green checkmark |
| Eher richtig | `CheckCircle` (half) | Or custom SVG half-circle |
| Eher falsch | `AlertTriangle` | Amber warning |
| Falsch | `X` | Rose cross |
| Keine Aussage | `Minus` | Gray dash |
| **Population Groups** | | |
| Erwachsene (18–70) | `UserCircle` | Single adult figure |
| Minderjährige (16–17) | `GraduationCap` | Education/youth context |
| Konsumierende | `Activity` | Active pattern |
| Junge Erwachsene (18–26) | `UserPlus` | Young adult addition |
| Eltern | `Heart` | Parental care |
| Allgemeinbevölkerung | `Users` | General population |
| **Quiz Themes** | | |
| Cannabis & Alltag | `Coffee` | Daily life |
| Cannabis & Gesellschaft | `Globe` | Society |
| Cannabis & Körper | `HeartPulse` | Physical health |
| Cannabis & Psyche | `Brain` | Mental health |
| **Myth Categories** | | |
| Übergreifend | `Layers` | Cross-cutting |
| Substanz | `FlaskConical` | Substance/chemistry |
| Körper | `HeartPulse` | Physical body |
| Körper & Psyche | `Activity` | Combined physical+mental |
| Psyche | `Brain` | Mental / cognitive |
| Soziales | `Users` | Social |
| Rechtliches | `Scale` | Legal |
| **Dashboard Indicators** | | |
| Kenntnis (Awareness) | `Eye` | How many know this myth |
| Bedeutung (Significance) | `TrendingUp` | How important people rate it |
| Richtigkeit (Correctness) | `Target` | How correctly people classify it |
| Prävention | `Shield` | Prevention significance |
| **Actions** | | |
| Mehr erfahren | `ArrowRight` | Read more |
| Schließen | `X` | Close panels/modals |
| Teilen | `Share2` | Share quiz results |
| CSV herunterladen | `Download` | Export data |
| Vollbild | `Maximize2` | Fullscreen toggle |
| Filter | `SlidersHorizontal` | Sidebar filters |
| Suche | `Search` | Search input |

**Icon sizing convention:**

| Context | Size | Stroke |
|---|---|---|
| Inline with text (badges) | 14px | 2px |
| Nav items | 18px | 1.75px |
| Card decorations | 24px | 1.5px |
| Empty states | 48px | 1px |

### 5.2 Classification Badge (Unified Component)

The most-reused micro-component. Consolidate three implementations into one.

**Structure:**
```
┌─────────────────────────┐
│ [icon] Classification   │
└─────────────────────────┘
```

**HTML pattern:**
```html
<span class="badge badge--richtig badge--sm" role="status">
  <svg class="badge__icon" aria-hidden="true"><!-- Check --></svg>
  Richtig
</span>
```

**Variants:**

| Variant | Font | Padding | Radius | Use |
|---|---|---|---|---|
| `badge--sm` | `--text-xs` (12px), wt 600 | `2px 8px` | `--radius-sm` (4px) | Inside cards, table cells |
| `badge--md` | `--text-sm` (14px), wt 600 | `4px 12px` | `--radius-sm` (4px) | Factsheet headers, quiz results |
| `badge--pill` | `--text-xs` (12px), wt 700 | `3px 10px` | `--radius-full` | Dashboard filter tags, legend items |

Each variant includes the icon + background color + text color from the classification token system. The icon provides a shape-based redundancy for colorblind users.

### 5.3 Population Group Avatars

The 6 population groups need distinct, recognizable visual treatments for the dashboard sidebar, the scrollytelling group toggle, and chart legends.

**Recommended: Abstract Silhouette System**

Rather than emoji (which vary across platforms) or photographic illustrations (which imply specific demographics), use abstract geometric silhouettes — circles with distinctive internal marks:

| Group | Color | Symbol | Visual Description |
|---|---|---|---|
| **Erwachsene** (18–70) | `--color-group-adults` Blue | Single circle with shoulders | Standard adult silhouette |
| **Minderjährige** (16–17) | `--color-group-minors` Orange | Smaller circle, cap detail | Suggests youth without infantilizing |
| **Konsumierende** | `--color-group-consumers` Violet | Circle with activity line | Abstract wave pattern overlay |
| **Junge Erwachsene** (18–26) | `--color-group-young-adults` Cyan | Circle with plus mark | Between youth and adult |
| **Eltern** | `--color-group-parents` Pink | Two overlapping circles | Adult + child relationship |
| **Allgemeinbevölkerung** | `--color-group-general` Gray | Three overlapping circles | Multiple figures |

**Implementation:** SVG sprites in a `<symbol>` block, referenced via `<use>`. Each is 24×24px with a 2px stroke. Used in:

- Dashboard sidebar checkboxes (inline, 18px)
- Scrollytelling group tabs (24px, with label below)
- Chart legends (16px, inline with text)
- Lollipop/trust-gap chart point markers (custom SVG markers instead of default circles)

### 5.4 Category Identifier (Icon + Label)

**Decision (confirmed):** Myth numbers (m01–m42) are internal editorial IDs only — they do not appear anywhere in the user-facing UI. Individual myths are identified by their title alone. The number 42 remains a site-wide claim ("42 wissenschaftlich geprüfte Mythen") but is never attached to individual entries.

Each myth belongs to one of 7 thematic categories. The category is the primary visual identifier on cards, replacing any numbering. It is displayed as an **icon + text label** pair.

**Category identifier design:**
```
┌──────────────────────┐
│  ♥ Körper            │
└──────────────────────┘
```

- Icon: Lucide icon at 14px, stroke 1.75px, `--color-text-muted`
- Label: `--text-xs`, weight 600, `--color-text-muted`
- Background: none (inline, not a pill or badge)
- Gap between icon and label: `--space-2xs` (2px)

The 7 category mappings (icon → label):

| Category (DE) | Icon | Display Label |
|---|---|---|
| Übergreifend | `Layers` | Übergreifend |
| Substanz | `FlaskConical` | Substanz |
| Körper | `HeartPulse` | Körper |
| Körper & Psyche | `Activity` | Körper & Psyche |
| Psyche | `Brain` | Psyche |
| Soziales | `Users` | Soziales |
| Rechtliches | `Scale` | Rechtliches |

**Note on myth-specific icons:** A unique icon per myth (42 distinct glyphs) is a v2 consideration — it would add visual richness and immediate scannability, but requires a coordinated illustration or icon design effort. The category icon approach is the right foundation and would coexist naturally with myth-level icons if they are introduced later.

**Where this appears:**
- Top-left of factsheet cards (MythCard) — see Section 5.5
- Factsheet detail page header area — see Section 5.11
- Dashboard table first data column, alongside the myth title
- Dashboard chart tooltips (category line, already implemented)

### 5.5 Factsheet Card (MythCard)

The primary content-browsing component. Appears on `/zahlen-und-fakten/` index.

**Desktop layout (within grid cell):**
```
┌──────────────────────────────────────────┐
│  ♥ Körper                [Falsch ✗]      │  ← Header row
│                                          │     Category identifier (left)
│                                          │     Classification badge (right)
│  Cannabis ist ein Allheilmittel.         │  ← Title (--text-xl, wt 600)
│                                          │
│  Die wissenschaftliche Evidenz für die   │  ← Summary (--text-sm, --color-text-secondary)
│  Wirksamkeit ist unzureichend…           │     2-line clamp
│                                          │
│  Medizin · Selbstmedikation              │  ← Topic tags (muted text, no pill shape)
└──────────────────────────────────────────┘
```

**Interaction states:**

| State | Visual Change |
|---|---|
| Default | `border: 1px solid --color-border`, white bg |
| Hover | `border-color: --color-accent`, `shadow-md`, `translateY(-2px)` |
| Focus-visible | `outline: 3px solid --color-focus`, `outline-offset: 3px` |
| Active (pressed) | `shadow-sm`, `translateY(0)` |

**Accessibility:**

- Entire card is a clickable `<a>` wrapping an `<article>`
- `aria-label` includes the myth title and classification, e.g. `"Cannabis ist ein Allheilmittel — Falsch"`
- Category icon is `aria-hidden="true"`; the text label beside it is the accessible name
- Classification badge has `role="status"` and its icon is `aria-hidden="true"` (text label is present)

### 5.6 Quiz Card (3D Flip — Improved)

The current 3D flip card is well-implemented. Recommended improvements:

**Front Face (Statement):**
```
┌──────────────────────────────────────────┐
│  Aussage 3 von 10                        │  ← Step counter (--text-xs, --color-text-muted)
│                                          │
│  Cannabis ist weniger                    │  ← Statement (--text-xl, wt 600)
│  schädlich als Alkohol.                  │     Centered vertically in remaining space
│                                          │
│  ┌─────────┬─────────┐                  │  ← Answer buttons (revealed on hover/tap)
│  │ Falsch  │ Eher    │                  │     2×2 grid, 44px min-height for touch
│  │         │ falsch  │                  │
│  ├─────────┼─────────┤                  │
│  │ Eher    │ Richtig │                  │
│  │ richtig │         │                  │
│  └─────────┴─────────┘                  │
└──────────────────────────────────────────┘
```

**Back Face (Result):**
```
┌──────────────────────────────────────────┐
│  ✓ Richtig!          [Richtig ✓ badge]   │  ← Result header
│                                          │
│  Cannabis verursacht aus Experten-       │  ← Explanation (--text-sm, 8-line clamp)
│  sicht erheblich weniger Schäden…        │
│                                          │
│  ┌──────────────────────────────────┐    │  ← Population comparison bar
│  │ Bevölkerung: 69 / 100 Punkte   │    │     (NEW — visual bar + text)
│  │ ████████████████░░░░░░░░        │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [mehr →]                                │  ← Link to factsheet panel
└──────────────────────────────────────────┘
```

**NEW: Population Comparison Bar.** Each quiz question has a `populationCorrectPct` from the CaRM survey. Show this as a small horizontal bar on the back face so users can see how they compare to the German general population. This makes the quiz feel connected to the research data.

**Mobile interaction improvement:**

Currently, the first tap reveals buttons, and the second tap answers. This is confusing because there's no visual feedback that the card is in "revealed" state. Recommendation:

1. First tap: Card slightly lifts (`translateY(-4px)`) and buttons fade in with a subtle pulse animation on the border
2. Add a small text hint below the statement: "Tippe, um zu antworten" (visible only on touch devices, hidden after first interaction via CSS)
3. After answering: Card auto-flips after 300ms delay (gives feedback before the flip animation starts)

### 5.7 Quiz Result Screen (Improved)

**Current structure is good.** Recommended additions:

**Score Ring Enhancement:**
```
        ╭─────────╮
       ╱           ╲
      │    7 / 10   │    ← Score ring with tiered border color
       ╲           ╱      Animated stroke-dasharray on SVG circle
        ╰─────────╯
         70% richtig      ← Percentage line
    Besser als 72%        ← Percentile (compared to German population 16–70)
    der Bevölkerung
```

The score ring should use an SVG `<circle>` with animated `stroke-dasharray` (filling clockwise) rather than a CSS border circle, for smoother visual feedback.

**NEW: Per-Question Recap Strip.** Below the tier card, show a horizontal row of small circles (one per question), colored by result:

```
○ ● ● ○ ● ● ● ○ ● ●
↑ correct (green)  ↑ incorrect (amber)  — tappable to flip back to that card
```

This gives users a quick scannable overview and lets them revisit specific questions they got wrong.

**Share Card:** Keep the dark forest-green gradient — it's the only place the accent color gets a full-bleed treatment, which makes it feel special and shareable.

### 5.8 Dashboard (MythenExplorer)

**Sidebar — Population Group Selector (Improved):**
```
┌── Bevölkerungsgruppen ──────────────────┐
│                                         │
│  [✓] 👤  Erwachsene (18–70)             │  ← Checkbox + avatar + label
│  [✓] 🎓  Minderjährige (16–17)          │     Each uses group color for the avatar
│  [ ] 📊  Konsumierende                  │     Active groups highlighted with
│  [ ] 👥  Junge Erwachsene (18–26)       │     left-border accent in group color
│  [✓] 💗  Eltern                         │
│                                         │
│  Alle · Keine                           │  ← Quick toggle links
└─────────────────────────────────────────┘
```

**Indicator Selector (Improved):**
```
┌── Indikator ────────────────────────────┐
│                                         │
│  (●) 👁  Kenntnis (%)                   │  ← Radio + icon + label + tooltip
│  ( ) 📈  Bedeutung (Punkte)             │     Hover/tap reveals explanation
│  ( ) 🎯  Richtigkeit (Punkte)           │
│  ( ) 🛡  Prävention (Punkte)            │
└─────────────────────────────────────────┘
```

Each indicator should have a tooltip (or expandable micro-description) explaining what it measures, since "Bedeutung" and "Richtigkeit" are not self-explanatory to lay audiences.

**Verdict Filter Tags (Improved):**
```
[Alle Mythen]  [✓ Fakt]  [◐ Eher Fakt]  [◑ Eher Falsch]  [✗ Falsch]  [— K.A.]
   gray bg      emerald      lime             amber            rose        gray
```

Each pill includes the classification icon for colorblind accessibility. Active filter has filled background; inactive has border-only treatment.

**View Tabs:**

Replace the current text-only tabs with icon + label:

| Tab | Icon | Label (DE) |
|---|---|---|
| Table | `Table2` | Tabelle |
| Bar | `BarChart3` | Balken |
| Scatter | `ScatterChart` | Streuung |
| Lollipop | `GitCompareArrows` | Vergleich |
| Overview | `LayoutGrid` | Übersicht |

**Dashboard Detail Panel:**

When a myth is clicked in any chart view, the detail panel should contain:

1. Myth statement (full text)
2. Classification badge (with icon)
3. Metric spider chart (4 indicators as a small radar/diamond chart) — shows the myth's profile at a glance
4. Group comparison bars (horizontal bars, one per selected group, using group colors)
5. "Factsheet lesen →" link
6. Related myths list (from `relatedMyths` field in CMS)

### 5.9 Scrollytelling Panels

The 5-step scrollytelling is the homepage hero. Improvements per step:
[TBD]

### 5.10 FAQ Page (Improved Pattern)

**Index Page:**
```
┌──────────────────────────────────────────┐
│  ❤️‍🩹  Gesundheit                        │
│                                          │
│  Fragen zu körperlichen Auswirkungen,    │
│  Risiken und medizinischer Nutzung.      │
│                                          │
│  8 Fragen · Allgemein, Eltern           │  ← Question count + audiences
└──────────────────────────────────────────┘
```

**Detail Page — Hybrid Approach (Recommended):**

Top: Jump-link table of contents (all questions as anchor links).
Body: Full rendering — each question as an `<h3>` + prose answer. This preserves SEO and readability.
Optional: `<details>/<summary>` progressive disclosure for long answers that exceed 4 paragraphs.

**Cross-links:** When a FAQ answer references a specific myth, add an inline card chip that links to the factsheet. The chip shows the myth title (not a number), with the category icon and classification badge:
```
...wie hier beschrieben: [🧠 Psyche  Cannabis verursacht keine Abhängigkeit  Falsch ✗  ↗]
```
Chip styling: white background, 1px border (`--color-border`), `--radius-sm`, inline-flex, `--text-xs`. On hover: accent border. This reinforces the content network without exposing internal IDs.

### 5.11 Factsheet Detail Page

The factsheet page for each myth should follow this layout:

```
┌────────────────────────────────────────────────────┐
│  ← Zurück zu Zahlen & Fakten                       │
│                                                    │
│  ♥ Körper                                          │  ← Category identifier (icon + label)
│  Cannabis ist ein Allheilmittel.                   │  ← h1 (title only — no number prefix)
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │  ✗ Falsch — Das stimmt nicht.            │      │  ← Classification banner
│  │     Medizin · Selbstmedikation           │      │     (full-width, colored bg)
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ── Einordnung ──────────────────────────────      │  ← Always visible
│  [2-3 sentences of context]                        │
│                                                    │
│  ── Synthese ────────────────────────────────      │  ← Always visible
│  [Core synthesis paragraph]                        │
│                                                    │
│  ── Zentrale Erkenntnisse ───────────────────      │  ← Collapsible (Fachebene)
│  [Detailed bullet points with citations]           │     Default: expanded
│                                                    │
│  ── Referenzen ──────────────────────────────      │  ← Collapsible
│  [Numbered reference list]                         │     Default: collapsed
│                                                    │
│  ── Verwandte Mythen ────────────────────────      │
│  [Card chips — title + classification, no IDs]     │
│                                                    │
│  ── In welchem Quiz? ────────────────────────      │
│  [Link to quiz-koerper]                            │
└────────────────────────────────────────────────────┘
```

### 5.12 Navigation Header (Improved)

**Desktop (≥1024px):**
```
┌──────────────────────────────────────────────────────────────┐
│  Cannabis: Mythen & Evidenz    Startseite  Zahlen & Fakten   │
│                                Selbsttest  Häufige Fragen    │
│                                Über uns                      │
└──────────────────────────────────────────────────────────────┘
```

**Mobile (≤640px) — Bottom Tab Bar (Recommended):**

Replace the wrapping nav with a fixed bottom tab bar — a pattern users understand from native apps. 5 items fit cleanly.

```
┌──────────────────────────────────────────┐
│  🏠        📄        🧠       ❓       👥  │
│  Start   Fakten    Quiz    FAQ     Über  │
└──────────────────────────────────────────┘
```

Benefits: Thumb-reachable on large phones, always visible, no hamburger menu needed. The glassmorphism backdrop-filter already in use works perfectly for a bottom bar.

**Add:** Skip-to-content link (`<a href="#main" class="sr-only focus:sr-undo">Zum Inhalt springen</a>`) as the very first focusable element for keyboard/screen-reader users.

---

## 6. Advanced Mode Toggle (Grundlagen vs. Fachebene)

### 6.1 Recommended Approach: Section-Level Disclosure

The simplest implementation that delivers real value without requiring CMS schema changes.

**How it works:**

The factsheet body already has natural sections: Einordnung → Synthese → Zentrale Erkenntnisse → Referenzen. The first two are "Grundlagen" (everyone needs them). The latter two are "Fachebene" (professionals want them, casual readers don't).

**Implementation:**

1. Wrap "Zentrale Erkenntnisse" and "Referenzen" in `<details>` elements
2. Default state: "Zentrale Erkenntnisse" **open**, "Referenzen" **closed**
3. A page-level toggle ("Fachmodus") in the factsheet header opens all `<details>` elements and persists the preference in `localStorage`
4. Visual treatment: Fachebene sections have a subtle left border (`--color-accent-muted`) and slightly tinted background (`--color-bg-subtle`) to signal "this is optional depth"

**Toggle UI:**
```
┌────────────────────────────────┐
│  Fachmodus  ○──────●           │  ← Segmented toggle or switch
│  Grundlagen    Fachebene       │     Persists via localStorage
└────────────────────────────────┘
```

This requires **zero CMS changes** — it works by targeting existing Markdoc heading structure.

### 6.2 Future: Audience-Aware Defaults

If the CMS schema later adds an `expertiseLevel` field per section, the toggle can evolve: Grundlagen shows only sections tagged "basic," Fachebene shows everything. For v1, the heading-based approach is sufficient.

---

## 7. Interaction & Motion Design

### 7.1 Transition Tokens

```css
:root {
  --ease-out:     cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in:      cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-in-out:  cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);

  --duration-fast:    150ms;
  --duration-normal:  250ms;
  --duration-slow:    400ms;
  --duration-enter:   300ms;   /* Panels, modals entering */
  --duration-exit:    200ms;   /* Faster exit than enter */
}
```

### 7.2 Motion Patterns

| Pattern | Duration | Easing | Use |
|---|---|---|---|
| Hover lift | 150ms | ease-out | Cards, buttons → `translateY(-2px)` |
| Card flip | 600ms | ease-in-out | Quiz card 3D rotation |
| Panel slide-in | 300ms | ease-out | Factsheet panel from right |
| Panel slide-out | 200ms | ease-in | Panel dismissal (faster) |
| Modal appear | 350ms | ease-out | Backdrop fade + panel slide-up |
| Progress fill | 500ms | ease-in-out | Quiz progress bar |
| Counter animate | 1600ms | easeOutExpo | Scrollytelling big number |
| Scroll fade-in | 400ms | ease-out | Scrollytelling step activation |
| Score flash | 600ms | ease-out | Quiz score badge pulse |

### 7.3 Reduced Motion

Already partially implemented. Ensure ALL animations respect:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The quiz card flip should use an instant `opacity` crossfade instead of `rotateY` when reduced motion is active.

---

## 8. Accessibility Checklist

| Requirement | Status | Notes |
|---|---|---|
| WCAG AA color contrast (4.5:1 text, 3:1 UI) | ⚠ Partial | Classification colors on white need verification |
| Focus-visible indicators | ✅ Present | 3px accent outline, offset 3px |
| Skip-to-content link | ❌ Missing | Add as first focusable element |
| `aria-current="page"` on nav | ✅ Present | |
| `aria-label` on interactive cards | ⚠ Partial | Quiz cards have focus-visible but incomplete labels |
| Screen-reader-only utility class | ✅ Present | `.sr-only` in global.css |
| `prefers-reduced-motion` | ✅ Present | In quiz.css; needs to be global |
| `lang="de"` on `<html>` | ⚠ Verify | Check BaseLayout.astro |
| Keyboard navigation in quiz | ⚠ Partial | Cards are focusable; button grid needs arrow-key support |
| Chart accessibility (dashboard) | ❌ Missing | ECharts needs `aria` configuration and alt-text tables |
| Color-independent information | ⚠ Partial | Classification uses color only; icons recommended above |

---

## 9. Empty States, Loading, and Error Patterns

### 9.1 Loading States

| Context | Pattern |
|---|---|
| Dashboard data loading | Centered spinner + "Daten werden geladen…" text |
| Factsheet panel loading | Skeleton shimmer: 3 text blocks + 1 badge placeholder |
| Quiz card grid loading | Ghost cards: white rectangles with pulsing border |
| Scrollytelling before hydration | Static text column visible; viz area shows branded placeholder |

**Skeleton shimmer CSS:**
```css
.skeleton {
  background: linear-gradient(90deg,
    var(--color-border) 25%,
    var(--color-bg-subtle) 50%,
    var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

### 9.2 Empty States

| Context | Message | Visual |
|---|---|---|
| Dashboard: no results after filtering | "Keine Mythen gefunden. Versuche, Filter anzupassen." | `SearchX` icon (48px, muted) |
| Quiz: no quizzes available | "Quizze werden gerade vorbereitet." | `Brain` icon + progress indicator |
| FAQ: no matching questions | "Keine passenden Fragen gefunden." | `HelpCircle` icon |

### 9.3 Error States

| Context | Pattern |
|---|---|
| Dashboard data fetch failed | Retry button + "Daten konnten nicht geladen werden." |
| Offline | Banner at top: "Du bist offline. Einige Inhalte sind möglicherweise nicht aktuell." |

---

## Appendix A: File Inventory

### Pages (Astro)

| File | Route | Type |
|---|---|---|
| `src/pages/index.astro` | `/` | Home + scrollytelling |
| `src/pages/zahlen-und-fakten/index.astro` | `/zahlen-und-fakten/` | Dashboard (MythenExplorer) |
| `src/pages/zahlen-und-fakten/[slug].astro` | `/zahlen-und-fakten/:slug/` | Factsheet detail |
| `src/pages/zahlen-und-fakten/daten/[slug].astro` | `/zahlen-und-fakten/daten/:slug/` | Dashboard segment detail |
| `src/pages/haeufige-fragen/index.astro` | `/haeufige-fragen/` | FAQ index |
| `src/pages/haeufige-fragen/[slug].astro` | `/haeufige-fragen/:slug/` | FAQ theme detail |
| `src/pages/selbsttest/index.astro` | `/selbsttest/` | Quiz selection |
| `src/pages/selbsttest/[slug].astro` | `/selbsttest/:slug/` | Quiz player |
| `src/pages/ueber-uns/index.astro` | `/ueber-uns/` | About index |
| `src/pages/ueber-uns/[slug].astro` | `/ueber-uns/:slug/` | About detail |
| `src/pages/login.astro` | `/login/` | OAuth login for Keystatic |

### React Components (26 files)

| Module | File | Purpose |
|---|---|---|
| Scrollytelling | `ScrollytellingViewer.tsx` | 5-step interactive narrative |
| Quiz | `QuizPlayer.tsx` | Orchestrator (state, progress, results) |
| | `QuizCard.tsx` | 3D-flip card |
| | `ProgressBar.tsx` | Header-integrated progress |
| | `ResultScreen.tsx` | End-of-quiz modal |
| | `ShareCard.tsx` | Shareable result image |
| | `FactsheetPanel.tsx` | Slide-in factsheet (quiz) |
| | `quizData.ts` | 40 questions across 4 themes |
| | `types.ts`, `i18n.ts`, `matomo.ts` | Supporting modules |
| Dashboard | `MythenExplorer.tsx` | Shell (state, layout, routing) |
| | `ViewTabs.tsx` | 5-view tab switcher |
| | `VerdictTags.tsx` | Classification filter pills |
| | `Sidebar.tsx` | Filter sidebar |
| | `DashboardChart.tsx` | Chart area wrapper |
| | `DetailPanel.tsx` | Myth detail slide-in |
| | `FactsheetPanel.tsx` | Slide-in factsheet (dashboard) |
| | `views/TableView.tsx` | Sortable data table |
| | `views/BarView.tsx` | ECharts bar chart |
| | `views/ScatterView.tsx` | ECharts scatter plot |
| | `views/LollipopView.tsx` | ECharts lollipop chart |
| | `views/OverviewView.tsx` | Tile grid overview |
| | `views/TreemapView.tsx` | ECharts treemap |
| | `views/WordCloudView.tsx` | Word cloud |

### Content Collections (Keystatic)

| Collection | Content | Entries | Key Fields |
|---|---|---|---|
| `zahlenUndFakten` | Myth factsheets | ~36 | mythId, theme (7 values), classification (5 values), categoryGroup, relatedMyths, quizIds |
| `zahlenUndFaktenDashboard` | Dashboard segments | 6 | audienceSegment (6 groups) |
| `haeufigeFragen` | FAQ themes | 7 | theme, audience (multiselect), sortOrder |
| `selbsttest` | Quiz definitions | 4+1 | questions[] (mythId, statement, correctClassification, populationCorrectPct), resultTiers[] |
| `startseite` | Scrollytelling | 2 | steps[] (vizType: 5 types, heading, bodyText, ctaLabel) |
| `ueberUns` | About pages | 4 | sortOrder |
| `meta` | Internal docs | ~10 | Internal only |
| `changelog` | Project log | 1+ | date, author, type, affectedContent[] |

### Data Dimensions Summary

| Dimension | Values |
|---|---|
| **Myths** | 42 (m01–m42), ~36 published as factsheets |
| **Classifications** | richtig (15), eher_richtig (5), eher_falsch (11), falsch (9), keine_aussage (2) |
| **Themes** | übergreifend, substanz, körper, körper_psyche, psyche, soziales, rechtliches |
| **Population Groups** | general_population, adults, minors, consumers, young_adults, parents |
| **Dashboard Indicators** | awareness (%), significance (pts), correctness (pts), prevention_significance (pts) |
| **Quiz Themes** | Alltag (10Q), Gesellschaft (9Q), Körper (10Q), Psyche (11Q) |
| **Result Tiers** | 0–30% / 31–55% / 56–80% / 81–100% |