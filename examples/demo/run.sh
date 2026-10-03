#!/usr/bin/env bash
# Run the settle-text demo. Nothing is published, so the demo borrows the SETTLE site's node_modules (vite, the
# React plugin, React itself) through a symlink; a published package would `npm i` them instead (PUBLISHING.md).
#   bash examples/demo/run.sh            # serve on 5240 (or PORT=... ) and print the address
#   bash examples/demo/run.sh --build    # vite build into examples/demo/dist and exit
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SITE="$HERE/../../../../../sites/settle-site"
if [ ! -d "$HERE/node_modules" ]; then
  if [ -d "$SITE/node_modules" ]; then ln -sfn "$SITE/node_modules" "$HERE/node_modules"; else echo "no node_modules: run npm install in $SITE first"; exit 1; fi
fi
PORT="${PORT:-5240}"
cd "$HERE"
if [ "${1:-}" = "--build" ]; then exec node node_modules/vite/bin/vite.js build; fi
echo "settle-text demo -> http://localhost:$PORT/"
exec node node_modules/vite/bin/vite.js --port "$PORT" --strictPort
