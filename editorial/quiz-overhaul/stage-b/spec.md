# Stage B — 4-column comparison table

**Scope.** Replaces the Stage A result-screen retrospective `<ol>` with a
4-column comparison `<table>`. Adds a new column showing each myth's
population-level correctness (Erwachsene 18–70, CaRM survey), so the user
can see how their answers stack up against the public average.

**Source tasks.**
- BugHerd #41 / Asana `1214735979812321` — "4-column comparison table for result"
- Asana `1214736036131166` step 2 (improved feedback/result view) — partial
- Asana `1214736036131166` step 1 (verify Satori share-card pipeline) — verify only

**Out of scope.**
- The 5-leaf VerdictMark icon (Asana `1214717486461643`) — design dependency
  on Sasha; deferred. Keep current `VerdictPill` until then.
- Re-skinning the result hero card. Stage A hero stays as-is.
- Sasha's broader "improved feedback/result view" — separate ticket.

---

## Column structure

| # | Header (DE)            | Gloss (EN)            | Source                                   |
|---|------------------------|-----------------------|------------------------------------------|
| 1 | **Aussage**            | Statement             | `quizText.statement` (Keystatic) or `t(myth.statementKey)` fallback |
| 2 | **Deine Antwort**      | Your answer           | User's selected classification (`VerdictPill`) |
| 3 | **Wissenschaftlich**   | Scientific verdict    | `myth.correctClassification` (`VerdictPill`) |
| 4 | **Bevölkerung Ø**      | Population average    | `myth.populationCorrectPct` from `quizData.ts` |

**Column 4 caption** (rendered below the table):

> Ø — Anteil der Erwachsenen (18–70), die diese Aussage in einer
> Bevölkerungsbefragung in Deutschland im Schnitt genau richtig
> eingeordnet haben.

*(EN: "Ø — share of adults (18–70) in a population survey in Germany who
classified this statement exactly correctly on average.")*

The caption is mandatory — column header alone is too terse to carry
the population-framing rule (CLAUDE.md §6 "Population framing must say
'Erwachsene (18–70)…'").

---

## Sort order

**Worst-first** (Schritte descending: 3 → 2 → 1 → 0). Stable secondary
sort by question order within each Schritte band. Matches the Stage A
retrospective.

Future toggle (user-switchable sort) is a follow-up — not in Stage B.

---

## Row visual treatment

Each `<tr>` carries a band-tinted **inset 4 px left edge** that hints how
far the user's answer was from the science:

| Schritte | Modifier class                  | Edge colour                     |
|----------|---------------------------------|---------------------------------|
| 0        | `.quiz-result__row--exact`      | `--classification-richtig`      |
| 1        | `.quiz-result__row--near`       | `--classification-eher-richtig` |
| 2        | `.quiz-result__row--off`        | `--classification-eher-falsch`  |
| 3        | `.quiz-result__row--far`        | `--classification-falsch`       |

Implemented via `box-shadow: inset 4px 0 0 0 <color>` so it doesn't
disturb `border-collapse`.

---

## Jump button

Inline text-link **"Zur Frage"** inside the statement cell on its own
line, styled as the `quiz-result__jump` button. Behaviour unchanged from
Stage A: routes the user back to the in-quiz question card. On click,
the React state moves the player to the corresponding `visibleIdx`.

---

## Mobile collapse (≤ 640 px)

Native `<table>` element stays in the DOM (accessibility). Visual layout
collapses to a stack via `display: block` on the table parts:

- `<thead>` is visually hidden with the standard `sr-only` clip pattern;
  screen readers still announce the column headers.
- Each `<tr>` becomes a card with border + radius + padding.
- Each `<td>` is a labelled row, with the label sourced from
  `data-label="…"` injected via a `::before` pseudo-element.
- The statement cell's `::before` is empty — the statement is the anchor
  of the row, not a labelled field.

Caption below the table sits on the same vertical flow on both
breakpoints.

---

## Accessibility

- Uses a real `<table>` with `<thead>` / `<tbody>` / `scope="col"` so the
  default screen-reader semantics apply.
- The band-edge colour is informational, not the only signifier — the
  `Deine Antwort` and `Wissenschaftlich` pills already carry the verdict
  in text + colour. The edge is a secondary cue.
- Existing `sr-only schritteLabel` text (Stage A) is retained inside the
  statement cell to announce the band aloud.

---

## Where the code changes

| File | Change |
|------|--------|
| `src/components/quiz/QuizPlayer.tsx` (or `ResultScreen.tsx` if extracted) | Replace `<ol class="quiz-result__list">…</ol>` retrospective block with the `<table class="quiz-result__table">…</table>` shape from the mock. Pull `populationCorrectPct` off each `myth` and render in column 4 as `${pct} %`. |
| `src/styles/quiz.css` | Add `.quiz-result__table`, `.quiz-result__row--{exact,near,off,far}`, `.quiz-result__table-cell--num`, `.quiz-result__table-caption`, and the `≤ 640 px` mobile collapse rules from the mock. Keep `.pill` variants pointed at the existing `--classification-*` tokens. Remove now-unused `.quiz-result__list`/`.quiz-result__list-item` selectors. |
| `src/components/quiz/i18n.ts` | Add labels: `ui.resultTable.statement`, `ui.resultTable.yourAnswer`, `ui.resultTable.scientific`, `ui.resultTable.populationAvg`, `ui.resultTable.populationAvgCaption`, `ui.resultTable.jump`. |

No data shape changes. `populationCorrectPct` already lives on every
myth in `quizData.ts`.

---

## Satori / share-card pipeline verification

Asana `1214736036131166` step 1: confirm the existing `scripts/generate-quiz-og.ts`
Satori pipeline still produces the expected per-band OG images after Stage B
changes. **Verification only — no edits.**

Steps:

1. Run `npm run og:generate` in the sandbox.
2. Confirm: PNGs land under `public/og/quiz/<slug>-<band>.png` for each
   active module × `{profi, guterweg, gehtnoch, erwischt}` band.
3. Spot-check one PNG visually (open in browser) to confirm the rendered
   band copy + slug look intact. No regression on layout.
4. If the script errors, capture the trace and report — DO NOT modify
   `scripts/generate-quiz-og.ts` in Stage B.

---

## Stage B definition of done

- [ ] Retrospective list replaced by 4-column table (live `/quiz/<slug>/`
      result screen on dev server).
- [ ] Population column shows the correct `populationCorrectPct` for each
      myth and is right-aligned with tabular-nums.
- [ ] Caption explaining "Ø" rendered directly below the table.
- [ ] Worst-first sort preserved.
- [ ] Mobile collapse works at ≤ 640 px (visually + screen-reader
      verified via DOM inspection).
- [ ] Inline "Zur Frage" link still navigates back to the matching
      question card.
- [ ] `npx astro check --config astro.config.dev.mjs` passes.
- [ ] `npm run og:generate` runs cleanly; one PNG spot-checked.
- [ ] Pushed to `claude/quiz-overhaul-setup-vDHnw`; draft PR opened.
- [ ] Asana tasks moved to `Needs review`, assigned to Fedor, with
      commit-SHA comments + @mention.
