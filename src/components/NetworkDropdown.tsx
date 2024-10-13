import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { chainNames } from '~/api/config';
import { appState } from '~/App';


const NetworkDropdown = ({  }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customWs, setCustomWs] = useState('');
  const appStateSnapshot = useSnapshot(appState)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400 w-full text-left"
      >
        {appStateSnapshot.chain.name} ▼
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-stone-300 shadow-lg z-10">
          {chainNames.map((net) => (
            <button
              key={net.chainId}
              className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
              onClick={() => {
                appState.chain = net
                if (net.chainId !== "custom") {
                  setIsOpen(false);
                }
              }}
            >
              {net.name}
            </button>
          ))}
          {appStateSnapshot.chain.chainId === 'custom' && (
            <>
              <input
                type="text"
                value={appStateSnapshot.wsUrl}
                onChange={(e) => appState.wsUrl = e.target.value}
                placeholder="Enter WebSocket URL"
                className="w-full px-4 py-2 text-sm border-t border-stone-300"
              />
              <span className='bg-warn'>
                You need to restart for this change to take effect.
              </span>
              <button className='btn btn-primary' onClick={() => {
                localStorage.wsUrl = appState.wsUrl
                window.location.reload()
              }}>Reload</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkDropdown;
