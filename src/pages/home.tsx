import { ChainProvider, ReactiveDotProvider } from '@reactive-dot/react';
import { useProxy } from 'valtio/utils';
import { ConfigProvider, useConfig } from '~/api/config2';
import { IdentityRegistrarComponent } from '~/components/identity-registrar';
import { chainStore as _chainStore } from '~/store/ChainStore';

function Home() {
  return (
    <ConfigProvider>
      <HomeWrapper />
    </ConfigProvider>
  );
}

const HomeWrapper = () => {
  const { config } = useConfig();
  const chainStore = useProxy(_chainStore);

  return <>
    {config &&
      <ReactiveDotProvider config={config}>
        <ChainProvider chainId={chainStore.id}>
          <IdentityRegistrarComponent />
        </ChainProvider>
      </ReactiveDotProvider>
    }
  </>;
}

export default Home;
