import { ChainProvider, ReactiveDotProvider } from '@reactive-dot/react';
import { useProxy } from 'valtio/utils';
import { IdentityRegistrarComponent } from '~/components/identity-registrar';
import { chainStore as _chainStore } from '~/store/ChainStore';
import { config } from '~/api/config';
import { useDeferredValue } from 'react';

function Home() {
  const chainId = useDeferredValue((useProxy(_chainStore)).id)
  
  return (
    <ReactiveDotProvider config={config}>
      <ChainProvider chainId={chainId}>
        <IdentityRegistrarComponent />
      </ChainProvider>
    </ReactiveDotProvider>
  );
}

export default Home;
