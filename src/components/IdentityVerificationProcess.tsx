import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './Header';
import ProgressBar from './ProgressBar';
import IdentityForm from './IdentityForm';
import ChallengeVerification from './ChallengeVerification';
import CompletionPage from './CompletionPage';
import { useSnapshot } from 'valtio';
import { appState } from '~/App';
import { getSs58AddressInfo } from 'polkadot-api';
import { IdentityVerificationStates } from '~/constants';

enum Stages {
  SetIdentityForm = 0,
  Challenges = 1,
  Congrats = 2,
}

const IdentityVerificationProcess = () => {
  const appStateSnap = useSnapshot(appState)

  const [stage, setStage] = useState(null);
  useEffect(() => {
    switch(appState.verificationProgress) {
      case IdentityVerificationStates.NoIdentity:
      case IdentityVerificationStates.IdentitySet:
        setStage(Stages.SetIdentityForm);
        return;
      case IdentityVerificationStates.JudgementRequested:
      case IdentityVerificationStates.FeePaid:
        setStage(Stages.Challenges);
        return;
      case IdentityVerificationStates.IdentityVerifid:
        setStage(Stages.Congrats);
        return;
      default:
        setStage(null);
        return;
    }
  }, [appState.verificationProgress]);

  const [challenges, setChallenges] = useState({
    displayName: false,
    matrix: { value: '', verified: false },
    email: { value: '', verified: false },
    discord: { value: '', verified: false },
    twitter: { value: '', verified: false }
  });

  const handleVerifyChallenge = (key) => {
    setChallenges(prev => ({
      ...prev,
      [key]: { ...prev[key], verified: true }
    }));
  };

  const handleCancel = () => {
    setStage(Stages.SetIdentityForm);
    setChallenges({
      displayName: false,
      matrix: { value: '', verified: false },
      email: { value: '', verified: false },
      discord: { value: '', verified: false },
      twitter: { value: '', verified: false }
    });
  };


  const handleBack = () => { setStage(n => n > 0 ? n - 1 : n); };
  const handleProceed = () => { setStage(n => n < 2 ? n + 1 : n); };

  const StageContent = () => {
    switch(stage) {
      case Stages.SetIdentityForm:
        return <IdentityForm handleProceed={handleProceed} />;
      case Stages.Challenges:
        return <ChallengeVerification
          onVerify={handleVerifyChallenge}
          onCancel={handleCancel}
          onProceed={handleProceed}
        />;
      case Stages.Congrats:
        return <CompletionPage />;
      default:
        return null;
    }
  };
  
  useEffect(() => {
    if (appStateSnap.account && import.meta.env.DEV) {
      const _ss58Info = getSs58AddressInfo(appStateSnap.account.address);
      console.log({ ss58Info: _ss58Info, })
    }
  }, [appStateSnap.account]) 

  const percentage = appStateSnap.verificationProgress / (Object.keys(IdentityVerificationStates).length / 2 -2) * 100
  useEffect(() => console.log({ percentage, 
    value: appStateSnap.verificationProgress,
    key: IdentityVerificationStates[appStateSnap.verificationProgress],
  }), [percentage])

  const canProceed = useMemo((() => 
    (stage <= Stages.SetIdentityForm 
      && appStateSnap.verificationProgress >= IdentityVerificationStates.JudgementRequested
    )
    || (stage <= Stages.Challenges 
      && appStateSnap.verificationProgress >= IdentityVerificationStates.IdentityVerifid  
    )
  ),
  [appStateSnap.verificationProgress, stage])

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white border border-stone-300">
      <Header />
      {appStateSnap.account && appStateSnap.verificationProgress !== IdentityVerificationStates.Unknown  && <>
        <ProgressBar progress={percentage} />
        <div className="flex flex-row justify-between">
          <button
            className="bg-stone-700 hover:bg-stone-800 text-white py-2 px-4 text-sm font-semibold transition duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed rounded border-none outline-none"
            onClick={handleBack}
            disabled={stage <= 0}
          >
            &lt; Previous
          </button>
          <button
            className="bg-stone-700 hover:bg-stone-800 text-white py-2 px-4 text-sm font-semibold transition duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed rounded border-none outline-none"
            onClick={handleProceed}
            disabled={stage >= 2 || !canProceed}
          >
            Next &gt;
          </button>
        </div>
        <StageContent />
      </>}
    </div>
  );

};

export default IdentityVerificationProcess;
