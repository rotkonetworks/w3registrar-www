import React, { useEffect, useCallback } from 'react';
import { useRpcWebSocketProvider } from '~/api/WebSocketClient';
import { useSnapshot } from 'valtio';
import { accountStore } from '~/store/accountStore';
import { identityStore, Identity } from '~/store/identityStore';
import IdentityForm from './IdentityForm';

interface IdentityFormContainerProps {
  onNextPage: () => void;
}

const IdentityFormContainer: React.FC<IdentityFormContainerProps> = ({ onNextPage }) => {
  const { api, isConnected } = useRpcWebSocketProvider();
  const { selectedAccount } = useSnapshot(accountStore);
  const { identity, status, error, loading } = useSnapshot(identityStore);

  const fetchIdentityData = useCallback(async () => {
    console.log('Fetching identity data', { api, isConnected, selectedAccount });
    if (!api || !isConnected) {
      console.log('API not available or not connected');
      identityStore.setLoading(false);
      identityStore.setError('API not connected');
      return;
    }

    if (!selectedAccount) {
      console.log('No account selected');
      identityStore.setLoading(false);
      identityStore.setError('No account selected');
      return;
    }
    try {
      console.log('Fetching identity data...');
      identityStore.setLoading(true);
      
      // Check if the query.Identity.IdentityOf method exists
      if (!api.query || !api.query.Identity || !api.query.Identity.IdentityOf) {
        console.error('api.query.Identity.IdentityOf is not available');
        identityStore.setError('Identity query not available');
        return;
      }

      const identityOf = await api.query.Identity.IdentityOf(selectedAccount);
      console.log('Identity data fetched:', identityOf);
      
      if (identityOf) {
        console.log('Identity found');
        const [registration, primaryUsername] = identityOf;
        const { info, judgements } = registration;

        const newIdentity: Identity = {
          displayName: info.display.value,
          matrix: info.matrix.value,
          email: info.email.value,
          discord: info.discord.value,
          twitter: info.twitter.value,
          github: info.github.value,
          image: info.image.value,
          legal: info.legal.value,
          web: info.web.value,
          pgpFingerprint: info.pgp_fingerprint ? Buffer.from(info.pgp_fingerprint).toString('hex') : undefined,
        };
        identityStore.setIdentity(newIdentity);

        const isFeePaid = judgements.some(([, judgement]) => judgement === 'FeePaid');
        identityStore.setStatus(isFeePaid ? 'FeePaid' : 'Registered');

        console.log('Parsed identity:', newIdentity);
        console.log('Primary username:', primaryUsername);
      } else {
        console.log('No identity found, setting default values');
        identityStore.setIdentity({
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
        });
        identityStore.setStatus('New');
      }
    } catch (err) {
      console.error('Error fetching identity:', err);
      identityStore.setError('Failed to fetch identity data');
    } finally {
      identityStore.setLoading(false);
    }
  }, [api, selectedAccount, isConnected]);

  useEffect(() => {
    console.log('Effect triggered, fetching identity data');
    fetchIdentityData();
  }, [fetchIdentityData]);

  const handleSubmit = useCallback(async () => {
    if (!api || !selectedAccount) {
      identityStore.setError('API or account not available');
      return;
    }

    try {
      // Note: This part may need to be adjusted based on how the API expects the data to be submitted
      const identityCall = api.tx.Identity.setIdentity({
        info: {
          display: { Raw: identity.displayName },
          matrix: { Raw: identity.matrix },
          email: { Raw: identity.email },
          discord: { Raw: identity.discord },
          twitter: { Raw: identity.twitter },
          github: { Raw: identity.github },
          image: { Raw: identity.image },
          legal: { Raw: identity.legal },
          web: { Raw: identity.web },
          pgp_fingerprint: identity.pgpFingerprint ? Buffer.from(identity.pgpFingerprint, 'hex') : null,
        }
      });

      const requestJudgementCall = api.tx.Identity.requestJudgement(0, 10);

      await api.tx.utility
        .batchAll([identityCall, requestJudgementCall])
        .signAndSend(selectedAccount);

      if (status === 'FeePaid') {
        onNextPage();
      } else {
        identityStore.setStatus('FeePaid');
      }
    } catch (err) {
      console.error('Error submitting identity:', err);
      identityStore.setError('Failed to submit identity');
    }
  }, [api, selectedAccount, identity, status, onNextPage]);

  console.log('Rendering IdentityFormContainer', { loading, identity, status, error });

  if (loading) {
    return <div className="text-center py-4">Loading identity data...</div>;
  }

  return (
    <IdentityForm
      identity={identity}
      setIdentity={identityStore.setIdentity}
      onSubmit={handleSubmit}
      error={error}
    />
  );
};

export default IdentityFormContainer;
