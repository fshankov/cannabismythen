# Quiz Overhaul · Stage A · Spec

Status: planning complete, implementation in progress.
Branch: `quiz-overhaul/stage-a`.
Direction: **1 — Pew minimalism** (confirmed by Fedor 2026-05-16).

This spec captures the final German strings, the population-stat
formula, and the surface-by-surface diff that Stage A will produce.
English glosses are included **for Fedor's review only** and never
ship to the live site (per CLAUDE.md "German text quality" rules).

## Surface 1 — Header bar during play (`ProgressBar.tsx`)

Drop the live-score pill on the right (the `.quiz-score` element + its
flash animations). The header bar now contains: module title (left),
thin progress fill (middle), counter (right).

Counter label change:
- **i18n key**: `ui.progress`
- **OLD value**: `"{answered} von {total} beantwortet"`
  *(EN: "{answered} of {total} answered")*
- **NEW value**: `"Aussage {answered} von {total}"`
  *(EN: "Statement {answered} of {total}")*

Rationale: matches Pew's "Question X of Y" pattern and the on-card
counter ("Aussage X von Y" in `ui.questionLabel`) for end-to-end
consistent vocabulary.

The `lastScoreDelta` prop becomes unused; `score` becomes unused.
Removing both from the props interface keeps `QuizPlayer.tsx`'s call
site cleaner — Stage A also drops them at the call site.

## Surface 2 — QuizCard back face (`QuizCard.tsx`)

Two changes; the rest of the stack stays.

### 2a — Population line

The current copy implies binary correctness, which misreads the CaRM
`populationCorrectPct` field (which is a partial-credit Richtigkeit
mean, not "% of respondents who answered correctly").

- **OLD copy**:
  > **X %** der Erwachsenen (18–70) in einer Bevölkerungsbefragung in
  > Deutschland haben diesen Mythos genau richtig eingeschätzt.

  *(EN: "X % of adults (18–70) in a population survey in Germany rated
  this myth exactly right.")*

- **NEW copy**:
  > Erwachsene (18–70) in einer Bevölkerungsbefragung in Deutschland
  > ordneten diese Aussage im Schnitt zu **X %** genau richtig ein.

  *(EN: "Adults (18–70) in a population survey in Germany classified
  this statement on average X % correctly.")*

  - "Im Schnitt zu X % genau richtig" = "on average X % correctly",
    which is honest about partial credit without saying "X % of
    respondents".
  - Drops the editorial-loaded "Mythos" — the front face calls these
    "Aussagen" already (`ui.questionLabel`).
  - Same data, no change to `populationCorrectPct`.

The accompanying horizontal `.quiz-card__pop-bar-fill` visual stays —
a thin bar fits the calm voice and adds a quick "how big is X %?"
read.

The `aria-label` on the same container updates in lockstep:
`${popPct} Prozent — durchschnittliche Trefferquote von Erwachsenen 18 bis 70 in einer Bevölkerungsbefragung in Deutschland für diese Aussage.`

### 2b — Factsheet button label

- **i18n key**: `ui.openMythDetail`
- **OLD**: `"Details zu dieser Aussage →"`
  *(EN: "Details on this statement →")*
- **NEW**: `"Mehr auf der Fakten-Karte →"`
  *(EN: "More on the Fakten-Karte →")*

Reads as a destination, not a duplicate "Aussage".

### 2c — Sie → Du sweep on touched strings (back face only)

- `ui.yourAnswer`: `"Ihre Antwort:"` → `"Deine Antwort:"`
- `ui.yourAnswerLabel`: `"Ihre Antwort"` → `"Deine Antwort"`

Untouched Sie strings elsewhere on the card front face are left for
Session 5 / Du-flip per CLAUDE.md.

## Surface 3 — Result screen (`ResultScreen.tsx` + `ShareCard.tsx`)

The result hero is rebuilt from medal + big-% to verdict-led copy.
The "Module review" list stays in structure but loses the per-myth
Fakten-Karten button-strip (kept only the "Zur Frage" link).

### 3a — New result hero

Order, top to bottom:

1. Verdict title (Keystatic `verdicts.{band}.title`, fallback below).
2. Verdict body (Keystatic `verdicts.{band}.body`, fallback below).
3. **User score line** (new):
   > Du hast **{user_exact} von {total} Aussagen** genau richtig
   > eingeordnet (**{user_pct} %**).
   *(EN: "You classified {user_exact} of {total} statements exactly
   right ({user_pct} %).")*
   - `{user_exact}` = `result.breakdown.exact` (already computed by
     `breakdownCounts()` — Schritte 0 only).
   - `{total}` = sum of breakdown counts = answered count.
   - `{user_pct}` = `result.moduleScore` (Schritte-based, 0–100,
     captures partial credit).
4. **Population reference line** (new):
   > Erwachsene (18–70) in einer Bevölkerungsbefragung in Deutschland
   > ordneten im Schnitt **{pop_exact} von {total} Aussagen** genau
   > richtig ein (**{pop_pct} %**).
   *(EN: "Adults (18–70) in a population survey in Germany classified
   on average {pop_exact} of {total} statements exactly right
   ({pop_pct} %).")*
   - `{pop_exact}` = `Math.round(sum(populationCorrectPct) / 100)`
     — already computed as `absolutePoints` in `computePopulationStats()`.
   - `{total}` = number of myths in the module = `questionCount`.
   - `{pop_pct}` = `Math.round(mean(populationCorrectPct))`
     — already computed as `percent` in `computePopulationStats()`.
   - "Im Schnitt N von M genau richtig" is partial-credit-honest at the
     population level (`absolutePoints` is the expected-value points
     total, framed as the average respondent's exact-count equivalent).
5. Share button (`ui.shareButton` = `"Ergebnis teilen"` — unchanged).
6. Branding (`ui.siteUrl` = `"cannabismythen.de"` — unchanged).

Dropped from the hero: medal emoji + circle, big `{moduleScore} %`
hero, `share-card__absolute-score` line, `share-card__breakdown` line.

### 3b — Module review list (`.quiz-result__list`)

Removes the per-myth `"Zur Karte →"` button. The per-card back face
already has the factsheet link. Keeps `"Zur Frage"` (quiz-internal
nav).

### 3c — Result-screen Sie → Du sweep

- `ui.resultTitle`: `"Ihr Ergebnis"` → `"Dein Ergebnis"`
  *(EN: "Your result")*
- `ui.retrospectiveTitle`: `"Ihre Antworten im Überblick"` →
  `"Deine Antworten im Überblick"`
  *(EN: "Your answers at a glance")*
- `ui.persistenceNotice`: `"Wir speichern Ihren Fortschritt nur in
  diesem Browser."` → `"Wir speichern deinen Fortschritt nur in
  diesem Browser."`
- Fallback verdict bodies (`VERDICT_FALLBACK` in `ResultScreen.tsx`):
  - profi: `"Sie erkennen die Cannabis-Mythen..."` →
    `"Du erkennst die Cannabis-Mythen..."`
  - guterweg: `"Bei den meisten Aussagen liegen Sie richtig..."` →
    `"Bei den meisten Aussagen liegst du richtig..."`
  - gehtnoch: `"...In den Fakten-Karten finden Sie..."` →
    `"...In den Fakten-Karten findest du..."`
  - erwischt: `"Die Forschung sagt häufig etwas anderes..."` —
    second sentence stays "Zeit für eine Tour..." (no possessive).
- Hardcoded intro fallbacks:
  - weakSpot: `"Hier sind Ihre Antworten..."` →
    `"Hier sind deine Antworten..."`
  - strongPerformance: `"Sie lagen bei jeder Aussage nah dran..."` →
    `"Du lagst bei jeder Aussage nah dran..."`

These are Keystatic-overrideable; the changes touch only the
hardcoded fallbacks in the React file. Keystatic-side verdict copy is
ISD-gated and is **not** touched in Stage A.

## Surface 4 — Share copy (`share-copy.yaml`)

The per-band population-line override is no longer interpolated by
`ResultScreen.tsx` — the new result hero composes the population
sentence directly from `computePopulationStats()`. To keep the
Keystatic surface clean and avoid editor-side confusion, all four
bands are flattened to a single shared sentence template (same as
today's pattern), updated to the new wording.

- **OLD** (all four bands):
  > Erwachsene haben in einer Studie durchschnittlich {x} von {z}
  > möglichen Punkten erreicht ({pct} %).
- **NEW** (all four bands, AI draft, awaiting ISD review):
  > Erwachsene (18–70) in einer Bevölkerungsbefragung in Deutschland
  > ordneten im Schnitt {x} von {z} Aussagen genau richtig ein
  > ({pct} %).

Placeholders unchanged: `{x}` = `absolutePoints`, `{z}` =
`questionCount`, `{pct}` = `percent`.

Note: in Direction 1 the share-copy YAML is **read but no longer
interpolated** by `ResultScreen.tsx` — the new hero hardcodes the
sentence template (it's a fixed structural element of the result
screen, not banded copy). The YAML is kept in sync with the same
sentence so editors don't see drift between the two surfaces. Future
stages can re-introduce banded variations via this YAML if needed.

## Surface 5 — /quiz/ index (`src/pages/quiz/index.astro`)

### 5a — Drop per-tile chip

- Remove the `<span class="quiz-select-card__last-score">` element
  rendering and the inline `is:inline` script that fills it from
  `localStorage["cm-quiz-score-{slug}"]`.
- Remove the matching `.quiz-select-card__last-score` and
  `.quiz-select-card__last-score--has-data` CSS rules.

### 5b — Add band-color completion dot

- Render an empty `<span class="quiz-select-card__band-dot"
  data-quiz-slug="..." aria-hidden="true"></span>` on each tile,
  hidden by default.
- New inline `is:inline` script reads the same
  `cm-quiz-score-{slug}` localStorage entry, derives the band from
  the stored `moduleScore` via the same `scoreBand()` thresholds
  (≥ 80 → profi, ≥ 60 → guterweg, ≥ 40 → gehtnoch, else → erwischt)
  inlined into vanilla JS, and sets `data-band="{band}"` on the
  span + reveals it.
- CSS: dot is 10 × 10 px, top-right corner of the tile, colored by
  `--classification-*` token via `data-band` attribute selectors.
  Also adds a 2 px tinted border on the tile via
  `.quiz-select-card[data-band="..."]` so the completion state reads
  at a glance.

LocalStorage payload (write path in `QuizPlayer.tsx`) is **not**
changed — the existing `cm-quiz-score-{slug}` data shape stays so
future stages can use the count and percentage too.

### 5c — Index intro Sie → Du

- OLD: "Testen Sie Ihr Wissen in fünf thematischen Quiz-Modulen oder
  im Schnellcheck mit zufälligen Aussagen aus allen Themen. Jede
  Aussage ist mit dem Stand der Forschung erklärt; Ihre
  Einschätzungen vergleichen wir mit denen der Erwachsenen (18–70)
  in einer Bevölkerungsbefragung in Deutschland."
- NEW: "Teste dein Wissen in fünf thematischen Quiz-Modulen oder
  im Schnellcheck mit zufälligen Aussagen aus allen Themen. Jede
  Aussage ist mit dem Stand der Forschung erklärt; deine
  Einschätzungen vergleichen wir mit denen der Erwachsenen (18–70)
  in einer Bevölkerungsbefragung in Deutschland."
- The `<BaseLayout description="...">` prop: `"Testen Sie Ihr
  Wissen über Cannabis-Mythen"` → `"Teste dein Wissen über
  Cannabis-Mythen"`.
- The page H1: `"Quiz: Was wissen Sie über Cannabis?"` →
  `"Quiz: Was weißt du über Cannabis?"`.

## Schritte verdict labels — left as is

`schritte.{exact,near,off,far}` keys are ISD-approved (BugHerd #25);
not in scope for Stage A.

## Out of scope (reaffirmed)

- `quizData.ts` scoring helpers — untouched.
- `carm-data.json` — untouched.
- `mythId` / `correctClassification` / `populationCorrectPct` — untouched.
- Keystatic `.mdoc` content bodies — untouched.
- `keystatic.config.ts` — untouched.
- `netlify.toml`, `middleware.ts`, `.npmrc` — untouched.
- Full Sie → Du flip site-wide — Session 5 territory.
- Renumbering myth IDs — HARD never.
- OG image regeneration — Direction 1 changes the on-screen ShareCard
  visual but does NOT change the OG render path (it has its own
  Satori components in `scripts/generate-quiz-og.ts`). Re-running
  `npm run og:generate` is a safety net, not a requirement.

## Verification

1. `npx astro check --config astro.config.dev.mjs` — type-check
   (sandbox-friendly config per CLAUDE.md).
2. `npm run build` — production build with `astro check` gate.
3. Open the draft PR's Netlify preview URL and walk through:
   - `/quiz/` — band-color dot, no per-tile chip, no aggregate.
   - `/quiz/medizinischer-nutzen/` — "Aussage X von 7" counter, no
     live score pill, new back-face population sentence, new
     factsheet button label.
   - Reach the result screen — new score lines, no per-myth Karte
     button, share works.
4. Asana hand-off comments on Stage A tasks `1214704527202906`
   (BugHerd #43) and `1214736036149011` (Sasha design feed), move
   to **Needs review**, assign Fedor, @-mention
   `fshankov@gmail.com`.

## Open follow-ups (Stage B+ territory)

- Full Sie → Du flip across the rest of the quiz player + site.
- Per-band share-copy variation if editors want banded copy (the
  YAML is ready to re-engage; ResultScreen would need to swap the
  hardcoded sentence template back to `bandedPopulationLine()`).
- Aggregate "X von 6 Modulen abgeschlossen" line on /quiz/ if user
  feedback asks for one — currently dropped per Direction 1.
