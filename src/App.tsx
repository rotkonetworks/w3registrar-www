import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { Suspense, createContext, useEffect, useRef, useState } from 'react';
import type { RouteType } from '~/routes';
import { routes } from '~/routes';

import { config } from "./api/config";
import { proxy, useSnapshot } from 'valtio';

import { ConnectionDialog } from "dot-connect/react.js";
import { useAccounts, useTypedApi } from '@reactive-dot/react';
import { PolkadotSigner } from 'polkadot-api';
import { CHAIN_UPDATE_INTERVAL } from './constants';
import { useIdentityEncoder } from './hooks/hashers/identity';


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

export const appState: {
  chain: string,
  walletDialogOpen: boolean,
  account?: {
    id: string,
    name: string,
    address: string,
    polkadotSigner: PolkadotSigner;
  },
  identity?: {
    displayName: string,
    matrix: string,
    discord: string,
    email: string,
    twitter: string,
  },
  stage: number,
  challenges: Record<string, {
    value: string,
    verified: boolean,
  }>,
  hashes: {
    identityOf?: Uint16Array,
  },
} = proxy({
  chain: Object.keys(config.chains)[0],
  walletDialogOpen: false,
  stage: 0,
  challenges: {
    matrix: { value: '', verified: false },
    email: { value: '', verified: false },
    discord: { value: '', verified: false },
    twitter: { value: '', verified: false }
  },
  hashes: {},
})

export const AppContext = createContext({})

export default function App() {
  const typedApi = useTypedApi({ chainId: "people_rococo" })

  const appStateSnapshot = useSnapshot(appState)

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
  }, [onChainIdentity, appStateSnapshot.identity])

  useEffect(() => {
    if (appState.account?.address) {
      typedApi.query.Identity.IdentityOf.getValue(appState.account?.address)
        .then(identityOf => {
          const identityData = Object.fromEntries(Object.entries(identityOf[0].info)
            .filter(([_, value]) => value?.type?.startsWith("Raw"))
            .map(([key, value]) => [key, value.value.asText()])
          );
          import.meta.env.DEV && console.log({
            identityOf,
            value: identityData
          })
          appState.identity = identityData
          setOnChainIdentity(identityData)
        })
        .catch(e => {
          if (import.meta.env.DEV) {
            console.error("Couldn't get identityOf")
            console.error(e)
          }
        })
    }
  }, [appState.account?.address])

  const chainClient = useClient({ chainId: "people_rococo" })
  
  const timer = useRef();
  useEffect(() => {
    if (appStateSnapshot.account) {
        import.meta.env.DEV && console.log({
          chainSpecData: {
            ss58Prefix: await typedApi.constants.System.SS58Prefix(),
            decimals: await chainClient._request("system_properties"),
          },
        })
      }, CHAIN_UPDATE_INTERVAL)
      return () => {
        clearInterval(timer.current);
      }
    }
  }, [appStateSnapshot.account])

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
