import { useCallback, useEffect, useState } from "react";
import { IdentityStore, verifyStatuses } from "~/store/IdentityStore";
import { TypedApi } from "polkadot-api";
import { fetchIdentity } from "~/utils/fetchIdentity";
import { SS58String } from "polkadot-api";
import { ApiTx } from "~/types/api";
import { IdentityFormData } from "~/components/tabs/IdentityForm";
import { ChainDescriptorOf } from "@reactive-dot/core/internal.js";
import { ChainId } from "@reactive-dot/core";

export function useIdentity({ typedApi, address, identityFormRef, }: {
  typedApi: TypedApi<ChainDescriptorOf<ChainId>>,
  address: SS58String,
}) {
  // Please note _setIdentityStore is only for internal state management and does not set on-chain 
  //  identity. if you're looking to set on-chain identity, see IdentityForm.tsx for the transaction
  //  preparation methods.
  const _blankIdentity = {
    info: {},
    judgements: [],
    status: verifyStatuses.Unknown,
  };
  const [identity, _setIdentity] = useState<IdentityStore>(_blankIdentity);

  const fetchIdAndJudgement = useCallback(async () => {
    try {
      const identityInfo = await fetchIdentity(typedApi, address);
      
      // Update the identity store with the fetched information
      Object.assign(identityStore, identityInfo);
      
      if (identityFormRef?.current) {
        identityFormRef.current.reset();
      }
      
      return identityInfo;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching identity info:", error);
      }
      return null;
    }
  }, [address, typedApi, identityFormRef]);

  useEffect(() => {
    _setIdentity({ ..._blankIdentity });
    
    if (address) {
      fetchIdAndJudgement();
    }
  }, [address, fetchIdAndJudgement]);

  // Transaction preparation methods
  const prepareSetIdentityTx = useCallback((identityData: IdentityFormData): ApiTx => {
    return typedApi.tx.Identity.set_identity({ info: identityData });
  }, [typedApi]);

  const prepareRequestJudgementTx = useCallback((regIndex: number, maxFee: bigint = 0n): ApiTx => {
    return typedApi.tx.Identity.request_judgement({ reg_index: regIndex, max_fee: maxFee });
  }, [typedApi]);

  const prepareClearIdentityTx = useCallback((): ApiTx => {
    return typedApi.tx.Identity.clear_identity({});
  }, [typedApi]);

  return {
    identityStore: identity,
    fetchIdAndJudgement,
    prepareSetIdentityTx,
    prepareRequestJudgementTx,
    prepareClearIdentityTx,
  };
}
