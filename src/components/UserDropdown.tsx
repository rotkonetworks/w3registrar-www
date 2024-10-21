import { useAccounts, useConnectedWallets, useWalletDisconnector, useWallets } from '@reactive-dot/react';
import { PolkadotIdenticon } from 'dot-identicon/react.js';
import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { appState } from '~/App';

const UserDropdown = () => {
  const [isOpen, setOpen] = useState(false);
  const [isAccountsOpen, setAccountsOpen] = useState(false);

  const connectedWallets = useConnectedWallets()
  const [_, disconnectWallet] = useWalletDisconnector()

  const appStateSnapshot = useSnapshot(appState)
  
  const handleClose = () => {
    setOpen(false)
    setAccountsOpen(false)
  }

  // testing for fetched from an API or passed as a prop
  const accounts = useAccounts()

  return (
    <div className="relative">
      {connectedWallets.length > 0 
        ?<>
          <button 
            onClick={() => setOpen(!isOpen)} 
            className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400 w-full text-left"
          >
            {appStateSnapshot.account?.address && <PolkadotIdenticon address={appStateSnapshot.account.address} />}
            {appStateSnapshot.identity?.displayName || appStateSnapshot.account?.name 
              || 'Please choose account'
            } ▼
          </button>
          {isOpen && (
            <div className="absolute left-0 mt-1 w-48 bg-white border border-stone-300 shadow-lg z-10">
              <button
                className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                onClick={() => { 
                  appState.walletDialogOpen = true 
                  handleClose()
                }}
              >
                Connect Wallets ({connectedWallets.length} connected)
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                onClick={() => {
                  setAccountsOpen(!isAccountsOpen);
                }}
              >
                Choose Account ▶
              </button>
              {appStateSnapshot.identity 
                && <button
                  className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                  onClick={() => {
                    appState.identity = null
                    handleClose()
                  }}
                >
                  Remove Identity
                </button>
              }
              <button
                className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                onClick={() => {
                  connectedWallets.forEach(w => disconnectWallet(w));
                  appState.account = null
                  appState.identity = null
                  localStorage.removeItem("account")
                  handleClose()
                }}
              >
                Logout
              </button>
            </div>
          )}
          {isAccountsOpen && (
            <div className="absolute left-48 top-0 w-48 bg-white border border-stone-300 shadow-lg z-20 max-h-60 overflow-y-auto">
              {accounts.map(({id, name, address, ...rest}) => (
                <button
                  key={id}
                  className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                  onClick={() => {
                    handleClose()
                    const account = { id, name, address, ...rest };
                    appState.account = account;
                    localStorage.setItem("account", JSON.stringify(account))
                  }}
                >
                  <PolkadotIdenticon address={address} />
                  &nbsp;
                  {name}
                  <br />
                  ({address.substring(0,4)}...{address.substring(address.length-4,address.length)})
                </button>
              ))}
            </div>
          )}
        </>
        :<button 
          onClick={() => {
            appState.walletDialogOpen = true;
            handleClose()
          }} 
          className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400 w-full text-left"
        >
          Log In
        </button>
      }
    </div>
  );
};

export default UserDropdown;
