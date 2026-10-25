#!/bin/bash
# configure.sh - choose this app's optional features: Google sign-in, MongoDB, its own API, EscapeVelocity backends.
# Safe to re-run at any time. ./configure.sh --help lists the flags for unattended use.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
exec node "$SCRIPT_DIR/tools/configure.mjs" "$@"
