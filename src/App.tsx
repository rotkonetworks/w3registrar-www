import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { Suspense, createContext } from 'react';
import type { RouteType } from '~/routes';
import { routes } from '~/routes';

import { chainNames, config } from "./api/config";
import { ChainProvider, ReactiveDotProvider } from "@reactive-dot/react";
import { proxy, useSnapshot } from 'valtio';

import { RpcWebSocketProvider, useRpcWebSocketProvider } from './api/WebSocketClient';

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

export const appState = proxy({
  chain: chainNames.find(c => c.chainId === "people_rococo") || chainNames[0],
  wsUrl: "ws://localhost:46085",
})

export const AppContext = createContext({})

export default function App() {
  const appStateSnapshot = useSnapshot(appState)
  useRpcWebSocketProvider()

  return (
    <AppContext.Provider value={proxy({
      chain: chainNames.find(c => c.chainId === "people_rococo") || chainNames[0]
    })}>
      <ReactiveDotProvider config={config}>
        <RpcWebSocketProvider>
            <ChainProvider chainId={appStateSnapshot.chain.chainId}>
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
              </div>
            </ChainProvider>
        </RpcWebSocketProvider>
      </ReactiveDotProvider>
    </AppContext.Provider>
  );
}
