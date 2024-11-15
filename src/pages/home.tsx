import { ReactiveDotProvider } from '@reactive-dot/react';
import { ConfigProvider, useConfig } from '~/api/config2';
import { IdentityRegistrarComponent } from '~/components/identity-registrar';

function Home() {
  return (
    <ConfigProvider>
      <HomeWrapper />
    </ConfigProvider>
  );
}

const HomeWrapper = () => {
  const { config } = useConfig()

  return <>
    {config &&
      <ReactiveDotProvider config={config}>
        <IdentityRegistrarComponent />
      </ReactiveDotProvider>
    }
  </>;
}

export default Home;
