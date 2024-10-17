import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { accountStore } from '~/store';
import Header from './Header';
import ProgressBar from './ProgressBar';
import IdentityFormContainer from './IdentityForm';
import ChallengeVerification from './ChallengeVerification';
import CompletionPage from './CompletionPage';

const IdentityVerificationProcess: React.FC = () => {
  const [stage, setStage] = useState(0);
  const { selectedAccount } = useSnapshot(accountStore);

  const [identity, setIdentity] = useState({
    displayName: '',
    matrix: '',
    email: '',
    discord: '',
    twitter: ''
  });
  const [challenges, setChallenges] = useState({
    displayName: false,
    matrix: { value: '', verified: false },
    email: { value: '', verified: false },
    discord: { value: '', verified: false },
    twitter: { value: '', verified: false }
  });

  const handleVerifyChallenge = (key: string) => {
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

  const handleSelectAccount = (account: string) => {
    accountStore.update(account);
  };

  const handleLogout = () => {
    accountStore.update('');
  };

  const renderStage = () => {
    switch(stage) {
      case 0:
        return <IdentityFormContainer onNextPage={() => setStage(1)} />;
      case 1:
        return <ChallengeVerification
          identity={identity}
          challenges={challenges}
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

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white border border-stone-300">
      <Header
        displayName={identity.displayName}
        onSelectAccount={handleSelectAccount}
        onLogout={handleLogout}
      />
      <ProgressBar progress={stage === 0 ? 0 : stage === 1 ? 50 : 100} />
      {renderStage()}
    </div>
  );
};

export default IdentityVerificationProcess;
