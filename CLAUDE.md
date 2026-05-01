# CLAUDE.md

Guidance for AI assistants working in this repository. Read `README.md` first for the
project intro and structure; this file captures conventions, patterns, and gotchas that
aren't obvious from the source.

## Working with Fedor — process rule (HARD)

**Ask before implementing.** When the user asks for a change that touches
copy, layout, scoring, content shape, navigation, or any user-visible decision:

1. State your understanding of the change in plain language.
2. Spell out the trade-offs and your recommendation (with rationale).
3. Use the AskUserQuestion tool to confirm before writing code.
4. Only then implement.

This applies even when the request feels obvious. Visual taste, copy tone,
data thresholds, and where new copy lands (per-card vs. per-page vs. global)
are decisions, not implementation details. Verify, don't assume.

Pure technical decisions with no user-visible effect (file naming inside a
folder, type names, refactor patterns) don't need confirmation.

## What this project is

Cannabis: Mythen & Evidenz — an evidence-based, German-language site that debunks 42
cannabis myths from the CaRM research project (ISD Hamburg). Content is presented in
five formats: myth factsheets, FAQs, an interactive quiz (Selbsttest), audience-specific
data dashboards, and scrollytelling narratives.

Two product principles to keep in mind when making changes:

- **Classification is 4-level, not binary.** Every myth resolves to one of
  `richtig | eher_richtig | eher_falsch | falsch`. Never collapse this to true/false in
  copy, UI, or data.
- **Four audiences:** general public, parents, prevention professionals, researchers.
  Many pages and dashboards switch view based on audience — don't assume a single
  reader.

For deep design rationale (color tokens, typography scale, component specs, UX
architecture), see `DESIGN.md` (~47KB).

## Tech stack at a glance

- **Astro 6** in SSR mode (`output: "server"`) with `@astrojs/netlify` and
  `edgeMiddleware: true`
- **React 18** islands for interactive UI (quiz, dashboard, hero, fakten-karten)
- **Keystatic 5** Git-based CMS with **Markdoc** content (`.mdoc`)
- **ECharts 5** + **D3 7** for data viz, **Lucide React** for icons
- **TypeScript** strict mode (extends `astro/tsconfigs/strict`)
- **Node 22**, npm with `legacy-peer-deps=true` (`.npmrc` — keep it)
- No Tailwind, no CSS-in-JS, no test runner wired up

## Commands

```
npm run dev       # astro dev (VSCode launch uses port 4321; default is 4321)
npm run build     # astro check && astro build  ← type errors fail the build
npm run preview   # serve the production build
```

There is no `npm test` and no linter. `astro check` (run as part of `build`) is the
type-correctness gate. For UI changes, validate manually in `npm run dev` — there are
Playwright session artifacts in `.playwright-mcp/` but no committed test suite.

## Path aliases (tsconfig.json)

Prefer aliases over relative paths:

```
@/*           → src/*
@components/* → src/components/*
@lib/*        → src/lib/*
@content/*    → src/content/*
@layouts/*    → src/layouts/*
```

## Content model (Keystatic)

`keystatic.config.ts` (33KB) is the source of truth for every collection schema. Any
`.mdoc` you create or edit must match it exactly or the editor will reject it.

| Collection | Disk path | Notes |
|---|---|---|
| `zahlenUndFakten` | `src/content/zahlen-und-fakten/m01..m42.mdoc` | The 42 myth factsheets |
| `zahlenUndFaktenDashboard` | `src/content/zahlen-und-fakten-dashboard/` | Audience-specific indicator pages |
| `haeufigeFragen` | `src/content/haeufige-fragen/` | FAQ pages by theme/audience |
| `selbsttest` | `src/content/selbsttest/` | Quiz modules + feedback texts |
| `startseite` | `src/content/startseite/` | Scrollytelling narratives |
| `ueberUns` | `src/content/ueber-uns/` | klassifikation, methodik, projekt, team |
| `meta`, `changelog` | `src/content/{meta,changelog}/` | Internal/reference |

Singletons live at the content root:

- `hero-block.yaml`, `credibility-block.yaml`, `headline-finding.yaml`,
  `quiz-hook-block.yaml`, `dashboard-definitionen.json`

Universal entry fields: `status: "draft" | "published"`, `tags`, `internalNotes`,
`publishedAt`, `updatedAt`.

### Hard rules for content

1. **Always filter to `status === "published"`** when generating paths or rendering
   listings. Use `filterPublished()` from `src/lib/content.ts`. Drafts must never reach
   the public site.
2. **Never expose `internalNotes`** to a rendered page. Use `stripInternal()` from
   `src/lib/content.ts`. These notes are editorial and may contain unpublished context.
3. **Don't renumber myths.** `mythId` (`m01`..`m42`) is referenced by `relatedMyths[]`,
   `quizIds[]`, and dashboards. Add new myths with the next sequential ID; don't
   reshuffle existing ones.

## Quiz content source of truth

The quiz lives across two stores by design. Both must reach the runtime,
and editors must be able to trust that their changes are reflected on the
live site without a code change.

- **Editorial text** — statements, explanations, per-band verdicts
  (`verdicts.{profi,guterweg,gehtnoch,erwischt}`), the
  `weakSpotIntro` / `strongPerformanceIntro` lines, and (Stage 7+) per-module
  share copy → **`src/content/quiz/*.mdoc`** is the source of truth. The
  Keystatic admin UI is the editorial surface; commits land in git.
- **Data integrity** — `mythId`, `correctClassification`, `populationCorrectPct`
  (Erwachsene 18–70 reference table) → **`src/components/quiz/quizData.ts`**
  is the source of truth. Code reviewers gate changes; the runtime trusts
  these values when computing scores. Never edit these in `.mdoc`; never
  duplicate them across the boundary.
- **The join point** — `src/pages/quiz/[slug].astro` reads both stores and
  passes them as JSON props (`quizText`, `verdicts`, `intros`, `shareCopy`,
  …) into `<QuizPlayer>`. If you add a new editorial field to the
  Keystatic schema, extend the Astro page to forward it — otherwise edits
  silently no-op.
- **Share-card copy fallback chain (Stage 7):** per-module
  `shareCopy.{band}` override > `share-copy.yaml` singleton default >
  hardcoded final fallback in `ResultScreen.tsx`. The Astro page does
  the merge so the React player sees a single resolved object.
  Editing either Keystatic surface reflects on the live result page +
  ShareCard after the next deploy.
- **Scoring is Schritte, never binary.** All per-question math routes
  through `schritte()` / `pointsForSchritte()` / `moduleScore()` /
  `breakdownCounts()` / `scoreBand()` in `quizData.ts`. If you find another
  scorer anywhere in the quiz codebase, that's a bug.
- **Population framing is honest.** Compare against
  "Erwachsene (18–70) in einer repräsentativen Stichprobe in Deutschland".
  CaRM IS that sample, so the data is unchanged — just framed for a
  general reader. Never reference "Bevölkerung in Deutschland" alone
  (implies all 80M), "Gesamtbevölkerung 16–70" (different cohort), or
  "Befragten" without qualifier (loses the population context).

## Routing patterns

Pages live in `src/pages/`. Dynamic routes (`[slug].astro`) follow a single pattern:

```ts
export async function getStaticPaths() {
  const slugs = await reader.collections.<name>.list();
  const paths = [];
  for (const slug of slugs) {
    const entry = await reader.collections.<name>.read(slug);
    if (entry && entry.status === "published") {
      paths.push({ params: { slug }, props: { entry } });
    }
  }
  return paths;
}
```

URLs are German and slugs are kebab-case: `/daten-explorer/`, `/haeufige-fragen/`,
`/selbsttest/`, `/ueber-uns/`, `/fakten-karten/`, `/startseite/`. Don't introduce
English route segments.

### URL conventions

- The dashboard route is `/daten-explorer/` (and `/daten-explorer/{slug}/` for
  factsheet detail pages). The previous public path `/zahlen-und-fakten/` was
  renamed in Stage 5 of the Daten-Explorer refactor and is now permanently
  301-redirected to the new path. Three layers handle the redirect (defense
  in depth): edge middleware in `src/middleware.ts`, page-level
  `Astro.redirect(..., 301)` stubs at `src/pages/zahlen-und-fakten/*.astro`,
  and `[[redirects]]` rules in `netlify.toml`.
- The Keystatic collection name (`zahlenUndFakten`) and the on-disk content
  folder (`src/content/zahlen-und-fakten/`) intentionally still use the
  old slug. Per CLAUDE.md's content-path stickiness rule, only the public
  URL moves — content paths stay so editor history + git references don't
  reshuffle.
- Don't introduce new code that links to `/zahlen-und-fakten/...` — use
  `/daten-explorer/...` everywhere. The `dashboardLinkLabel()` helper in
  `src/lib/faq.ts` keeps legacy editor entries with old URLs gracefully
  resolving to the same German captions.

`src/middleware.ts` enforces a `SITE_PASSWORD` cookie at the edge when the env var is
set; `/login` and Keystatic's `/api/*` routes are exempt. The Stage 5
`/zahlen-und-fakten/*` → `/daten-explorer/*` 301 redirects fire BEFORE the
password gate so external backlinks resolve for unauthenticated traffic too.

## Component organization

```
src/components/
├── dashboard/        MythenExplorer, FilterBar, ViewTabs, VerdictTags
├── fakten-karten/    FaktenCard, FaktenKartenExplorer
├── quiz/             QuizPlayer + cards + quizData.ts + i18n.ts + matomo.ts
├── hero/             HeroBlock + mythPositions.ts
├── home/             CredibilityBlock, HeadlineFindingBlock, QuizHookBlock (.astro)
├── scrollytelling/   ScrollytellingViewer
└── shared/           FactsheetPanel
```

`src/layouts/BaseLayout.astro` is the only layout — it renders the HTML shell, header,
mobile tab bar (<1024px), and footer. Pass `title`, `description`, and optional
`heroMode` props.

## Styling

Plain CSS with CSS custom properties as the design-token system.

- `src/styles/global.css` — base typography, layout, header/nav, classification color
  vars (`--classification-richtig`, etc.). Source of truth for tokens.
- `src/styles/dashboard.css` — MythenExplorer, filter bar, views.
- `src/styles/quiz.css` — quiz card animations and progress.

Component-scoped styles use `<style>` blocks inside `.astro` and `.tsx` files. Do not
introduce Tailwind, CSS-in-JS, or CSS modules without an explicit ask.

## Dashboard data

`public/data/carm-data.json` is a pre-processed CaRM survey dataset. Loaders, types, and
view-state utilities live in `src/lib/dashboard/`:

- `data.ts` — dataset access and metric queries
- `types.ts` — `CarmData`, `Myth`, `Metric`, `Indicator`
- `colors.ts` — verdict colors and icon helpers
- `translations.ts` — German UI labels
- `url-state.ts` — sync filter state to URL search params

Treat `carm-data.json` as an immutable upstream artifact unless explicitly asked to
regenerate it.

## Conventions

- **Language:** website content is German; code, identifiers, comments, and commit
  messages are English.
- **File naming:** `CamelCase.tsx` / `CamelCase.astro` for components and pages,
  `[slug].astro` for dynamic routes, `kebab-case.mdoc` for content, `camelCase.ts` for
  utilities.
- **TypeScript:** strict mode is on. Don't widen types or sprinkle `any` to make
  `astro check` pass — fix the underlying type issue.
- **`internalNotes` and `_local/`** are editorial-only spaces. `_local/` is gitignored
  for ad-hoc reference docs; never commit content from there.

## Environment

`.env.example` lists required keys:

- `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` —
  GitHub OAuth for the Keystatic admin UI
- `SITE_PASSWORD` — optional; when set, the middleware gates the whole site

`netlify.toml` pins Node 22 and lists these keys under `SECRETS_SCAN_OMIT_KEYS` so the
build doesn't flag them.

## Common tasks — where to look first

| Task | Start here |
|---|---|
| Add a new myth | New `src/content/zahlen-und-fakten/mNN-slug.mdoc` matching `zahlenUndFakten` schema in `keystatic.config.ts` |
| Tweak quiz behaviour | `src/components/quiz/QuizPlayer.tsx` + `quizData.ts` (Schritte scoring lives in `schritte()` / `pointsForSchritte()` / `moduleScore()` / `scoreBand()`) |
| Change quiz statements / explanations / verdicts | `src/content/quiz/*.mdoc` (Keystatic). The Astro page `src/pages/quiz/[slug].astro` is the join point. |
| Add a quiz module | New `src/content/quiz/quiz-<slug>.mdoc` matching the schema, plus a static theme entry in `quizData.ts` (or `dynamic: true` for runtime-picked decks like Schnellcheck), plus a tile in `src/pages/quiz/index.astro`. |
| Change global share copy / verdict fallbacks | `src/content/share-copy.yaml` (singleton) — per-module override is in each module's `shareCopy.{band}` field. |
| Generate OG share images | `npm run og:generate` (or `npm run build` — runs as prebuild). Script: `scripts/generate-quiz-og.ts`. |
| Change quiz UI copy / labels | `src/components/quiz/i18n.ts` |
| Tweak the dashboard | `src/components/dashboard/MythenExplorer.tsx` and `src/lib/dashboard/` |
| Adjust verdict colors / typography | `src/styles/global.css` (CSS custom properties) |
| Add a new dynamic route | Mirror the `getStaticPaths()` + published filter pattern from any existing `[slug].astro` |
| Update homepage hero/credibility | Edit the matching `*-block.yaml` singleton in `src/content/` |

## Gotchas

- `astro build` runs `astro check` first; type errors block deploys.
- Edge middleware runs before any page render — auth changes need to consider both
  edge and origin behavior.
- `legacy-peer-deps=true` in `.npmrc` is intentional. Don't remove it when running
  `npm install`.
- `.superpowers/` and `.playwright-mcp/` hold session artifacts (brainstorm logs,
  Playwright dumps). They aren't source — don't refactor or "clean them up" without
  asking.
- The `editorial/` directory is a placeholder for editorial notes and is not part of
  the build.
- Keystatic content lives in Git, so editor-driven changes appear as commits. Be
  careful when rewriting `.mdoc` files — match the schema or Keystatic will reject the
  file in its UI even if the build still succeeds.

## When in doubt

Re-read `keystatic.config.ts` (schema source of truth), `DESIGN.md` (UX/visual
rationale), and `src/lib/content.ts` (the helpers that enforce published-only and
internal-note stripping). If a convention here conflicts with what's actually in the
code, the code wins — update this file.
