import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { Suspense, createContext } from 'react';
import type { RouteType } from '~/routes';
import { routes } from '~/routes';

import { chainNames, config } from "./api/config";
import { ChainProvider, ReactiveDotProvider } from "@reactive-dot/react";
import { proxy, useSnapshot } from 'valtio';


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
  chain: chainNames.find(c => c.chainId === "people_rococo"),
  wsUrl: "ws://localhost:46085",
})

export const AppContext = createContext({})

export default function App() {
  const appStateSnapshot = useSnapshot(appState)

  return (
    <AppContext.Provider value={proxy({ 
      chain: chainNames.find(c => c.chainId === "people_rococo")
    })}>
      <ReactiveDotProvider config={config}>
        <ChainProvider chainId={appStateSnapshot.chain.chainId}>
          <Suspense>
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
          </Suspense>
        </ChainProvider>
      </ReactiveDotProvider>
    </AppContext.Provider>
  );
}
