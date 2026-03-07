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

  // Check auth cookie
  const cookie = context.cookies.get(COOKIE_NAME);
  const password = import.meta.env.SITE_PASSWORD ?? "Time-Turner";

  if (cookie?.value === password) {
    return next();
  }

  // Not authenticated — redirect to login
  return context.redirect("/login");
});
