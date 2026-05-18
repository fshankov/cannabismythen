# AI cross-browser / responsive pipeline

This directory documents the multi-agent pipeline that audits, screenshots,
and rewrites the site for cross-browser and small-screen behavior. It is
checked into git so every Claude Code session — local on Fedor's MBP and
remote on claude.ai/code — bootstraps from the same shared knowledge base.

> **TL;DR for a future Claude session:** read `known-quirks.md` first, then
> the relevant `section-playbooks/<section>.md`, then run the matching
> skill (`/cross-browser-audit`, `/responsive-tokens-sweep`,
> `/visual-screenshot-pass`). Verify visually via Playwright MCP and via
> `npx astro check --config astro.config.dev.mjs` before requesting review.

## What lives where

| Layer | Path | Purpose |
|---|---|---|
| Slash skills | `.claude/skills/<name>/SKILL.md` | Operator-invokable entry points. Each skill orients you, names the audience, and chains into agents. |
| Sub-agents | `.claude/agents/<name>.md` | Specialised workers (read-only quirk hunter, Playwright reviewer, CSS rewriter). Invoked by skills or by the top-level agent when a task matches. |
| Project MCP | `.claude/.mcp.json` | Pins Playwright MCP for the project. User-level MCPs (GitHub, Asana, Figma, Netlify, Astro docs, Gmail labels) are configured separately on Fedor's machine. |
| Shared docs | `docs/ai-pipeline/` (this folder) | Browser matrix, known quirks, per-section playbooks — the source of truth Claude reads at session start. |
| Operator playbook | `_local/ai-pipeline-playbook.md` | Fedor's personal notes. Gitignored — see `.gitignore`. |

## Layers, in detail

### 1. Slash skills (the front door)

Operator types `/<skill>` from any Claude Code surface. Each skill:

1. Asks one or two AskUserQuestion-style questions to scope the work.
2. Loads the relevant section playbook and quirk list.
3. Delegates to the right sub-agent(s).
4. Returns with a status checklist + commit SHAs.

Current Phase 0 skills (more land in Phase 1):

- **`/cross-browser-audit`** — meta dispatcher. Pick a section, get a
  prioritised quirk report based on the relevant playbook. Read-only.
- **`/responsive-tokens-sweep`** — normalise the ~30 ad-hoc media-query
  breakpoints into a token set, fix the `100vh` → `100dvh` issue on iOS,
  remove `cqi` units behind a feature query. CSS-only.
- **`/visual-screenshot-pass`** — drive Playwright MCP through the
  section's URL × viewport matrix; produce a screenshot bundle Fedor can
  scroll through. Verification, not implementation.

### 2. Sub-agents (the workers)

- **`browser-quirk-hunter`** — read-only deep auditor. Scans the codebase
  for the 12 quirk patterns documented in `known-quirks.md`. Returns
  file:line refs and severity, never edits.
- **`visual-reviewer`** — wraps Playwright MCP. Takes a URL list + viewport
  list, captures consistent screenshots, flags layout shifts, returns a
  finding list.
- **`responsive-rewriter`** — makes CSS-only edits within a defined scope
  (one section, one stylesheet, one pattern). Strict guardrails: never
  touches `quizData.ts` data integrity fields, never edits
  `carm-data.json`, never renumbers myths.

### 3. Shared docs (the knowledge base)

- **`browser-matrix.md`** — what we test on, with viewports per tier.
- **`known-quirks.md`** — the 12 cross-browser / responsive patterns
  identified in the 2026-05-17 audit, with concrete file:line references.
  Updated whenever a new quirk lands.
- **`section-playbooks/<section>.md`** — per-section playbook: priority
  risks, suggested URLs for visual review, recommended skill workflow.

### 4. Operator playbook (Fedor's notes)

`_local/ai-pipeline-playbook.md` — keyboard cheat-sheet, session
preflight checklist, Asana review-state cribsheet, anything that's
private to Fedor's workflow. Gitignored.

## Verification gates

Two gates apply before any /<adapt-*>-style skill is allowed to claim a
task is "ready for review":

1. **Visual gate.** Run `/visual-screenshot-pass` on the section's URL
   set across Tier-1 viewports (see `browser-matrix.md`). Compare before
   and after. Attach the after-screenshots to the Asana task.
2. **Type gate.** Run `npx astro check --config astro.config.dev.mjs`
   (the type-only config that avoids the sandbox Netlify integration
   error documented in `CLAUDE.md`). Zero new errors required.

`npm test` doesn't exist on this project (no test runner is wired up).
Visual + type checks are the only gates.

## Audit provenance

The 12 quirk patterns and the section priority list were derived from a
parallel codebase audit on **2026-05-17** that reviewed:

- All page templates in `src/pages/`
- The MythenExplorer + dashboard CSS in `src/styles/dashboard.css`
- `QuizPlayer.tsx` + `quiz.css`
- ScrollytellingViewer
- `BaseLayout.astro` + `global.css` (responsive tokens)
- All `<style>` blocks across `.astro` / `.tsx` files

When updating `known-quirks.md`, prepend the new finding with the audit
date and the file:line reference, so future Claude sessions can tell
which findings have been triaged.

## Future skills (Phase 1+, not in this scaffold)

Tracked in `_local/ai-pipeline-playbook.md`. Expected:

- `/adapt-daten-explorer`, `/adapt-quiz`, `/adapt-scrollytelling`,
  `/adapt-faq`, `/adapt-projekt` — per-section adapter skills that bundle
  a quirk-hunt + visual-pass + rewrite for that area.
- `/safari-ios-pass` — focused iOS pass (dvh, 100vh, momentum scroll,
  rubber-banding, viewport meta).
- `/keyboard-and-a11y-pass` — focus rings, skip links, ARIA on the
  scrollytelling and quiz components.

When you add a new skill, append it to `_local/ai-pipeline-playbook.md`
under "Skills inventory" so the operator knows it exists.
