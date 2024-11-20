import { proxy } from "valtio";

export interface ChainStore {
  id: string;
  name?: string;
  ss58Format?: number;
  tokenDecimals?: number;
  tokenSymbol?: string;
}

export const chainStore = proxy<ChainStore>({
  id: "polkadot",
})
