import { PolkadotClient } from "polkadot-api";
import { proxy } from "valtio";

export interface IPolkadotApiStore {
  accounts: WalletAccount[];
  chainClient?: PolkadotClient;
  typedApi?: TypedApi;
  setChainId: (id: string) => void;
  chainConstants: {
    existentialDeposit?: bigint,
    byteDeposit?: bigint,
    basicDeposit?: bigint,
  };
  connectedVallets: string[];
  disconnectWallet: (vallet: string) => void;
}

export const polkadotApiStore = proxy<IPolkadotApiStore>({
  accounts: [],
})
