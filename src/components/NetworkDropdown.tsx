import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { config } from '~/api/config';
import { useRpcWebSocketProvider } from '~/api/WebSocketClient';
import { appState } from '~/App';


const NetworkDropdown = ({  }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Backing field for typing debounce
  const [_wsUrl, _setWsUrl] = useState("")
  // Real value that is actually used to set up WebSocket connection.
  const {wsUrl, setWsUrl} = useRpcWebSocketProvider()
  const appStateSnapshot = useSnapshot(appState)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400 w-full text-left"
      >
        {!wsUrl ? config.chains[appStateSnapshot.chain].name : "Custom"} ▼
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-stone-300 shadow-lg z-10">
          {Object.entries(config.chains).map(([key, net]) => (
            <button
              key={key}
              className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
              onClick={() => {
                appState.chain = key
                _setWsUrl("")
                setWsUrl(null)
                setIsOpen(false);
              }}
            >
              {net.name}
            </button>
          ))}
          <button
            key={"custom"}
            className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
            onClick={() => {
              setWsUrl(import.meta.env.VITE_APP_DEFAULT_WS_URL)
              _setWsUrl(import.meta.env.VITE_APP_DEFAULT_WS_URL)
            }}
          >
            Custom
          </button>
          {wsUrl && (
            <>
              <input
                type="text"
                value={_wsUrl}
                onChange={(e) => _setWsUrl(e.target.value)}
                onBlur={(e) => setWsUrl(e.target.value)}
                placeholder="Enter WebSocket URL"
                className="w-full px-4 py-2 text-sm border-t border-stone-300"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkDropdown;
