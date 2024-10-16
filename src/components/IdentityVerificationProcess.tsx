import { useState } from 'react';
import Header from './Header';
import ProgressBar from './ProgressBar';
import IdentityForm from './IdentityForm';
import ChallengeVerification from './ChallengeVerification';
import CompletionPage from './CompletionPage';

import { useAccounts } from "@reactive-dot/react";

import {
  useConnectedWallets,
  useWallets,
  useWalletConnector,
  useWalletDisconnector,
} from "@reactive-dot/react";

export function Wallets() {
  const wallets = useWallets();
  const connectedWallets = useConnectedWallets();

  const [_, connectWallet] = useWalletConnector();
  const [__, disconnectWallet] = useWalletDisconnector();

  return (
    <section>
      <header>
        <h3>Wallet connection</h3>
      </header>
      <article>
        <h4>Wallets</h4>
        <ul>
          {wallets.map((wallet) => (
            <li key={wallet.id}>
              <div>{wallet.name}</div>
              <div>
                {connectedWallets.includes(wallet) ? (
                  <button onClick={() => disconnectWallet(wallet)}>
                    Disconnect
                  </button>
                ) : (
                  <button onClick={() => connectWallet(wallet)}>Connect</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export function Accounts() {
  const accounts = useAccounts();

  return (
    <section>
      <header>
        <h3>Accounts</h3>
      </header>
      <ul>
        {accounts.map((account, index) => (
          <li key={index}>
            <div>{account.address}</div>
            <div>{account.name}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const IdentityVerificationProcess = () => {
  const [stage, setStage] = useState(0);
  
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
  const [error, setError] = useState('');

  const handleSubmitIdentity = () => {
    if (identity.displayName.trim() === '') {
      setError('Display Name is required');
      return;
    }
    setStage(1);
    setChallenges(prev => ({
      displayName: true,
      ...Object.entries(identity).reduce((acc, [key, value]) => {
        if (key !== 'displayName' && value.trim() !== '') {
          acc[key] = { value: Math.random().toString(36).substring(2, 10), verified: false };
        }
        return acc;
      }, {} as typeof prev)
    }));
  };

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
        return <IdentityForm
          identity={identity}
          setIdentity={setIdentity}
          onSubmit={handleSubmitIdentity}
          error={error}
        />;
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
        onRemoveIdentity={handleRemoveIdentity}
        onLogout={handleLogout}
      />
      <ProgressBar progress={stage === 0 ? 0 : stage === 1 ? 50 : 100} />
      {renderStage()}
      <Accounts />
    </div>
  );
};

export default IdentityVerificationProcess;
