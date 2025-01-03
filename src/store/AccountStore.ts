import { PolkadotSigner } from "polkadot-api";
import { proxy } from "valtio";

export interface AccountBalance {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
  flags: bigint;
}
export type AccountData = {
  id?: string;
  name?: string;
  address?: string;
  polkadotSigner?: PolkadotSigner;
  balance?: AccountBalance;
}
export type Account = AccountData

export const accountStore = proxy<Account>({  })
