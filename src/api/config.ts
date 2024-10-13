import { polkadot, kusama, westend, paseo } from "@polkadot-api/descriptors";
import type { Config } from "@reactive-dot/core";
import { InjectedWalletAggregator } from "@reactive-dot/core/wallets.js";
import { chainSpec as polkadotChainSpec } from "polkadot-api/chains/polkadot";
import { chainSpec as kusamaChainSpec } from "polkadot-api/chains/ksmcc3";
import { chainSpec as westendChainSpec } from "polkadot-api/chains/westend2";
import { chainSpec as paseoChainSpec } from "polkadot-api/chains/paseo";
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
  { name: "People Rococo Local", chainId: "people_rococo", },
  { name: "Polkadot", chainId: "polkadot", },
  { name: "Kusama", chainId: "kusama", },
  { name: "Westend", chainId: "westend", },
  { name: "Paseo", chainId: "paseo", },
  { name: "Custom...", chainId: "custom", },
]

export const config = {
  chains: {
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
    paseo: {
      descriptor: paseo,
      provider: getSmProvider(smoldot.addChain({ chainSpec: paseoChainSpec })),
    }, 
  },
  wallets: [
    new InjectedWalletAggregator(),
    new LedgerWallet(),
    new WalletConnect({
      projectId: import.meta.env.VITE_APP_WALLET_CONNECT_PROJECT_ID,
      providerOptions: {
        metadata: {
          name: "ĐÓTConsole",
          description: "Substrate development console.",
          url: globalThis.origin,
          icons: ["/logo.png"],
        },
      },
      chainIds: [
        "polkadot:91b171bb158e2d3848fa23a9f1c25182", // Polkadot
      ],
      optionalChainIds: [
        "polkadot:91b171bb158e2d3848fa23a9f1c25182", // Polkadot
        "polkadot:b0a8d493285c2df73290dfb7e61f870f", // Kusama
        "polkadot:77afd6190f1554ad45fd0d31aee62aac", // Paseo
        "polkadot:e143f23803ac50e8f6f8e62695d1ce9e", // Westend
      ],
    }),
  ],
} as const satisfies Config;
