import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), markdoc(), keystatic()],
  output: "server",
  adapter: netlify({
    includeFiles: ["./src/content/**"],
    // edgeMiddleware: true, // disabled — edge middleware can intercept the
    // /api/keystatic/github/oauth/callback route before the SSR function
    // handles it, causing Bad Request errors for new users during OAuth.
    // Re-enable only if you specifically need edge-based auth middleware.
  }),
  vite: {
    optimizeDeps: {
      include: ["echarts", "echarts-for-react"],
    },
  },
});
