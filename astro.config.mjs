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
    edgeMiddleware: true,
  }),
  // Legacy theme-based FAQ slugs → audience-first restructure.
  // The eight legacy `src/content/haeufige-fragen/*.mdoc` files were dropped
  // in favour of the docx-driven faq/questions/ collection on 2026-04-30.
  redirects: {
    "/haeufige-fragen/abhaengigkeit-risiko":
      "/haeufige-fragen/konsumierende/#faq-kann-cannabis-abhaengig-machen",
    "/haeufige-fragen/abhaengigkeit-risiko/":
      "/haeufige-fragen/konsumierende/#faq-kann-cannabis-abhaengig-machen",
    "/haeufige-fragen/empfohlene-weitere-fragen": "/haeufige-fragen/",
    "/haeufige-fragen/empfohlene-weitere-fragen/": "/haeufige-fragen/",
    "/haeufige-fragen/gesundheit": "/haeufige-fragen/eltern/",
    "/haeufige-fragen/gesundheit/": "/haeufige-fragen/eltern/",
    "/haeufige-fragen/haralds-fragen": "/haeufige-fragen/",
    "/haeufige-fragen/haralds-fragen/": "/haeufige-fragen/",
    "/haeufige-fragen/jugend-eltern": "/haeufige-fragen/eltern/",
    "/haeufige-fragen/jugend-eltern/": "/haeufige-fragen/eltern/",
    "/haeufige-fragen/medizin": "/haeufige-fragen/konsumierende/",
    "/haeufige-fragen/medizin/": "/haeufige-fragen/konsumierende/",
    "/haeufige-fragen/psyche-kognition":
      "/haeufige-fragen/eltern/#faq-kann-cannabis-psychosen-ausloesen",
    "/haeufige-fragen/psyche-kognition/":
      "/haeufige-fragen/eltern/#faq-kann-cannabis-psychosen-ausloesen",
    "/haeufige-fragen/sozial-gesellschaft": "/haeufige-fragen/jugendliche/",
    "/haeufige-fragen/sozial-gesellschaft/": "/haeufige-fragen/jugendliche/",
  },
  vite: {
    optimizeDeps: {
      include: ["echarts", "echarts-for-react"],
    },
  },
});
