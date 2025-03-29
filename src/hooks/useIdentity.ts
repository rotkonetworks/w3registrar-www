import { useCallback, useEffect } from "react";
import { useProxy } from "valtio/utils";
import { identityStore as _identityStore, verifyStatuses } from "~/store/IdentityStore";
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
  identityFormRef?: React.MutableRefObject<{ reset: () => void } | undefined>,
}) {
  const identityStore = useProxy(_identityStore);

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
    identityStore.deposit = null;
    identityStore.info = null;
    identityStore.status = verifyStatuses.Unknown;
    
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
    identityStore,
    fetchIdAndJudgement,
    prepareSetIdentityTx,
    prepareRequestJudgementTx,
    prepareClearIdentityTx,
  };
}
