import React from 'react';
import { Identity } from '~/store/identityStore';

interface Props {
  identity: Identity | undefined;
  setIdentity: (identity: Identity) => void;
  onSubmit: () => void;
  error?: string | null;
}

const IdentityForm: React.FC<Props> = ({ identity, setIdentity, onSubmit, error }) => {
  const handleChange = (key: keyof Identity, value: string) => {
    setIdentity({ ...identity, [key]: value } as Identity);
  };

  const fieldNames: { [key in keyof Identity]: string } = {
    displayName: 'Display Name',
    matrix: 'Matrix',
    email: 'Email',
    discord: 'Discord',
    twitter: 'Twitter'
  };

  const placeholders: { [key in keyof Identity]: string } = {
    displayName: 'Alice',
    matrix: '@alice:matrix.org',
    email: 'alice@w3reg.org',
    discord: 'alice#123',
    twitter: '@alice'
  };

  if (!identity) {
    return <div>Loading identity...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4 text-stone-800">Identity</h2>
      {Object.entries(fieldNames).map(([key, label]) => (
        <div key={key} className="flex flex-col">
          <label className="text-sm text-stone-600 mb-1">{label}</label>
          <input
            type="text"
            value={identity[key as keyof Identity] || ''}
            onChange={(e) => handleChange(key as keyof Identity, e.target.value)}
            placeholder={placeholders[key as keyof Identity]}
            className="border-b border-stone-400 px-0 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-600 placeholder-stone-400"
            required={key === 'displayName'}
          />
        </div>
      ))}
      {error && <p className="text-red-700 text-sm">{error}</p>}
      <button
        onClick={onSubmit}
        className="mt-6 w-full bg-stone-700 hover:bg-stone-800 text-white py-2 text-sm font-semibold transition duration-300"
      >
        Submit
      </button>
    </div>
  );
};

export default IdentityForm;
