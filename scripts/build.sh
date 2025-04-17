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

readonly REQUIRED_VARS=(
    VITE_APP_WALLET_CONNECT_PROJECT_ID
    VITE_APP_DEFAULT_WS_URL
    VITE_APP_DEFAULT_WS_URL_RELAY
    VITE_APP_REGISTRAR_INDEX__PEOPLE_POLKADOT
    VITE_APP_REGISTRAR_INDEX__PEOPLE_KUSAMA
    VITE_APP_REGISTRAR_INDEX__PEOPLE_PASEO
    # VITE_APP_REGISTRAR_INDEX__PEOPLE_ROCOCO
    VITE_APP_CHALLENGES_API_URL
    MODE
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var-}" ]]; then
        echo "Error: $var is not set." >&2
        exit 1
    fi
done

bun install

if [ MODE = "development" ]; then
    bun vite build --mode development
else
    bun vite build --mode production
fi

if ! bun ./build.js; then
    echo "Error: 'bun run build' failed." >&2
    exit 1
fi

echo "Build completed successfully."
