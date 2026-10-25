#!/bin/bash
# check.sh - the gate before committing: lint, typecheck and production build. Exits non-zero if any of them fails.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

status=0

echo "--- ESLint ---"
npm run lint || status=1

# `npm run build` is `tsc -b && vite build`, so this covers the typecheck too.
echo "--- Typecheck + build ---"
npm run build || status=1

if [ $status -eq 0 ]; then
    echo -e "${GREEN}All checks passed.${NC}"
else
    echo -e "${RED}Checks failed - see the output above.${NC}"
fi
exit $status
