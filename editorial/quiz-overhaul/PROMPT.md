# Quiz Overhaul — Session Prompt (Repo Memory)

This file is the operating prompt for the **Quiz Overhaul** session, committed
here so any future agent can re-orient. Treat as appendix to `CLAUDE.md`.

## Environment

Running in Claude Code Cloud (remote sandbox, NOT Fedor's Mac). Outputs go to
tracked paths under `editorial/quiz-overhaul/`. No local dev server, no
Playwright, no `_local/`. Fedor operates from his phone.

## Hard constraints

- **Every German line comes with an English gloss inside an `AskUserQuestion`
  call.** Inline questions get missed.
- `AskUserQuestion` is mandatory before any user-visible change (copy, layout,
  scoring, thresholds, classification logic, navigation).
- Scoring math goes through `schritte() / pointsForSchritte() / moduleScore() /
  scoreBand() / breakdownCounts() / distanceScore() / computePercentile()` in
  `src/components/quiz/quizData.ts`. NEVER write a parallel scorer.
- 4-level classification (`richtig | eher_richtig | eher_falsch | falsch` +
  `keine_aussage`). Never collapse to true/false.
- **Du**, never Sie, in quiz copy. Youth-friendly public-health voice. Avoid
  English-pattern phrasing ("es ist wichtig zu erwähnen, dass…", noun-stacking,
  "macht Sinn").
- Site header / nav menu must stay visible during quiz play (D4).
- `public/data/carm-data.json`: read-only.
- `quizData.ts` fields `mythId / correctClassification / populationCorrectPct`:
  read-only without explicit Fedor confirmation per row.
- German body copy in `.mdoc` files: never AI-drafted into the `body` field.
  Draft in `editorial/quiz-overhaul/` first and surface to ISD via Keystatic
  with `internalNotes: "AI draft, awaiting ISD review"`.
- "Cannabis: Mythen & Evidenz" brand name is protected. UI-label "Evidenz" →
  "Wissenschaftlich".
- "repräsentativ" / "representative" must NOT appear in user-visible copy.
- Population framing: "Erwachsene (18–70) in einer Bevölkerungsbefragung in
  Deutschland".

## German copy rule — re-read before every answer

Wrong: `"Ich schlage 'Du hast 4 von 6 Punkten' vor. Passt?"`

Right: `AskUserQuestion` with options:
- Option A: `"Du hast 4 von 6 Punkten erreicht"` *(You scored 4 out of 6 points)*
- Option B: `"Du hast 4 von 6 Aussagen richtig eingeordnet"` *(You classified 4
  out of 6 statements correctly)*

Question text in English so Fedor can decide.

## Decisions pre-made (do not re-ask)

- **D1** Per-card population reference: YES (BugHerd #43).
- **D2** Fakten-Karten linkout: per-card only. NO duplicate on the result screen.
- **D3** Voice: Du, youth-friendly, public-health appropriate.
- **D4** Site header / nav menu visible at all times during quiz play.

## Open brainstorm questions (resolve in-session)

- **Q1** Decimal vs integer in points line (`2,6 / 6` vs `3 / 6`).
- **Q2** Noun choice (`Punkte` / `Antworten` / `Aussagen`).
- **Q3** Cross-module aggregate (none / counter only / weighted aggregate).

## Stages

- **Stage A** — Scoring dynamics, per-card UI, menu visibility fix. Branch
  `quiz-overhaul/stage-a`. Outputs in `editorial/quiz-overhaul/stage-a/`.
- **Stage B** — Final verdict screen + 4-column comparison + Satori PNG. Branch
  `quiz-overhaul/stage-b`. Outputs in `editorial/quiz-overhaul/stage-b/`.
- **Stage C** — Cross-quiz consistency, data integrity, framing audit. Branch
  `quiz-overhaul/stage-c`. Outputs in `editorial/quiz-overhaul/stage-c/`.
- **Stage D** — ISD-ready German wording packet. Branch `quiz-overhaul/stage-d`.
  Outputs in `editorial/quiz-overhaul/stage-d/`.

After each stage: push, refresh PR, post Asana comment with commit SHAs / PR URL
/ Netlify preview URL, then `AskUserQuestion` (proceed / iterate / pause /
abort).

## Data sources (all tracked)

- `public/data/carm-data.json` — CaRM survey dataset. Read-only.
- `src/components/quiz/quizData.ts` — code-side data integrity (`mythId`,
  `correctClassification`, `populationCorrectPct`). Read-only without per-row
  Fedor confirmation.
- `src/content/quiz/*.mdoc` — editorial text (six modules + feedback-texte).
- `src/content/share-copy.yaml` — default share copy per band.
- `editorial/quiz-overhaul/data/Kategorisierung_*.xlsx` — CaRM Excel master (if
  committed).

Six quiz module slugs on disk:

- `quiz-schnellcheck`
- `quiz-stimmung-wahrnehmung`
- `quiz-gefaehrlichkeit`
- `quiz-medizinischer-nutzen`
- `quiz-risiken-koerper-psyche`
- `quiz-soziales-bevoelkerung`
- `feedback-texte` (shared strings, not a quiz module)

## Asana tasks

Project: **CannabisMythen** (workspace `1214692075439040`, project
`1214704634010891`). Use `asana-v2` MCP. Confirm sections / completion /
comments before assuming what's open.

- **Stage A** `1214704527202906` (BugHerd #43 — feedback wording),
  `1214736036149011` (Sasha to design quiz UI).
- **Stage B** `1214740933217604`, `1214704419857456`, `1214736036131166`,
  `1214717486461643`.
- **Stage C** `1214717196240204`, `1214736238433684`, `1214717325268367`,
  `1214717325029230`.
- **Stage D** `1214717325029230` (ISD copy review, final hand-off).

## Cloud-specific workflow (differs from local)

1. `git checkout -b quiz-overhaul/stage-{a|b|c|d}`
2. Read / edit / commit in small reviewable commits.
3. Type-check: `npx astro check --config astro.config.dev.mjs`
4. Build: `npm run build`
5. Push: `git push -u origin quiz-overhaul/stage-{...}`
6. Open Draft PR. Netlify deploy preview triggers automatically.
7. Asana comment on relevant task(s) with stage summary, commit SHAs, Netlify
   preview URL, diff link, deliverable path under `editorial/quiz-overhaul/`.
   @-mention `fshankov@gmail.com`.
8. **Stage gate** — `AskUserQuestion`: proceed / iterate / pause / abort.

Do NOT call `./_local/render.sh` — doesn't exist in this sandbox. Do NOT try to
open a browser locally — use the Netlify preview URL. Do NOT write to `_local/`
— gitignored, won't survive a fresh checkout.

## Pause protocol

Commit in-flight work, push the branch, write
`editorial/quiz-overhaul/PAUSE-NOTE.md` describing exact resume state, post
Asana comment linking to it. Fedor can resume on any device.
