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

## How to work and answer Fedor (HARD — 2026-06-14)

Keep every answer short and simple. Easy language. No long text. Do not waste tokens.

**Answer shape — use this:**
- **Problem:** what is wrong and where.
- **Needed:** what the fix needs.
- **Fix:** what to do.

**When the task is done, answer easy:**
- **Before:** what it was.
- **Now:** what it is.

**Hard rules:**
- Fix only the exact part of the code in the task. Do not touch other parts of the site.
- Never change CSS classes of other elements. Only the element in the task.
- No generative ideas without asking. Do not invent or "improve" anything.
- Never write or generate text unless Fedor asks for it. If text is needed and you
  do not know what to put — ASK Fedor.
- Do not interpret, imagine, or think how it "could be better". ASK Fedor exactly
  what needs to be done.
- One short question to Fedor beats a wrong guess.
- Stop writing huge responses. Simple, logical, easy language.

## Operator context

Fedor works on **MacBook Pro** (Apple Silicon, zsh shell, primary path
`/Users/feodorshankov/Documents/GitHub/cannabismythen`). Use macOS conventions when
proposing keyboard shortcuts (Cmd not Ctrl: Cmd-S, Cmd-Tab, Cmd-Shift-3/4 for
screenshots), app names (Finder, Safari, Chrome — not File Explorer / Edge),
clipboard helpers (`pbcopy` / `pbpaste`), and "open in editor" commands (`open .`
opens the current dir in Finder; VS Code path is the macOS .app bundle). Don't
propose Ctrl-key shortcuts or Windows path conventions.

## Local-only workflow (HARD — 2026-05-25 onward)

**Default mode for this codebase:** Claude makes **uncommitted edits in
the local working tree on `main`**. No new branches, no commits, no
pushes, no PRs unless Fedor explicitly asks ("commit", "push", "open a
PR", "merge"). Fedor iterates via `./_local/render.sh` and reviews
changes by visual inspection in the browser, not by reading PR diffs.

Concretely:

- Stay on `main`. Edit files in place. Do not run `git checkout -b`,
  `git commit`, `git push`, or `gh pr create` unless Fedor explicitly
  asks for one of those actions in the current turn.
- Past sessions ran a "travel pipeline" with many feature branches +
  PRs. That mode is OVER. Don't replicate that workflow without an
  explicit request.
- If a change accidentally lands on a branch other than `main`,
  switch back to `main` and re-apply locally.
- Stale open PRs from prior sessions are Fedor's to manage; don't
  close, merge, or rebase them unsolicited.
- The exception: `astro check` and other read-only verification
  commands are always fine to run.

The reason: Fedor wants tight visual iteration without the PR-review
overhead. Branches + PRs slow down "see the change → tweak → see
again" cycles when he's at his desk with the dev server running.

## Tracker workflow (Asana + Feedbucket)

**Use the Asana CannabisMythen project for every task related to
this website.** It is the single source of truth — completed work,
in-progress work, and items needing review all live there. Project:
**CannabisMythen**, workspace `1214692075439040`, project gid
`1214704634010891`.

Three writers:

- **Stakeholders / ISD reviewers** leave comments on the live site
  via the **Feedbucket** widget (browser, no signup). Feedbucket's
  native Asana integration auto-creates tasks with screenshot +
  browser info, with 2-way comment sync (reply in Asana starting
  with `@feedbucket` → posts back to the widget on the page).
- **Fedor + dev team** triage and assign tasks in Asana directly.
- **Claude Code** (local + Cowork) reads and writes Asana via the
  Asana V2 MCP server.

**Feedbucket items — how to summarize (HARD — 2026-06-14).** When you
read a Feedbucket comment, write it short and simple. Easy language. No
long text.

- **Problem:** what is wrong and where (which page, which step).
- **Solution / who does what:** what fix is needed, and who does it.

Example: "Florian found a bug on Step 5 on the Über das Projekt page. He
wants this and that. Needs: we add this and that. We do this."

**Sections (Kanban columns) ARE the status machine.** Going-forward
five-section design: `To do` · `In progress` · `Awaiting decision` ·
`Needs review` · `Done`. Moving a card to a new section changes its
status. Each section has a clear meaning:

- `To do` — not started, ready when capacity allows
- `In progress` — actively being worked
- `Awaiting decision` — work blocked on a ruling from Fedor or ISD;
  cannot proceed until someone decides
- `Needs review` — Claude or dev team finished; awaiting team review
  before it can ship as Done
- `Done` — shipped, approved, closed (`completed: true`)

States that don't need their own column live as **tags** instead:
`blocked` · `parked-s4` · `noise` (plus the workstream tags below).

(Asana history note: the project was initially created with 8
sections — `Backlog`, `Awaiting review`, `Blocked`, `Parked`, `Noise`
remain in addition to the five above until Fedor renames/deletes
them in the Asana UI. Claude should treat `Backlog` as `To do` and
`Awaiting review` as `Needs review` while the rename is pending.)

Task notes carry a metadata schema header on line 1:
`[BugHerd #N] | <Session> | <Priority> | <Owner> | tags: <…> | section: <site-area>`
followed by free-form description. Site-area `section` values:
`home` / `daten-explorer` / `quiz` / `fakten-karten` / `projekt` /
`cross-cutting`. Workspace tags:
`design` · `functionality` · `german-review` · `pre-launch` ·
`data-accuracy` · `nice-to-have` · `accessibility` · `blocked` ·
`parked-s4` · `noise`.

**How Claude asks Fedor for review (when uncertain or finished):**

When Claude is unsure about a decision, or has finished
implementation and the work is ready for human eyes — Claude does
NOT close the task or move it to `Done`. Instead:

1. Move the task to `Needs review` (or leave it in `In progress`
   for an open question).
2. **Set the task assignee to Fedor** (`fshankov@gmail.com`).
3. Add a comment using `@fshankov@gmail.com` mentioning Fedor
   directly, stating what's done + commit SHA(s) + any open
   question. The @mention triggers an email notification and the
   task appears in Fedor's "My Tasks" inbox.
4. Fedor reviews. If approved and no team review is needed: he
   moves the task to `Done` + ticks `completed`. If team review is
   needed, he reassigns to Harald/Christian, leaves it in
   `Needs review`. They approve, then someone moves to `Done`.

Tasks ONLY reach `Done` after the necessary review(s) — never
auto-closed by Claude.

Workflow for Claude per session:

- **Session start:** Read open Asana tasks via MCP (typically the
  `To do` / `Backlog`, `In progress`, `Awaiting decision`
  sections). Surface a 5-item priority list. Ask Fedor which to
  pick up.
- **During session:** Use `add_comment` on the active task to
  record progress + commit SHA(s) as commits land. When you find
  an untracked issue worth fixing, `create_tasks` it
  (project_id `1214704634010891`, section_id `1214704526251784`
  for the current `Backlog`/`To do`), notes following the header
  schema above.
- **Session end:** Use `update_tasks` to move the task to
  `Needs review` and set assignee = Fedor + add an @mention
  comment per the pattern above. Leave in `In progress` if
  partial. NEVER auto-set `completed: true`.
- **Commit-message convention (optional):** Reference the Asana
  task GID or BugHerd ID in commit messages so later runs trace
  which commit closed which task.

(For setup steps and detailed workflow, see local notes — not in
the public repo.)

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

**Language note for communication (HARD):** Fedor's first language is neither
English nor German. He may slip in Russian words mid-message, write in
sentence fragments, or use English phrasings whose intent is ambiguous to a
native English reader. Pattern-matching on English idioms WILL mislead you.

**The rule: when the request is even slightly ambiguous, paraphrase your
understanding back to Fedor and ask via AskUserQuestion BEFORE acting.**
Do this even if you feel 80–90 % sure. Cost of confirming = 1 round-trip;
cost of acting on a misread = re-doing work, frustration, lost trust.

Concrete shape of the paraphrase: "Just to make sure — you want X to happen
(not Y), correct?" Then offer options. Do not assume that because a phrase
"sounds like" English idiom Z, Fedor meant Z.

Examples of past misinterpretations to internalise:

- 2026-05-14 (Session A audit): Fedor wrote "make sure the links are same as
  section names — i.e. now it is ueber-projekt (but make it look good)".
  Claude assumed he meant "rename the nav LABEL to match the URL slug" and
  changed "Über das Projekt" → "Über uns". Fedor actually meant the
  OPPOSITE — keep the label "Über das Projekt", rename the URL to match
  the label. A single AskUserQuestion before acting would have avoided
  reverting the work.

- (Add new examples here when they happen — institutional memory matters.)

**German copy: always include a brief English gloss** in parentheses or
as a follow-up line. Fedor doesn't speak German fluently — he can't
sanity-check tone without the gloss. Never propose German copy without
a translation.

Pure technical decisions with no user-visible effect (file naming inside a
folder, type names, refactor patterns, internal helper signatures) don't need
confirmation.

## Think before coding — when to ask, about what (HARD)

The "Ask before implementing" rule above tells you to use AskUserQuestion before
touching user-visible decisions. This section tells you the FOUR specific triggers
that should make you stop and ask, and what shape each question should take. If
any of these triggers fires, do not implement — invoke AskUserQuestion first.

1. **Unstated assumption.** You're about to act on something Fedor didn't
   actually say but you inferred. → Ask: "I'm reading this as X. Is that right,
   or did you mean Y?" Offer both as concrete options. Never act on a silent
   assumption about taste, scope, or wording.

2. **Multiple plausible interpretations.** The request can be parsed two or
   more ways (especially common given the language-note rule above). → Ask:
   list each interpretation as a separate option with what would change under
   each. Do not pick silently and "fix later if wrong" — that's the failure
   mode the 2026-05-14 ueber-projekt example warns about.

3. **A simpler approach exists.** What was requested is more elaborate than
   what the underlying goal actually needs. → Surface the simpler path as one
   of the options with the tradeoff named. Push back when the simpler path is
   clearly better — don't just build the longer thing because it was asked
   for. State the recommendation; let Fedor decide.

4. **Something is unclear.** A word, scope boundary, or success criterion is
   ambiguous (German wording, "make it look good", "consistent with the rest",
   "more readable"). → Stop. Name what's confusing in one sentence. Ask via
   AskUserQuestion with concrete options that pin down the ambiguity.

The test: if you catch yourself thinking "I'll guess and fix later if wrong",
that's a trigger. Cost of asking = one round-trip; cost of guessing wrong =
rework, reverted commits, eroded trust.

## Surgical changes by default (HARD)

**Touch only what the task requires. Don't "improve" adjacent code as a side effect.**

For everyday edits:
- Don't refactor adjacent code, comments, or formatting unless the task is the
  refactor itself.
- Match existing style even if you'd write it differently.
- Clean up imports/variables/functions that YOUR change made unused. Don't
  delete pre-existing dead code in the same pass without asking.
- If you notice unrelated dead code or inconsistency, surface it as a separate
  finding — don't fold it into the current diff.

**Site-wide consistency sweeps are the exception.** Renames, copy flips, term
replacements (Sie→Du, Evidenz→Wissenschaftlich, URL moves like
`/ueber-uns/` → `/projekt/`) are by nature cross-cutting — touching adjacent
code IS the job. Rule for sweeps:

1. Name the sweep explicitly ("this is a site-wide X→Y pass").
2. Confirm scope and stopping criteria via AskUserQuestion BEFORE starting.
3. Treat as a Major Revision in its own session, not a side trip during an
   unrelated fix.

The test: every changed line should trace either to the user's request OR to
the named sweep — nothing else.

## German text quality (HARD)

ISD reads the live site post-deploy, so there is **no pre-ship
gate** on AI-drafted German — but the bar for quality stays high and
the rules below are non-negotiable. AI-drafted German has shown two
recurring failure modes flagged by the team: (1) it reads like a
translation from English (English clause order, loaned constructions,
calques like "macht Sinn"), and (2) it occasionally inverts technical
claims (m13 "löst Spasmen" vs. Excel "lindert Spastiken").

Rules for any German text Claude proposes:

1. Always include a brief English gloss in parentheses or as a
   follow-up line. Fedor doesn't speak German — he can't sanity-check
   tone without it.
2. AI-drafted German that touches editorial copy must be marked in
   the source (e.g., `internalNotes: "AI draft, see ISD review"` for
   `.mdoc` files; equivalent JSDoc note for component-rendered text)
   so ISD can find and revise it after seeing it live. Whenever the
   copy lives in a Keystatic-backed `.mdoc`, write through the
   Keystatic schema and Markdoc, never bypass the schema.
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
- **Nav / menu (HARD)** — the floating pill nav is fragile. Any change to
  `.nav-wrapper`, `.nav-blur-shield`, `.nav`, `.nav__*`, `body:not(.has-hero)`
  nav rules, or `main { padding-top }` in `global.css`, or the `isHero` /
  `publishHeight` scripts in `BaseLayout.astro` requires an explicit
  AskUserQuestion confirmation before editing. Past unreviewed nav changes broke
  page-level h1 positioning and scroll behaviour across the whole site.

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
`/selbsttest/`, `/projekt/`, `/fakten-karten/`, `/startseite/`. Don't introduce
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
- The Über-das-Projekt page is `/projekt/` (renamed from `/ueber-uns/` on
  2026-05-14 so the URL matches the visible nav label "Über das Projekt").
  301s in three layers: middleware, page-level `Astro.redirect` stub at
  `src/pages/ueber-uns/index.astro`, and `netlify.toml`. The Keystatic
  singleton is still `ueberUnsScrolly` and its content file is still at
  `src/content/ueber-uns-scrolly.yaml` — only the URL moved, not the
  content path. Don't link to `/ueber-uns/...` in new code; use
  `/projekt/...`.

`src/middleware.ts` enforces a `SITE_PASSWORD` cookie at the edge when the env var is
set; `/login` and Keystatic's `/api/*` routes are exempt. The Stage 5
`/zahlen-und-fakten/*` → `/daten-explorer/*`, the Session 3a
`/haeufige-fragen/*` → `/meine-interessen/*`, and the 2026-05-14
`/ueber-uns/*` → `/projekt/` 301 redirects all fire BEFORE the password gate so
external backlinks resolve for unauthenticated traffic too.

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
