import { proxy } from 'valtio';

export interface Identity {
  displayName: string;
  matrix: string;
  email: string;
  discord: string;
  twitter: string;
  github: string;
  image: string;
  legal: string;
  web: string;
  pgpFingerprint?: string; // This is optional in the blockchain data
}

interface IdentityStore {
  identity: Identity;
  status: 'New' | 'Registered' | 'FeePaid';
  error: string | null;
  loading: boolean;
  setIdentity: (identity: Identity) => void;
  setStatus: (status: 'New' | 'Registered' | 'FeePaid') => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const identityStore = proxy<IdentityStore>({
  identity: {
    displayName: '',
    matrix: '',
    email: '',
    discord: '',
    twitter: '',
    github: '',
    image: '',
    legal: '',
    web: '',
    pgpFingerprint: undefined,
  },
  status: 'New',
  error: null,
  loading: false,
  setIdentity: (newIdentity) => {
    identityStore.identity = newIdentity;
  },
  setStatus: (newStatus) => {
    identityStore.status = newStatus;
  },
  setError: (newError) => {
    identityStore.error = newError;
  },
  setLoading: (isLoading) => {
    identityStore.loading = isLoading;
  }
});
