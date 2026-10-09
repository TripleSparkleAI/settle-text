#!/usr/bin/env bash
# Run the settle-text demo. It needs vite, the React plugin and React (this folder's package.json). Inside the SETTLE
# research repository it borrows the SETTLE site's node_modules through a symlink, so it needs no network; anywhere
# else (the package's own repository) it installs them into this folder once.
#   bash examples/demo/run.sh            # serve on 5240 (or PORT=... ) and print the address
#   bash examples/demo/run.sh --build    # vite build into examples/demo/dist and exit
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SITE="$HERE/../../../../SETTLE/settle-site"
if [ ! -e "$HERE/node_modules" ]; then
  if [ -d "$SITE/node_modules/vite" ]; then
    ln -sfn "$SITE/node_modules" "$HERE/node_modules"
  else
    echo "settle-text demo: installing vite, the React plugin and React into examples/demo (once)"
    (cd "$HERE" && npm install --no-audit --no-fund)
  fi
fi
if [ ! -d "$HERE/../../node_modules/settle-see" ] && [ ! -d "$HERE/../../../settle-see" ]; then
  echo "settle-text demo: settle-see is missing; run npm install in the package folder first"
  exit 1
fi
PORT="${PORT:-5240}"
cd "$HERE"
if [ "${1:-}" = "--build" ]; then exec node node_modules/vite/bin/vite.js build; fi
echo "settle-text demo -> http://localhost:$PORT/"
exec node node_modules/vite/bin/vite.js --port "$PORT" --strictPort
