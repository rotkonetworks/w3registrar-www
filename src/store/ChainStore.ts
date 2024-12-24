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
  id: new URLSearchParams(window.location.search).get("chain") || import.meta.env.VITE_APP_DEFAULT_CHAIN,
});
