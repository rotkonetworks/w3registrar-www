import { Chains } from "@reactive-dot/core";
import { proxy } from "valtio";

export interface ChainInfo {
  id: keyof Chains;
  ss58Format?: number;
  tokenDecimals?: number;
  tokenSymbol?: string;
  registrarIndex?: number;
}

export const chainStore: ChainInfo = proxy({
  id: localStorage.getItem('chain') as keyof Chains || import.meta.env.VITE_APP_DEFAULT_CHAIN,
});
