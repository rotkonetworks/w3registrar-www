import { SS58String } from "polkadot-api";
import { proxy } from "valtio";

export type XcmParameters = {
  fromAddress: SS58String;
  fromChain: {
    name: string;
    id: number;
  };
  txAmount: bigint;
};

export const xcmParameters = proxy<XcmParameters>({
  fromAddress: "",
  fromChain: {
    name: "",
    id: 0,
  },
  txAmount: 0n,
})
