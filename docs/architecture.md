# Architecture

This document describes the system architecture, technology choices, and design principles of the cannabis-science-web project.

## Overview

The application is a **static-first website** with selective server-side rendering for the CMS admin interface. There is no backend server or database — content is stored as files in the Git repository and managed through Keystatic.

```
┌─────────────────────────────────────────────┐
│  GitHub Repository (single source of truth) │
│                                             │
│  src/content/   ← Keystatic writes here     │
│  keystatic.config.ts  ← Schema definitions  │
└────────┬────────────────────────┬───────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│  Astro Build    │    │  Keystatic Admin UI  │
│  (Static HTML)  │    │  (/keystatic)        │
│                 │    │  GitHub OAuth login   │
│  - Factsheets   │    │  Commits to repo     │
│  - FAQ          │    └──────────────────────┘
│  - Quiz         │
│  - Scrollytell  │
│  - Dashboard    │
│  - About        │
└─────────────────┘
```

## Technology Choices

### Astro (Framework)

Astro was chosen because it is static-first (fast, cheap to host), has built-in content collection support, supports React islands for interactivity, and integrates natively with Keystatic and Markdoc.

The project uses `output: "hybrid"` mode: most pages are statically generated at build time, while the `/keystatic` admin routes use server-side rendering.

### Keystatic (CMS)

Keystatic in **GitHub mode** was chosen because:

- Content is stored as plain files in Git (no database, no vendor lock-in)
- Collaborators edit through a visual UI at `/keystatic`
- Every edit creates a Git commit (full version history)
- Non-technical editors can contribute without learning Git
- Schema validation ensures content consistency

### Markdoc (Content Format)

Markdoc is used instead of MDX because:

- It provides cleaner separation between content and code
- It is the native content format for Keystatic
- It supports custom tags for future extensibility
- It does not allow arbitrary JavaScript execution in content files (safer for multi-author workflows)

### React (Interactive Components)

React is used for three interactive sections:

- **Quiz** — Multi-step question flow with scoring and feedback
- **Dashboard** — Filterable/sortable data visualizations
- **Scrollytelling** — Scroll-driven narrative with animated charts

These are implemented as Astro "islands" — they hydrate on the client only where needed, keeping the rest of the site static.

### D3.js (Visualizations)

D3 is used for data visualizations in the dashboard and scrollytelling sections. Visualization code lives in `src/lib/visualizations/` and is consumed by React components.

## Content Architecture

### Collections

The content model has 7 collections, each mapping to a public website section:

| Collection | Public Route | Entries | Purpose |
|---|---|---|---|
| `factsheets` | `/factsheets/` | 36 | Core myth entries with scientific evidence |
| `faq` | `/faq/` | 7 | Thematic FAQ groupings |
| `quiz` | `/quiz/` | 5 | Interactive quiz modules |
| `scrollytelling` | `/scrollytelling/` | 4 | Narrative data stories |
| `dashboard` | `/dashboard/` | 6 | Audience-specific indicator data |
| `about` | `/about/` | 4 | Project information |
| `meta` | (none) | 10 | Internal reference only |

### Content Workflow

Every content entry has a `status` field: `draft` or `published`. Only `published` entries are rendered on the public site. The `meta` collection is never rendered publicly.

### Internal Notes

Every collection includes an `internalNotes` field for editorial comments. This field is:

- Visible in the Keystatic admin UI
- **Never rendered** on the public website
- Stripped from entry data before any page rendering

This is enforced in `src/lib/content.ts` via the `stripInternal()` helper and the destructuring pattern used in all page files: `const { content, internalNotes, ...meta } = entry`.

## Directory Boundaries

```
src/content/          → CMS-managed content (Keystatic writes here)
src/pages/            → Public routes (Astro)
src/components/       → React interactive components
src/lib/              → Shared utilities and D3 visualizations
src/layouts/          → HTML layouts

docs/                 → Developer documentation (not public)
editorial/            → Editorial working notes (not public)
planning/             → Project planning (not public)
research/             → Research materials (not public)
```

The `docs/`, `editorial/`, `planning/`, and `research/` folders are **never** part of the Astro build. They exist only in the repository for internal use.

## Deployment

The site can be deployed to any static hosting platform that supports Astro's hybrid mode:

- **Vercel** (recommended — native Astro adapter, handles SSR for `/keystatic`)
- **Netlify** (Astro adapter available)
- **Cloudflare Pages** (Astro adapter available)

For production Keystatic, the deployment platform must support server-side rendering for the `/keystatic` and `/api/keystatic` routes.

## Future Considerations

- **i18n**: The site is currently German-only. If multilingual support is needed, Astro's built-in i18n routing can be added.
- **Search**: A client-side search (e.g., Pagefind) could be added for myth discovery.
- **Structured data (JSON-LD)**: Could improve SEO for individual factsheets.
- **Data files**: The `data/` and `Sources/` folders from the old repo may be migrated in a future phase for D3 visualizations.
