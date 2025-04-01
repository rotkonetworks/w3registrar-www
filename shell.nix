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

    echo "To set up project dependencies and environment, run scripts/setup.sh"
    set +euo pipefail
  '';
}
