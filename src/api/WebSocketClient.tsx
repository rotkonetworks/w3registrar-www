import React, { useState, useEffect, useContext } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { createContext } from 'react';


const RpcWebSocketContext = createContext({})

export const RpcWebSocketProvider = ({ children }) => {
  const [api, setApi] = useState(null);
  const [wsUrl, setWsUrl] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [chainInfo, setChainInfo] = useState('');

  // Connect to the WebSocket and initialize the API
  const connect = async () => {
    try {
      const provider = new WsProvider(wsUrl);
      const api = await ApiPromise.create({ provider });
      setApi(api);
      setIsConnected(true);

      // Fetch chain info once connected
      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ]);
      console.log({ wsUrl, chain, nodeName, nodeVersion })

      setChainInfo(`${chain} - ${nodeName} v${nodeVersion}`);
    } catch (error) {
      console.error('Connection failed', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    setWsUrl(import.meta.env.VITE_APP_DEFAULT_WS_URL)
  }, [])

  useEffect(() => {
    if (!wsUrl) {
      return
    }
    console.log({ wsUrl })
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

  return <RpcWebSocketContext.Provider value={{ api, wsUrl, setWsUrl, connect, isConnected, chainInfo }}>
    {children}
  </RpcWebSocketContext.Provider>;
};
export const useRpcWebSocketProvider = () => {
  const contextData = useContext(RpcWebSocketContext)

  return contextData;
}
