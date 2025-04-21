import { useCallback, useMemo } from "react";
import { AccountData } from "~/store/AccountStore";
import { useAccounts, useConnectedWallets, useWalletDisconnector } from "@reactive-dot/react";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { SS58String } from "polkadot-api";

interface UseWalletAccountsProps {
  chainSs58Format: number;
}

export function useWalletAccounts({
  chainSs58Format,
}: UseWalletAccountsProps) {
  // Get accounts from wallet
  const accounts = useAccounts();
  const connectedWallets = useConnectedWallets();
  const [_, disconnectWallet] = useWalletDisconnector();

  // Format accounts with proper SS58 format
  const formattedAccounts = useMemo(() => accounts
    // First filter out accounts with invalid public keys, such as EVM accounts
    .filter(account => [1, 2, 4, 8, 32, 33].includes(account.polkadotSigner.publicKey.length))
    .map(account => ({
      ...account,
      encodedAddress: encodeAddress(account.polkadotSigner.publicKey, chainSs58Format),
    })
  ), [accounts, chainSs58Format]);

  // Get wallet account by address
  const getWalletAccount = useCallback((address: SS58String) => {
    if (!address) return null;
    
    let foundAccount: AccountData | null;
    let decodedAddress: Uint8Array;
    try {
      decodedAddress = decodeAddress(address);
    } catch (error) {
      console.error("Error decoding address:", error);
      return null;
    }
    
    foundAccount = accounts.find(account => {
      const publicKey = account.polkadotSigner.publicKey;
      return publicKey.every((byte, index) => byte === decodedAddress[index]);
    });

    if (!foundAccount) {
      return null;
    }

    return {
      name: foundAccount.name,
      polkadotSigner: foundAccount.polkadotSigner,
      address: address,
      encodedAddress: encodeAddress(foundAccount.polkadotSigner.publicKey, chainSs58Format),
    };
  }, [accounts, chainSs58Format]);

  // Disconnect all wallets
  const disconnectAllWallets = useCallback(() => {
    connectedWallets.forEach(w => disconnectWallet(w));
  }, [connectedWallets, disconnectWallet]);

  return {
    accounts: formattedAccounts,
    connectedWallets,
    getWalletAccount,
    disconnectAllWallets,
  };
}
