// Type-check-only config for sandbox `astro check`. Skips the
// @astrojs/netlify adapter because its `astro:config:setup` hook
// rmdir's .netlify/v1/edge-functions/middleware which EPERMs in the
// Cowork Linux sandbox (the dir was created on macOS with restrictive
// perms). See CLAUDE.md "Sandbox-side `astro check`".
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";

export default defineConfig({
  integrations: [react(), markdoc()],
  output: "server",
});
