# Section playbook — Meine Interessen (FAQ)

Path: `/meine-interessen/` and `/meine-interessen/{audience}/`,
`/meine-interessen/frage/{slug}/`
Code: `src/pages/meine-interessen/`, `src/lib/faq.ts`,
content in `src/content/faq/`

## Risk profile

- **Audience-first restructure landed in Session 3a (2026-05-07).**
  Three 301 redirect patterns from the legacy `/haeufige-fragen/` URL
  fire from middleware + netlify.toml + page stubs. Visual passes
  should test both the new and the redirect-from-legacy paths.
- **Sie / Du baseline is split.** The Eltern, Fachkräfte, Lehrkräfte
  audiences keep Sie. Konsumierende + Jugendliche use Du. Don't sweep
  pronoun copy through this pipeline (that's Session 5 territory).
- **Lowest visual risk in the audit.** Mostly typography + spacing.

## Known quirks live here

- #1 (ad-hoc breakpoints — fewer than other sections)
- #11 (German text overflow on narrow viewports — quote callouts)
- #9 (focus rings on internal links)

## Visual-pass URL × viewport matrix

| URL | Viewports |
|---|---|
| `/meine-interessen/` (audience picker) | 375, 1024 |
| `/meine-interessen/eltern/` | 375, 1440 (Sie-baseline) |
| `/meine-interessen/konsumierende/` | 375 (Du-baseline) |
| `/meine-interessen/frage/<a popular slug>/` | 375, 768 |
| `/haeufige-fragen/` | 375 | must 301 to `/meine-interessen/` |

## Recommended skill workflow

1. `/cross-browser-audit faq` — light pass.
2. `/visual-screenshot-pass faq`
3. `/responsive-tokens-sweep faq` — typography wrap fixes.

## Forbidden edits

- Any Sie/Du sweep on this section's content (Session 5 will handle
  this separately).
- Audience definitions in `src/content/faq/audiences.yaml`.

## Verification gate

- `npx astro check --config astro.config.dev.mjs` — zero new errors.
- Manual: open one question page on mobile + desktop; confirm internal
  cross-links open and the audience badge wraps cleanly.
