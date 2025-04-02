import { Select, SelectChangeHandler, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue, TypedSelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Sun, Moon, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { ApiConfig } from "~/api/config";
import { useConnectedWallets, useSpendableBalance } from "@reactive-dot/react";
import { PolkadotIdenticon } from 'dot-identicon/react.js';
import { IdentityStore } from "~/store/IdentityStore";
import { SelectLabel } from "@radix-ui/react-select";
import { AccountData } from "~/store/AccountStore";
import { Chains } from "@reactive-dot/core/internal.js";
import { useFormatAmount } from "~/hooks/useFormatAmount";
import { BalanceDisplay } from "./ui/balance-display";
import { AssetAmount } from "~/types";

const AccountListing = ({ address, name }) => (
  <div className="flex items-center w-full min-w-0">
    <div className="flex-shrink-0">
      <PolkadotIdenticon address={address} />
    </div>
    <span className="mx-2 truncate min-w-0">{name}</span>
    <span className="flex-shrink-0">
      ({address.substring(0, 4)}...{address.substring(address.length - 4, address.length)})
    </span>
  </div>
)

const Header = ({ 
  config, chainStore, accountStore, identityStore, accounts, isTxBusy, isDark, balance,
  onChainSelect, onAccountSelect, onRequestWalletConnections, onToggleDark, openHelpDialog,
}: { 
  accounts: AccountData[];
  config: ApiConfig;
  chainStore: {
    id: string | number | symbol,
    name: string,
    symbol: string,
    tokenDecimals: number,
  };
  accountStore: { address: string, name: string };
  identityStore: IdentityStore;
  isTxBusy: boolean;
  isDark: boolean;
  onChainSelect: (chainId: keyof ApiConfig["chains"]) => void;
  balance: AssetAmount;
  onAccountSelect: SelectChangeHandler;
  onRequestWalletConnections: () => void;
  onToggleDark: () => void;
  openHelpDialog: () => void;
}) => {
  const [isNetDropdownOpen, setNetDropdownOpen] = useState(false);
  const connectedWallets = useConnectedWallets()
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false)

  const allAccountBalances = useSpendableBalance(
    accounts.map(({ address }) => address), 
    { chainId: chainStore.id as keyof Chains }
  )

  const shortFormatAmount = useFormatAmount({
    symbol: "",
    tokenDecimals: chainStore.tokenDecimals,
    decimals: 2,
  })
  const formatAmount = useFormatAmount({
    symbol: chainStore.symbol,
    tokenDecimals: chainStore.tokenDecimals,
  })

  return (
    <div className="flex max-[450px]:flex-col sm:flex-row flex-nowrap justify-between items-center mb-6 gap-4">
      <div className="flex gap-2 w-full sm:w-auto max-w-[300px]">
        <div className="flex-1 min-w-[180px]">
          <Select 
            onValueChange={onAccountSelect} 
            open={isUserDropdownOpen}
            onOpenChange={() => {
              if (connectedWallets.length > 0) {
                setUserDropdownOpen(open => !open)
              } else {
                setUserDropdownOpen(false)
                onRequestWalletConnections()
              }
            }}
            disabled={isTxBusy}
          >
            <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit min-w-0">
              <div className="w-full min-w-0">
                {(() => {
                  if (accountStore.address) {
                    return <AccountListing address={accountStore.address} name={accountStore.name} />;
                  }
                  if (connectedWallets.length > 0) {
                    return <span>Select account</span>;
                  }
                  return <span>Connect wallet</span>;
                })()}
              </div>
            </SelectTrigger>
            <SelectContent>
              {connectedWallets.length > 0 && <>
                <SelectItem value={{type: "Wallets"}}>Connect Wallets</SelectItem>
                <SelectItem value={{type: "Disconnect"}}>Disconnect</SelectItem>
                {identityStore.info && <>
                  <SelectItem value={{type: "RemoveIdentity"}}>Remove Identity</SelectItem>
                </>}
                <SelectSeparator />
                <SelectGroup>
                  {accounts.length > 0 
                    ?<>
                      <SelectLabel>Accounts</SelectLabel>
                      {accounts.map(({ name, address, encodedAddress, ...rest }, index) => {
                        const account = { name, address, ...rest };
                        return (
                          <SelectItem key={address} value={{ type: "account", account }} className="max-w-sm">
                            <div className="flex items-center w-full min-w-0">
                              <div className="flex-shrink-0">
                                <PolkadotIdenticon address={encodedAddress} />
                              </div>
                              <span className="mx-2 truncate min-w-0">{name}</span>
                              <span className="flex-shrink-0 pe-2">
                                ({encodedAddress.substring(0, 4)}...{encodedAddress.substring(encodedAddress.length - 4, encodedAddress.length)})
                              </span>
                              <BalanceDisplay balance={allAccountBalances[index].planck} formatter={shortFormatAmount} />
                            </div>
                          </SelectItem>
                        );
                      })}
                    </>
                    :<>
                      <SelectLabel>No accounts found</SelectLabel>
                    </>
                  }
                </SelectGroup>
              </>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[100px]">
          <Select 
            open={isNetDropdownOpen} 
            onOpenChange={setNetDropdownOpen} 
            onValueChange={onChainSelect}
            disabled={isTxBusy}
          >
            <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit">
              <SelectValue placeholder={chainStore.name?.replace("People", "")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(config.chains)
                .filter(([key]) => 
                  import.meta.env.VITE_APP_AVAILABLE_CHAINS 
                    ? import.meta.env.VITE_APP_AVAILABLE_CHAINS.split(',').map(key => key.trim())
                      .includes(key)
                    : key.includes("people")
                )
                .map(([key, net]: [string, { name: string }]) => (
                  <SelectItem key={key} value={key}>
                    {net.name.replace("People", "")}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <BalanceDisplay balance={balance} formatter={formatAmount} />
        <Button 
          variant="outline" 
          size="icon" 
          className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
          onClick={() => openHelpDialog()} 
        >
          <ShieldQuestion className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
          onClick={() => onToggleDark()} 
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default Header;
