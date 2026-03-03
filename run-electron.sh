#!/usr/bin/env bash
# Run Compass Electron from the repo root.
# Use Terminal.app (or iTerm), not Cursor's terminal.

set -e
cd "$(dirname "$0")"

# Avoid "too many open files" during dev
ulimit -n 10240 2>/dev/null || true

# Prefer latest Node (e.g. from /usr/local/bin)
export PATH="/usr/local/bin:$PATH"

echo "Starting Compass Electron (dev server)..."
echo "If it crashes with 'electron module undefined', try the compiled app instead:"
echo "  1. npm run compile --workspace=mongodb-compass"
echo "  2. npm run run-compiled --workspace=mongodb-compass"
echo ""

npm run start --workspace=mongodb-compass
