import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react";
import { appStore as _appStore } from '~/store/AppStore';
import { useProxy } from "valtio/utils";
import { useEffect, useState } from "react";
import { ConfigContextProps } from "~/api/config2";
import { useConnectedWallets } from "@reactive-dot/react";
import { Account } from "~/store/AccountStore";
import { PolkadotIdenticon } from 'dot-identicon/react.js';
import { Chains } from "@reactive-dot/core";
import { IdentityStore } from "~/store/IdentityStore";
import { SelectLabel } from "@radix-ui/react-select";
import { WalletAccount } from "node_modules/@reactive-dot/core/build/wallets/account";

const AccountListing = ({ address, name }) => <>
  <PolkadotIdenticon address={address} />
  &nbsp;
  {name}
  &nbsp;
  ({address.substring(0, 4)}...{address.substring(address.length - 4, address.length)})
</>

const Header = ({ 
  config: chainContext, chainStore, accountStore, onChainSelect, onAccountSelect, identityStore, 
  accounts,
}: { 
  accounts: WalletAccount[],
  config: ConfigContextProps;
  chainStore: { id: string, name: string };
  accountStore: Account;
  identityStore: IdentityStore;
  onChainSelect: (chainId: keyof Chains) => void;
  onAccountSelect: ({ type: string, [key]: string }) => void;
}) => {
  const appStore = useProxy(_appStore);
  const isDarkMode = appStore.isDarkMode;

  useEffect(() => import.meta.env.DEV && console.log({ chainContext }), [chainContext]);

  //# region NetDropdown
  const [_wsUrl, _setWsUrl] = useState("");
  const defaultWsUrl = localStorage.getItem("wsUrl") || import.meta.env.VITE_APP_DEFAULT_WS_URL

  useEffect(() => {
    if (defaultWsUrl && chainStore.id === "people_rococo") {
      _setWsUrl(defaultWsUrl);
    } else {
      _setWsUrl("");
    }
  }, [defaultWsUrl]);

  const [isNetDropdownOpen, setNetDropdownOpen] = useState(false);
  //# endregion NetDropdown
  
  //#region userDropdown
  const connectedWallets = useConnectedWallets()
  
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false)
  //#endregion userDropdown

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
            {accountStore.address 
              ? <>
                {accountStore.name}
                <span className="text-xs text-stone-400">
                  <PolkadotIdenticon address={accountStore.address} />
                  {accountStore.address.slice(0, 4)}...{accountStore.address.slice(-4)}
                </span>
              </>
              : connectedWallets.length > 0
                ? <span>Pick account</span>
                : <span>Connect wallet</span>
            }
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
              {accounts.length > 0 
                ?<>
                  <SelectGroup>
                    <SelectLabel>Accounts</SelectLabel>
                    {accounts.map(({ id, name, address, ...rest }) => {
                      const account = { id, name, address, ...rest };
                      return (
                        <SelectItem key={id} value={{ type: "account", account }} onClick={() => {
                          console.log({ account });
                          return updateAccount(account);
                        }}>
                          <AccountListing address={address} name={name} />
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </>
                :<>
                  <SelectLabel>No accounts found</SelectLabel>
                </>
              }
            </>}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 min-w-[140px]">
        <Select open={isNetDropdownOpen} onOpenChange={setNetDropdownOpen} 
          onValueChange={onChainSelect}
        >
          <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit">
            <SelectValue placeholder={chainStore.name} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(chainContext.chains)
              .filter(([key]) => key.includes("people"))
              .map(([key, net]) => (
                <SelectItem key={key} value={key}>
                  {net.name}
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
        onClick={() => appStore.isDarkMode = !appStore.isDarkMode} 
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  </div>;
}

export default Header;
