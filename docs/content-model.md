# Content Model

This document describes all Keystatic collections, their schemas, and the content workflow.

## Collections Overview

| Collection | Path | Entries | Public | Format |
|---|---|---|---|---|
| `factsheets` | `src/content/factsheets/` | 36 | Yes | Markdoc + rich frontmatter |
| `faq` | `src/content/faq/` | 7 | Yes | Markdoc + theme metadata |
| `quiz` | `src/content/quiz/` | 5 | Yes | Markdoc + quiz metadata |
| `scrollytelling` | `src/content/scrollytelling/` | 4 | Yes | Markdoc + version metadata |
| `dashboard` | `src/content/dashboard/` | 6 | Yes | Markdoc + audience metadata |
| `about` | `src/content/about/` | 4 | Yes | Markdoc + sort order |
| `meta` | `src/content/meta/` | 10 | No | Markdoc (internal only) |

## Shared Fields

These fields appear in every collection:

| Field | Type | Description |
|---|---|---|
| `title` | slug | Entry title (also generates the URL slug) |
| `summary` | text (multiline) | Short description for listings and SEO |
| `tags` | array of text | Freeform tags for categorization |
| `status` | select: `draft` / `published` | Controls public visibility |
| `internalNotes` | text (multiline) | Editorial notes — never rendered publicly |
| `publishedAt` | date | Publication date |
| `updatedAt` | date | Last update date |

## Factsheets Schema

The factsheets collection has the richest schema, carrying all research metadata:

| Field | Type | Values / Description |
|---|---|---|
| `mythId` | text | `m01` through `m42` |
| `mythNumber` | integer | 1–42 |
| `theme` | select | `übergreifend`, `substanz`, `körper`, `körper_psyche`, `psyche`, `soziales`, `rechtliches` |
| `category` | text | e.g., "Allgemein", "Medizin", "Psyche" |
| `categoryGroup` | text | Longer categorical grouping from research |
| `classification` | select | `richtig`, `eher_richtig`, `eher_falsch`, `falsch`, `keine_aussage` |
| `classificationLabel` | text | Human-readable label, e.g., "Das stimmt nicht." |
| `relatedMyths` | array of text | IDs of related myths (e.g., `m10`, `m12`) |
| `quizIds` | array of text | Which quiz modules reference this myth |
| `content` | markdoc | Full factsheet body (German) |

### Classification System

| Value | Code | Meaning |
|---|---|---|
| `richtig` | Correct | Myth aligns with current scientific evidence |
| `eher_richtig` | Rather correct | Mostly correct with caveats |
| `eher_falsch` | Rather false | Mostly wrong but has partial truths |
| `falsch` | False | Clearly contradicts scientific evidence |
| `keine_aussage` | No statement possible | Conflicting or insufficient evidence |

### Themes

| Theme Key | German Label | Myth Range |
|---|---|---|
| `übergreifend` | Übergreifend | M01–M04 |
| `substanz` | Substanz | M05–M07 |
| `körper` | Körper | M08–M17 |
| `körper_psyche` | Körper & Psyche | M18–M21 |
| `psyche` | Psyche | M22–M32 |
| `soziales` | Soziales | M33–M38 |
| `rechtliches` | Rechtliches | M39–M42 |

## FAQ Schema

| Field | Type | Description |
|---|---|---|
| `theme` | text | Thematic group name |
| `audience` | multiselect | Target audiences: `allgemein`, `jugendliche`, `konsumierende`, `junge_erwachsene`, `eltern` |
| `sortOrder` | integer | Display order on the FAQ index |
| `content` | markdoc | FAQ questions and answers (German) |

## Quiz Schema

| Field | Type | Description |
|---|---|---|
| `theme` | text | Quiz theme (Körper, Psyche, Alltag, Gesellschaft) |
| `questionCount` | integer | Number of questions in the quiz |
| `content` | markdoc | Quiz questions, options, and feedback (German) |

## Scrollytelling Schema

| Field | Type | Description |
|---|---|---|
| `versionLabel` | text | Version identifier (A, B, C, Tech) |
| `stepCount` | integer | Number of narrative steps |
| `content` | markdoc | Narrative steps and chart specifications |

## Dashboard Schema

| Field | Type | Description |
|---|---|---|
| `audienceSegment` | select | `erwachsene`, `minderjaehrige`, `konsumierende`, `junge_erwachsene`, `eltern`, `uebergreifend` |
| `content` | markdoc | Indicator data tables and descriptions |

## About Schema

| Field | Type | Description |
|---|---|---|
| `sortOrder` | integer | Display order on the about page |
| `content` | markdoc | About page content |

## Content Workflow

### Draft vs. Published

- **Draft**: Entry is visible in Keystatic but not rendered on the public website.
- **Published**: Entry appears on the public website.

All migrated content (except `meta`) was imported with `status: published`. The `meta` collection defaults to `status: draft` since it contains internal reference material.

### Editing Workflow

1. Editor opens `/keystatic` on the deployed site
2. Authenticates with GitHub
3. Edits content in the visual editor
4. Saves → Keystatic creates a Git commit
5. Site rebuilds automatically (if CI/CD is configured)

### Internal Notes

The `internalNotes` field is for:

- Editorial TODOs
- Questions for the team
- Review status notes
- Source attribution notes

These were migrated from HTML comments in the original wiki files (e.g., `<!-- AUTHOR-TODO: ... -->`). They are never exposed on the public website.
