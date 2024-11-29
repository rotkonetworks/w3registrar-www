import { TypedApi } from "polkadot-api";
import { useEffect, useState } from "react";
import { CHAIN_UPDATE_INTERVAL } from "~/constants";
import { AccountData } from "~/store/AccountStore";
import { ChainInfo } from "~/store/ChainStore";

export const useChainRealTimeInfo = (
  typedApi: TypedApi, 
  chainStore: ChainInfo,
  accountStore: AccountData,
) => {
  const [ constants, setConstants ] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (typedApi) {
      (async () => {
        try {
          const constants = {
            byteDeposit: await typedApi.constants.Identity.ByteDeposit(),
            basicDeposit: await typedApi.constants.Identity.BasicDeposit(),
            existentialDeposit: await typedApi.constants.Balances.ExistentialDeposit(),
          }
          import.meta.env.DEV && console.log({ constants })
          setConstants(constants)
        } catch (e) {
          import.meta.env.DEV && console.error(e)
        }
      })()
    }
  }, [typedApi])

  const [_pendingBlocks, _setPendingBlocks] = useState()
  const handleChainEvent = ({ type: { pallet, call }, onEvent, onError }) => {
    const type = `${pallet}.${call}`;
    typedApi.event[pallet][call].pull()
      .then(data => {
        data.filter(item => [item.payload.who, item.payload.target].includes(accountStore.address))
          .forEach(item => {
            onEvent(item)
            import.meta.env.DEV && console.log({ data: item, type, })
          })
      })
      .catch(error => {
        onError(error)
        import.meta.env.DEV && console.error({ message: error.message, type, })
        import.meta.env.DEV && console.error(error)
      })
  }
  const getEffectCallback = ({ type: { pallet, call }, onEvent, onError }) => {
    return () => {
      if (!chainStore.id || !accountStore.address) {
        return
      }
      const timer = window.setInterval(() => {
        handleChainEvent({ type: { pallet, call }, onEvent, onError })
      }, CHAIN_UPDATE_INTERVAL)
      return () => window.clearInterval(timer)
    }
  }
  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "IdentitySet" },
    onEvent: data => {
      /* appState.verificationProgress =
        // As we do batch calls, we need to know if judgeent is already awaiting
        appStateSnapshot.verificationProgress === IdentityVerificationStatuses.NoIdentity
          ? IdentityVerificationStatuses.IdentitySet
          : appStateSnapshot.verificationProgress */
    },
    onError: error => { },
  }), [chainStore.id, accountStore.address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "IdentityCleared" },
    onEvent: data => {
      /* appState.verificationProgress = IdentityVerificationStatuses.NoIdentity;
      appState.identity = null; */
    },
    onError: error => { },
  }), [chainStore.id, accountStore.address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "JudgementRequested" },
    onEvent: data => {
      //appState.verificationProgress = IdentityVerificationStatuses.JudgementRequested
    },
    onError: error => { },
  }), [chainStore.id, accountStore.address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "JudgementGiven" },
    onEvent: data => {
      //getIdAndJudgement()
    },
    onError: error => { },
  }), [chainStore.id, accountStore.address])


  return [ constants, ]
}
