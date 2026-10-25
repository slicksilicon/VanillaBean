#!/bin/bash
# template.sh - VanillaBean's link to the EscapeVelocity template (see TEMPLATE_SYNC.json and CLAUDE.md).
#
#   ./template.sh status          EscapeVelocity version vs synced_to, plus the newer changelog entries to apply
#   ./template.sh drift [--all]   file-by-file comparison with EscapeVelocity through TEMPLATE_SYNC.json's path_map

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
exec python3 -I "$SCRIPT_DIR/tools/template_drift.py" "$@"
