#!/bin/bash
# check.sh - the gate before committing: lint, typecheck (app and server), router registration and production build.
# Exits non-zero if any of them fails.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

status=0

echo "--- ESLint ---"
npm run lint || status=1

echo "--- Server typecheck ---"
npx tsc -p tsconfig.server.json || status=1

# A bundled function cannot discover routers itself, so every routes_*.ts must be imported by server/routes/index.ts.
echo "--- Router registration ---"
for file in server/routes/routes_*.ts; do
    module="./$(basename "${file%.ts}").js"
    if ! grep -q "from \"$module\"" server/routes/index.ts; then
        echo -e "${RED}$file is not listed in server/routes/index.ts${NC}"
        status=1
    fi
done

# `npm run build` is `tsc -b && vite build`, so this covers the app typecheck too.
echo "--- Typecheck + build ---"
npm run build || status=1

if [ $status -eq 0 ]; then
    echo -e "${GREEN}All checks passed.${NC}"
else
    echo -e "${RED}Checks failed - see the output above.${NC}"
fi
exit $status
