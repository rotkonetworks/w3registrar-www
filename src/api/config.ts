import { polkadot, kusama, westend, people_polkadot, people_kusama, people_westend } from "@polkadot-api/descriptors";
import type { Config } from "@reactive-dot/core";
import { InjectedWalletAggregator } from "@reactive-dot/core/wallets.js";
import { chainSpec as peoplePolkadotChainSpec } from "polkadot-api/chains/polkadot_people";
import { chainSpec as peopleKusamaChainSpec } from "polkadot-api/chains/ksmcc3_people";
import { chainSpec as peopleWestendChainSpec } from "polkadot-api/chains/westend2_people";
import { chainSpec as polkadotChainSpec } from "polkadot-api/chains/polkadot";
import { chainSpec as kusamaChainSpec } from "polkadot-api/chains/ksmcc3";
import { chainSpec as westendChainSpec } from "polkadot-api/chains/westend2";
import { getSmProvider } from "polkadot-api/sm-provider";
import { startFromWorker } from "polkadot-api/smoldot/from-worker";
import { LedgerWallet } from "@reactive-dot/wallet-ledger";
import { WalletConnect } from "@reactive-dot/wallet-walletconnect";


const initWorker = () => startFromWorker(
  new Worker(new URL("polkadot-api/smoldot/worker", import.meta.url), {
    type: "module",
  })
)
export let smoldot = initWorker();

export const chainNames = [
  { name: "Rococo Local", chainId: "rococo_people", },
  { name: "Polkadot", chainId: "people_polkadot", },
  { name: "Kusama", chainId: "people_kusama", },
  { name: "Westend", chainId: "people_westend", },
  { name: "Custom...", chainId: "custom", },
]

export const config = {
  chains: {
    people_polkadot: {
      descriptor: people_polkadot,
      provider: getSmProvider(smoldot.addChain({ chainSpec: peoplePolkadotChainSpec })),
    },
    people_kusama: {
      descriptor: people_kusama,
      provider: getSmProvider(smoldot.addChain({ chainSpec: peopleKusamaChainSpec })),
    },
    people_westend: {
      descriptor: people_westend,
      provider: getSmProvider(smoldot.addChain({ chainSpec: peopleWestendChainSpec })),
    },
    polkadot: {
      descriptor: polkadot,
      provider: getSmProvider(smoldot.addChain({ chainSpec: polkadotChainSpec })),
    },
    kusama: {
      descriptor: kusama,
      provider: getSmProvider(smoldot.addChain({ chainSpec: kusamaChainSpec })),
    },
    westend: {
      descriptor: westend,
      provider: getSmProvider(smoldot.addChain({ chainSpec: westendChainSpec })),
    },
  },
  wallets: [
    new InjectedWalletAggregator(),
    new LedgerWallet(),
    new WalletConnect({
      projectId: import.meta.env.VITE_APP_WALLET_CONNECT_PROJECT_ID,
      providerOptions: {
        metadata: {
          name: "w3reg",
          description: "web3 registrar.",
          url: globalThis.origin,
          icons: ["/logo.png"],
        },
      },
      chainIds: [
        "polkadot:67fa177a097bfa18f77ea95ab56e9bcd", // people-polkadot
        "polkadot:1eb6fb0ba5187434de017a70cb84d4f4", // people-westend
        "polkadot:c1af4cb4eb3918e5db15086c0cc5ec17", // people-kusama
      ],
      optionalChainIds: [
        "polkadot:42a6fe2a73c2a8920a8ece6bdbaa63fc", // people-rococo
        "polkadot:91b171bb158e2d3848fa23a9f1c25182", // polkadot
        "polkadot:b0a8d493285c2df73290dfb7e61f870f", // kusama
        "polkadot:e143f23803ac50e8f6f8e62695d1ce9e", // westend
      ],
    }),
  ],
} as const satisfies Config;
