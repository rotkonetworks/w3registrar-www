import { useCallback, useEffect, useMemo } from "react";
import { useProxy } from "valtio/utils";
import BigNumber from "bignumber.js";
import { TypedApi } from "polkadot-api";
import { Binary } from "polkadot-api";
import { useTypedApi } from "@reactive-dot/react";
import { ChainId, } from "@reactive-dot/core";
import { xcmParameters as _xcmParams } from "~/store/XcmParameters";
import { config } from "~/api/config";
import { AccountData } from "~/store/AccountStore";
import { ChainDescriptorOf, Chains } from "@reactive-dot/core/internal.js";

interface UseXcmParametersOptions {
  chainId: string | number | symbol;
  estimatedCosts?: Record<string, BigNumber | bigint>;
}

export function useXcmParameters({
  chainId,
  estimatedCosts = {},
}: UseXcmParametersOptions) {
  const xcmParams = useProxy(_xcmParams);

  // Determine relay chain ID based on current chain
  const relayChainId = useMemo<keyof Chains>(
    () => (chainId as string).replace("_people", "") as keyof Chains,
    [chainId]
  );

  // Get list of relay and parachains
  const relayAndParachains = useMemo(() => 
    Object.entries(config.chains)
      .filter(([id]) => id.includes(relayChainId) && id !== chainId)
      .map(([id, chain]) => ({ id, name: chain.name })),
    [relayChainId, chainId]
  );

  // Setup fromChain when relayChainId changes
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ relayChainId, relayAndParachains });
    xcmParams.fromChain.id = relayChainId;
  }, [relayChainId, relayAndParachains]);

  // Get typed API for from chain
  const fromTypedApi = useTypedApi({ 
    chainId: xcmParams.fromChain.id || relayChainId as ChainId 
  });

  // Function to get parachain ID
  const getParachainId = useCallback(async (typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>) => {
    if (typedApi) {
      try {
        const paraId = await typedApi.constants.ParachainSystem.SelfParaId();
        if (import.meta.env.DEV) console.log({ paraId });
        return paraId;
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error getting parachain ID", error);
      }
    }
    return null;
  }, []);

  // Get and set parachain ID for from chain
  useEffect(() => {
    if (fromTypedApi) {
      getParachainId(fromTypedApi).then(id => {
        if (id !== null) {
          xcmParams.fromChain.paraId = id;
        }
      });
    }
  }, [fromTypedApi, getParachainId]);

  // Update total transaction cost based on estimated costs
  useEffect(() => {
    const totalCost = Object.values(estimatedCosts)
      .reduce(
        (total: BigNumber, current: BigNumber) => BigNumber(total).plus(BigNumber(current.toString())), 
        BigNumber(0)
      ) as BigNumber;
    xcmParams.txTotalCost = totalCost.times(1.1);
  }, [estimatedCosts]);

  // Generate teleport call
  const getTeleportCall = useCallback(({
    amount, 
    fromApi, 
    signer, 
    parachainId
  }: { 
    amount: BigNumber; 
    fromApi: TypedApi<ChainDescriptorOf<keyof Chains>>;
    signer: AccountData['polkadotSigner'];
    parachainId?: number;
  }) => {
    const txArguments = ({
      dest: {
        type: "V3",
        value: {
          interior: {
            type: "X1",
            value: {
              type: "Parachain",
              value: parachainId,
            }
          },
          parents: 0,
        },
      },
      beneficiary: {
        type: "V3",
        value: {
          interior: {
            type: "X1",
            value: {
              type: "AccountId32",
              value: {
                id: Binary.fromBytes(signer.publicKey),
              },
            },
          },
          parents: 0
        }
      },
      assets: {
        type: "V3",
        value: [{
          fun: {
            type: "Fungible",
            value: BigInt(amount.toString())
          },
          id: {
            type: "Concrete",
            value: xcmParams.fromChain.paraId
              ? {
                interior: {
                  type: "X1",
                  value: xcmParams.fromChain.paraId,
                },
                parents: 1,
              }
              : {
                interior: {
                  type: "Here",
                  value: null
                },
                parents: 0,
              }
          }
        }]
      },
      fee_asset_index: 0,
      weight_limit: {
        type: "Unlimited",
        value: null,
      }
    });
    
    if (import.meta.env.DEV) console.log({ txArguments });
    return fromApi.tx.XcmPallet.limited_teleport_assets(txArguments);
  }, [xcmParams.fromChain.paraId]);

  // Teleport accordion state
  const teleportExpanded = xcmParams.enabled;
  const setTeleportExpanded = useCallback((nextState: boolean) => {
    xcmParams.enabled = nextState;
  }, []);

  return {
    xcmParams,
    relayChainId,
    relayAndParachains,
    fromTypedApi,
    getTeleportCall,
    getParachainId,
    teleportExpanded,
    setTeleportExpanded,
  };
}
