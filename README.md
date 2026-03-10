# Cannabis: Mythen & Evidenz

An evidence-based web application about cannabis myths, built on research from the **CaRM (Cannabis – Risiken und Mythen)** project by ISD Hamburg.

The site presents 42 scientifically evaluated cannabis myths across multiple formats: factsheets, FAQ, interactive quiz, scrollytelling narratives, and audience-specific dashboards.

## Tech Stack

- **[Astro](https://astro.build/)** — Static site framework
- **[Keystatic](https://keystatic.com/)** — Git-based CMS (GitHub mode)
- **[React](https://react.dev/)** — Interactive components (quiz, dashboard, scrollytelling)
- **[D3.js](https://d3js.org/)** — Data visualizations
- **[Markdoc](https://markdoc.dev/)** — Content format
- **TypeScript** throughout

## Project Structure

```
cannabis-science-web/
├── src/
│   ├── pages/              # Astro routes (public website)
│   ├── components/         # React components (quiz, dashboard, scrollytelling)
│   ├── content/            # Keystatic-managed content collections
│   │   ├── factsheets/     # 36 entries covering 42 myths
│   │   ├── faq/            # 7 thematic FAQ pages
│   │   ├── quiz/           # 5 quiz modules + feedback texts
│   │   ├── scrollytelling/ # 3 narrative versions + chart specs
│   │   ├── dashboard/      # 6 audience-specific indicator pages
│   │   ├── about/          # 4 project info pages
│   │   └── meta/           # 10 internal reference entries
│   ├── layouts/            # Base HTML layout
│   └── lib/                # Utilities, D3 visualizations
├── docs/                   # Architecture & setup documentation
├── editorial/              # Editorial notes (not public)
├── planning/               # Project planning (not public)
├── research/               # Research materials (not public)
├── keystatic.config.ts     # CMS collection schemas
├── astro.config.mjs        # Astro configuration
└── package.json
```


## Documentation

- [Architecture](docs/architecture.md) — System design, technology choices, content model
- [Content Model](docs/content-model.md) — Collection schemas, fields, and workflow
- [Editor Guide](docs/editor-guide.md) — How to use Keystatic, GitHub setup, collaborator workflow
- [Migration Notes](docs/migration-notes.md) — How wiki content was migrated to this repo

## Language

- **Website content:** German
- **Code, documentation, commit messages:** English

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |

## License

Content based on the CaRM research project by ISD Hamburg. All rights reserved.
