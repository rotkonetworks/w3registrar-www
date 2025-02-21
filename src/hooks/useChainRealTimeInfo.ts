import { ChainDescriptorOf, Chains } from "@reactive-dot/core/internal.js";
import { SS58String, TypedApi } from "polkadot-api";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHAIN_UPDATE_INTERVAL } from "~/constants";
import { ApiStorage } from "~/types/api";

export const useChainRealTimeInfo = ({ typedApi, chainId, address, handlers }: {
  typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>;
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
  
  // Convert handlers to array and memoize
  const handlerEntries = useMemo(() => 
    Object.entries(handlers).map(([key, handler]) => {
      const [pallet, call] = key.split('.')
      return { pallet, call, handler }
    }), 
    [handlers]
  )

  useEffect(() => {
    const systemEventsSub = (typedApi.query.System.Events as ApiStorage)
      .watchValue("best").subscribe({
        next: (events) => {
          if (import.meta.env.DEV) console.log({ events })
        },
        error: (error) => {
          if (import.meta.env.DEV) console.error("Error fetching events", error)
        },
        complete: () => {
          if (import.meta.env.DEV) console.log({ event: "complete fetching events" })
        }
      })
    return () => {
      systemEventsSub.unsubscribe?.()
    }
  }, [typedApi])

  return { constants, }
}
