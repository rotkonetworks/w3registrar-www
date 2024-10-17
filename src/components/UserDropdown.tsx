import React, { useState, useCallback, useMemo } from 'react';
import { useAccounts } from '@reactive-dot/react';
import { PolkadotIdenticon } from 'dot-identicon/react.js';
import { useSnapshot } from 'valtio';
import { accountStore } from '~/store/accountStore';

interface UserDropdownProps {
  onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onLogout }) => {
  const { selectedAccount } = useSnapshot(accountStore);
  const accounts = useAccounts();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenWalletDialog = useCallback(() => {
    import('~/App').then(({ appState }) => {
      appState.walletDialogOpen = true;
    });
    setIsOpen(false);
  }, []);

  const handleSelectAccount = useCallback((address: string) => {
    accountStore.update(address);
    setIsOpen(false);
  }, []);

  const truncateAddress = useCallback((address: string): string => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }, []);

  const accountButtons = useMemo(() => accounts.map(({ id, name, address }) => (
    <button
      key={id}
      className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
      onClick={() => handleSelectAccount(address)}
    >
      <PolkadotIdenticon address={address} />
      &nbsp;
      {name || truncateAddress(address)}
    </button>
  )), [accounts, handleSelectAccount, truncateAddress]);

  if (!accounts.length) {
    return (
      <button 
        className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400"
        onClick={handleOpenWalletDialog}
      >
        Connect Wallet
      </button>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="relative">
        <button 
          className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400"
          onClick={() => setIsOpen(!isOpen)}
        >
          Login ▼
        </button>
        {isOpen && (
          <div className="absolute left-0 mt-1 w-48 bg-white border border-stone-300 shadow-lg z-10">
            <div className="py-1">
              <div className="px-4 py-2 text-sm font-medium text-stone-700">Select Account</div>
              {accountButtons}
            </div>
            <div className="border-t border-stone-200">
              <button
                className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                onClick={handleOpenWalletDialog}
              >
                Connect Another Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        {truncateAddress(selectedAccount)} ▼
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 bg-white border border-stone-300 shadow-lg z-10">
          <div className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
            Change Account
            <div className="absolute left-full top-0 w-48 bg-white border border-stone-300 shadow-lg z-20">
              {accountButtons}
            </div>
          </div>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
            onClick={handleOpenWalletDialog}
          >
            Connect Another Wallet
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
