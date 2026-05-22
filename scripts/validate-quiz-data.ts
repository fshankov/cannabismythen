/**
 * validate-quiz-data — one-shot drift check between quizData.ts and
 * the upstream CaRM dataset. Stage D PR4 (2026-05-22).
 *
 * Why this exists:
 *   `src/components/quiz/quizData.ts` carries hand-maintained
 *   populationCorrectPct values for the 40 quiz myths. These values
 *   are derived from `public/data/carm-data.json` —
 *   `metrics[].correctness` rows where `group_id === "adults"` (the
 *   Erwachsene 18–70 sample). If someone hand-edits quizData.ts
 *   without re-pulling, the runtime score comparison silently drifts
 *   from the upstream truth. This script catches that.
 *
 * Algorithm:
 *   1. Read public/data/carm-data.json.
 *   2. Build mythId (mNN) → adults.correctness lookup.
 *   3. For each entry in ALL_MYTHS_BY_ID, compare populationCorrectPct
 *      against the upstream value.
 *   4. Pretty-print a table. Mark drifts > 0.2 % as ✗; values within
 *      noise as ✓.
 *   5. Exit non-zero if any drift > 0.2 %.
 *
 * Run via `npm run validate:quiz-data` (script entry in package.json).
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_MYTHS_BY_ID } from "../src/components/quiz/quizData";

const TOLERANCE_PCT = 0.2;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const carmDataPath = join(repoRoot, "public", "data", "carm-data.json");

type CarmMetric = {
  myth_id: number;
  group_id: string;
  correctness: number | null;
};

type CarmFile = {
  metrics: CarmMetric[];
};

function loadCarm(): CarmFile {
  const raw = readFileSync(carmDataPath, "utf8");
  return JSON.parse(raw) as CarmFile;
}

/** Convert the numeric `myth_id` (1..42) in carm-data.json to the
 *  string mythId (`m01`..`m42`) used in quizData.ts. */
function mythIdFor(num: number): string {
  return `m${String(num).padStart(2, "0")}`;
}

function main(): void {
  const carm = loadCarm();

  const upstreamByMythId = new Map<string, number>();
  for (const row of carm.metrics) {
    if (row.group_id !== "adults") continue;
    if (row.correctness === null) continue;
    upstreamByMythId.set(mythIdFor(row.myth_id), row.correctness);
  }

  const rows: Array<{
    mythId: string;
    code: number;
    upstream: number | null;
    drift: number | null;
    ok: boolean;
  }> = [];

  for (const [mythId, myth] of Object.entries(ALL_MYTHS_BY_ID)) {
    const upstream = upstreamByMythId.get(mythId) ?? null;
    if (upstream === null) {
      rows.push({
        mythId,
        code: myth.populationCorrectPct,
        upstream: null,
        drift: null,
        ok: false,
      });
      continue;
    }
    const drift = myth.populationCorrectPct - upstream;
    const ok = Math.abs(drift) <= TOLERANCE_PCT;
    rows.push({
      mythId,
      code: myth.populationCorrectPct,
      upstream,
      drift,
      ok,
    });
  }

  rows.sort((a, b) => a.mythId.localeCompare(b.mythId));

  const headerCols = ["myth", "code", "upstream", "drift", ""];
  const colWidths = [6, 8, 10, 9, 3];
  const fmt = (n: number | null, w: number, dp = 2): string => {
    const s = n === null ? "—" : n.toFixed(dp);
    return s.padStart(w);
  };

  let driftCount = 0;
  let missingCount = 0;

  console.log("\nquizData.ts populationCorrectPct vs. carm-data.json (group=adults):\n");
  console.log(
    headerCols.map((h, i) => h.padStart(colWidths[i])).join("  "),
  );
  console.log("  ".padEnd(colWidths.reduce((a, b) => a + b, 0) + 8, "─"));

  for (const r of rows) {
    const status = r.upstream === null ? "?" : r.ok ? "✓" : "✗";
    if (r.upstream === null) missingCount++;
    else if (!r.ok) driftCount++;
    console.log(
      [
        r.mythId.padStart(colWidths[0]),
        fmt(r.code, colWidths[1]),
        fmt(r.upstream, colWidths[2]),
        fmt(r.drift, colWidths[3]),
        status.padStart(colWidths[4]),
      ].join("  "),
    );
  }

  console.log("");
  if (driftCount > 0) {
    console.log(
      `✗ ${driftCount} myth(s) drift more than ±${TOLERANCE_PCT} % from carm-data.json. Investigate.`,
    );
  }
  if (missingCount > 0) {
    console.log(
      `? ${missingCount} myth(s) have no adults-group correctness in carm-data.json (likely keine_aussage; verify).`,
    );
  }
  if (driftCount === 0 && missingCount === 0) {
    console.log("✓ All quizData.ts populationCorrectPct values match carm-data.json within tolerance.");
  }

  process.exit(driftCount > 0 ? 1 : 0);
}

main();
