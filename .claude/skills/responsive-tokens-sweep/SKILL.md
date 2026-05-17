---
name: responsive-tokens-sweep
description: Normalise the ~30 ad-hoc media-query breakpoints across global.css, dashboard.css, quiz.css, and component <style> blocks into a four-token system. Fix the 100vh → 100dvh issue on iOS Safari (quirk #2). Fence cqi container query units behind @supports (quirk #3). CSS-only edits, scoped to one section per invocation. Use when starting a responsive cleanup pass or after /cross-browser-audit surfaces quirks #1, #2, or #3.
---

# /responsive-tokens-sweep — CSS-only token normalisation

## When to use

Apply this skill when the operator wants to address one of these
related quirks for a specific section:

- Quirk #1 — ad-hoc breakpoints
- Quirk #2 — `100vh` on iOS Safari
- Quirk #3 — `cqi` without `@supports`

This is the first defined fix skill in the pipeline (Phase 0). It
operates CSS-only; it does not touch React, Astro, or content files
beyond CSS-in-style-block boundaries.

Out of scope: any layout restructure, JSX changes, content edits,
Keystatic schema changes. For those, use future `/adapt-<section>`
skills.

## Inputs

1. Which section? — daten-explorer · quiz · scrollytelling · faq ·
   projekt · global (global.css only)
2. Token strategy?
   - **Recommended:** Four breakpoints: `--bp-sm: 480px`, `--bp-md:
     768px`, `--bp-lg: 1024px`, `--bp-xl: 1440px`. Components with a
     legitimate extra step keep a literal but add a comment explaining
     why.
   - Alternative: five-breakpoint system (add `--bp-md-lg: 1200px`).
   - Alternative: do not introduce tokens, only fix quirks #2 and #3.

If either input is missing, ask via `AskUserQuestion` BEFORE editing.

## Workflow

1. Read `docs/ai-pipeline/known-quirks.md` quirks #1, #2, #3.
2. Read the section playbook in
   `docs/ai-pipeline/section-playbooks/<section>.md` to know which
   files are in scope.
3. Delegate to the `responsive-rewriter` sub-agent with:
   - The token definitions to add to `global.css`
   - The list of media-query rules to migrate
   - The list of `100vh` declarations to convert
   - The list of `cqi` declarations to fence
   - Hard guardrails (see below)
4. After the rewriter returns, run
   `npx astro check --config astro.config.dev.mjs`. Zero new errors
   required. If anything fails, ask the operator before continuing.
5. Chain into `/visual-screenshot-pass <section> verification` with
   the Tier-1 viewport set. Compare against the baseline screenshots.
6. If diffs are clean, prepare a commit message:
   `style(<section>): normalise responsive tokens (quirks #1/#2/#3)`
   List the migrated breakpoints in the body. Do not auto-commit —
   confirm with the operator first.

## Verification gate

Both gates required before requesting review:

- `npx astro check --config astro.config.dev.mjs` — zero new errors.
- `/visual-screenshot-pass <section> verification` — no regressions
  vs baseline.

## Hard guardrails

- **CSS-only.** Do not touch `.tsx`, `.astro`, or `.mdoc` files for
  anything beyond the `<style>` block inside the file. If a fix needs
  a JSX change, stop and ask.
- **No content folder edits.** `src/content/**` is editorial. Off-limits.
- **No data file edits.** `public/data/carm-data.json`,
  `quizData.ts` (data integrity fields) — off-limits per `CLAUDE.md`.
- **No new dependencies.** No PostCSS plugins, no SCSS, no Tailwind.
- **Preserve dark mode rules** if any exist in the touched files.

## Linked Asana behaviour

1. If no Asana card exists for "Responsive token sweep — <section>",
   create one in the `To do` section with the metadata header schema
   from `CLAUDE.md`: tags `design`, `functionality`, `pre-launch`.
2. As commits land, post a progress comment with the SHA.
3. When verification gates pass, move the task to `Needs review`,
   set assignee = Fedor (`fshankov@gmail.com`), and add an `@mention`
   comment listing the commit SHA, the URL of the dev preview, and a
   pointer to the screenshot bundle.
4. **Never auto-complete the task.** Fedor reviews and closes.

## Cross-references

- Quirk patterns: `docs/ai-pipeline/known-quirks.md` (#1, #2, #3)
- Per-section scope: `docs/ai-pipeline/section-playbooks/<section>.md`
- Worker agent: `.claude/agents/responsive-rewriter.md`
- Verification: `/visual-screenshot-pass`
- Type gate: `npx astro check --config astro.config.dev.mjs`
