# Section playbook — Quiz / Selbsttest

Path: `/selbsttest/`, `/quiz/`, `/quiz/{slug}/`
Code: `src/components/quiz/`, `src/styles/quiz.css`,
`src/pages/quiz/[slug].astro`

## Risk profile

- **Data integrity is code-review-gated.** `quizData.ts` fields
  `mythId`, `correctClassification`, `populationCorrectPct` MUST NOT be
  touched by this pipeline. The pipeline is allowed to edit CSS, JSX
  layout, and i18n labels only.
- **Two stores, one runtime.** Editorial text lives in
  `src/content/quiz/*.mdoc`; data lives in `quizData.ts`. The Astro
  page `src/pages/quiz/[slug].astro` is the join. CSS-only passes here
  are safe; touching either store needs a separate task.
- **Score persistence** — `localStorage` key `cm-quiz-score-{themeSlug}`
  is set by `QuizPlayer.tsx`. Rendering tweaks must not break the read
  path in `src/pages/quiz/index.astro`.

## Known quirks live here

- #7 (card transition `overflow: hidden` breaks momentum scroll on iOS)
- #1 (ad-hoc breakpoints in `quiz.css`)
- #9 (focus rings on answer buttons)
- #8 (Lucide icons in verdict chips)

## Visual-pass URL × viewport matrix

| URL | Viewports | Notes |
|---|---|---|
| `/selbsttest/` (landing) | 375, 1024 | hero + module tiles |
| `/quiz/` (index with score tiles) | 375, 768, 1440 | localStorage chip rendering |
| `/quiz/quiz-medizinischer-nutzen/` | 375, 1024 | mid-quiz, advance past Q1 first |
| `/quiz/quiz-medizinischer-nutzen/?result=erwischt` | 375, 1440 | result screen — share copy + OG |
| `/quiz/quiz-schnellcheck/` | 375 | dynamic deck, ensure runtime pick |

Capture each at "card N of M" mid-quiz, then at the result screen.

## Recommended skill workflow

1. `/cross-browser-audit quiz`
2. `/visual-screenshot-pass quiz`
3. `/responsive-tokens-sweep quiz`
4. Future `/adapt-quiz` for quirk #7 specifically (iOS momentum scroll).
5. `/visual-screenshot-pass quiz` — confirm no regressions on result
   screen typography or OG share card layout.

## Forbidden edits

- `src/components/quiz/quizData.ts` — fields `mythId`,
  `correctClassification`, `populationCorrectPct` (data integrity).
- Per-question scoring math outside `schritte()` / `pointsForSchritte()`
  / `moduleScore()` / `scoreBand()` — that's a bug per CLAUDE.md.
- Renaming quiz slugs (would orphan `cm-quiz-score-*` localStorage keys).

## Verification gate

- `npx astro check --config astro.config.dev.mjs` — zero new errors.
- Manual: play through one quiz module on mobile + desktop; confirm
  Schritte scoring renders and result screen share card displays.
