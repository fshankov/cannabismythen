# Archived — see `src/content/faq/`

This directory is **archived**. The audience-first FAQ restructure of
2026-04-30 replaced the eight theme-based `*.mdoc` files here with the
docx-driven `faqQuestions` collection at `src/content/faq/questions/` plus the
`faqAudiences` singleton at `src/content/faq/audiences.yaml`.

The `haeufigeFragen` collection has been removed from `keystatic.config.ts`,
so these files are no longer parsed at build time. They remain on disk only
because the deletion couldn't be performed from the agent sandbox. **Safe to
`git rm`** the eight `*.mdoc` files (and this README) in any follow-up commit.

Old slugs are 301-redirected to the new audience pages via `astro.config.mjs#redirects`:

| Old slug                                  | Redirects to                                                            |
|-------------------------------------------|-------------------------------------------------------------------------|
| `/haeufige-fragen/abhaengigkeit-risiko/`  | `/haeufige-fragen/konsumierende/#faq-kann-cannabis-abhaengig-machen`    |
| `/haeufige-fragen/empfohlene-weitere-fragen/` | `/haeufige-fragen/`                                                 |
| `/haeufige-fragen/gesundheit/`            | `/haeufige-fragen/eltern/`                                              |
| `/haeufige-fragen/haralds-fragen/`        | `/haeufige-fragen/`                                                     |
| `/haeufige-fragen/jugend-eltern/`         | `/haeufige-fragen/eltern/`                                              |
| `/haeufige-fragen/medizin/`               | `/haeufige-fragen/konsumierende/`                                       |
| `/haeufige-fragen/psyche-kognition/`      | `/haeufige-fragen/eltern/#faq-kann-cannabis-psychosen-ausloesen`        |
| `/haeufige-fragen/sozial-gesellschaft/`   | `/haeufige-fragen/jugendliche/`                                         |

The canonical content source is now:

- `_local/team/FAQ/cannabismythen_FAQ_HL_2026 04 29.docx` (editorial draft)
- `_local/team/FAQ/scripts/build_faq.py` (generates the mdoc files)
- `_local/team/FAQ/FAQ_Implementation_Plan.md` (design rationale)
