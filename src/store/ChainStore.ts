import { proxy } from "valtio";

export interface ChainInfo {
  id: string | number | symbol; // TODO Leave this as string, as that's how we use it in the app
  name?: string;
  ss58Format?: number;
  tokenDecimals?: number;
  tokenSymbol?: string;
  registrarIndex?: number;
}

export const chainStore: ChainInfo = proxy({
  id: new URLSearchParams(window.location.search).get("chain") || import.meta.env.VITE_APP_DEFAULT_CHAIN,
});
