import { 
  polkadot, kusama, westend, people_polkadot, people_kusama, people_westend, 
  rococo
} from "@polkadot-api/descriptors";
import type { ChainConfig, Config } from "@reactive-dot/core";
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

import { people_rococo } from "@polkadot-api/descriptors";
import { getWsProvider } from "@polkadot-api/ws-provider/web";
import { createContext, useContext, useEffect, useState } from "react";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";

export type ApiConfig = Config & {
  chains: Record<
    string,
    ChainConfig & {
      name: string;
      registrarIndex?: number;
    }
  >;
};

export type ConfigContextProps = {
  config: ApiConfig;
  worker: Worker;
  initWorker: () => void;
  validateUrl: (url: string) => { isValid: boolean; message: string };
  setCustoNetEndponit: (wsUrl: string) => void;
}
export const ConfigContext = createContext<ConfigContextProps>({} as ConfigContextProps);
export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState<ApiConfig | null>()
  const [worker, setWorker] = useState(null)

  const initWorker = () => {
    const _worker = startFromWorker(
      new Worker(new URL("polkadot-api/smoldot/worker", import.meta.url), {
        type: "module",
      })
    );

    if (worker) {
      import.meta.env.DEV && console.log("Stopping smoldot worker")
      worker.terminate()
    }
    setWorker(_worker)
    import.meta.env.DEV && console.log("Starting smoldot worker")
  }

  function createConfig(): ApiConfig {
    return {
      chains: {
        people_polkadot: {
          name: "Polkadot",
          descriptor: people_polkadot,
          provider: getSmProvider(worker?.addChain({ chainSpec: peoplePolkadotChainSpec })),
        },
        people_kusama: {
          name: "Kusama",
          descriptor: people_kusama,
          provider: getSmProvider(worker?.addChain({ chainSpec: peopleKusamaChainSpec })),
        },
        people_westend: {
          name: "Westend",
          descriptor: people_westend,
          provider: getSmProvider(worker?.addChain({ chainSpec: peopleWestendChainSpec })),
        },
        polkadot: {
          name: "Polkadot",
          descriptor: polkadot,
          provider: getSmProvider(worker?.addChain({ chainSpec: polkadotChainSpec })),
        },
        kusama: {
          name: "Kusama",
          descriptor: kusama,
          provider: getSmProvider(worker?.addChain({ chainSpec: kusamaChainSpec })),
        },
        westend: {
          name: "Westend",
          descriptor: westend,
          provider: getSmProvider(worker?.addChain({ chainSpec: westendChainSpec })),
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
    } as const satisfies ApiConfig;
  }

  function createConfigWithCustomEndpoint(endpoint: string): ApiConfig {
    const newConfig = createConfig();

    return {
      ...newConfig,
      chains: {
        ...newConfig.chains,
        people_rococo: {
          name: "Rococo",
          descriptor: people_rococo,
          provider: () => withPolkadotSdkCompat((
            getWsProvider(import.meta.env.VITE_APP_DEFAULT_WS_URL)
          )),
          registrarIndex: import.meta.env.VITE_APP_REGISTRAR_INDEX__PEOPLE_KUSAMA,
        },
        rococo: {
          name: "Rococo",
          descriptor: rococo,
          provider: () => withPolkadotSdkCompat((
            getWsProvider(import.meta.env.VITE_APP_DEFAULT_WS_URL_RELAY)
          )),
        },
      },
    };
  }

  const validateUrl = (url: string): { isValid: boolean; message: string } => {
    if (!url.trim()) return { isValid: false, message: "URL cannot be empty" };
    try {
      new URL(url);
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        return { isValid: false, message: "URL must start with ws:// or wss://" };
      }
      return { isValid: true, message: "Valid WebSocket URL" };
    } catch {
      return { isValid: false, message: "Invalid URL format" };
    }
  };

  const setCustoNetEndponit = (wsUrl: string) => {
    const urlValidateResolt = validateUrl(wsUrl);
    if (!urlValidateResolt.isValid) {
      throw new Error(urlValidateResolt.message)
    }

    setConfig(createConfigWithCustomEndpoint(wsUrl));
  }

  useEffect(() => {
    if (!worker) {
      initWorker()
    }
  }, [])
  useEffect(() => {
    const defaultWsUrl = localStorage.getItem("wsUrl") || import.meta.env.VITE_APP_DEFAULT_WS_URL;
    import.meta.env.DEV && console.log({ worker, config, defaultWeUrl: defaultWsUrl })
    if (worker && !config) {
      if (defaultWsUrl) {
        setConfig(createConfigWithCustomEndpoint(defaultWsUrl));
      } else {
        setConfig(createConfig())
      }
    }
  }, [worker, config])

  return <ConfigContext.Provider value={{ 
    config, 
    worker, 
    initWorker, 
    validateUrl, 
    setCustoNetEndponit 
  }}>
    {children}
  </ConfigContext.Provider>
}

export const useConfig = () => {
  const context = useContext(ConfigContext)

  if (!context) {
    throw new Error("COmponnt must be in <ConfigProvider> to use context.")
  }
  return context;
}
