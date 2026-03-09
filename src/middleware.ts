import { defineMiddleware } from "astro:middleware";

const COOKIE_NAME = "site-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Never block: login page, keystatic CMS, API routes, static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/keystatic") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_") ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|css|js|woff2?)$/)
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
