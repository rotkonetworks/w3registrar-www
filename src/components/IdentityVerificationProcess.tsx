import { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import ProgressBar from './ProgressBar';
import IdentityForm from './IdentityForm';
import ChallengeVerification from './ChallengeVerification';
import CompletionPage from './CompletionPage';
import { useSnapshot } from 'valtio';
import { appState } from '~/App';
import { SignerProvider } from '@reactive-dot/react';
import { useIdentityEncoder } from '~/hashers/identity';
import { getSs58AddressInfo } from 'polkadot-api';


const IdentityVerificationProcess = () => {
  const [stage, setStage] = useState(0);
  
  const [challenges, setChallenges] = useState({
    displayName: false,
    matrix: { value: '', verified: false },
    email: { value: '', verified: false },
    discord: { value: '', verified: false },
    twitter: { value: '', verified: false }
  });
  const [error, setError] = useState('');

  const handleVerifyChallenge = (key) => {
    setChallenges(prev => ({
      ...prev,
      [key]: { ...prev[key], verified: true }
    }));
  };

  const handleCancel = () => {
    setStage(0);
    setChallenges({
      displayName: false,
      matrix: { value: '', verified: false },
      email: { value: '', verified: false },
      discord: { value: '', verified: false },
      twitter: { value: '', verified: false }
    });
  };

  const handleProceed = () => {
    setStage(2);
  };

  const handleSelectAccount = (account) => {
    console.log(`Selected account: ${account}`);
    // Implement account selection logic here
  };

  const handleRemoveIdentity = () => {
    console.log('Removing identity');
    // Implement identity removal logic here
  };

  const handleLogout = () => {
    console.log('Logging out');
    // Implement logout logic here
  };

  const renderStage = () => {
    switch(stage) {
      case 0:
        return <IdentityForm />;
      case 1:
        return <ChallengeVerification
          onVerify={handleVerifyChallenge}
          onCancel={handleCancel}
          onProceed={handleProceed}
        />;
      case 2:
        return <CompletionPage />;
      default:
        return null;
    }
  };
  
  const appStateSnap = useSnapshot(appState)
  const ss58Info = useMemo(() => {
    if (appStateSnap.account) {
      return getSs58AddressInfo(appStateSnap.account.address);
    }
  }, [appStateSnap.account]) 
  useEffect(() => {
    if (appStateSnap.account) {
      const _ss58Info = getSs58AddressInfo(appStateSnap.account.address);
      console.log({ ss58Info: _ss58Info, })
    }
  }, [appStateSnap.account]) 

  const identityEncoder = useIdentityEncoder({
    accountId: ss58Info?.publicKey
  })

  useEffect(() => {
    if (appStateSnap.identity) {
      const encoded = identityEncoder.encodeFields(appStateSnap.identity);
      console.log({ 
        encoded: encoded,
        hash: identityEncoder.calculateHash(encoded),
      })
    }
  }, [appStateSnap.identity])

  if (appStateSnap.account) {
    return (
      <SignerProvider signer={appStateSnap.account?.polkadotSigner}>
        <div className="w-full max-w-3xl mx-auto p-6 bg-white border border-stone-300">
          <Header />
          <ProgressBar progress={stage === 0 ? 0 : stage === 1 ? 50 : 100} />
          {renderStage()}
        </div>
      </SignerProvider>
    );
  }

};

export default IdentityVerificationProcess;
