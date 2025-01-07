import { SS58String, TypedApi } from "polkadot-api";
import { useEffect, useRef, useState } from "react";
import { CHAIN_UPDATE_INTERVAL } from "~/constants";

export const useChainRealTimeInfo = ({ typedApi, chainId, address, handlers, }: {
  typedApi: TypedApi<ChainId>;
  chainId: string | number | symbol;
  address: SS58String;
  handlers: Record<string, {
    onEvent: (data: any) => void;
    onError?: (error: Error) => void;
    priority: number;
  }>
}) => {  
  const [ constants, setConstants ] = useState<Record<string, any>>({});
  useEffect(() => {
    if (import.meta.env.DEV) console.log(constants)
  }, [constants])
  
  useEffect(() => {
    if (typedApi) {
      (async () => {
        try {
          const constants = {
            byteDeposit: await typedApi.constants.Identity.ByteDeposit(),
            basicDeposit: await typedApi.constants.Identity.BasicDeposit(),
            existentialDeposit: await typedApi.constants.Balances.ExistentialDeposit(),
          }
          if (import.meta.env.DEV) console.log({ constants })
          setConstants(constants)
        } catch (e) {
          if (import.meta.env.DEV) console.error(e)
        }
      })()
    }
  }, [typedApi])

  const _pendingBlocks = useRef([])
  useEffect(() => {
    const timer = window.setInterval(() => {
      [..._pendingBlocks.current]
        .sort((b1, b2) => 
          b2.neta.block.number*100 + handlers[b2.type].priority - b1.neta.block.number*100 + handlers[b1.type].priority 
        )
        .forEach(block => {
          handlers[block.type].onEvent(block)
          if (import.meta.env.DEV) console.log({ block, })
        })
      ;
      _pendingBlocks.current.splice(0, _pendingBlocks.current.length)
    },  CHAIN_UPDATE_INTERVAL)
    return () => {
      window.clearInterval(timer)
      _pendingBlocks.current.splice(0, _pendingBlocks.current.length)
    }
  }, [])

  const waitForEvent = ({ type: { pallet, call }, }) => {
    const type = `${pallet}.${call}`;
    const { onError } = handlers[type]
    typedApi.event[pallet][call].pull()
      .then(data => {
        if (data.length === 0) {
          return
        }
        if (import.meta.env.DEV) console.log({ data, type, address })
        data.filter(item => [item.payload.who, item.payload.target].includes(address))
          .forEach(item => {
            _pendingBlocks.current.push({ ...item, type })
          })
      })
      .catch(error => {
        onError(error)
        if (import.meta.env.DEV) console.error({ message: error.message, type, })
        if (import.meta.env.DEV) console.error(error)
      })
  }
  const getEffectCallback = ({ type: { pallet, call }, }) => {
    return () => {
      if (!chainId || !address) {
        return
      }
      const timer = window.setInterval(() => {
        waitForEvent({ type: { pallet, call }, })
      }, CHAIN_UPDATE_INTERVAL)
      return () => window.clearInterval(timer)
    }
  }
  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "IdentitySet" },
  }), [chainId, address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "IdentityCleared" },
  }), [chainId, address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "JudgementRequested" },
  }), [chainId, address])

  useEffect(getEffectCallback({
    type: { pallet: "Identity", call: "JudgementGiven" },
  }), [chainId, address])

  return { constants, }
}
