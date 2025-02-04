{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs = with pkgs; [ curl unzip ];

  shellHook = ''
    set -euo pipefail
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    if ! command -v bun &>/dev/null; then
      curl -fsSL https://bun.sh/install | bash -s "bun-v1.1.42"
    fi

    if [ ! -d node_modules ]; then
      bun install || true
    fi

    # Wait for the descriptors to be downloaded. This is a workaround because it's likely to fail
    # by not generating the descriptors on the first try.
    attempts=10
    while [ ! -d .papi/descriptors/dist ]; do
      bunx polkadot-api@1.8.0 update || true
      attempts=$((attempts - 1))
      if [ $attempts -eq 0 ]; then
        echo "Failed to download descriptors"
        exit 1
      fi
    done

    if [ ! -f .env ]; then
      cp .env.example .env
    fi
    set +euo pipefail
  '';
}
