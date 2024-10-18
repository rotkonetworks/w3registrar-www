# w3registrar-www

frontend to submit setIdentity + requestJudgement on polkadot-sdk chains using polkadot-api.

## Usage

### Development

Just run and visit http://localhost:3333
```sh
bun install
bun dev
```

To generate/update scale metadata
```sh
bunx papi update # or bun metadata
```

### Build

To build the App, run
```sh
bun build
```

### Chain docs
Docs can be found at 

You can also generate it via comand
```sh
bunx papi-generate-docs --config .papi/polkadot-api.json --output docs/
```
