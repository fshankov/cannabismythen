#!/usr/bin/env bash
# scripts/sync-tracker.sh
#
# Copies the Cowork-maintained CannabisMythen Feedback Tracker artifact
# into the repo at public/tracker/index.html. Astro/Netlify serves
# public/* as-is, so the tracker becomes available at
# https://cannabismythen.netlify.app/tracker/ after the next deploy.
# The site's SITE_PASSWORD edge gate also protects /tracker/ — only
# team members with the password can read it.
#
# Workflow:
#   1. Run this script:        ./scripts/sync-tracker.sh
#   2. Review the diff:        git diff public/tracker/
#   3. Commit + push:          git add public/tracker && git commit -m "tracker: sync $(date +%F)" && git push
#   4. Wait ~2 min for Netlify deploy.
#   5. Open: https://cannabismythen.netlify.app/tracker/
#
# Local preview: ./_local/render.sh opens both /fakten-karten/ AND
# /tracker/ tabs in the browser automatically.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$HOME/Documents/Claude/Artifacts/cannabismythen-feedback-tracker/index.html"
TARGET_DIR="$REPO_ROOT/public/tracker"
TARGET="$TARGET_DIR/index.html"

if [ ! -f "$SOURCE" ]; then
  echo "❌ Source not found: $SOURCE"
  echo "   The Cowork artifact may be missing. Open it in Cowork once to materialize the file, then re-run."
  exit 1
fi

mkdir -p "$TARGET_DIR"
cp "$SOURCE" "$TARGET"

# Stamp last-synced time into a small JSON file so the page can show it.
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$TARGET_DIR/synced-at.txt"

LINES=$(wc -l < "$TARGET")
SIZE=$(du -h "$TARGET" | awk '{print $1}')
echo "✓ Synced tracker → docs/tracker/index.html ($LINES lines, $SIZE)"
echo ""
echo "Next steps:"
echo "  git diff docs/tracker/"
echo "  git add docs/tracker && git commit -m \"tracker: sync $(date +%F)\" && git push"
