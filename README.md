# Cannabis: Mythen & Evidenz

An evidence-based web application about cannabis myths, built on research from the **CaRM (Cannabis – Risiken und Mythen)** project by ISD Hamburg.

The site presents 42 scientifically evaluated cannabis myths across multiple formats: factsheets, FAQ, interactive quiz, scrollytelling narratives, and audience-specific dashboards.

## Tech Stack

- **[Astro](https://astro.build/)** — SSR framework, deployed via Netlify adapter
- **[Keystatic](https://keystatic.com/)** — Git-based CMS (GitHub mode)
- **[React](https://react.dev/)** — Interactive components (quiz, dashboard, scrollytelling)
- **[ECharts](https://echarts.apache.org/)** + **[D3.js](https://d3js.org/)** — Data visualizations
- **[Markdoc](https://markdoc.dev/)** — Content format
- **TypeScript** throughout

## Project Structure

```
cannabismythen/
├── src/
│   ├── pages/                        # Astro routes (public website)
│   │   ├── index.astro               # Homepage / scrollytelling entry
│   │   ├── login.astro               # Auth gate
│   │   ├── haeufige-fragen/          # FAQ section
│   │   ├── selbsttest/               # Interactive quiz
│   │   ├── startseite/               # Scrollytelling viewer
│   │   ├── ueber-uns/                # About / methodology
│   │   ├── zahlen-und-fakten/        # Myth factsheets + data dashboard
│   │   └── api/                      # Auth + Keystatic API routes
│   ├── components/
│   │   ├── dashboard/                # Mythen explorer (charts, sidebar, panels)
│   │   ├── quiz/                     # Quiz player, cards, result screen
│   │   ├── scrollytelling/           # Scrollytelling viewer
│   │   └── shared/                   # Shared UI components (FactsheetPanel)
│   ├── content/                      # Keystatic-managed content collections
│   │   ├── zahlen-und-fakten/        # 42 myth factsheets (m01–m42)
│   │   ├── zahlen-und-fakten-dashboard/ # 6 audience-specific indicator pages
│   │   ├── haeufige-fragen/          # 8 thematic FAQ pages
│   │   ├── selbsttest/               # 4 quiz modules + feedback texts
│   │   ├── startseite/               # Scrollytelling content + chart specs
│   │   ├── ueber-uns/                # 4 project / methodology pages
│   │   ├── meta/                     # Internal reference entries (glossary, tagging, etc.)
│   │   └── changelog/                # Release notes
│   ├── layouts/
│   │   └── BaseLayout.astro          # Base HTML shell
│   ├── lib/
│   │   ├── content.ts                # Content loading utilities
│   │   └── dashboard/                # Dashboard data, types, colors, URL state
│   ├── styles/                       # Global CSS + section-specific styles
│   └── middleware.ts                 # Auth middleware (Netlify edge)
├── public/
│   ├── data/carm-data.json           # Pre-processed CaRM dataset
│   └── favicon.svg
├── editorial/                        # Editorial notes placeholder (not public)
├── keystatic.config.ts               # CMS collection schemas
├── astro.config.mjs                  # Astro + Netlify configuration
├── markdoc.config.mjs                # Markdoc tag definitions
├── netlify.toml                      # Netlify build settings
└── package.json
```

> `_local/` — local-only reference materials (research docs, design specs, AI workflow guides). Gitignored, not part of the build.

## Language

- **Website content:** German
- **Code, comments, commit messages:** English

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |

## License

Content based on the CaRM research project by ISD Hamburg. All rights reserved.
