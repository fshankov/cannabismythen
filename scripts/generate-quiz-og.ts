/**
 * generate-quiz-og.ts — Stage 8 of the quiz overhaul.
 *
 * Renders 1200×630 PNG OG share images for every published quiz module
 * + the Schnellcheck + a hub image for the index page. Output lands in
 * `public/og/quiz/{slug}.png`.
 *
 * Wired into `npm run build` via the `prebuild` script. Run manually
 * with `npm run og:generate`.
 *
 * FALLBACK: if Satori's font loader fails (e.g. on first install), the
 * script logs a warning and keeps any existing PNGs untouched. You can
 * drop hand-designed 1200×630 PNGs into `public/og/quiz/{slug}.png` and
 * the OG meta tags in `src/pages/quiz/[slug].astro` will pick them up.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// satori + resvg are devDeps; tsx is devDep. The script runs only at
// build time so users don't pay the install cost in production deploys.
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { createReader } from "@keystatic/core/reader";
// keystatic.config is at the repo root; use a relative import.
import keystaticConfig from "../keystatic.config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "public", "og", "quiz");

// ── Brand tokens (mirror DESIGN.md / global.css) ───────────────────
const COLORS = {
  bg: "#047857", // --color-richtig (forest green)
  bgDeep: "#1f4f3a",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.78)",
  divider: "rgba(255, 255, 255, 0.18)",
};

const WIDTH = 1200;
const HEIGHT = 630;

// ── Module emoji (parked) ───────────────────────────────────────────
// Original design placed a module emoji in the OG card's top-right.
// Inter has no emoji glyphs, so Satori renders "NO GLYPH" tofu unless
// a colour-emoji font (e.g. Noto Color Emoji ~3 MB) is loaded
// alongside Inter. Parked until someone wires that up; restore the
// emoji <div> in the JSX above and re-enable this map at the same time.
//
// const MODULE_EMOJI: Record<string, string> = {
//   "quiz-medizinischer-nutzen": "💊",
//   "quiz-risiken-koerper-psyche": "⚠️",
//   "quiz-stimmung-wahrnehmung": "🧠",
//   "quiz-soziales-bevoelkerung": "🏛️",
//   "quiz-gefaehrlichkeit": "⚖️",
//   "quiz-schnellcheck": "🎲",
// };

interface ModuleEntry {
  slug: string;
  title: string;
  subtitle: string;
  questionCount: number;
}

async function loadInterFont(): Promise<ArrayBuffer | null> {
  // Satori only parses .ttf / .otf / .woff — never .woff2. We load Inter
  // from @fontsource/inter which ships static .woff at each weight. The
  // CDN fallback fetches the same .woff from rsms.me when the local
  // package is missing. Both paths are .woff (NOT .woff2) — past
  // breakage came from feeding the variable-font .woff2 to Satori,
  // which fails with "Unsupported OpenType signature wOF2".
  try {
    const fontPath = path.join(
      REPO_ROOT,
      "node_modules",
      "@fontsource",
      "inter",
      "files",
      "inter-latin-700-normal.woff"
    );
    const data = await fs.readFile(fontPath);
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    );
  } catch (err) {
    console.warn(
      "[generate-quiz-og] Could not load @fontsource/inter; fetching from rsms.me as fallback.",
      err
    );
    try {
      const res = await fetch(
        "https://rsms.me/inter/font-files/Inter-Bold.woff"
      );
      if (!res.ok) throw new Error(`Inter CDN ${res.status}`);
      return await res.arrayBuffer();
    } catch (err2) {
      console.error(
        "[generate-quiz-og] Inter font fallback also failed; aborting.",
        err2
      );
      return null;
    }
  }
}

function moduleSvgTree(entry: ModuleEntry, fontFamily: string) {
  return {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bgDeep} 100%)`,
        color: COLORS.text,
        fontFamily,
      },
      children: [
        // Top row: brand label. The original design included a module
        // emoji on the right (see MODULE_EMOJI below). Satori needs a
        // colour-emoji font to render those glyphs and Inter alone
        // produces a "NO GLYPH" tofu, so the emoji is dropped for now.
        // Re-enable by loading e.g. Noto Color Emoji alongside Inter.
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              fontSize: "28px",
              color: COLORS.textMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
            },
            children: "Quiz",
          },
        },
        // Center: title + subtitle
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "78px",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  },
                  children: entry.title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "32px",
                    fontWeight: 400,
                    lineHeight: 1.4,
                    color: COLORS.textMuted,
                    maxWidth: "900px",
                  },
                  children: entry.subtitle,
                },
              },
            ],
          },
        },
        // Bottom row: question meta + wordmark
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${COLORS.divider}`,
              paddingTop: "24px",
              fontSize: "24px",
              color: COLORS.textMuted,
              fontWeight: 500,
            },
            children: [
              {
                type: "div",
                props: {
                  children: `${entry.questionCount} Aussagen · ca. ${Math.max(1, Math.round(entry.questionCount * 0.5))} Min.`,
                },
              },
              {
                type: "div",
                props: {
                  style: { fontWeight: 700, color: COLORS.text },
                  children: "cannabismythen.de",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function hubSvgTree(fontFamily: string) {
  return {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bgDeep} 100%)`,
        color: COLORS.text,
        fontFamily,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: "28px",
              color: COLORS.textMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
            },
            children: "Cannabis: Mythen & Evidenz",
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "84px",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  },
                  children: "Quiz",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "32px",
                    fontWeight: 400,
                    lineHeight: 1.4,
                    color: COLORS.textMuted,
                    maxWidth: "900px",
                  },
                  children:
                    "Sechs Quiz-Module mit den 42 verbreitetsten Cannabis-Mythen — wissenschaftlich eingeordnet.",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              borderTop: `1px solid ${COLORS.divider}`,
              paddingTop: "24px",
              fontSize: "24px",
              fontWeight: 700,
            },
            children: "cannabismythen.de",
          },
        },
      ],
    },
  };
}

async function renderToPng(
  tree: object,
  font: ArrayBuffer
): Promise<Buffer> {
  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: "Inter",
        data: font,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: font,
        weight: 700,
        style: "normal",
      },
      {
        name: "Inter",
        data: font,
        weight: 800,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    background: COLORS.bgDeep,
  });
  return resvg.render().asPng();
}

async function main() {
  const font = await loadInterFont();
  if (!font) {
    console.error(
      "[generate-quiz-og] No font available; aborting. Existing PNGs in public/og/quiz/ are untouched."
    );
    process.exit(0);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const reader = createReader(REPO_ROOT, keystaticConfig);
  const slugs = await reader.collections.quiz.list();

  const entries: ModuleEntry[] = [];
  for (const slug of slugs) {
    if (slug === "feedback-texte") continue;
    const e = await reader.collections.quiz.read(slug);
    if (!e || e.status !== "published") continue;
    const eAny = e as unknown as {
      title: string;
      questionCount?: number;
      summary?: string;
      questions?: unknown[];
    };
    entries.push({
      slug,
      title: eAny.title,
      subtitle:
        eAny.summary?.trim() ||
        (slug === "quiz-schnellcheck"
          ? "Sieben zufällige Aussagen aus allen Themen — jeder Besuch ist neu."
          : "Cannabis-Mythen — wissenschaftlich eingeordnet."),
      questionCount:
        eAny.questionCount ?? eAny.questions?.length ?? 7,
    });
  }

  console.log(
    `[generate-quiz-og] Rendering ${entries.length + 1} images to ${OUT_DIR}`
  );

  for (const entry of entries) {
    try {
      const png = await renderToPng(
        moduleSvgTree(entry, "Inter"),
        font
      );
      const out = path.join(OUT_DIR, `${entry.slug}.png`);
      await fs.writeFile(out, png);
      console.log(`  ✓ ${entry.slug}.png (${(png.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ ${entry.slug}.png — render failed`, err);
    }
  }

  // Hub image for /quiz/ index
  try {
    const png = await renderToPng(hubSvgTree("Inter"), font);
    const out = path.join(OUT_DIR, "index.png");
    await fs.writeFile(out, png);
    console.log(`  ✓ index.png (${(png.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error("  ✗ index.png — render failed", err);
  }

  console.log("[generate-quiz-og] Done.");
}

main().catch((err) => {
  console.error("[generate-quiz-og] Fatal:", err);
  process.exit(0); // exit 0 so the build doesn't fail on font issues
});
