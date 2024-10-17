import React, { useState, useEffect, useContext } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { createContext } from 'react';

type RpcWebSocketContextProps = {
  api?: ApiPromise,
  wsUrl: string | null,
  setWsUrl: (v: string | null) => void,
  isConnected: boolean,
  basicChainInfo: string,
  connect: () => void
}

const RpcWebSocketContext = createContext<RpcWebSocketContextProps>({
  wsUrl: null,
  setWsUrl: () => {},
  isConnected: false,
  basicChainInfo: "",
  connect: () => {}
});

export const RpcWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isConnected, setConnected] = useState(false);
  const [basicChainInfo, setBasicChainInfo] = useState('');

  const connect = async () => {
    if (!wsUrl) {
      console.error('No WebSocket URL provided');
      return;
    }

    console.log('Attempting to connect to WebSocket:', wsUrl);
    try {
      const provider = new WsProvider(wsUrl);
      const api = await ApiPromise.create({ provider });
      console.log('API created successfully');
      setApi(api);
      setConnected(true);

      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ]);
      console.log({ wsUrl, chain, nodeName, nodeVersion });
      setBasicChainInfo(`${chain} - ${nodeName} v${nodeVersion}`);
    } catch (error) {
      console.error('Connection failed', error);
      setConnected(false);
    }
  };

  useEffect(() => {
    if (wsUrl) {
      connect();
    }
    return () => {
      if (api) {
        console.log('Disconnecting API');
        api.disconnect();
      }
    };
  }, [wsUrl]);

  console.log('RpcWebSocketProvider render', { api, isConnected, basicChainInfo });

  return (
    <RpcWebSocketContext.Provider value={{ api, wsUrl, setWsUrl, connect, isConnected, basicChainInfo }}>
      {children}
    </RpcWebSocketContext.Provider>
  );
};

export const useRpcWebSocketProvider = () => {
  return useContext(RpcWebSocketContext);
};
