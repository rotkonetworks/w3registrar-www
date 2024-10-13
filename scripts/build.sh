#!/bin/bash
set -euo pipefail
shopt -s nullglob globstar
umask 077

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Strict environment sanitization
for var in $(compgen -e); do
    case $var in
        HOME|PATH|TERM|USER|SHELL|TMPDIR|VITE_*)
            ;;
        *)
            unset "$var"
            ;;
    esac
done

export PATH="/usr/local/bin:/usr/bin:/bin"

readonly REQUIRED_VARS=(
    "VITE_APP_WALLET_CONNECT_PROJECT_ID"
    "VITE_APP_DEFAULT_WS_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var-}" ]]; then
        echo "Error: $var is not set." >&2
        exit 1
    fi
done

if command -v bun &> /dev/null; then
    echo "Using Bun for build"
    if ! bun run build; then
        echo "Error: 'bun run build' failed." >&2
        exit 1
    fi
elif command -v npm &> /dev/null; then
    echo "Using npm for build"
    if ! npm run build; then
        echo "Error: 'npm run build' failed." >&2
        exit 1
    fi
else
    echo "Error: Neither Bun nor npm is available. Please install one of these package managers." >&2
    exit 1
fi

echo "Build completed successfully."
