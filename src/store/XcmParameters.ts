import { Chains } from "@reactive-dot/core/internal.js";
import BigNumber from "bignumber.js";
import { SS58String } from "polkadot-api";
import { proxy } from "valtio";
import { EstimatedCostInfo } from "~/components/identity-registrar";

export type XcmParameters = {
  enabled: boolean;
  fromAddress: SS58String;
  fromChain: {
    name: string;
    id: keyof Chains;
    paraId?: number;
  };
  txCosts: EstimatedCostInfo;
  txTotalCost: BigNumber;
};

export const xcmParameters = proxy<XcmParameters>({
  enabled: false,
  fromAddress: "",
  fromChain: {
    name: "",
    id: import.meta.env.VITE_DEFAULT_CHAIN as keyof Chains,
    paraId: undefined,
  },
  txCosts: {},
  txTotalCost: BigNumber(0),
})
