// SANDBOX-ONLY Astro config — drops the netlify integration so the dev
// server works in environments where the `.netlify/` directory is locked
// (CI / agent sandboxes). DO NOT USE in production.
//
// Run with: `npx astro dev --config astro.config.dev.mjs`
//
// Safe to delete this file — it's not referenced by any build or deploy
// step. It exists only so contributors without write access to .netlify/
// can still preview locally.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";

export default defineConfig({
  integrations: [react(), markdoc(), keystatic()],
  output: "static",
  cacheDir: "/tmp/astro-sandbox-cache",
  vite: {
    cacheDir: "/tmp/vite-sandbox-cache",
    optimizeDeps: {
      include: ["echarts", "echarts-for-react"],
    },
  },
});
