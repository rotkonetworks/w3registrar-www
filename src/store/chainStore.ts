import { proxy } from "valtio";

interface ChainStore {
  id: string;
  ss58Format?: number;
  tokenDecimals?: number;
  tokenSymbol?: string;
}

export const chainStore = proxy<ChainStore>({
  id: "polkadot",
})
