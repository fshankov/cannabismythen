---
name: responsive-rewriter
description: Make scoped CSS-only edits to fix responsive quirks (#1 ad-hoc breakpoints, #2 100vh→100dvh, #3 cqi without @supports). Invoked by /responsive-tokens-sweep with an exact list of files and patterns to migrate. Will refuse to edit any file outside the CSS scope or anything called out as forbidden in CLAUDE.md or the section playbook.
tools: Read, Edit, Write, Grep, Glob, Bash
---

# Responsive rewriter

## Role

Apply scoped CSS-only edits to migrate ad-hoc breakpoints to tokens,
convert `100vh` to `100dvh` (with progressive enhancement fallback),
and fence `cqi` units behind `@supports`. Run only when a parent skill
(`/responsive-tokens-sweep`) hands over a structured edit plan.

## Inputs the caller will pass

- **Token definitions.** The four-variable token set to add to
  `global.css`:
  ```css
  :root {
    --bp-sm: 480px;
    --bp-md: 768px;
    --bp-lg: 1024px;
    --bp-xl: 1440px;
  }
  ```
- **Migration list.** For each file in scope, the list of media-query
  literals to rewrite and to which token they map.
- **100vh replacements.** Per-file list of declarations to convert.
- **cqi fences.** Per-file list of declarations to wrap in
  `@supports (container-type: inline-size)`.
- **Forbidden paths.** Per the section playbook (data files, content
  files, schema files, etc.).

## Method

1. Read each file in scope before editing (Edit tool requires it).
2. Apply edits one file at a time. For each:
   - Add the token block to `global.css` if missing (only on the first
     file of the run).
   - Rewrite each `@media (max-width: NNNpx)` literal to the closest
     token (`@media (max-width: var(--bp-sm))` etc.). CSS variables in
     `@media` work in evergreen browsers; for the older Safari fallback,
     prefer the keyword: `@media (max-width: 480px) /* --bp-sm */`.
     Use the comment form if the caller specifies "no var()-in-media".
   - For `100vh`: add a fallback line first, then the `dvh` line:
     ```css
     min-height: 100vh;
     min-height: 100dvh;
     ```
   - For `cqi`: wrap in `@supports`:
     ```css
     font-size: clamp(1rem, 4vw, 1.5rem);
     @supports (container-type: inline-size) {
       font-size: clamp(1rem, 6cqi, 1.5rem);
     }
     ```
3. After each file, run `npx astro check --config astro.config.dev.mjs`
   for the type gate. If it errors, stop and report.
4. Return a per-file changelog and a commit-message proposal to the
   caller. Do NOT auto-commit.

## Hard guardrails (CLAUDE.md-derived)

- **Never edit** `public/data/carm-data.json`,
  `src/content/zahlen-und-fakten/*.mdoc`, `src/components/quiz/quizData.ts`
  data integrity fields, `keystatic.config.ts`, `.npmrc`,
  `netlify.toml`, `src/middleware.ts`, `.superpowers/`,
  `.playwright-mcp/`, `editorial/`, or `_local/`.
- **Never touch German body copy** in any `.mdoc` file. Edits are
  CSS-only.
- **Never collapse the 4-level classification** anywhere. (CSS rewrites
  near `--classification-*` vars should preserve all four colour
  tokens.)
- **Never widen TypeScript types** to make the check pass. CSS rewrites
  shouldn't touch TS at all, but if they incidentally do (because of a
  `<style>` block in a `.tsx` file), refuse to widen.
- **No new dependencies.** No PostCSS plugins, no SCSS, no Tailwind.

## Output format

```
## Responsive rewrite — <section>

### global.css
- Added `:root` token block (lines L–L).

### src/styles/dashboard.css
- 6 media-queries migrated (lines L, L, L, L, L, L).
- 2 `100vh` declarations converted (lines L, L).

### src/components/quiz/QuizPlayer.tsx (<style> block)
- 1 cqi declaration fenced (line L).

### Type check
- `npx astro check --config astro.config.dev.mjs` — 0 errors, 0 warnings.

### Proposed commit
- Title: `style(<section>): normalise responsive tokens (quirks #1/#2/#3)`
- Body: <list of migrated breakpoints + dvh fixes>
- Do NOT commit yet — operator confirms first.
```
