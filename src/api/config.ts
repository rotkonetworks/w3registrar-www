import {
  polkadot,
  polkadot_people,
  ksmcc3,
  ksmcc3_people,
  rococo,
  rococo_people,
  westend2,
  westend2_people,
  paseo,
  paseo_people,
} from "@polkadot-api/descriptors";
import { defineConfig, type ChainConfig, type Config } from "@reactive-dot/core";
import { LedgerWallet } from "@reactive-dot/wallet-ledger";
import { WalletConnect } from "@reactive-dot/wallet-walletconnect";
import { registerDotConnect } from "dot-connect";
import { getWsProvider } from "@polkadot-api/ws-provider/web";
import { createLightClientProvider } from "@reactive-dot/core/providers/light-client.js";
import { InjectedWalletProvider } from "@reactive-dot/core/wallets.js";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";

const getProviders = () => {
  const lightClientProvider = createLightClientProvider();
  const polkadot = lightClientProvider.addRelayChain({ id: "polkadot" });
  const ksmcc3 = lightClientProvider.addRelayChain({ id: "kusama" });
  const paseo = lightClientProvider.addRelayChain({ id: "paseo" });
  const westend = lightClientProvider.addRelayChain({ id: "westend" });

  return {
    lightClientProvider,
    polkadot,
    ksmcc3, 
    paseo,
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
    polkadot: {
      name: "Polkadot",
      descriptor: polkadot,
      provider: providers.polkadot,
    },
    polkadot_people: {
      name: "Polkadot People",
      descriptor: polkadot_people,
      provider: providers.polkadot.addParachain({ id: "polkadot_people" }),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_POLKADOT,
    },

    ksmcc3: {
      name: "Kusama",
      descriptor: ksmcc3,
      provider: providers.ksmcc3,
    },
    ksmcc3_people: {
      name: "Kusama People",
      descriptor: ksmcc3_people,
      provider: providers.ksmcc3.addParachain({ id: "kusama_people" }),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_KUSAMA,
    },

    paseo: {
      name: "Paseo",
      descriptor: paseo,
      provider: providers.paseo,
    },
    paseo_people: {
      name: "Paseo People",
      descriptor: paseo_people,
      provider: providers.paseo.addParachain({ id: "paseo_people" }),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_PASEO,
    },

    westend2: {
      name: "Westend",
      descriptor: westend2,
      provider: providers.westend,
    },
    westend2_people: {
      name: "Westend People",
      descriptor: westend2_people,
      provider: providers.westend.addParachain({ id: "westend_people" }),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_WESTEND,
    },

    rococo: {
      name: "Rococo",
      descriptor: rococo,
      provider: withPolkadotSdkCompat(getWsProvider(import.meta.env.VITE_APP_DEFAULT_WS_URL_RELAY)),
    },
    rococo_people: {
      name: "Rococo People",
      descriptor: rococo_people,
      provider: withPolkadotSdkCompat(getWsProvider(import.meta.env.VITE_APP_DEFAULT_WS_URL)),
      registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_ROCOCO,
    },
  },
  targetChains: import.meta.env.VITE_APP_AVAILABLE_CHAINS 
    ? import.meta.env.VITE_APP_AVAILABLE_CHAINS.split(',').map(key => key.trim())
    : ["polkadot_people", "ksmcc3_people", "westend2_people", "rococo_people"]
  ,
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
        "polkadot:c1af4cb4eb3918e5db15086c0cc5ec17", // people-ksmcc3
      ],
      optionalChainIds: [
        "polkadot:42a6fe2a73c2a8920a8ece6bdbaa63fc", // people-rococo
        "polkadot:91b171bb158e2d3848fa23a9f1c25182", // polkadot
        "polkadot:b0a8d493285c2df73290dfb7e61f870f", // ksmcc3
        "polkadot:e143f23803ac50e8f6f8e62695d1ce9e", // westend
      ],
    }),
  ],
} as const satisfies ApiConfig);

// Register dot-connect custom elements & configure supported wallets
registerDotConnect({
  wallets: config.wallets,
});
