import { SS58String, TypedApi } from "polkadot-api";
import { useEffect, useMemo, useRef, useState } from "react";
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
      _pendingBlocks.current = []
    },  CHAIN_UPDATE_INTERVAL)
    return () => {
      window.clearInterval(timer)
      _pendingBlocks.current = []
    }
  }, [])

  // Since a single account is used, we can keep track of the last block per relevant event type. 
  // This way we can avoid processing the same event multiple times.
  const _lastBlockPerEvent = useRef({})
  const waitForEvent = ({ type: { pallet, call }, }) => {
    const type = `${pallet}.${call}`;
    const { onError } = handlers[type]
    typedApi.event[pallet][call].pull()
      .then(data => {
        if (data.length === 0) {
          return
        }
        if (import.meta.env.DEV) console.log({ data, type, address })
        data.filter(item => 
          [item.payload.who, item.payload.target].includes(address)
            && item.meta.block.number > (_lastBlockPerEvent.current[type] || 0)
        )
          .forEach(item => {
            _pendingBlocks.current.push({ ...item, type })
            _lastBlockPerEvent.current[type] = item.meta.block.number
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

  // Convert handlers to array and memoize
  const handlerEntries = useMemo(() => 
    Object.entries(handlers).map(([key, handler]) => {
      const [pallet, call] = key.split('.')
      return { pallet, call, handler }
    }), 
    [handlers]
  )
  
  // Single effect to handle all subscriptions
  useEffect(() => {
    const subscriptions = handlerEntries.map(({ pallet, call }) => 
      getEffectCallback({
        type: { pallet, call },
      })()
    )
  
    // Cleanup function
    return () => {
      subscriptions.forEach(cleanup => cleanup?.())
    }
  }, [chainId, address, handlerEntries])

  return { constants, }
}
