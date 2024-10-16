import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { appState } from '~/App';

interface Identity {
  [key: string]: string;
}

const IdentityForm: React.FC = () => {
  const [_identity, _setIdentity] = useState({
    displayName: '',
    matrix: '',
    email: '',
    discord: '',
    twitter: ''
  });
  const validators = {
    displayName: (v) => v.length < 3 && "At least 3 characters" , // not required
    matrix: ((v: string) => !/@[A-Z0-9._=-]+:[A-Z0-9.-]+\.[A-Z]{2,}/i.test(v)),
    email: (v: string) => !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v),
    discord: (v: string) => !/^[a-z0-9]+#\d{4}$/.test(v),
    twitter: (v: string) => !/^@?(\w){1,15}$/.test(v),
  }
  const [errors, setErrors] = useState({
    displayName: "At least 3 characters",
    matrix: true,
    email: true,
    discord: true,
    twitter: true,
  })

  const appStateSnapshot = useSnapshot(appState);

  const handleChange = (key: string, value: string) => {
    _setIdentity(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: validators[key](value) }));
  };
  const handleSubmitIdentity = () => {
    appState.stage = 1;
    appState.challenges = {
      ...Object.entries(appStateSnapshot.identity).reduce((acc, [key, value]) => {
        acc[key] = { value: Math.random().toString(36).substring(2, 10), verified: false };
        return acc;
      }, {})
    }
  };

  const fieldNames: { [key: string]: string } = {
    displayName: 'Display Name',
    matrix: 'Matrix',
    email: 'Email',
    discord: 'Discord',
    twitter: 'Twitter'
  };

  const placeholders: { [key: string]: string } = {
    displayName: 'Alice',
    matrix: '@alice:matrix.org',
    email: 'alice@w3reg.org',
    discord: 'alice#123',
    twitter: '@alice'
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4 text-stone-800">Identity</h2>
      {Object.entries(_identity).map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <label className="text-sm text-stone-600 mb-1">{fieldNames[key]}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholders[key]}
            className="border-b border-stone-400 px-0 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-600 placeholder-stone-400"
            required={key === 'displayName'}
          />
          {errors[key] && <p className="text-red-700 text-sm">{typeof errors[key] === "boolean"
            ? <>Invalid format for {fieldNames[key]}</>
            : errors[key]
          }</p>}
        </div>
      ))}
      <button
        onClick={handleSubmitIdentity}
        className="mt-6 w-full bg-stone-700 hover:bg-stone-800 text-white py-2 text-sm font-semibold transition duration-300"
        disabled={Object.values(errors).filter(v => v).length > 0}
      >
        Submit
      </button>
    </div>
  );
};

export default IdentityForm;
