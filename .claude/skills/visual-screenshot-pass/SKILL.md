---
name: visual-screenshot-pass
description: Drive Playwright MCP through a section's URL × viewport matrix and produce a consistent screenshot bundle for visual review. Use when Fedor asks for "screenshots of the dashboard at mobile sizes", "a visual check on the quiz", "before/after on the scrollytelling change", or after any responsive change to gather a verification bundle. Never edits files. Defers browser engine choice based on the section playbook.
---

# /visual-screenshot-pass — Playwright-driven visual capture

## When to use

Operator wants a screenshot bundle for a section, either as a baseline
before a change or as a verification after one. Always runs against
the locally-rendered dev server unless an explicit external URL is
supplied.

Out of scope: implementing fixes (chain into the relevant /adapt or
/responsive skill), accessibility-only inspection, unit / type
checking (separate gate).

## Inputs

1. Which section? — daten-explorer · quiz · scrollytelling · faq ·
   projekt · custom-url-list
2. Baseline or verification? — affects file-naming and the comparison
   text in the report.
3. Viewport set? — default = Tier 1 from `browser-matrix.md`. Override
   when zooming on a specific regression (e.g. only 375×667 for iOS).
4. Local or staging? — default = `http://localhost:4321` via
   `./_local/render.sh`. Override if Fedor wants a deployed preview.

If any input is missing, ask via `AskUserQuestion`.

## Preflight

1. Confirm the dev server is running. If not, tell the operator to
   start it with `./_local/render.sh` (NOT raw `npm run dev` — per
   `CLAUDE.md`). Do not auto-start it without confirmation; the port
   collision warning matters.
2. If the operator is in the Cowork sandbox, the dev server runs in
   the sandbox at the port Astro picks. Read the log to confirm port.

## Workflow

1. Load `docs/ai-pipeline/section-playbooks/<section>.md` for the URL ×
   viewport matrix.
2. Load `docs/ai-pipeline/browser-matrix.md` for viewport defaults.
3. Delegate to the `visual-reviewer` sub-agent with:
   - URL list (resolved against dev-server origin)
   - Viewport list (Tier 1 default, override per input)
   - Browser engine — Chromium by default; WebKit when the section
     playbook calls out iOS-specific quirks (scrollytelling, quiz)
   - Naming convention: `<section>__<slug>__<viewport>__<engine>.png`
4. Receive screenshot paths back. Render an indexable contact-sheet
   list for the operator.
5. Send all screenshots to the operator via `SendUserFile` so they
   land in chat.

## Verification gate

For a verification pass (input 2 = "verification"), include a one-line
diff verdict per URL: "matches baseline" / "regressed" / "improved",
based on the agent's pixel-diff or layout-shift heuristic. Always
attach the visual to the corresponding Asana task as evidence.

## Linked Asana behaviour

If an active Asana task is in scope, attach the screenshot bundle as a
comment on the task. For verification passes, the agent's diff verdict
becomes the comment body, with screenshots as evidence.

## Cross-references

- URL matrix: `docs/ai-pipeline/section-playbooks/<section>.md`
- Viewport tiers: `docs/ai-pipeline/browser-matrix.md`
- Worker agent: `.claude/agents/visual-reviewer.md`
- MCP server: `.claude/.mcp.json` (Playwright)
