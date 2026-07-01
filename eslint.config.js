// Report-only lint config (Stage 1 safety net).
// NOT wired into `npm run build` — run manually via `npm run lint`.
// Scope is deliberately narrow: eslint-plugin-astro recommended (for .astro)
// + react-hooks rules (for React islands). The typescript-eslint parser is
// used only to PARSE .ts/.tsx so react-hooks can see them — the full
// typescript-eslint ruleset is intentionally NOT enabled.
import astro from "eslint-plugin-astro";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/",
      ".netlify/",
      ".astro/",
      "node_modules/",
      "_local/",
      "public/",
      "scripts/",
      "src/content/**",
      "**/*-snapshots/**",
      "keystatic.config.ts",
    ],
  },
  ...astro.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
