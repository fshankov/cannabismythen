import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), markdoc(), keystatic()],
  output: "server",
  // Default adapter for Node/self-hosted.
  // Swap for @astrojs/vercel or @astrojs/netlify when deploying.
  adapter: vercel(),
});
