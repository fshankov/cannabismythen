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
  // Legacy redirects:
  //  - FAQ theme-based slugs → audience-first restructure (2026-04-30).
  //  - Selbsttest section renamed to Quiz (2026-04-30).
  redirects: {
    // Selbsttest → Quiz
    "/selbsttest": "/quiz",
    "/selbsttest/": "/quiz/",
    "/selbsttest/[slug]": "/quiz/[slug]",
    "/selbsttest/[slug]/": "/quiz/[slug]/",

    // FAQ legacy slugs
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
