# Migration Notes

This document records how content was migrated from the old `cannabis-myths/wiki` folder into the new `cannabis-science-web` content architecture.

## Source

- **Source repository:** `cannabis-myths`
- **Source folder:** `wiki/` (78 files across 7 subfolders + 4 root files)
- **Migration date:** 2026-03-07
- **Migration tool:** `migrate_wiki.py` (Python script)

## Migration Rules

1. **No content modification** — All German text was preserved verbatim
2. **No translation** — Content remains in German
3. **No content invention** — No data was fabricated or inferred
4. **No citation removal** — All references were preserved
5. **Source intact** — The original `wiki/` folder was not modified or deleted

## Mapping: Wiki Folders → Content Collections

| Wiki Source | → Collection | Files Migrated | Files Skipped |
|---|---|---|---|
| `wiki/factsheets/*.md` | `src/content/factsheets/` | 36 | 1 (`_overview.md`) |
| `wiki/faq/*.md` | `src/content/faq/` | 7 | 1 (`_overview.md`) |
| `wiki/quiz/*.md` | `src/content/quiz/` | 5 | 1 (`_overview.md`) |
| `wiki/scrollytelling/*.md` | `src/content/scrollytelling/` | 4 | 1 (`_overview.md`) |
| `wiki/dashboard/*.md` | `src/content/dashboard/` | 6 | 1 (`_overview.md`) |
| `wiki/about/*.md` | `src/content/about/` | 4 | 0 |
| `wiki/meta/*.md` | `src/content/meta/` | 3 | 0 |
| `wiki/*.md` (root) | `src/content/meta/` | 4 | 0 |
| **Total** | | **69 + 3 = 72** | **6** |

### Not Migrated

| File | Reason |
|---|---|
| `_overview.md` (×6) | These are navigational indexes. Their function is replaced by generated Astro index pages. |
| `Factsheet Cannabismythen.txt` | Loose plain-text reference, not structured content. |

## Frontmatter Transformation

### Factsheets (had YAML frontmatter)

The factsheet files already had structured YAML frontmatter. Fields were mapped:

| Wiki Field | → New Field | Transformation |
|---|---|---|
| `id` | `mythId` | Direct copy |
| `number` | `mythNumber` | Direct copy |
| `theme` | `theme` | Direct copy |
| `category` | `category` | Direct copy |
| `category_group` | `categoryGroup` | Renamed (camelCase) |
| `classification` | `classification` | Normalized: `eher richtig` → `eher_richtig`, `keine Aussage möglich` → `keine_aussage` |
| `classification_label` | `classificationLabel` | Renamed (camelCase) |
| `related_myths` | `relatedMyths` | Renamed (camelCase), preserved as array |
| `quiz_ids` | `quizIds` | Renamed (camelCase), preserved as array |
| `tags` | `tags` | Direct copy |
| (none) | `status` | Set to `published` |
| (none) | `publishedAt` | Set to migration date |
| (none) | `updatedAt` | Set to migration date |

### Other Collections (no frontmatter in source)

FAQ, quiz, scrollytelling, dashboard, about, and meta files had no YAML frontmatter. Frontmatter was constructed from:

| Field | Source |
|---|---|
| `title` | Extracted from first `# Heading` in content |
| `theme` / `audience` / etc. | Derived from filename-to-metadata mapping tables |
| `sortOrder` | Assigned based on logical section order |
| `questionCount` | Auto-counted by regex (`### Frage N:` pattern) |
| `stepCount` | Auto-counted by regex (`## Step N` pattern) |
| `audienceSegment` | Mapped from filename (e.g., `indikatoren-erwachsene` → `erwachsene`) |
| `status` | `published` for all except `meta` (set to `draft`) |

## HTML Comment Extraction

The wiki files contained editorial HTML comments in several patterns:

- `<!-- GENERATED-CONTENT: ... -->` — Auto-generation markers
- `<!-- AUTHOR-TODO: ... -->` — Tasks for authors
- `<!-- AUTHOR-QUESTION: ... -->` — Open editorial questions
- `<!-- AUTHOR-REVIEW: ... -->` — Content requiring expert review
- `<!-- IDEA: ... -->` — Implementation suggestions

**All HTML comments were:**
1. Extracted from the content body
2. Concatenated into the `internalNotes` field
3. Removed from the rendered content

This preserves the editorial intent while ensuring comments never appear on the public site.

## Combined Myth Files

Three factsheet files cover multiple myths in a single entry:

| File | Myths | Reason |
|---|---|---|
| `m31-m32-entspannt-aggressiv.md` | M31 + M32 | Thematically paired (relaxation vs. aggression) |
| `m36-m37-leistungen-niveau.md` | M36 + M37 | Related (performance + social status) |
| `m41-m42-anstieg-konsum.md` | M41 + M42 | Related (legalization + youth consumption increase) |

These were migrated as single entries, preserving the original editorial grouping. If they need to be split in the future, the content is clearly structured within each file.

## File Format

All migrated files use the `.mdoc` extension (Markdoc) with YAML frontmatter:

```
---
title: "Mythos 24: Cannabiskonsum verursacht Psychosen"
mythId: m24
mythNumber: 24
classification: richtig
status: published
internalNotes: ""
...
---

# Mythos 24: Cannabiskonsum verursacht Psychosen

> **Einordnung: richtig** — Das stimmt.

[Content continues...]
```

## Verification

After migration:
- **72 `.mdoc` files** created (7,131 total lines)
- **77 `.md` source files** confirmed intact in `wiki/`
- Spot-checks confirmed content integrity for factsheets, FAQ, quiz, and about sections
