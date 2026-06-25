import { defineMiddleware } from "astro:middleware";

const COOKIE_NAME = "site-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  // During build-time prerendering, there is no real request context
  // (no cookies, no headers). Skip auth — the Edge Function handles
  // auth at request time when edgeMiddleware is enabled.
  if (!context.request.headers.get("host")) {
    return next();
  }

  const { pathname, search } = context.url;

  /**
   * Stage 5 of the Daten-Explorer refactor — `/zahlen-und-fakten/*`
   * was renamed to `/daten-explorer/*`. We 301 the old paths BEFORE
   * the SITE_PASSWORD gate so external backlinks resolve even for
   * unauthenticated traffic. Three patterns:
   *   1. bare `/zahlen-und-fakten` (with or without trailing slash)
   *   2. legacy dashboard pages: `/zahlen-und-fakten/daten/{slug}`
   *      → collapse to the new explorer index
   *   3. factsheet detail: `/zahlen-und-fakten/{slug}` → `/daten-explorer/{slug}`
   * Order matters: the bare match must run FIRST so the factsheet
   * regex doesn't try to redirect `''` as a slug.
   */
  if (pathname === "/zahlen-und-fakten" || pathname === "/zahlen-und-fakten/") {
    return Response.redirect(new URL(`/daten-explorer/${search}`, context.url), 301);
  }
  const datenMatch = pathname.match(/^\/zahlen-und-fakten\/daten\/([^/]+)\/?$/);
  if (datenMatch) {
    return Response.redirect(new URL(`/daten-explorer/${search}`, context.url), 301);
  }
  // The legacy /daten-explorer/daten/{slug} indicator pages were removed
  // (2026-06-25 cleanup) — their content lives in the interactive explorer.
  // Collapse any leftover/bookmarked links to the explorer index.
  if (/^\/daten-explorer\/daten\//.test(pathname)) {
    return Response.redirect(new URL(`/daten-explorer/${search}`, context.url), 301);
  }
  const factsheetMatch = pathname.match(/^\/zahlen-und-fakten\/([^/]+)\/?$/);
  if (factsheetMatch) {
    return Response.redirect(
      new URL(`/daten-explorer/${factsheetMatch[1]}/${search}`, context.url),
      301,
    );
  }

  /**
   * Travel pipeline Stage 5 (2026-05-23) — individual myth pages at
   * `/daten-explorer/m{NN}-{slug}/` are retired. The popup inside the
   * dashboard is now the source of truth for myth content. Redirect old
   * external links to the explorer with a `?mythos={N}` param that
   * opens the popup automatically (see url-state.ts).
   * Slug pattern: `m\d+` optionally followed by a `-…` kebab tail.
   * Mirror rule also lives in netlify.toml.
   */
  const mythPageMatch = pathname.match(/^\/daten-explorer\/m(\d+)(?:-[a-z0-9-]+)?\/?$/i);
  if (mythPageMatch) {
    const id = String(parseInt(mythPageMatch[1], 10));
    return Response.redirect(
      new URL(`/daten-explorer/?mythos=${id}`, context.url),
      301,
    );
  }

  /**
   * Session 3a of 2026-05 — `/haeufige-fragen/*` renamed to
   * `/meine-interessen/*` per BugHerd #6 (Fedor 2026-05-07). Mirror
   * rules also live in `netlify.toml` for paths that bypass the edge
   * middleware. Order matters: the bare match runs first so the
   * splat regex doesn't try to redirect `''` as a slug.
   */
  if (pathname === "/haeufige-fragen" || pathname === "/haeufige-fragen/") {
    return Response.redirect(new URL(`/meine-interessen/${search}`, context.url), 301);
  }
  const fragenFrageMatch = pathname.match(/^\/haeufige-fragen\/frage\/([^/]+)\/?$/);
  if (fragenFrageMatch) {
    return Response.redirect(
      new URL(`/meine-interessen/frage/${fragenFrageMatch[1]}/${search}`, context.url),
      301,
    );
  }
  const fragenAudienceMatch = pathname.match(/^\/haeufige-fragen\/([^/]+)\/?$/);
  if (fragenAudienceMatch) {
    return Response.redirect(
      new URL(`/meine-interessen/${fragenAudienceMatch[1]}/${search}`, context.url),
      301,
    );
  }

  /**
   * 2026-05-14 — `/ueber-uns/` renamed to `/projekt/` so the URL matches
   * the nav label "Über das Projekt" (and the mobile-tab-bar short label
   * "Projekt"). 301 the bare path AND the four legacy sub-paths
   * (projekt, methodik, team, klassifikation) from the 2026-05-11
   * scrollytelling consolidation — they all collapse to /projekt/.
   * Order matters: the legacy sub-path regex runs FIRST so the bare
   * match doesn't try to redirect `/ueber-uns/projekt/` to `/projekt/`
   * via a single-slash strip.
   * Mirror rules also live in `netlify.toml`.
   */
  const ueberUnsLegacy = pathname.match(
    /^\/ueber-uns\/(projekt|methodik|team|klassifikation)\/?$/,
  );
  if (ueberUnsLegacy) {
    return Response.redirect(new URL(`/projekt/${search}`, context.url), 301);
  }
  if (pathname === "/ueber-uns" || pathname === "/ueber-uns/") {
    return Response.redirect(new URL(`/projekt/${search}`, context.url), 301);
  }

  /**
   * Session 1 of 2026-05 — quiz module slug renames per the
   * Kategorisierung_2026 05 06 docx. Four modules got longer slugs that
   * match the canonical 5-cat taxonomy. quiz-gefaehrlichkeit and
   * quiz-schnellcheck are unchanged. Mirror rules also live in
   * `netlify.toml` for paths that bypass the edge middleware.
   */
  const QUIZ_SLUG_RENAMES: Record<string, string> = {
    "quiz-medizin": "quiz-medizinischer-nutzen",
    "quiz-risiken": "quiz-risiken-koerper-psyche",
    "quiz-stimmung": "quiz-stimmung-wahrnehmung",
    "quiz-gesellschaft": "quiz-soziales-bevoelkerung",
  };
  const quizMatch = pathname.match(/^\/quiz\/([^/]+)(\/.*)?$/);
  if (quizMatch) {
    const oldSlug = quizMatch[1];
    const trailing = quizMatch[2] ?? "/";
    const newSlug = QUIZ_SLUG_RENAMES[oldSlug];
    if (newSlug) {
      return Response.redirect(
        new URL(`/quiz/${newSlug}${trailing}${search}`, context.url),
        301,
      );
    }
  }

  // Never block: login page, keystatic CMS, API routes, static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/keystatic") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_") ||
    pathname.startsWith("/data/") ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|gif|webp|css|js|mjs|woff2?|json|txt|xml|pdf)$/)
  ) {
    return next();
  }

  // If no SITE_PASSWORD is configured, the site is publicly accessible.
  // Set SITE_PASSWORD in your environment (Netlify dashboard or local .env)
  // to enable password protection.
  //
  // Note: we use a tiny indirection (the `passwordEnv` const) so Vite's
  // build-time replacement of `import.meta.env.SITE_PASSWORD` doesn't
  // dead-code-eliminate the "no password configured" branch. Without
  // this indirection, when SITE_PASSWORD is set at build time, the
  // bundle becomes a literal that short-circuits the early return and
  // leaves no graceful path if the env later resolves differently.
  const passwordEnv = import.meta.env.SITE_PASSWORD;
  const password = typeof passwordEnv === "string" ? passwordEnv : "";
  if (!password) {
    return next();
  }

  // Check auth cookie
  const cookie = context.cookies.get(COOKIE_NAME);
  if (cookie?.value === password) {
    return next();
  }

  // Not authenticated — redirect to login. We use `Response.redirect`
  // here instead of `context.redirect` so the function behaves
  // identically to the dozen other redirects above and doesn't depend
  // on the Astro context's `redirect` helper being present in every
  // edge runtime (Netlify Edge Functions, Vercel Edge, etc.).
  return Response.redirect(new URL("/login", context.url), 302);
});
