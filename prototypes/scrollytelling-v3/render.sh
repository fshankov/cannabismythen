#!/usr/bin/env bash
#
# render.sh — local dev runner for the scrollytelling-v3 prototype
#
# What it does:
#   1. cd into this prototype's directory
#   2. Warn if port 4327 is already in use
#   3. npm install (idempotent)
#   4. npm run dev (Vite, port 4327, with HMR — edits refresh the browser automatically)
#   5. Open http://localhost:4327/ as soon as Vite prints its ready URL
#
# Run from any Terminal:
#     ./render.sh
#
# If you see "Permission denied", run `chmod +x render.sh` once and retry.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "▶ Working in: $SCRIPT_DIR"

# Warn if port 4327 is already in use (Vite will shift to 4328+ instead).
if command -v lsof >/dev/null 2>&1 && lsof -iTCP:4327 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "⚠  Port 4327 is already in use — Vite will shift to 4328 (or higher)."
  echo "   Stop the other process first if you want to land on :4327."
fi

# Install (no-op when lockfile is already satisfied).
echo "▶ npm install …"
npm install

# Capture Vite output so we can detect the ready URL and open the browser.
LOG="$(mktemp -t scrolly3-dev.XXXXXX.log)"

cleanup() {
  [[ -n "${WATCH_PID:-}" ]] && kill "$WATCH_PID" 2>/dev/null || true
  rm -f "$LOG"
}
trap cleanup EXIT INT TERM

# Background watcher: poll the log for the URL Vite prints when ready,
# then open it in the default browser. Vite's HMR handles all subsequent
# file-change reloads — no polling needed after this.
(
  for _ in $(seq 1 60); do
    URL=$(grep -oE 'http://(localhost|127\.0\.0\.1):[0-9]+/?' "$LOG" 2>/dev/null | head -n1)
    if [[ -n "$URL" ]]; then
      sleep 0.5   # tiny grace period so the route is mounted
      echo "▶ Opening $URL"
      open "$URL"
      exit 0
    fi
    sleep 0.5
  done
  echo "⚠  Couldn't detect the dev-server URL within 30 s — open http://localhost:4327/ manually."
) &
WATCH_PID=$!

echo "▶ npm run dev — Vite starts on :4327, browser opens automatically."
echo "  Edits to src/ refresh the page instantly via HMR."
echo "  Press Ctrl+C to stop."
npm run dev 2>&1 | tee "$LOG"
