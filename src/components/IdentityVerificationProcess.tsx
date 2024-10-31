import { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import ProgressBar from './ProgressBar';
import IdentityForm from './IdentityForm';
import ChallengeVerification from './ChallengeVerification';
import CompletionPage from './CompletionPage';
import { useSnapshot } from 'valtio';
import { appState } from '~/App';
import { useIdentityEncoder } from '~/hooks/hashers/identity';
import { getSs58AddressInfo } from 'polkadot-api';
import { IdentityVerificationStates } from '~/constants';

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

  const renderStage = () => {
    switch(appState.verificationProgress) {
      case IdentityVerificationStates.Unknown:
      case IdentityVerificationStates.NoIdentity:
      case IdentityVerificationStates.IdentitySet:
      case IdentityVerificationStates.JudgementRequested:
        return <IdentityForm />;
      case IdentityVerificationStates.FeePaid:
        return <ChallengeVerification
          onVerify={handleVerifyChallenge}
          onCancel={handleCancel}
          onProceed={handleProceed}
        />;
      case IdentityVerificationStates.IdentityVerifid:
        return <CompletionPage />;
      default:
        return null;
    }
  };
  
  const appStateSnap = useSnapshot(appState)
  useEffect(() => {
    if (appStateSnap.account && import.meta.env.DEV) {
      const _ss58Info = getSs58AddressInfo(appStateSnap.account.address);
      console.log({ ss58Info: _ss58Info, })
    }
  }, [appStateSnap.account]) 

  const identityEncoder = useIdentityEncoder(appStateSnap.identity)
  const percentage = appStateSnap.verificationProgress / (Object.keys(IdentityVerificationStates).length / 2 -2) * 100
  useEffect(() => console.log({ percentage, 
    value: appStateSnap.verificationProgress,
    key: IdentityVerificationStates[appStateSnap.verificationProgress],
  }), [percentage])

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white border border-stone-300">
      <Header />
      {appStateSnap.verificationProgress !== IdentityVerificationStates.Unknown 
        && <ProgressBar progress={percentage} />
      }
      {appStateSnap.account && renderStage()}
    </div>
  );

};

export default IdentityVerificationProcess;
