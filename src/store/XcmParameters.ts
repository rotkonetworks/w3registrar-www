import BigNumber from "bignumber.js";
import { SS58String } from "polkadot-api";
import { proxy } from "valtio";
import { EstimatedCostInfo } from "~/components/identity-registrar";

export type XcmParameters = {
  enabled: boolean;
  fromAddress: SS58String;
  fromChain: {
    name: string;
    id: number;
  };
  txCosts: EstimatedCostInfo;
  txTotalCost: BigNumber;
};

export const xcmParameters = proxy<XcmParameters>({
  enabled: false,
  fromAddress: "",
  fromChain: {
    name: "",
    id: 0,
  },
  txCosts: {},
  txTotalCost: BigNumber(0),
})
