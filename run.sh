#!/bin/bash
# run.sh - start the Vite dev server (port from vite.config.ts).
#
# EscapeVelocity backends named in .env.local must already be running, with this app's origin in their
# ALLOWED_FRONTEND_URLS. Segments that need one show a "Sign in" / "isn't running" panel until they are.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

if [ ! -d node_modules ]; then
    echo "node_modules missing - running npm ci..."
    npm ci || exit 1
fi

exec npm run dev
