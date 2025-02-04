import { useEffect, useCallback, useState, useRef } from 'react';

// Types matching your Rust backend
type Data = {
  type: 'none' | 'raw' | 'blake_two_256' | 'sha_256' | 'keccak_256' | 'sha_three_256';
  value?: Uint8Array | [number, number, number, number];
};

interface IdentityInfo {
  display: Data;
  legal: Data;
  web: Data;
  matrix: Data;
  email: Data;
  pgp_fingerprint?: Uint8Array;
  image: Data;
  twitter: Data;
  github: Data;
  discord: Data;
}

interface VerificationState {
  fields: Record<string, boolean>;
}

export interface NotifyAccountState {
  account: string;
  network?: string;
  info: IdentityInfo;
  verification_state: VerificationState;
}

interface ResponseAccountState {
  account: string;
  network?: string;
  hashed_info: string;
  verification_state: VerificationState;
  pending_challenges: [string, string][];
}

interface RequestVerificationSecret {
  account: string;
  field: string;
}

interface VerifyIdentity {
  account: string;
  field: string;
  challenge: string;
  network: string;
}

type ResponsePayload = {
  AccountState: ResponseAccountState;
  Secret: string;
  VerificationResult: boolean;
};

type SubscribeAccountState = {
  network: string;
  account: string;
};

type WebSocketMessage = { 
    type: 'SubscribeAccountState'; 
    payload: SubscribeAccountState 
  } | { 
    type: 'NotifyAccountState'; 
    payload: NotifyAccountState 
  } | { 
    type: 'RequestVerificationSecret'; 
    payload: RequestVerificationSecret 
  } | { 
    type: 'VerifyIdentity'; 
    payload: VerifyIdentity 
  } | { 
    type: 'JsonResult'; 
    payload: { 
      type: "ok", 
      message: ResponsePayload 
    } | { 
      type: "err", 
      message: string 
    } 
  };

interface VersionedMessage {
  version: string;
  type: string;
  payload: any;
}

interface UseIdentityWebSocketProps {
  url: string;
  account: string;
  network: string;
  onNotification?: (notification: NotifyAccountState) => void;
}

interface UseIdentityWebSocketReturn {
  isConnected: boolean;
  error: string | null;
  accountState: ResponseAccountState | null;
  requestVerificationSecret: (field: string) => Promise<string>;
  verifyIdentity: (field: string, secret: string) => Promise<boolean>;
}

export const useIdentityWebSocket = ({
  url,
  account,
  network,
  onNotification
}: UseIdentityWebSocketProps): UseIdentityWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<ResponseAccountState | null>(null);
  
  // Keep track of pending promises for responses
  const pendingRequests = useRef<Map<string, { 
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: number;
  }>>(new Map());

  const generateRequestId = () => Math.random().toString(36).substring(7);

  const sendMessage = useCallback((message: WebSocketMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }
      if (import.meta.env.DEV) console.log({ message, callback: "sendMessage" })

      const requestId = generateRequestId();
      const versionedMessage: VersionedMessage = {
        version: '1.0',
        ...message
      };

      // Set up timeout for response
      const timeout = window.setTimeout(() => {
        const request = pendingRequests.current.get(requestId);
        if (request) {
          request.reject(new Error('Request timeout'));
          pendingRequests.current.delete(requestId);
        }
      }, 30000);

      pendingRequests.current.set(requestId, { resolve, reject, timeout });
      ws.current.send(JSON.stringify(versionedMessage));
    });
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      if (import.meta.env.DEV) console.log({message})

      switch (message.type) {
        case 'JsonResult':
          if ('ok' === message.payload.type) {
            const response = message.payload.message.AccountState;
            if (response) {
              if (import.meta.env.DEV) console.log({ response })
              setAccountState({
                ...response,
                network: response.network || 'rococo'
              });
            }
          } else {
            setError(message.payload.message);
          }
          break;
          
        case 'NotifyAccountState':{
          const notifyPayload = { 
            ...message.payload,
            network: message.payload.network || 'rococo'
          };
          onNotification?.(notifyPayload);
          setAccountState(prev => ({ ...prev,
            verification_state: message.payload.verification_state,
            network: message.payload.network || 'rococo'
          }))
          break;
        }
      }

      // Resolve any pending requests
      for (const [requestId, { resolve, timeout }] of pendingRequests.current.entries()) {
        clearTimeout(timeout);
        resolve(message);
        pendingRequests.current.delete(requestId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse message');
    }
  }, [onNotification]);

  // Set up WebSocket connection
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ ws: ws.current, state: ws.current?.readyState })
    if (ws.current?.readyState === WebSocket.CONNECTING) {
      setIsConnected(false)
      return;
    }
    if (ws.current?.readyState === WebSocket.OPEN) {
      setIsConnected(true)
      return;
    }
    if (!ws.current?.readyState || ws.current?.readyState > WebSocket.OPEN) {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        if (import.meta.env.DEV) console.log({ callBack: "onopen" })
        setIsConnected(true);
        setError(null);
      };
      ws.current.onclose = (event) => {
        if (import.meta.env.DEV) console.log({ callBack: "onclose", code: event.code })
        setIsConnected(false);
      };
      ws.current.onerror = (error) => {
        if (import.meta.env.DEV) console.error(error)
        setError('WebSocket error occurred');
      };
      ws.current.onmessage = handleMessage;
    }
    
    return () => {
      // Important. Socket explicitly checked if open. so it won't get closed before ones that are
      //  connecting. ws.current in dependency array ensures updating on unmount. Otherwise, it's a
      //  mess to work with it, as too many connections may be opened in vain, or expected events
      //  may not really be fired as expected.
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.onopen = null
        ws.current.onerror = null
        ws.current.onmessage = null
        ws.current.close();
        // ws.current = null and any remaining cleanup happens on close handling.
      }
      if (ws.current?.readyState > WebSocket.OPEN) {
        ws.current = null
      }
    };
  }, [url, handleMessage, sendMessage, ws.current, ws.current?.readyState]);

  useEffect(() => {
    if (ws.current?.readyState === WebSocket.OPEN && account) {
      if (import.meta.env.DEV) console.log({ ws: ws.current, state: ws.current?.readyState, account, callback: "sendMessage<effect>" })
      // Subscribe to account state on connection
      sendMessage({
        type: 'SubscribeAccountState',
        payload: {account, network},
      }).catch(err => setError(err.message));
    }
  }, [account, network, sendMessage, ws.current?.readyState])

  const requestVerificationSecret = useCallback(async (field: string): Promise<string> => {
    const response = await sendMessage({
      type: 'RequestVerificationSecret',
      payload: { account, field }
    });

    if (response.type === 'JsonResult' && 'ok' === response.payload.type) {
      return response.payload.message.Secret;
    }
    throw new Error('Failed to get verification secret');
  }, [account, sendMessage]);

  const verifyIdentity = useCallback(async (field: string, secret: string): Promise<boolean> => {
    const internalFieldIds = {
      discord: "Discord",
      display_name: "Display name",
      email: "Email",
      matrix: "Matrix",
      twitter: "Twitter",
      github: "Github",
      legal: "Legal",
      web: "Website",
      pgp: "PGP Fingerprint",
    }
    const response = await sendMessage({
      type: 'VerifyIdentity',
      payload: { account, field: internalFieldIds[field], challenge: secret, network }
    });

    if (response.type === 'JsonResult' && 'ok' === response.payload.type) {
      return response.payload.message.VerificationResult;
    }
    throw new Error('Verification failed');
  }, [account, network, sendMessage]);

  return {
    isConnected,
    error,
    accountState,
    requestVerificationSecret,
    verifyIdentity
  };
};

