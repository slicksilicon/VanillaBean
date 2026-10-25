#!/bin/bash
# run.sh - start the app locally: the Vite dev server (port from vite.config.ts) and, when features.api is on, the
# app's own API (server/dev.ts on API_PORT, default 7410) that Vite proxies /api to.
#
# EscapeVelocity backends named in .env.local must already be running, with this app's origin in their
# ALLOWED_FRONTEND_URLS. Segments that need one show a "Sign in" / "isn't running" panel until they are.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

if [ ! -d node_modules ]; then
    echo "node_modules missing - running npm ci..."
    npm ci || exit 1
fi

if [ "$(jq -r '.features.api' vanillabean.config.json)" = "true" ]; then
    # .env.local supplies the server's secrets and MONGODB_URI; tsx restarts the API when server/ changes.
    npx tsx watch --env-file-if-exists=.env.local server/dev.ts &
    API_PID=$!
    trap 'kill $API_PID 2> /dev/null' EXIT INT TERM
fi

npm run dev
