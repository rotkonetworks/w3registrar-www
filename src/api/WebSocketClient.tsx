import React, { useState, useEffect, useContext } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { createContext } from 'react';


type RpcWebSocketContextProps ={
  api?: ApiPromise,
  wsUrl: string,
  setWsUrl: (v: undefined) => void,
  isConnected: boolean,
  basicChainInfo: string,
  connect: () => void
}
const RpcWebSocketContext = createContext<RpcWebSocketContextProps>({
  wsUrl: import.meta.env.VITE_APP_DEFAULT_WS_URL,
  setWsUrl: (v) => void 0,
  isConnected: false,
  basicChainInfo: "",
  connect: () => {}
})

export const RpcWebSocketProvider = ({ children }) => {
  const [api, setApi] = useState(null);
  const {wsUrl, setWsUrl} = useRpcWebSocketProvider()
  const [isConnected, setConnected] = useState(false);
  const [basicChainInfo, setBasicChainInfo] = useState('');

  // Connect to the WebSocket and initialize the API
  const connect = async () => {
    try {
      const provider = new WsProvider(wsUrl);
      const api = await ApiPromise.create({ provider });
      setApi(api);
      setConnected(true);

      // Fetch chain info once connected
      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ]);
      console.log({ wsUrl, chain, nodeName, nodeVersion })

      setBasicChainInfo(`${chain} - ${nodeName} v${nodeVersion}`);
    } catch (error) {
      console.error('Connection failed', error);
      setConnected(false);
    }
  };

  useEffect(() => {
    if (!wsUrl) {
      return
    }
    connect()
  }, [wsUrl])

  // Disconnect API when component unmounts
  useEffect(() => {
    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, [api]);

  return <RpcWebSocketContext.Provider value={{ api, wsUrl, setWsUrl, connect, isConnected, basicChainInfo }}>
    {children}
  </RpcWebSocketContext.Provider>;
};
export const useRpcWebSocketProvider = () => {
  const contextData = useContext(RpcWebSocketContext)

  return contextData;
}
