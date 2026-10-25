#!/bin/bash
# build-backends.sh - generate typed TanStack Query hooks for the EscapeVelocity backends this app calls.
#
# Usage:
#   ./build-backends.sh                      Regenerate every backend already under src/Backends/
#   ./build-backends.sh Tools Scout          Generate (or regenerate) the named backends
#   ./build-backends.sh Tools --spec FILE    Generate from a saved openapi.json instead of the live backend
#   ./build-backends.sh App                  Generate hooks for this app's own API (server/) - spec read from the code,
#                                            hooks call same-origin /api/... (no env var, nothing running)
#
# A backend is named by its folder, src/Backends/<Name>/, and found at VITE_BACKEND_<NAME uppercased>_URL in .env.local
# (e.g. Tools -> VITE_BACKEND_TOOLS_URL=http://localhost:18700). For each one this:
#   1. downloads <url>/openapi.json into a scratch folder, .codegen/<Name>/
#   2. runs EscapeVelocity's own generators there, unmodified (codegen/ev/ - kept byte-identical by ./template.sh drift).
#      They only work relative to the current directory, which is what lets one copy serve every backend.
#   3. rewrites the generated base URL from EscapeVelocity's VITE_API_BACKEND_URL:VITE_API_BACKEND_PORT pair to this
#      backend's own VITE_BACKEND_<NAME>_URL
#   4. replaces src/Backends/<Name>/Query/ and src/Backends/<Name>/openapi.json with the result
#
# Everything under src/Backends/<Name>/Query/ is generated - never edit it. The output is committed, so a Vercel build
# never needs a backend. Needs: a running backend (or --spec), jq, python3, and `npm install` done.

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

fail() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# --- Arguments ---
names=()
spec_file=""
while [ $# -gt 0 ]; do
    case "$1" in
        --spec)
            [ -n "$2" ] || fail "--spec needs a file"
            spec_file="$(realpath "$2")"
            shift 2
            ;;
        -h|--help)
            sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            [[ "$1" =~ ^[A-Za-z][A-Za-z0-9]*$ ]] || fail "backend name '$1' must be letters and digits only (it is a folder name)"
            names+=("$1")
            shift
            ;;
    esac
done

if [ ${#names[@]} -eq 0 ]; then
    for dir in src/Backends/*/; do
        [ -d "$dir" ] && names+=("$(basename "$dir")")
    done
    [ ${#names[@]} -gt 0 ] || fail "no backends under src/Backends/ yet - name one, e.g. ./build-backends.sh Tools"
fi

if [ -n "$spec_file" ] && [ ${#names[@]} -ne 1 ]; then
    fail "--spec generates exactly one backend - name it"
fi
[ -z "$spec_file" ] || [ -f "$spec_file" ] || fail "spec file not found: $spec_file"

command -v jq > /dev/null || fail "jq is required (sudo apt install jq)"
command -v python3 > /dev/null || fail "python3 is required"
[ -d node_modules/openapi-typescript ] || fail "openapi-typescript is missing - run npm install"

# --- .env then .env.local, the order Vite applies them (same parsing as EscapeVelocity's build-apis.sh) ---
for env_file in .env .env.local; do
    [ -f "$env_file" ] || continue
    while IFS='=' read -r key value; do
        if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        key=$(echo "$key" | xargs)
        if [[ "$value" =~ ^\"(.*)\"$ || "$value" =~ ^\'(.*)\'$ ]]; then
            value="${BASH_REMATCH[1]}"
        fi
        export "$key=$value"
    done < "$env_file"
done

# This app's own API in server/ - generated like any backend, but from the code and with same-origin URLs.
APP_BACKEND="App"

# The exact base-URL expression generate-queries.sh emits.
EV_URL_EXPR='${import.meta.env.VITE_API_BACKEND_URL}:${import.meta.env.VITE_API_BACKEND_PORT}'

for name in "${names[@]}"; do
    env_var="VITE_BACKEND_${name^^}_URL"
    url="${!env_var}"
    url="${url%/}"
    stage="$SCRIPT_DIR/.codegen/$name"
    dest="src/Backends/$name"

    echo -e "${BLUE}=== $name ===${NC}"
    rm -rf "$stage"
    mkdir -p "$stage/src"

    if [ "$name" = "$APP_BACKEND" ]; then
        # This app's own API (server/): the spec comes straight from the code, so no server has to be running.
        echo "Writing spec from server/ (every route, whatever the features)"
        npx tsx server/scripts/openapi.ts > "$stage/openapi.json" || fail "server/scripts/openapi.ts failed"
    elif [ -n "$spec_file" ]; then
        echo "Using spec $spec_file"
        cp "$spec_file" "$stage/openapi.json"
    else
        [ -n "$url" ] || fail "$env_var is not set in .env.local (see .env.local.sample)"
        echo "Fetching $url/openapi.json"
        curl -sSfL -o "$stage/openapi.json" "$url/openapi.json" \
            || fail "could not download $url/openapi.json - is $name's backend running?"
    fi
    jq -e '.openapi and .paths' "$stage/openapi.json" > /dev/null || fail "$name's openapi.json is not an OpenAPI document"

    (
        cd "$stage"
        bash "$SCRIPT_DIR/codegen/ev/generate-types.sh" > /dev/null
        python3 -I "$SCRIPT_DIR/codegen/ev/extract-types.py" > /dev/null
        bash "$SCRIPT_DIR/codegen/ev/generate-queries.sh" > /dev/null
    ) || fail "code generation failed for $name (rerun the codegen/ev scripts inside .codegen/$name to see why)"

    replacement="\${import.meta.env.${env_var}}"
    if [ "$name" = "$APP_BACKEND" ]; then
        # Same origin on Vercel and in dev (Vite proxies /api), so the hooks call plain /api/... paths.
        replacement=""
    fi
    find "$stage/src/Query" -maxdepth 1 -name '*.ts' -print0 | while IFS= read -r -d '' file; do
        EV_URL_EXPR="$EV_URL_EXPR" REPLACEMENT="$replacement" python3 -I -c '
import os, sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
with open(path, "w") as f:
    f.write(text.replace(os.environ["EV_URL_EXPR"], os.environ["REPLACEMENT"]))
' "$file"
    done
    if grep -rq "VITE_API_BACKEND_" "$stage/src/Query"; then
        fail "generated hooks for $name still reference VITE_API_BACKEND_* - generate-queries.sh changed its URL form"
    fi

    mkdir -p "$dest"
    rm -rf "$dest/Query"
    mv "$stage/src/Query" "$dest/Query"
    cp "$stage/openapi.json" "$dest/openapi.json"
    rm -rf "$stage"

    hooks=$(find "$dest/Query" -maxdepth 1 -name '*.ts' | wc -l)
    version=$(jq -r '.info.version // "?"' "$dest/openapi.json")
    echo -e "${GREEN}$name: $hooks hooks, API version $version -> $dest/Query/${NC}"
done

rmdir .codegen 2> /dev/null || true
echo "Build process completed."
