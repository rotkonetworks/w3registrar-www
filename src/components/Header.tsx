import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bell, Sun, Moon, Link, CheckCircle, FolderSync } from "lucide-react";
import { appStore as _appStore } from '~/store/AppStore';
import { pushAlert } from '~/store/AlertStore';
import { useProxy } from "valtio/utils";
import { useEffect, useRef, useState } from "react";
import { ChainStore } from "~/store/chainStore";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { ConfigContextProps } from "~/api/config2";
import { useAccounts, useConnectedWallets, useWalletDisconnector } from "@reactive-dot/react";
import { Account, AccountData, accountStore } from "~/store/AccountStore";
import { PolkadotIdenticon } from 'dot-identicon/react.js';
import { ChainInfo } from "~/store/ChainStore";
import { Chains } from "@reactive-dot/core";
import { IdentityStore } from "~/store/IdentityStore";

const Header = ({ 
  chainContext, chainStore, accountStore, onRequestWalletConnections, identityStore 
}: { 
  chainContext: ConfigContextProps;
  chainStore: ChainInfo;
  accountStore: Account;
  onRequestWalletConnections: () => void;
  identityStore: IdentityStore;
}) => {
  const appStore = useProxy(_appStore);
  const isDarkMode = appStore.isDarkMode;

  useEffect(() => import.meta.env.DEV && console.log({ chainContext }), [chainContext]);

  //# region NetDropdown
  const [_wsUrl, _setWsUrl] = useState("");
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: "" });
  const defaultWsUrl = localStorage.getItem("wsUrl") || import.meta.env.VITE_APP_DEFAULT_WS_URL

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (defaultWsUrl && chainStore.id === "people_rococo") {
      _setWsUrl(defaultWsUrl);
    } else {
      _setWsUrl("");
    }
  }, [defaultWsUrl]);

  const [isNetDropdownOpen, setNetDropdownOpen] = useState(false);

  const validateUrl = (url: string): { isValid: boolean; message: string } => {
    if (!url.trim()) return { isValid: false, message: "URL cannot be empty" };
    try {
      new URL(url);
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        return { isValid: false, message: "URL must start with ws:// or wss://" };
      }
      return { isValid: true, message: "Valid WebSocket URL" };
    } catch {
      return { isValid: false, message: "Invalid URL format" };
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    _setWsUrl(newUrl);
    setUrlValidation(validateUrl(newUrl));
  };

  const handleUrlSubmit = () => {
    const validation = validateUrl(_wsUrl);
    if (validation.isValid) {
      setNetDropdownOpen(false);
      localStorage.setItem("wsUrl", _wsUrl);
      document.location.reload();
    } else {
      setUrlValidation(validation);
    }
  };

  const handleChainSelect = (chainId: keyof Chains) => {
    chainStore.id = chainId;
  }
  //# endregion NetDropdown

  //#region userDropdown
  const [isOpen, setOpen] = useState(false);
  const [isAccountsOpen, setAccountsOpen] = useState(false);

  const connectedWallets = useConnectedWallets()
  const [_, disconnectWallet] = useWalletDisconnector()

  const handleClose = () => {
    setOpen(false)
    setAccountsOpen(false)
  }

  const accounts = useAccounts()

  //#endregion userDropdown

  return <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
    <div className="flex gap-2 w-full sm:w-auto">
      <div className="flex-1 min-w-[140px]">
        {connectedWallets.length > 0
          ? <>
            <button
              onClick={() => setOpen(!isOpen)}
              className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400 w-full text-left"
            >
              {accountStore.address && <PolkadotIdenticon
                address={accountStore.address}
              />}
              {identityStore.identity?.display || accountStore?.name
                || 'Please choose account'
              } ▼
            </button>
            {isOpen && (
              <div className="absolute left-0 mt-1 w-48 bg-white border border-stone-300 shadow-lg z-10">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                  onClick={() => {
                    appState.walletDialogOpen = true
                    handleClose()
                  }}
                >
                  Connect Wallets ({connectedWallets.length} connected)
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                  onClick={() => {
                    setAccountsOpen(!isAccountsOpen);
                  }}
                >
                  Choose Account ▶
                </button>
                {appStateSnapshot.identity
                  && <button
                    className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                    onClick={() => {
                      typedApi.tx.Identity.clear_identity().signAndSubmit(
                        accountStore?.polkadotSigner
                      )
                      handleClose()
                    }}
                  >
                    Remove Identity
                  </button>
                }
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                  onClick={() => {
                    connectedWallets.forEach(w => disconnectWallet(w));
                    appState.account = null
                    appState.identity = null
                    localStorage.removeItem("account")
                    handleClose()
                  }}
                >
                  Logout
                </button>
              </div>
            )}
            {isAccountsOpen && (
              <div className="absolute left-48 top-0 w-48 bg-white border border-stone-300 shadow-lg z-20 max-h-60 overflow-y-auto">
                {accounts.map(({ id, name, address, ...rest }) => (
                  <button
                    key={id}
                    className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                    onClick={() => {
                      handleClose()
                      const account = { id, name, address, ...rest };
                      appState.account = account;
                      // Needed to prevent circular references for serialization
                      const accountToLocalStore = { id, name, address };
                      localStorage.setItem("account", JSON.stringify(accountToLocalStore))
                    }}
                  >
                    <PolkadotIdenticon address={address} />
                    &nbsp;
                    {name}
                    <br />
                    ({address.substring(0, 4)}...{address.substring(address.length - 4, address.length)})
                  </button>
                ))}
              </div>
            )}
          </>
          : <button
            onClick={() => {
              appState.walletDialogOpen = true;
              handleClose()
            }}
            className="bg-stone-200 text-stone-800 px-3 py-1 text-sm font-medium border border-stone-400 w-full text-left"
          >
            Log In
          </button>
        }
        <Select onValueChange={() => { } }>
          <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="account1">Account 1</SelectItem>
            <SelectItem value="account2">Account 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 min-w-[140px]">
        <Select open={isNetDropdownOpen} onOpenChange={setNetDropdownOpen} onValueChange={() => {  }}>
          <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit">
            <SelectValue placeholder={chainStore.name} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(chainContext.config.chains)
              .filter(([key]) => key.includes("people"))
              .map(([key, net]) => (
                <SelectItem key={key} value={key} 
                  onClick={() => handleChainSelect(key)}
                >
                  {net.name}
                </SelectItem>
              ))
            }
            {(defaultWsUrl && chainStore.id === "people_rococo") && (
              <div className="p-4 border-t border-stone-300">
                <Label htmlFor="wsUrl" className="text-inherit flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  WebSocket URL
                </Label>
                <Input ref={inputRef} id="wsUrl" name="wsUrl" type="url" value={_wsUrl} 
                  className="bg-transparent border-[#E6007A] text-inherit placeholder-[#706D6D] focus:ring-[#E6007A]"
                  placeholder="wss://example.com/ws" 
                  onChange={handleUrlChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  //aria-invalid={!urlValidation.isValid}
                  //aria-describedby="url-validation-message" 
                />
                <p id="url-validation-message"
                  className={`text-xs mb-2 ${urlValidation.isValid 
                    ? 'text-green-600' 
                    : 'text-red-500'
                  }`}
                >
                  {urlValidation.message}
                </p>
                <Button type="submit" 
                  onClick={handleUrlSubmit}
                  disabled={!urlValidation.isValid}
                  className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] flex-1"
                >
                  <FolderSync className="mr-2 h-4 w-4" />
                  Reload
                </Button>
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="icon" 
        className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
        onClick={() => pushAlert({
          key: (new Date()).toISOString(),
          type: 'info', 
          message: 'Notification test',
        })}
      >
        <Bell className="h-4 w-4" />
      </Button>
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
