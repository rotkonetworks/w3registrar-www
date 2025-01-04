import { ChainProvider, ReactiveDotProvider } from '@reactive-dot/react';
import { useProxy } from 'valtio/utils';
import { IdentityRegistrarComponent } from '~/components/identity-registrar';
import { chainStore as _chainStore } from '~/store/ChainStore';
import { config } from '~/api/config';
import { Suspense } from 'react';
import { Loading } from './Loading';
import React from 'react';
import { ErrorBoundary } from '~/components/ErrorBoundary';

function Home() {
  const chainId = useProxy(_chainStore).id
  React.useEffect(() => {
    if (import.meta.env.DEV) console.log({ config });
  }, [config]);

  React.useEffect(() => {
    if (!Object.keys(config.chains).includes(chainId as string)) {
      _chainStore.id = import.meta.env.VITE_APP_DEFAULT_CHAIN;
    }
  }, [chainId]);
  
  return (
    <ErrorBoundary>
      <ReactiveDotProvider config={config}>
        <ChainProvider chainId={chainId}>
          <Suspense fallback={<Loading />}>
            <IdentityRegistrarComponent />
          </Suspense>
        </ChainProvider>
      </ReactiveDotProvider>
    </ErrorBoundary>
  );
}

export default Home;
