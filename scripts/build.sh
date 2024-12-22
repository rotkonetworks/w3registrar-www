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
    VITE_APP_REGISTRAR_INDEX__PEOPLE_WESTEND
    VITE_APP_REGISTRAR_INDEX__PEOPLE_ROCOCO
    VITE_APP_CHALLENGES_API_URL
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var-}" ]]; then
        echo "Error: $var is not set." >&2
        exit 1
    fi
done

bun install
bunx polkadot-apu generate

cat << EOF > ./node_modules/css-tree/lib/data-patch.js
import * as patch from "../data/patch.json"

export default patch;
EOF

cat << EOF > ./node_modules/css-tree/lib/version.js
export { version } from "../package.json";
EOF

# vite build will fail with 
#   error during build:
#   undefined
# So this script is required to get actual error message:
cat << EOF > ./build.js
const vite = require('vite');

vite.build();
EOF
bun ./build.js

if ! bun ./build.js; then
    echo "Error: 'bun run build' failed." >&2
    exit 1
fi

echo "Build completed successfully."
