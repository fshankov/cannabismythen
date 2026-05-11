# CLAUDE.md

Guidance for AI assistants working in this repository. Read `README.md` first for the
project intro and structure; this file captures conventions, patterns, and gotchas that
aren't obvious from the source.

> **Run / Build / Verify:** `./_local/render.sh` is Fedor's preferred way to start the
> dev server (does `npm install` first, runs `npm run dev`, watches the log for the
> actual port Astro picked, opens `/fakten-karten/` in the default browser, warns when
> port 4321 is already in use). When advising Fedor to (re)start the dev server, point
> at `./_local/render.sh`, NOT raw `npm run dev`. Other commands: `npm run build` (runs
> `astro check` first — type errors fail) · `npm run preview` · `npm run og:generate`
> to refresh quiz OG images. No test runner, no linter — `astro check` is the gate.
>
> **Vite cache recovery:** if the dev server overlay shows
> `Cannot read properties of undefined (reading 'call')` (a Vite plugin pipeline error,
> usually from two dev servers sharing `node_modules/.vite/deps` or a mid-transform
> save), tell Fedor to: stop the dev server, `rm -rf node_modules/.vite`, re-run
> `./_local/render.sh`. The render script's port-collision warning explains this.
>
> **Sandbox-side `astro check`:** the Cowork sandbox runs Linux. Running `astro check`
> in the sandbox hits two recurring failures: (1) the macOS-installed
> `node_modules` ships `@rollup/rollup-darwin-arm64` not the `linux-arm64-gnu`
> variant — fix with `npm install @rollup/rollup-linux-arm64-gnu --no-save`;
> (2) the `@astrojs/netlify` integration `astro:config:setup` hook tries to
> `rmdir .netlify/v1/edge-functions/middleware` and fails on EPERM because that
> dir was created by Fedor's macOS Netlify CLI with restrictive perms. Workaround:
> use the type-only config that doesn't load netlify integration:
> `npx astro check --config astro.config.dev.mjs`. That's the canonical sandbox
> typecheck command across S2/S3a/S3b/S3c.

## Operator context

Fedor works on **MacBook Pro** (Apple Silicon, zsh shell, primary path
`/Users/feodorshankov/Documents/GitHub/cannabismythen`). Use macOS conventions when
proposing keyboard shortcuts (Cmd not Ctrl: Cmd-S, Cmd-Tab, Cmd-Shift-3/4 for
screenshots), app names (Finder, Safari, Chrome — not File Explorer / Edge),
clipboard helpers (`pbcopy` / `pbpaste`), and "open in editor" commands (`open .`
opens the current dir in Finder; VS Code path is the macOS .app bundle). Don't
propose Ctrl-key shortcuts or Windows path conventions.

## Tracker workflow (BugHerd feedback tracker)

The team-shareable tracker lives at `public/tracker/index.html` and is served
by Astro/Netlify at `https://cannabismythen.netlify.app/tracker/` — same
SITE_PASSWORD edge gate as the rest of the site, so it's team-only. The
canonical source is the Cowork artifact at
`~/Documents/Claude/Artifacts/cannabismythen-feedback-tracker/index.html`.
After any session that updates the tracker, run `./scripts/sync-tracker.sh`
(also runs silently on every `./_local/render.sh` start), then commit + push
`public/tracker/`. Sessions can also edit `public/tracker/index.html` directly
when needed — but the Cowork artifact is the long-term canonical so the
tracker survives across sessions. `render.sh` opens both `/fakten-karten/`
and `/tracker/` in the browser automatically. Token cost of editing the
tracker is small (~500–2000 per session); CLAUDE.md additions like this
paragraph are ~100–300 tokens loaded per session start.

## Working with Fedor — process rule (HARD)

**Ask before implementing — always with options, via the AskUserQuestion tool.**
When the user asks for a change that touches copy, layout, scoring, content shape,
navigation, visual style, classification thresholds, or any user-visible decision:

1. State your understanding of the change in plain language.
2. Spell out the trade-offs and your recommendation (with rationale).
3. Use the **AskUserQuestion tool** (not just inline text) to confirm — give 2–4
   concrete options with a recommendation marked. Inline questions get skipped or
   misanswered; the tool's structured options are far easier for Fedor to act on.
4. Only then implement.

This applies even when the request feels obvious. Visual taste, copy tone, data
thresholds, and where new copy lands (per-card vs. per-page vs. global) are
decisions, not implementation details. **Pay extra care for design** — many past
mistakes have come from acting on assumed taste; verify, don't assume.

**Language note for communication:** Fedor's first language is neither English nor
German. He may slip in Russian words mid-message or use English phrasings that need
clarification — when something is ambiguous, prefer the AskUserQuestion tool over
guessing. The website itself is fully in **German**, but Fedor doesn't speak German;
when you're discussing or proposing German copy with him, **always include a brief
English translation in parentheses or as a follow-up line** so he can confirm tone
and meaning. Never propose German copy without a translation.

Pure technical decisions with no user-visible effect (file naming inside a
folder, type names, refactor patterns, internal helper signatures) don't need
confirmation.

## German text quality (HARD)

Every line of user-visible German on this site is reviewed by ISD
before it ships. AI-drafted German has shown two recurring failure
modes flagged by the team: (1) it reads like a translation from
English (English clause order, loaned constructions, calques like
"macht Sinn"), and (2) it occasionally inverts technical claims (m13
"löst Spasmen" vs. Excel "lindert Spastiken").

Rules for any German text Claude proposes:

1. Always include a brief English gloss in parentheses or as a
   follow-up line. Fedor doesn't speak German — he can't sanity-check
   tone without it.
2. Never ship AI-drafted German into a .mdoc file's body without an
   ISD-review checkpoint. Mark drafts clearly (e.g., `internalNotes:
   "AI draft, awaiting ISD review"`). The Keystatic editor is the
   review surface.
3. Avoid English-pattern phrasing. Common slips to self-check:
   English-style noun stacking, "es ist wichtig zu erwähnen, dass…",
   over-literal translations of "in terms of", "aus meiner Sicht"
   used as filler. Prefer short, declarative sentences.
4. Source-of-truth check before drafting. When the source is the CaRM
   final report or the Excel master, quote the exact wording first,
   then adapt — don't paraphrase from memory.

## Never modify without asking

Path-based safety rules. Claude must NOT edit any of the following without an
explicit ask from Fedor in this session — and even then, must confirm with
AskUserQuestion before writing.

- **`public/data/carm-data.json`** — pre-processed CaRM survey dataset. Treat as
  an immutable upstream artifact. Regenerate only when explicitly asked, never as
  a side-effect of other work.
- **`src/components/quiz/quizData.ts` — fields `mythId`, `correctClassification`,
  `populationCorrectPct`** — runtime data integrity. Code-review-gated; the quiz
  trusts these values when computing scores.
- **`src/content/zahlen-und-fakten/mNN-*.mdoc` — `mythId` and `mythNumber`** —
  these are referenced by `relatedMyths[]`, `quizIds[]`, and dashboards.
  Never renumber. Add new myths with the next sequential ID.
- **`keystatic.config.ts`** — schema source of truth. Schema changes require a
  data migration pass on existing `.mdoc` files. Confirm scope first.
- **`.npmrc`** (`legacy-peer-deps=true`) — load-bearing. Do not remove.
- **`netlify.toml`, `src/middleware.ts`** — edge config and password gate. Auth or
  redirect changes need to consider both edge and origin behavior.
- **`.superpowers/`, `.playwright-mcp/`, `editorial/`, `_local/`** — session
  artifacts and editorial scratch space. Don't refactor or "clean them up".

## The Weird Things (will break if you don't know)

Things that look normal but aren't — every one of these has bitten somebody.

1. **Classification is 4-level, not binary.** Every myth resolves to one of
   `richtig | eher_richtig | eher_falsch | falsch` (plus `keine_aussage` for
   "no scientific verdict"). Never collapse to true/false in copy, UI, or data.
2. **The dashboard URL is `/daten-explorer/`, but the content folder is still
   `src/content/zahlen-und-fakten/`.** This is intentional — only the public URL
   moved (Stage 5 refactor). 301 redirects fire from three layers; don't link to
   the old URL in new code, but don't rename the content folder either.
3. **Quiz scoring goes through `schritte()` exclusively.** Anywhere you see
   per-question math that isn't routed through `schritte()` /
   `pointsForSchritte()` / `moduleScore()` / `scoreBand()` in `quizData.ts`,
   that's a bug.
4. **The quiz lives in two stores by design.** Editorial text in
   `src/content/quiz/*.mdoc` (Keystatic), data integrity in `quizData.ts` (code).
   `src/pages/quiz/[slug].astro` is the join point — a new editorial field is
   silently dropped if you don't extend the Astro page to forward it.
5. **Population framing must say "Erwachsene (18–70)…"**, never "Bevölkerung in
   Deutschland" alone or "Befragten" without qualifier. CaRM IS the sample; the
   wording protects honesty about who the data describes. **One sanctioned
   exception** (Fedor 2026-05-07 PM): the homepage credibility lede in
   `src/content/credibility-block.yaml` uses *"einer umfangreichen Befragung
   in Deutschland"* without the (Erwachsene 18–70) qualifier. The headline
   above it still says "Bevölkerungsbefragung", carrying the framing.
   Everywhere else in user-visible copy, keep the audience qualifier.

6. **"Evidenz" → "Wissenschaftlich" rule (UI labels only).** Site-wide policy
   from BugHerd #30 (Fedor 2026-05-07 PM): UI labels and headings that mean
   "evidence-based" use a *Wissenschaftlich…* form, not *Evidenz…*. The
   substantive scientific term "Evidenz" stays in body copy of myth
   explanations, methodology and glossary pages. The brand name **"Cannabis:
   Mythen & Evidenz"** is protected — keep it everywhere it appears (login
   page, BaseLayout title suffix, `ui.siteName`, CSS comments). When you
   encounter an `Evidenz…` string, decide: is this a label/heading
   (replace) or a substantive scientific claim in body copy (keep)? See
   `src/components/quiz/i18n.ts` `ui.correctAnswer` for the canonical
   replacement pattern.

7. **Sie/Du baseline (FLIPPED 2026-05-08 — team meeting).** The site's
   voice is now **Du** (informal) site-wide. The only sanctioned Sie-form
   pockets are the Meine Interessen FAQ sections for **Eltern**,
   **Fachkräfte**, and **Lehrkräfte** (adult professional audiences) —
   identified in `src/content/faq/audiences.yaml` by their `id` fields
   (`eltern`, `fachkraefte`, `lehrkraefte`). The Meine Interessen sections
   for Konsumierende and Jugendliche use Du like the rest of the site.
   This is a HARD reversal of the Sessions 1–3 sweep: every quiz module,
   share-copy, hero copy, ResultScreen fallback, BaseLayout chrome, etc.
   that S1+S2+S3a flipped to Sie now needs to flip back to Du. Treat as
   a Major Revision — schedule its own session (Session 5 / "Du flip").
   Do NOT do partial Sie→Du flips inside a normal session; the inconsistency
   is worse than either pure baseline.

8. **Quiz tile score persistence (Session 3b).** When a user finishes a
   quiz, `QuizPlayer.tsx` writes `cm-quiz-score-{themeSlug}` to
   `localStorage` (no cookies, no server, no PII). The `/quiz/` index reads
   it via an inline script and renders a small "Zuletzt: X/Y · Z %" chip
   on each tile. Key uses the canonical (post-Session-1) slug, so
   `quiz-medizin` → `quiz-medizinischer-nutzen` rename does NOT bleed
   scores. If you rename a slug in the future, follow the same pattern and
   leave the old localStorage key behind (gracefully ignored).

## What this project is

Cannabis: Mythen & Evidenz — an evidence-based, German-language site that debunks 42
cannabis myths from the CaRM research project (ISD Hamburg). Content is presented in
five formats: myth factsheets, FAQs, an interactive quiz (Selbsttest), audience-specific
data dashboards, and scrollytelling narratives.

Two product principles to keep in mind when making changes:

- **Classification is 4-level, not binary.** Every myth resolves to one of
  `richtig | eher_richtig | eher_falsch | falsch`. Never collapse this to true/false in
  copy, UI, or data.
- **Five Zielgruppen** are the data filters in CaRM and on the public site:
  Volljährige (18–70), Minderjährige (16–17), Konsumierende, Junge
  Erwachsene (18–26), Eltern. These are data slices, not reader-personas.
  Pages and dashboards switch view based on the selected Zielgruppe.

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
| `faqQuestions` + `faqAudiences` | `src/content/faq/questions/`, `src/content/faq/audiences/` | "Meine Interessen" section — pages live under `/meine-interessen/` (renamed from `/haeufige-fragen/` in Session 3a, 2026-05-07; the legacy URL 301-redirects from edge + netlify.toml). Audience-first restructure replaced the legacy theme-based `haeufigeFragen` collection. |
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
  "Erwachsene (18–70) in einer Bevölkerungsbefragung in Deutschland".
  CaRM IS that sample, so the data is unchanged — just framed for a
  general reader. Never reference "Bevölkerung in Deutschland" alone
  (implies all 80M), "Gesamtbevölkerung 16–70" (different cohort), or
  "Befragten" without qualifier (loses the population context). The
  word "repräsentativ" / "representative" must NOT appear anywhere in
  user-visible copy (per stakeholder ruling 2026-05-06, BugHerd #28) —
  the survey IS methodologically representative (n=2.097, weighted by
  sex/age/education), but the word is dropped at editorial request.
  Canonical replacement phrasing for share copy / credibility blocks /
  quiz framing: "in einer Bevölkerungsbefragung in Deutschland
  (Erwachsene 18–70)".

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

URLs are German and slugs are kebab-case: `/daten-explorer/`, `/meine-interessen/`,
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
- The FAQ section is `/meine-interessen/` (renamed from `/haeufige-fragen/` in
  Session 3a, 2026-05-07, per BugHerd #6). Three patterns 301 from the legacy
  URL: bare, `/frage/{slug}/`, and `/{audience}/`. Edge middleware + netlify.toml
  carry the rules. The visible label everywhere is **"Meine Interessen"**;
  the legacy "Häufige Fragen" / "Ihre Fragen" labels were swept site-wide.
- The on-disk content folder is `src/content/faq/` (audience-first restructure)
  — only the URL moved, not the content folder. Don't link to `/haeufige-fragen/`
  in new code; use `/meine-interessen/...`.

`src/middleware.ts` enforces a `SITE_PASSWORD` cookie at the edge when the env var is
set; `/login` and Keystatic's `/api/*` routes are exempt. Both the Stage 5
`/zahlen-und-fakten/*` → `/daten-explorer/*` and the Session 3a
`/haeufige-fragen/*` → `/meine-interessen/*` 301 redirects fire BEFORE the
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
