import { TypedApi } from "polkadot-api";
import { useEffect, useState } from "react";
import { CHAIN_UPDATE_INTERVAL } from "~/constants";
import { AccountData } from "~/store/AccountStore";
import { ChainInfo } from "~/store/ChainStore";

export const useChainRealTimeInfo = ({
  typedApi,
  chainStore,
  accountStore,
  handlers,
}: {
  typedApi: TypedApi<ChainId>;
  chainStore: ChainInfo;
  accountStore: AccountData;
  handlers: Record<string, {
    onEvent: (data: any) => void;
    onError?: (error: Error) => void;
  }>
}) => {  
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
  const handleChainEvent = ({ type: { pallet, call }, }) => {
    const type = `${pallet}.${call}`;
    const { onEvent, onError } = handlers[type]
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
  const getEffectCallback = ({ type: { pallet, call }, }) => {
    return () => {
      if (!chainStore.id || !accountStore.address) {
        return
      }
      const timer = window.setInterval(() => {
        handleChainEvent({ type: { pallet, call }, })
      }, CHAIN_UPDATE_INTERVAL)
      return () => window.clearInterval(timer)
    }
  }
  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "IdentitySet" },
  }), [chainStore.id, accountStore.address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "IdentityCleared" },
  }), [chainStore.id, accountStore.address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "JudgementRequested" },
  }), [chainStore.id, accountStore.address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "JudgementGiven" },
  }), [chainStore.id, accountStore.address])


  return [ constants, ]
}
