import { TypedApi } from "polkadot-api";
import { useEffect, useRef, useState } from "react";
import { CHAIN_UPDATE_INTERVAL } from "~/constants";
import { AccountData } from "~/store/AccountStore";
import { ChainInfo } from "~/store/ChainStore";

export const useChainRealTimeInfo = ({
  typedApi,
  chainId,
  address,
  handlers,
}: {
  typedApi: TypedApi<ChainId>;
  chainId: string;
  address: string;
  handlers: Record<string, {
    onEvent: (data: any) => void;
    onError?: (error: Error) => void;
    priority: number;
  }>
}) => {
  const [constants, setConstants] = useState<{
    existentialDeposit?: bigint,
    byteDeposit?: bigint,
    basicDeposit?: bigint,
  }>({});
  useEffect(() => console.log(constants), [constants])

  useEffect(() => {
    if (typedApi) {
      (async () => {
        try {
          const constants: Record<string, bigint> = {};
          try {
            constants.byteDeposit = await typedApi.constants.Identity.ByteDeposit();
          } catch (e) {
            import.meta.env.DEV && console.error('Failed to get ByteDeposit:', e);
          }
          try {
            constants.basicDeposit = await typedApi.constants.Identity.BasicDeposit();
          } catch (e) {
            import.meta.env.DEV && console.error('Failed to get BasicDeposit:', e);
          }
          try {
            constants.existentialDeposit = await typedApi.constants.Balances.ExistentialDeposit();
          } catch (e) {
            import.meta.env.DEV && console.error('Failed to get ExistentialDeposit:', e);
          }
          import.meta.env.DEV && console.log({ constants });
          setConstants(constants);
        } catch (e) {
          import.meta.env.DEV && console.error('Failed to set constants:', e);
        }
      })()
    }
  }, [typedApi])

  const _pendingBlocks = useRef([])
  useEffect(() => {
    const timer = window.setInterval(() => {
      [..._pendingBlocks.current]
        .sort((b1, b2) => 
          b2.neta.block.number*100 + handlers[b2.type].priority 
          - b1.neta.block.number*100 + handlers[b1.type].priority 
        )
        .forEach(block => {
          handlers[block.type].onEvent(block)
          import.meta.env.DEV && console.log({ block, })
        });
      _pendingBlocks.current.splice(0, _pendingBlocks.current.length)
    }, CHAIN_UPDATE_INTERVAL)
    return () => {
      window.clearInterval(timer)
      _pendingBlocks.current.splice(0, _pendingBlocks.current.length)
    }
  }, [])

  const waitForEvent = ({ type: { pallet, call }, }) => {
    const type = `${pallet}.${call}`;
    const { onEvent, onError } = handlers[type]
    typedApi.event[pallet][call].pull()
      .then(data => {
        data.filter(item => [item.payload.who, item.payload.target].includes(address))
          .forEach(item => {
            _pendingBlocks.current.push({ ...item, type })
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
