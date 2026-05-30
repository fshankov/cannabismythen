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

// ── Module emoji + title fallback (matches index.astro) ────────────
const MODULE_EMOJI: Record<string, string> = {
  "quiz-medizinischer-nutzen": "💊",
  "quiz-risiken-koerper-psyche": "⚠️",
  "quiz-stimmung-wahrnehmung": "🧠",
  "quiz-soziales-bevoelkerung": "🏛️",
  "quiz-gefaehrlichkeit": "⚖️",
  "quiz-schnellcheck": "🎲",
};

interface ModuleEntry {
  slug: string;
  title: string;
  subtitle: string;
  questionCount: number;
}

type FontWeight = 400 | 600 | 700 | 800;
const FONT_WEIGHTS: FontWeight[] = [400, 600, 700, 800];
const FONT_CACHE_DIR = path.join(
  REPO_ROOT,
  "node_modules",
  ".cache",
  "og-fonts"
);

interface LoadedFont {
  weight: FontWeight;
  data: ArrayBuffer;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;
}

/**
 * Load Inter for Satori.
 *
 * IMPORTANT: Satori's OpenType parser (@shuding/opentype.js) supports
 * TTF / OTF / WOFF1 but NOT WOFF2. `@fontsource-variable/inter` only ships
 * `.woff2`, which is why the previous loader failed with "Unsupported
 * OpenType signature wOF2" and produced zero OG images. We instead fetch
 * the `.woff` (WOFF1) builds of `@fontsource/inter` from jsDelivr for the
 * weights the cards use (400/600/700/800), caching each under
 * `node_modules/.cache/og-fonts/` so repeat runs (and offline builds after
 * a first online run) don't need the network. A graceful per-weight
 * warning keeps the build alive if a weight can't be fetched — see the
 * FALLBACK note at the top of this file.
 */
async function loadInterFonts(): Promise<LoadedFont[] | null> {
  await fs.mkdir(FONT_CACHE_DIR, { recursive: true }).catch(() => {});
  const fonts: LoadedFont[] = [];

  for (const weight of FONT_WEIGHTS) {
    const file = `inter-latin-${weight}-normal.woff`;
    const cachePath = path.join(FONT_CACHE_DIR, file);

    // 1) Local cache (offline path after the first successful fetch).
    try {
      const cached = await fs.readFile(cachePath);
      if (cached.byteLength > 0) {
        fonts.push({ weight, data: toArrayBuffer(cached) });
        continue;
      }
    } catch {
      /* not cached yet — fall through to the CDN fetch */
    }

    // 2) Fetch the WOFF1 build from jsDelivr (write-through cache).
    try {
      const url = `https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.0/files/${file}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Inter ${weight} → HTTP ${res.status}`);
      const ab = await res.arrayBuffer();
      await fs.writeFile(cachePath, Buffer.from(ab)).catch(() => {});
      fonts.push({ weight, data: ab });
    } catch (err) {
      console.warn(`[generate-quiz-og] Inter ${weight} unavailable:`, err);
    }
  }

  if (fonts.length === 0) {
    console.error(
      "[generate-quiz-og] No Inter weights could be loaded; aborting. Existing PNGs in public/og/quiz/ are untouched."
    );
    return null;
  }
  return fonts;
}

// ── Emoji rendering for Satori ─────────────────────────────────────
// Satori has no emoji font, so a bare emoji renders as a "NO GLYPH" tofu
// box. The documented fix is `loadAdditionalAsset`: when Satori hits an
// emoji grapheme it asks us for an image. We map the grapheme to its
// Twemoji SVG (jdecked fork — the maintained Twemoji) and return it as a
// data URI, cached on disk so repeat/offline runs don't re-fetch.
const EMOJI_CACHE_DIR = path.join(
  REPO_ROOT,
  "node_modules",
  ".cache",
  "og-emoji"
);

/** Twemoji filenames drop the FE0F variation selector — strip it so e.g.
 *  ⚠️ (26a0 fe0f) resolves to `26a0.svg`. */
function emojiCodepoints(segment: string): string {
  return [...segment]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-");
}

async function loadEmojiDataUri(segment: string): Promise<string | null> {
  const cp = emojiCodepoints(segment);
  if (!cp) return null;
  await fs.mkdir(EMOJI_CACHE_DIR, { recursive: true }).catch(() => {});
  const cachePath = path.join(EMOJI_CACHE_DIR, `${cp}.svg`);

  let svg: string | null = null;
  try {
    const cached = await fs.readFile(cachePath, "utf8");
    if (cached) svg = cached;
  } catch {
    /* not cached yet */
  }

  if (!svg) {
    try {
      const res = await fetch(
        `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${cp}.svg`
      );
      if (!res.ok) throw new Error(`twemoji ${cp} → HTTP ${res.status}`);
      svg = await res.text();
      await fs.writeFile(cachePath, svg).catch(() => {});
    } catch (err) {
      console.warn(
        `[generate-quiz-og] emoji ${segment} (${cp}) unavailable:`,
        err
      );
      return null;
    }
  }

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
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
        // Top row: emoji + brand
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "28px",
              color: COLORS.textMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
            },
            children: [
              { type: "div", props: { children: "Quiz" } },
              {
                type: "div",
                props: {
                  style: { fontSize: "80px" },
                  children: MODULE_EMOJI[entry.slug] ?? "📋",
                },
              },
            ],
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
  fonts: LoadedFont[]
): Promise<Buffer> {
  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: fonts.map((f) => ({
      name: "Inter",
      data: f.data,
      weight: f.weight,
      style: "normal" as const,
    })),
    // Render emoji as Twemoji SVGs (Satori has no emoji font). Empty
    // string on failure → nothing drawn, never a "NO GLYPH" tofu box.
    loadAdditionalAsset: async (code: string, segment: string) => {
      if (code !== "emoji") return code;
      const uri = await loadEmojiDataUri(segment);
      return uri ?? "";
    },
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    background: COLORS.bgDeep,
  });
  return resvg.render().asPng();
}

async function main() {
  const fonts = await loadInterFonts();
  if (!fonts) {
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
        fonts
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
    const png = await renderToPng(hubSvgTree("Inter"), fonts);
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
