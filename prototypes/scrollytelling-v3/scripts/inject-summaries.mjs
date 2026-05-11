#!/usr/bin/env node
// Reads cardSummary + classificationLabel out of the production .mdoc files
// for myths m01..m42 and writes them to public/myth-summaries.json so the
// scrollytelling-v3 prototype can show factsheet hover-cards in step 4.
//
// Run: node scripts/inject-summaries.mjs (from prototypes/scrollytelling-v3/)

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(ROOT, '..', '..');
const MDOC_DIR = join(REPO_ROOT, 'src', 'content', 'zahlen-und-fakten');
const OUT_PATH = join(ROOT, 'public', 'myth-summaries.json');

function parseFrontmatter(src) {
  const match = src.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const out = {};
  const lines = yaml.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    let val = m[2];
    if (val === '>-' || val === '>') {
      // Folded block scalar: collect indented lines until next top-level key.
      const buf = [];
      i += 1;
      while (i < lines.length && /^\s/.test(lines[i])) {
        buf.push(lines[i].trim());
        i += 1;
      }
      out[key] = buf.join(' ').trim();
      continue;
    }
    if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    } else if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    out[key] = val;
    i += 1;
  }
  return out;
}

async function main() {
  const files = (await readdir(MDOC_DIR)).filter((f) => /^m\d{2}-.*\.mdoc$/.test(f));
  files.sort();
  const summaries = {};
  for (const file of files) {
    const src = await readFile(join(MDOC_DIR, file), 'utf8');
    const fm = parseFrontmatter(src);
    const idMatch = file.match(/^m(\d{2})/);
    if (!idMatch) continue;
    const id = parseInt(idMatch[1], 10);
    if (!fm.cardSummary) {
      console.warn(`[inject-summaries] ${file}: no cardSummary, skipping`);
      continue;
    }
    summaries[id] = {
      summary_de: fm.cardSummary,
      classification_label: fm.classificationLabel ?? '',
    };
  }
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(summaries, null, 2), 'utf8');
  console.log(`[inject-summaries] wrote ${Object.keys(summaries).length} summaries to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
