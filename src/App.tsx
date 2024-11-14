import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import type { RouteType } from '~/routes';
import { routes } from '~/routes';

import { config } from "./api/config";
import { proxy, useSnapshot } from 'valtio';

import { ConnectionDialog } from "dot-connect/react.js";
import { useAccounts, useClient, useTypedApi } from '@reactive-dot/react';
import { PolkadotSigner } from 'polkadot-api';
import { CHAIN_UPDATE_INTERVAL, IdentityVerificationStatuses } from './constants';
import { useIdentityEncoder } from './hooks/hashers/identity';
import { IdentityJudgement } from '@polkadot-api/descriptors';
import { mergeMap } from 'rxjs';
import { Chains, unstable_getBlockExtrinsics } from '@reactive-dot/core';

import { useAlerts } from "./hooks/useAlerts"

interface Props {
  route: RouteType;
}

function Loading() {
  return (
    <div className='h-100vh flex-center'>
    </div>
  );
}

const DomTitle: React.FC<Props> = ({ route }) => {
  React.useEffect(() => {
    if (route.meta?.title) {
      document.title = `${route.meta.title} | Reactease`;
    }
  }, [route]);

  return (
    <Suspense fallback={<Loading />}>
      <route.element />
    </Suspense>
  );
};

interface AccountBalance {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
  flags: bigint;
}

interface Account {
  id: string;
  name: string;
  address: string;
  polkadotSigner: PolkadotSigner;
  balance: AccountBalance;
}

interface Identity {
  display: string;
  matrix: string;
  discord: string;
  email: string;
  twitter: string;
}

interface Judgement {
  registrar: {
    index: number;
  };
  state: keyof IdentityJudgement;
  fee: bigint;
}

interface Challenge {
  value: string;
  verified: boolean;
}

interface Fees {
  requestJdgement?: bigint;
  setIdentityAndRequestJudgement?: bigint;
}

interface AlertProps {
  closable: boolean;
}

interface AppState {
  chain: ChainInfo;
  walletDialogOpen: boolean;
  account?: Account;
  identity?: Identity;
  judgements?: Array<Judgement>;
  challenges: Record<string, Challenge>;
  hashes: {
    identityOf?: Uint16Array;
  };
  fees: Fees;
  reserves: {};
  verificationProgress: IdentityVerificationStatuses;
  alerts: Record<string, AlertProps>;
}

export const appState: AppState = proxy({
  chain: {
    id: import.meta.env.VITE_APP_DEFAULT_CHAIN || Object.keys(config.chains)[0],
  },
  walletDialogOpen: false,
  challenges: {},
  hashes: {},
  fees: {},
  reserves: {},
  verificationProgress: IdentityVerificationStatuses.Unknown,
  alerts: {},
})

interface MainAlerts extends Alert {
  closable?: boolean;
}

export default function App() {
  const appStateSnapshot = useSnapshot(appState)
  
  const typedApi = useTypedApi({ chainId: appStateSnapshot.chain.id })

  // Osed to keep last identity data from chain
  const [onChainIdentity, setOnChainIdentity] = useState()
  const { calculateHash: calculateHashPrev } = useIdentityEncoder(onChainIdentity)
  const { calculateHash } = useIdentityEncoder(appStateSnapshot.identity)
  useEffect(() => {
    if (onChainIdentity) {
      const prevIdHash = calculateHashPrev();
      const curIdHash = calculateHash();
      import.meta.env.DEV && console.log({ prevIdHash, curIdHash })
      if (curIdHash !== prevIdHash) {
        appState.hashes = { ...appStateSnapshot.hashes, identity: prevIdHash }
      }
    }
  }, [onChainIdentity])

  const getIdAndJudgement = () => typedApi.query.Identity.IdentityOf
    .getValue(appState.account?.address)
    .then((result) => {
      if (!result) {
        appState.verificationProgress = IdentityVerificationStatuses.NoIdentity;
        return;
      }
      const identityOf = result[0];

      const identityData = Object.fromEntries(Object.entries(identityOf.info)
        .filter(([_, value]) => value?.type?.startsWith("Raw"))
        .map(([key, value]) => [key, value.value.asText()])
      );
      appState.identity = identityData;
      appState.verificationProgress = IdentityVerificationStatuses.IdentitySet;
      setOnChainIdentity(identityData);

      const idJudgementOfId = identityOf.judgements;
      const judgementData: typeof appState.judgements = idJudgementOfId.map((judgement) => ({
        registrar: {
          index: judgement[0],
        },
        state: judgement[1].type,
        fee: judgement[1].value,
      }));
      appState.judgements = judgementData;
      appState.verificationProgress = IdentityVerificationStatuses.JudgementRequested;

      if (judgementData.find(j => j.state === IdentityJudgement.FeePaid().type)) {
        appState.verificationProgress = IdentityVerificationStatuses.FeePaid;
      }
      if (judgementData.find(j => [
        IdentityJudgement.Reasonable().type,
        IdentityJudgement.KnownGood().type,
      ].includes(j.state))) {
        appState.verificationProgress = IdentityVerificationStatuses.IdentityVerified;
      }

      const idDeposit = identityOf.deposit;
      // TODO  Compue approximate reserve
      import.meta.env.DEV && console.log({
        identityOf,
        identityData,
        judgementData,
        idDeposit,
      });
    })
    .catch(e => {
      if (import.meta.env.DEV) {
        console.error("Couldn't get identityOf");
        console.error(e);
      }
    });
  useEffect(() => {
    if (appState.account?.address) {
      getIdAndJudgement()
    }
  }, [appState.account?.address])

  const chainClient = useClient({ chainId: appStateSnapshot.chain.id })

  //const [relevantBlocks, setRelevantBlocks] = useState([])
  const relevantBlocks = useRef([])

  const [eventSubs, setEventSubs] = useState({
    idSet: null,
    idCleared: null,
    judgRequested: null,
    judgGiven: null,
    extrinsics: null,
  })
  
  const getEventObserver = (type, id) => ({
    next(block) {
      const blockData = { block, callback: "next", type };
      import.meta.env.DEV && console.log(blockData)
      relevantBlocks.current.push(block)
      processBlock(blockData)
    },
    error(error) {
      import.meta.env.DEV && console.error({ error: error.message, callback: "error", type })
      import.meta.env.DEV && console.error(error)
    },
    complete(data) {
      import.meta.env.DEV && console.log({ data, callback: "complete", type })
    }
  })
  const handleChainEvent = ({type: { pallet, call }, onEvent, onError, id}) => {
    const type = `${pallet}.${call}`;
    typedApi.event[pallet][call].pull()
      .then(data => {
        data.filter(item => [item.payload.who, item.payload.target].includes(appStateSnapshot.account?.address))
          .forEach(item => {
            onEvent(item)
            import.meta.env.DEV && console.log({ data: item, type, })
          }
        )
      })
      .catch(error => {
        onError(error)
        import.meta.env.DEV && console.error({ message: error.message, type, })
        import.meta.env.DEV && console.error(error)
      })
  }
  const getEffectCallback = ({type: { pallet, call }, onEvent, onError, id}) => {
    return () => {
      if (!appStateSnapshot.chain.id || !appStateSnapshot.account?.address) {
        return
      }
      const timer = window.setInterval(() => {
        handleChainEvent({ type: { pallet, call }, id, onEvent, onError, })
      }, CHAIN_UPDATE_INTERVAL)
      return () => window.clearInterval(timer)
    }
  }

  useEffect(getEffectCallback({ type: { pallet: "Identity", call: "IdentitySet" }, id: "idSet",
    onEvent: data => {
      appState.verificationProgress = 
        // As we do batch calls, we need to know if judgeent is already awaiting
        appStateSnapshot.verificationProgress === IdentityVerificationStatuses.NoIdentity
          ? IdentityVerificationStatuses.IdentitySet
          : appStateSnapshot.verificationProgress
    },
    onError: error => {},
  }), [appStateSnapshot.chain.id, appStateSnapshot.account?.address,])
  
  useEffect(getEffectCallback({ type: { pallet: "Identity", call: "IdentityCleared" }, 
    id: "idCleared",
    onEvent: data => {
      appState.verificationProgress = IdentityVerificationStatuses.NoIdentity;
      appState.identity = null;
    },
    onError: error => {},
  }), [appStateSnapshot.chain.id, appStateSnapshot.account?.address,])
  
  useEffect(getEffectCallback({ type: { pallet: "Identity", call: "JudgementRequested" }, 
    id: "judgRequested",
    onEvent: data => {
      appState.verificationProgress = IdentityVerificationStatuses.JudgementRequested
    },
    onError: error => {},
  }), [appStateSnapshot.chain.id, appStateSnapshot.account?.address,])
  
  useEffect(getEffectCallback({ type: { pallet: "Identity", call: "JudgementGiven" }, 
    id: "judgRequested",
    onEvent: data => {
      getIdAndJudgement()
    },
    onError: error => {},
  }), [appStateSnapshot.chain.id, appStateSnapshot.account?.address,])

  const startExtrinsicsSub = () => {
    setEventSubs(es => {
      if (!es.extrinsics || es.extrinsics.close) {
        es.extrinsics = chainClient.bestBlocks$
          .pipe(
            mergeMap((blocks) =>
              Promise.all(
                blocks.map((block) =>
                  unstable_getBlockExtrinsics(chainClient, typedApi, block.hash).then(
                    (extrinsics) => ({ block, extrinsics }),
                  ),
                ),
              ),
            ),
          )
          .subscribe({
            ...getEventObserver("extrinsics"),
            next: (blocks) => {
              const newBlocks = new Map(blocks);
  
              for (const block of blocks) {
                if (block.extrinsics && block.block.hash) {
                  newBlocks.set(block.block.hash, block.extrinsics);
                }
                const matchingBlock = relevantBlocks.current.find(
                  (__block) => block.block.hash === __block.meta.block.hash
                );
                if (matchingBlock) {
                  matchingBlock.extrinsics = block.extrinsics
                  processBlock({ block: matchingBlock, type: "extrinsics" });
                  import.meta.env.DEV && console.log({ matchingBlock, block, relevantBlocks });
                }
              }
  
              import.meta.env.DEV && console.log({newBlocks});
            },
            error: (error) => {
              import.meta.env.DEV && console.error("block error", error);
              return startExtrinsicsSub();
            },
          });
      }
      return es;
    })
  };
  useEffect(() => {
    if (!appStateSnapshot.chain.id || !appStateSnapshot.account?.address) {
      return
    }

    startExtrinsicsSub();
    
    return () => {
      eventSubs.extrinsics?.unsubscribe()
    }
  }, [appStateSnapshot.chain.id, appStateSnapshot.account?.address, eventSubs.extrinsics])
  
  useEffect(() => {
    (async () => {
      if (appStateSnapshot.chain.id) {
        const chainSpecData = await chainClient._request("system_properties");
        import.meta.env.DEV && console.log({ chainSpecData, })
        appState.chain = { ...appStateSnapshot.chain, ...chainSpecData }
      }
    }) ()
  }, [appStateSnapshot.chain.id])
  
  // TODO Subscribe to events instead
  const timer = useRef<number>();
  useEffect(() => {
    if (appStateSnapshot.account) {
      timer.current = window.setInterval(async () => {
        const accData = await typedApi.query.System.Account.getValue(appStateSnapshot.account.address)
        const existentialDep = await typedApi.constants.Balances.ExistentialDeposit()
        import.meta.env.DEV && console.log({
          "System.Account": accData,
          "Balances.ExistentialDeposit": existentialDep,
        })
        appState.account.balance = accData.data
      }, CHAIN_UPDATE_INTERVAL)
    }
    return () => {
      window.clearInterval(timer.current);
    }
  }, [appStateSnapshot.account, appStateSnapshot.chain.id])

  const accounts = useAccounts()
  useEffect(() => {
    let account = localStorage.getItem("account");
    if (!account || accounts.length < 1) {
      return;
    }
    account = JSON.parse(account);
    const _account = accounts.find(ac => account.address === ac.address);
    account = { ...account, ..._account }
    import.meta.env.DEV && console.log({ account, })
    appState.account = account
  }, [accounts])

  const { push, remove } = useAlerts(proxy(appState.alerts))

  return <>
    <Router>
      <Routes>
        {routes.map((route) => (
          <Route
            path={route.path}
            key={route.path}
            element={<DomTitle route={route} />}
          />
        ))}
      </Routes>
    </Router>
    <ConnectionDialog open={appStateSnapshot.walletDialogOpen} 
      onClose={() => { appState.walletDialogOpen = false }} 
    />
  </>;
}
