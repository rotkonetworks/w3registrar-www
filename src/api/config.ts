import {
  polkadot,
  kusama,
  westend,
  rococo,
  people_polkadot,
  people_kusama,
  people_westend,
  people_rococo,
} from "@polkadot-api/descriptors";
import { defineConfig, type ChainConfig, type Config } from "@reactive-dot/core";
import { LedgerWallet } from "@reactive-dot/wallet-ledger";
import { WalletConnect } from "@reactive-dot/wallet-walletconnect";
import { registerDotConnect } from "dot-connect";
import { getWsProvider } from "@polkadot-api/ws-provider/web";
import { createLightClientProvider } from "@reactive-dot/core/providers/light-client.js";
import { InjectedWalletProvider } from "@reactive-dot/core/wallets.js";

const getProviders = () => {
  const lightClientProvider = createLightClientProvider();
  const polkadot = lightClientProvider.addRelayChain({ id: "polkadot" });
  const kusama = lightClientProvider.addRelayChain({ id: "kusama" });
  const westend = lightClientProvider.addRelayChain({ id: "westend" });

  return {
    lightClientProvider,
    polkadot,
    kusama, 
    westend
  };};
export let providers = getProviders();

type ApiConfig = Config & {
  chains: Record<
    string,
    ChainConfig & {
      name: string;
      registrarIndex?: number;
    }
  >;
};
export const config = defineConfig({
  chains: {
    people_polkadot: {
      name: "Polkadot",
      descriptor: people_polkadot,
      provider: providers.polkadot.addParachain({ id: "polkadot_people" }),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_POLKADOT,
    },
    people_kusama: {
      name: "Kusama",
      descriptor: people_kusama,
      provider: providers.kusama.addParachain({ id: "kusama_people" }),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_KUSAMA,
    },
    people_westend: {
      name: "Westend",
      descriptor: people_westend,
      provider: providers.westend.addParachain({ id: "people_westend_people" }),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_WESTEND,
    },
    polkadot: {
      name: "Polkadot",
      descriptor: polkadot,
      provider: providers.polkadot,
    },
    kusama: {
      name: "Kusama",
      descriptor: kusama,
      provider: providers.kusama,
    },
    westend: {
      name: "Westend",
      descriptor: westend,
      provider: providers.westend,
    },
    people_rococo: {
      name: "Rococo",
      descriptor: people_rococo,
      provider: getWsProvider(import.meta.env.VITE_APP_DEFAULT_WS_URL),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_ROCOCO,
    },
    rococo: {
      name: "Rococo",
      descriptor: rococo,
      provider: getWsProvider(import.meta.env.VITE_APP_DEFAULT_WS_URL_RELAY),
    },
  },
  targetChains: ["people-polkadot", "popple_kusama", "people_westend", "people_rococo"],
  wallets: [
    new InjectedWalletProvider(),
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
} as const satisfies ApiConfig);

// Register dot-connect custom elements & configure supported wallets
registerDotConnect({
  wallets: config.wallets,
});
