---
name: cross-browser-audit
description: Read-only cross-browser and responsive audit of one site section. Use when Fedor asks for "a check on X", "what's broken on iOS on the dashboard", "any responsive issues with the quiz", etc. Loads the relevant section playbook from docs/ai-pipeline/, delegates to the browser-quirk-hunter agent, returns a prioritised file:line finding list. Never edits files. Optionally chains into /visual-screenshot-pass for a screenshot bundle.
---

# /cross-browser-audit — read-only quirk hunt per section

## When to use

Operator asks for a cross-browser or responsive check on a specific
section: dashboard / daten-explorer, quiz, scrollytelling, FAQ /
meine-interessen, or projekt. The skill returns a prioritised list of
findings with file:line references — it does not edit anything.

Out of scope: copy review, German review, accessibility-only review
(use future `/keyboard-and-a11y-pass`), per-quirk fixes
(use `/responsive-tokens-sweep` or future `/adapt-<section>`).

## Inputs

1. Which section?
   - daten-explorer · quiz · scrollytelling · faq · projekt · all-quick
2. Severity floor?
   - High only · High + Medium (recommended) · Everything

If either input is missing, ask via `AskUserQuestion` BEFORE doing
anything else. Do not guess.

## Workflow

1. Read `docs/ai-pipeline/known-quirks.md` end to end.
2. Read `docs/ai-pipeline/section-playbooks/<section>.md`.
3. Read `docs/ai-pipeline/browser-matrix.md` so the agent knows what
   "supported" means.
4. Delegate to the `browser-quirk-hunter` sub-agent with this brief:
   - The 12 quirks to look for (load list from `known-quirks.md`).
   - The file paths the section owns (load from playbook).
   - Severity floor passed by the operator.
   - Hard rule: read-only, no edits, return file:line refs only.
5. Receive the finding list back. Reformat as a checklist:
   ```
   [HIGH] Quirk #N — <pattern> — src/path/to/file.css:LL
     Owned by: /<skill>
   ```
6. Ask the operator: capture screenshots now (chain into
   `/visual-screenshot-pass`), or stop here?

## Verification gate

Read-only — no gate. Output is the deliverable.

## Linked Asana behaviour

If an active Asana task is in scope (passed by the operator or surfaced
at session start), append the finding list as a comment on that task
using the MCP `add_comment` tool. Do not move the task to "Done" —
findings are diagnostic, not the fix.

## Cross-references

- Quirk catalog: `docs/ai-pipeline/known-quirks.md`
- Per-section facts: `docs/ai-pipeline/section-playbooks/<section>.md`
- Browser/viewport scope: `docs/ai-pipeline/browser-matrix.md`
- Worker agent: `.claude/agents/browser-quirk-hunter.md`
- Verification skill: `/visual-screenshot-pass`
- Fix skills: `/responsive-tokens-sweep` (Phase 0), future
  `/adapt-<section>` (Phase 1).
