import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { useRpcWebSocketProvider } from '~/api/WebSocketClient';
import { appState } from '~/App';
import IdentityVerificationProcess from '~/components/IdentityVerificationProcess';

function Home() {
  const appStateSnapshot = useSnapshot(appState)
  const {api} = useRpcWebSocketProvider()

  useEffect(() => {
    console.log({ api, address: appStateSnapshot.account?.address })
    if (!appStateSnapshot.account?.address || !api) {
      return;
    }
    api.query.identity.identityOf(appStateSnapshot.account.address).then(response => {
      console.log({ 
        identityOf: response.toJSON()
      })
    })
  }, [appStateSnapshot.account?.address, api])

  return (
      <IdentityVerificationProcess />
  );
}

export default Home;
