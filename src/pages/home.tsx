import { ChainProvider, ReactiveDotProvider } from '@reactive-dot/react';
import { useProxy } from 'valtio/utils';
import { IdentityRegistrarComponent } from '~/components/identity-registrar';
import { chainStore as _chainStore } from '~/store/ChainStore';
import { config } from '~/api/config';

function Home() {
  const chainStore = useProxy(_chainStore);
  
  return (
    <ReactiveDotProvider config={config}>
      <ChainProvider chainId={chainStore.id}>
        <IdentityRegistrarComponent />
      </ChainProvider>
    </ReactiveDotProvider>
  );
}

export default Home;
