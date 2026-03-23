# Cannabis Mythen & Evidenz — Project Rules

## Project Overview

German-language website presenting evidence-based cannabis health information. The site classifies 42 common myths about cannabis using scientific research data from the CaRM study. Target audiences: adults, minors, consumers, young adults, parents.

**Stack:** Astro 6 · React 18 · Keystatic CMS · Markdoc · TypeScript · D3.js · ECharts · Netlify

## Architecture

- **Rendering:** `output: "server"` with Netlify edge middleware. Pages prerendered at build time via `getStaticPaths()`, with selective SSR for Keystatic admin.
- **React Islands:** Interactive components use `client:load` — only for quiz player, dashboard/MythenExplorer, and scrollytelling viewer. Keep static content in `.astro` files.
- **Keystatic:** Git-based CMS with GitHub storage (`fshankov/cannabismythen`), branch prefix `content/`. Admin UI at `/keystatic`.
- **Auth:** Cookie-based password protection (`site-auth` cookie, env `SITE_PASSWORD`). Bypass routes: `/login`, `/keystatic`, `/api/*`, `/_*`, `/data/*`, static assets.
- **Analytics:** Matomo in cookieless mode (no GDPR banner needed).

## TypeScript Path Aliases

```
@/*           → src/*
@components/* → src/components/*
@lib/*        → src/lib/*
@content/*    → src/content/*
@layouts/*    → src/layouts/*
```

## Content System

All content is managed via **Keystatic** collections defined in `keystatic.config.ts`. Content is written in **Markdoc** (`.mdoc` files) and stored in `src/content/`.

### Collections

| Collection | Path | Route | Purpose |
|---|---|---|---|
| `zahlenUndFakten` | `src/content/zahlen-und-fakten/` | `/zahlen-und-fakten/[slug]` | 36 factsheets covering myths m01–m42 |
| `zahlenUndFaktenDashboard` | `src/content/zahlen-und-fakten-dashboard/` | Dashboard data | Audience-segmented indicators |
| `haeufigeFragen` | `src/content/haeufige-fragen/` | `/haeufige-fragen/[slug]` | FAQ grouped by theme |
| `selbsttest` | `src/content/selbsttest/` | `/selbsttest/[slug]` | Interactive quizzes (4 themes) |
| `startseite` | `src/content/startseite/` | `/startseite/[slug]` | Scrollytelling narratives |
| `ueberUns` | `src/content/ueber-uns/` | `/ueber-uns/[slug]` | About pages |
| `meta` | `src/content/meta/` | Internal only | Reference docs |
| `changelog` | `src/content/changelog/` | Internal only | Project activity log |

### Content Workflow

- Status field: `draft` → `published`. Only `published` entries render on the public site.
- **CRITICAL:** Always strip `internalNotes` before rendering using `stripInternal()` from `src/lib/content.ts`.
- Shared field helpers (`statusField`, `metaFields`) are defined at the top of `keystatic.config.ts` — reuse them for new collections.
- Myth IDs follow pattern `m01`–`m42`. Some myths share factsheets: m31/m32, m36/m37, m41/m42.

### Content Utilities (`src/lib/content.ts`)

```typescript
reader                  // Keystatic server-side reader (use in .astro pages, NOT client components)
filterPublished(entries) // Filter to status === "published"
stripInternal(entry)     // Remove internalNotes before rendering
getPublishedEntries(col) // Load, filter, and strip in one call
```

## File Conventions

```
src/pages/                    # Astro routes
  ├── [section]/index.astro   # Section index pages
  └── [section]/[slug].astro  # Dynamic routes via getStaticPaths()
src/components/{feature}/     # React components grouped by feature
  ├── dashboard/              # MythenExplorer, charts, sidebar
  ├── quiz/                   # QuizPlayer, ResultScreen, ProgressBar
  └── scrollytelling/         # ScrollytellingViewer
src/content/{collection}/     # Keystatic .mdoc content files
src/lib/                      # Utilities and helpers
  ├── content.ts              # Keystatic reader utilities
  └── dashboard/              # Dashboard types, colors, translations
src/styles/                   # CSS (global.css, dashboard.css, quiz.css)
src/layouts/BaseLayout.astro  # Main HTML layout with nav, header, footer
```

## Development

```bash
npm run dev      # Dev server at http://localhost:4321
npm run build    # astro check && astro build
npm run preview  # Preview production build
```

- Keystatic admin: `http://localhost:4321/keystatic`
- Dashboard data: `/public/data/carm-data.json`

## Important Rules

1. **All user-facing text must be in German.**
2. **Never expose `internalNotes`** in rendered output — always use `stripInternal()`.
3. **Use `astro add`** for new integrations, not manual npm install + config.
4. **Verify Astro APIs** against current docs — use the `astro-docs` MCP server for up-to-date documentation.
5. **React islands only where needed** — quiz, dashboard, scrollytelling. Static content stays in `.astro`.
6. **Classification values:** `richtig`, `eher_richtig`, `eher_falsch`, `falsch`, `keine_aussage`.
7. **Audience segments:** `erwachsene`, `minderjaehrige`, `konsumierende`, `junge_erwachsene`, `eltern`.
