#!/bin/bash
set -euo pipefail

if command -v bunx &> /dev/null; then
    bunx papi add people_polkadot --wsUrl wss://people-polkadot.dotters.network
    bunx papi add people_westend --wsUrl wss://people-westend.dotters.network
    bunx papi add people_kusama --wsUrl wss://people-kusama.dotters.network
    bunx papi add polkadot --wsUrl wss://polkadot.dotters.network
    bunx papi add westend --wsUrl wss://westend.dotters.network
    bunx papi add kusama --wsUrl wss://kusama.dotters.network
    bunx papi
elif command -v npx &> /dev/null; then
    npx papi
else
    echo "Error: Neither bunx nor npx is available. Please install Bun or Node.js."
    exit 1
fi

echo "Papi setup completed successfully."
