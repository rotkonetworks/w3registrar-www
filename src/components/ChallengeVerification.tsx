import React, { useEffect, useState, useRef } from 'react';
import CountdownTimer from './CountdownTimer';
import { useSnapshot } from 'valtio';
import { appState } from '~/App';

interface Challenge {
  verified: boolean;
  value: string;
}

interface Challenges {
  [key: string]: Challenge;
}

interface VerificationState {
  fields: { [key: string]: boolean };
}


interface Props {
  onVerify: (key: string) => void;
  onCancel: () => void;
  onProceed: () => void;
}

const ChallengeVerification: React.FC<Props> = ({ onVerify, onCancel, onProceed }) => {
  const appStateSnapshot = useSnapshot(appState);
  const { accountId } = appStateSnapshot;
  const [challenges, setChallenges] = useState<Challenges>({});
  const [verificationState, setVerificationState] = useState<VerificationState>({ fields: {} });


  const fieldNames: { [key: string]: string } = {
    displayName: 'Display Name',
    matrix: 'Matrix',
    email: 'Email',
    discord: 'Discord',
    twitter: 'Twitter',
  };

  const allVerified = Object.keys(verificationState.fields).length > 0 && Object.values(verificationState.fields).every((verified) => verified);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-stone-800">Challenge Verification</h2>
        <CountdownTimer />
      </div>
      {Object.entries(challenges).map(([key, challenge]) => {
        const isVerified = verificationState.fields[key] || false;
        return (
          <div
            key={key}
            className={`flex items-center space-x-2 px-3 py-2 ${
              isVerified ? 'bg-stone-200' : 'bg-yellow-100'
            }`}
          >
            <span className="w-24 text-sm font-semibold text-stone-700">{fieldNames[key]}:</span>
            <span className="flex-grow font-mono text-sm text-stone-800">{challenge.value}</span>
            {!isVerified ? (
              <button
                onClick={() => onVerify(key)}
                className="text-stone-600 hover:text-stone-800 font-semibold text-sm"
              >
                Verify
              </button>
            ) : (
              <span className="text-green-700 font-semibold text-sm">Verified</span>
            )}
          </div>
        );
      })}
      <div className="flex justify-between mt-6">
        <button
          onClick={onCancel}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 text-sm font-semibold transition duration-300"
        >
          Cancel
        </button>
        <button
          onClick={onProceed}
          className={`bg-stone-700 text-white py-2 px-4 text-sm font-semibold transition duration-300 ${
            allVerified ? 'hover:bg-stone-800' : 'opacity-50 cursor-not-allowed'
          }`}
          disabled={!allVerified}
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default ChallengeVerification;
