// `dot` is the name we gave to `npx papi add`
import { people_rococo, polkadot, kusama, westend, paseo } from "@polkadot-api/descriptors";
import { WsProvider } from "@polkadot/api";
import type { Config } from "@reactive-dot/core";
import { InjectedWalletAggregator } from "@reactive-dot/core/wallets.js";
//import { chainSpec } from "polkadot-api/chains/polkadot";
import { chainSpec as polkadotChainSpec } from "polkadot-api/chains/polkadot";
import { chainSpec as kusamaChainSpec } from "polkadot-api/chains/ksmcc3";
import { chainSpec as westendChainSpec } from "polkadot-api/chains/westend2";
import { chainSpec as paseoChainSpec } from "polkadot-api/chains/paseo";
import peopleRococoChainSpec from "./chainSpecs/bob.json";
import { getSmProvider } from "polkadot-api/sm-provider";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { startFromWorker } from "polkadot-api/smoldot/from-worker";

const smoldot = startFromWorker(
  new Worker(new URL("polkadot-api/smoldot/worker", import.meta.url), {
    type: "module",
  }),
);

export const config = {
  chains: {
    // "polkadot" here can be any unique string value
    people_rococo_ws: {
      descriptor: people_rococo,
      provider: () => getWsProvider("ws://localhost:42001"),
    },
    people_rococo: {
      descriptor: people_rococo,
      provider: getSmProvider(smoldot.addChain({ chainSpec: JSON.stringify(peopleRococoChainSpec) })),
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
    paseo: {
      descriptor: paseo,
      provider: getSmProvider(smoldot.addChain({ chainSpec: paseoChainSpec })),
    }, 
    /* 
    */
  },
  wallets: [new InjectedWalletAggregator()],
} as const satisfies Config;


