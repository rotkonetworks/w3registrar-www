# w3registrar-www

frontend to submit setIdentity + requestJudgement on polkadot-sdk chains using polkadot-api.

## Usage

Setting it up with Nix is the recommended way, since it takes care of setting up dependencies & environment. Visit https://nixos.org/download/ and follow the installation instructions.

Once you have cloned the repo, and opened a terminal within this repo, you can run `nix-shell` to start. 

### First-time setup

After entering the Nix shell for the first time, you'll need to run the setup script manually:

```sh
scripts/setup.sh
```

For debugging, simply run `nix-shell --command "bun dev"`

For building, just run `nix-shell --command "bun run build"`

### Setup
First of all, make sure you set up your environment correctly. Those versons are recommended to prevent issues on debug or building. Please make sure you

```sh
curl -fsSL https://bun.sh/install | bash -s "bun-v1.1.35"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 22
```

Then, just run and visit http://localhost:3333
```sh
bun install
```

Before debugging or building, make sure to have the `.env` file:
```sh
cp .env.example .env
```
You might edit it to set your endpoints. If debugging, Vite will restart on edit.

### Debug
```sh
bun dev
```

To generate/update scale metadata
```sh
bunx polkadot-api@1.8.0 update # or bun metadata
```

### Build

To build the App, run
```sh
bun run build
```

### Chain docs
Docs can be found at 

You can also generate it via comand
```sh
bunx papi-generate-docs --config .papi/polkadot-api.json --output docs/
```
