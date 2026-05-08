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
    return Response.redirect(
      new URL(`/daten-explorer/daten/${datenMatch[1]}/${search}`, context.url),
      301,
    );
  }
  const factsheetMatch = pathname.match(/^\/zahlen-und-fakten\/([^/]+)\/?$/);
  if (factsheetMatch) {
    return Response.redirect(
      new URL(`/daten-explorer/${factsheetMatch[1]}/${search}`, context.url),
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
    pathname.match(/\.(ico|png|svg|jpg|jpeg|gif|webp|css|js|mjs|woff2?|json|txt|xml)$/)
  ) {
    return next();
  }

  // If no SITE_PASSWORD is configured, the site is publicly accessible.
  // Set SITE_PASSWORD in your environment (Netlify dashboard or local .env)
  // to enable password protection.
  const password = import.meta.env.SITE_PASSWORD;
  if (!password) {
    return next();
  }

  // Check auth cookie
  const cookie = context.cookies.get(COOKIE_NAME);
  if (cookie?.value === password) {
    return next();
  }

  // Not authenticated — redirect to login
  return context.redirect("/login");
});
