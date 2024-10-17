import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { Suspense, createContext } from 'react';
import type { RouteType } from '~/routes';
import { routes } from '~/routes';

import { config } from "./api/config";
import { ChainProvider, ReactiveDotProvider } from "@reactive-dot/react";
import { proxy, useSnapshot } from 'valtio';

import { RpcWebSocketProvider, useRpcWebSocketProvider } from './api/WebSocketClient';

import { ConnectionDialog } from "dot-connect/react.js";


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
  },
  identity?: {
    displayName: string,
    matrix: string,
    discord: string,
    email: string,
    twitter: string,
  }
} = proxy({
  chain: Object.keys(config.chains)[0],
  walletDialogOpen: false,
})

export const AppContext = createContext({})

export default function App() {
  const appStateSnapshot = useSnapshot(appState)
  useRpcWebSocketProvider()

  useEffect(() => {
    const account = localStorage.getItem("account");
    if (!account) {
      return;
    }
    appState.account = JSON.parse(account)
  }, [])

  return (
    <AppContext.Provider value={proxy({  })}>
      <ReactiveDotProvider config={config}>
        <RpcWebSocketProvider>
            <ChainProvider chainId={config[appState.chain]}>
              <div className='dark:bg-black min-h-0px'>
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
              </div>
            </ChainProvider>
        </RpcWebSocketProvider>
      </ReactiveDotProvider>
    </AppContext.Provider>
  );
}
