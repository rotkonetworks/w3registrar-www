import { Select, SelectChangeHandler, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue, TypedSelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react";
import { appStore as _appStore } from '~/store/AppStore';
import { useProxy } from "valtio/utils";
import { useState } from "react";
import { ApiConfig } from "~/api/config";
import { useConnectedWallets } from "@reactive-dot/react";
import { PolkadotIdenticon } from 'dot-identicon/react.js';
import { IdentityStore } from "~/store/IdentityStore";
import { SelectLabel } from "@radix-ui/react-select";
import { AccountData } from "~/store/AccountStore";

const AccountListing = ({ address, name }) => <>
  <PolkadotIdenticon address={address} />
  &nbsp;
  {name}
  &nbsp;
  ({address.substring(0, 4)}...{address.substring(address.length - 4, address.length)})
</>

const Header = ({ 
  config, chainStore, accountStore, identityStore, accounts, 
  onChainSelect, onAccountSelect, onRequestWalletConnections, onToggleDark: onToggleDark
}: { 
  accounts: AccountData[];
  config: ApiConfig;
  chainStore: { id: string | number | symbol, name: string };
  accountStore: { address: string, name: string };
  identityStore: IdentityStore;
  onChainSelect: (chainId: keyof ApiConfig["chains"]) => void;
  onAccountSelect: SelectChangeHandler;
  onRequestWalletConnections: () => void;
  onToggleDark: () => void;
}) => {
  const appStore = useProxy(_appStore);
  const isDarkMode = appStore.isDarkMode;

  const [isNetDropdownOpen, setNetDropdownOpen] = useState(false);
  
  const connectedWallets = useConnectedWallets()
  
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false)

  return <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
    <div className="flex gap-2 w-full sm:w-auto">
      <div className="flex-1 min-w-[240px]">
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
        >
          <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit">
            {(() => {
              if (accountStore.address) {
                return <AccountListing address={accountStore.address} name={accountStore.name} />;
              }
              if (connectedWallets.length > 0) {
                return <span>Pick account</span>;
              }
              return <span>Connect wallet</span>;
            }) ()}
          </SelectTrigger>
          <SelectContent>
            {connectedWallets.length > 0 && <>
              <SelectItem value={{type: "Wallets"}}>Connect Wallets</SelectItem>
              <SelectItem value={{type: "Disconnect"}}>Disconnect</SelectItem>
              {identityStore.info && <>
                <SelectItem value={{type: "RemoveIdentity"}}>Remove Identity</SelectItem>
              </>}
              {accountStore.address && <>
                <SelectItem value={{type: "Teleport"}}>Teleport</SelectItem>
              </>}
              <SelectSeparator />
              {/* Required to encose any laber or element so won't crash if no account */}
              <SelectGroup>
                {accounts.length > 0 
                  ?<>
                    <SelectLabel>Accounts</SelectLabel>
                    {accounts.map(({ name, address, encodedAddress, ...rest }) => {
                      const account = { name, address, ...rest };
                      return (
                        <SelectItem key={address} value={{ type: "account", account }}>
                          <AccountListing address={encodedAddress} name={name} />
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
      <div className="flex-1 min-w-[140px]">
        <Select open={isNetDropdownOpen} onOpenChange={setNetDropdownOpen} 
          onValueChange={onChainSelect}
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
      <Button variant="outline" size="icon" 
        className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
        onClick={() => onToggleDark()} 
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  </div>;
}

export default Header;
