#!/bin/bash
# init_project.sh - turn a fresh clone of VanillaBean into a new project.
#
# Stamps the project name into package.json / package-lock.json, the title into .env, and the dev port into
# vite.config.ts (and the sample backend origin note), installs dependencies, then runs ./configure.sh to choose the
# optional features. Run once, right after cloning.

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

read -p "Project name (npm package name, e.g. my-app): " project_name
[[ "$project_name" =~ ^[a-z0-9][a-z0-9._-]*$ ]] || { echo "Use lowercase letters, digits, '.', '_' or '-'."; exit 1; }

read -p "Application title [$project_name]: " app_title
app_title="${app_title:-$project_name}"

current_port=$(grep -oE 'port:\s*[0-9]+' vite.config.ts | grep -oE '[0-9]+' | head -n 1)
echo -e "${YELLOW}Ports already used by EscapeVelocity apps: 7000 7100 7200 7300 7500 7700 7900 (see ~/Workspaces/ports.sh).${NC}"
read -p "Dev server port [$current_port]: " port
port="${port:-$current_port}"
[[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 1024 ] && [ "$port" -le 65535 ] || { echo "Invalid port."; exit 1; }

tmp=$(mktemp)
jq --arg n "$project_name" '.name = $n' package.json > "$tmp" && mv "$tmp" package.json
jq --arg n "$project_name" '.name = $n | .packages[""].name = $n' package-lock.json > "$tmp" && mv "$tmp" package-lock.json
sed -i -E "s/^VITE_APP_TITLE=.*/VITE_APP_TITLE=\"${app_title//\//\\/}\"/" .env
sed -i -E "s/port: [0-9]+/port: $port/" vite.config.ts
sed -i -E "s#http://localhost:[0-9]+\) in ALLOWED_FRONTEND_URLS#http://localhost:$port) in ALLOWED_FRONTEND_URLS#" .env.local.sample

[ -f .env.local ] || cp .env.local.sample .env.local

npm ci

echo ""
echo -e "${GREEN}Initialized $project_name (\"$app_title\") on port $port.${NC}"
echo ""

# Optional features - Google sign-in, MongoDB, the app's own API, EscapeVelocity backends. Re-run any time.
./configure.sh
