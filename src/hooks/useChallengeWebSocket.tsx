import { SS58String } from 'polkadot-api';
import { useEffect, useCallback, useState, useRef } from 'react';
import { ChallengeStatus, ChallengeStore } from '~/store/challengesStore';
import { IdentityFormData, verifyStatuses } from '~/store/IdentityStore';
import { AlertProps } from './useAlerts';

// Types matching your Rust backend
type Data = {
  type: 'none' | 'raw' | 'blake_two_256' | 'sha_256' | 'keccak_256' | 'sha_three_256';
  value?: Uint8Array | [number, number, number, number];
};

// FIX Confllicts with IdentityFormData
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

type ResponsePayload = {
  AccountState: ResponseAccountState;
  Secret: string;
  VerificationResult: boolean;
};

type SubscribeAccountState = {
  network: string;
  account: string;
};

type Challenge = {
  done: boolean;
  name: string;
  token?: string;
}

type VerificationStateNew = {
  all_done: boolean;
  challenges: Record<string, Challenge>;
  created_at: string;
  updated_at: string;
  network: string;
}

type AccountStateMessage = {
  network: string;
  operation: 'set';
  type: 'AccountState';
  verification_state: VerificationStateNew;
}

type WebSocketMessage = { 
    type: 'SubscribeAccountState'; 
    payload: SubscribeAccountState 
  } | { 
    type: 'NotifyAccountState'; 
    payload: NotifyAccountState 
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
  challengeState: ResponseAccountState | null;
}

const useChallengeWebSocketWrapper = ({ 
  url, address, network, identityStore, addNotification
}: {
  url: string;
  address: SS58String;
  network: string;
  identityStore: { info: IdentityFormData, status: verifyStatuses };
  addNotification?: (alert: AlertProps | Omit<AlertProps, "key">) => void;
}) => {
  const challengeWebSocket = useChallengeWebSocket({ 
    url, 
    account: address,  
    network: network.split("_")[0], 
  });
  const { challengeState, error, isConnected, } = challengeWebSocket

  const [challenges, setChallenges] = useState<ChallengeStore>({});
  const idWsDeps = [challengeState, error, address, identityStore.info, network]
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ idWsDeps })
    if (error) {
      if (import.meta.env.DEV) console.error(error)
      return
    }
    if (idWsDeps.some((value) => value === undefined)) {
      return
    }
    if (import.meta.env.DEV) console.log({ challengeState })
    if (challengeState) {
      const {
        pending_challenges,
        verification_state: { fields: verifyState },
      } = challengeState;
      const pendingChallenges = Object.fromEntries(pending_challenges)

      const _challenges: ChallengeStore = {};
      Object.entries(verifyState)
        .filter(([key, value]) => pendingChallenges[key] || value)
        .forEach(([key, value]) => {
          let status;
          if (identityStore.status === verifyStatuses.IdentityVerified) {
            status = ChallengeStatus.Passed;
          } else {
            status = value ? ChallengeStatus.Passed : ChallengeStatus.Pending;
          }

          _challenges[key] = {
            type: "matrixChallenge",
            status,
            code: !value && pendingChallenges[key],
          };
        })
      setChallenges(_challenges)

      if (import.meta.env.DEV) console.log({
        origin: "challengeState",
        pendingChallenges,
        verifyState,
        challenges: _challenges,
      })
    }
  }, idWsDeps)

  return { challenges, error, isConnected, }
}

// TODO Rename as a generic WebSocket hook
const useChallengeWebSocket = (
  { url, account, network, onNotification }: UseIdentityWebSocketProps
): UseIdentityWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeState, setAccountState] = useState<ResponseAccountState | null>(null);
  
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

  // Note union of types for event.data. it's done because AccountStateMessage does not have `payload` field.
  type ChallengeMessageType = WebSocketMessage | AccountStateMessage;

  const handleMessage = useCallback((event: MessageEvent<ChallengeMessageType>) => {
    try {
      const message = JSON.parse(event.data as any) as ChallengeMessageType;
      if (import.meta.env.DEV) console.log({message})

      switch (message.type) {
        case 'JsonResult':
          if ('ok' === message.payload.type) {
            const response = message.payload.message.AccountState;
            if (response) {
              if (import.meta.env.DEV) console.log({ response })
              setAccountState({
                ...response,
                network: response.network || 'paseo'
              });
            }
          } else {
            setError(message.payload.message);
          }
          break;
          
        case 'AccountState': {
          // TODO Implement onNotification
          
          const verificationStateFields: Record<string, boolean> = {};
          const pendingChallenges: [string, string][] = [];
          
          // Extract verification states and pending challenges from the new format
          if (message.verification_state?.challenges) {
            Object.entries(message.verification_state.challenges).forEach(([key, value]: [string, any]) => {
              verificationStateFields[key] = value.done;
              if (!value.done && value.token) {
                pendingChallenges.push([key, value.token]);
              }
            });
          }

          setAccountState(prev => ({ 
            ...prev,
            verification_state: { fields: verificationStateFields },
            pending_challenges: pendingChallenges,
            network: message.network || network
          }));
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
    if (ws.current?.readyState === WebSocket.OPEN && account && network) {
      if (import.meta.env.DEV) console.log({ ws: ws.current, state: ws.current?.readyState, account, callback: "sendMessage<effect>" })
      // Subscribe to account state on connection
      sendMessage({
        type: 'SubscribeAccountState',
        payload: {account, network},
      }).catch(err => setError(err.message));
    }
  }, [account, network, sendMessage, ws.current?.readyState])

  return {
    isConnected,
    error,
    challengeState,
  };
};

export { useChallengeWebSocketWrapper as useChallengeWebSocket };
