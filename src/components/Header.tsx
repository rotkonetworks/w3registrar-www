import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bell, Sun, Moon, Link, CheckCircle } from "lucide-react";
import { appStore as _appStore } from "~/store";
import { pushAlert } from '~/store/AlertStore';
import { useProxy } from "valtio/utils";
import { useEffect, useRef, useState } from "react";
import { ChainStore } from "~/store/chainStore";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { ConfigContextProps } from "~/api/config2";

const Header = ({ chainContext, chainStore }: { 
  chainContext: ConfigContextProps;
  chainStore: ChainStore;
}) => {
  const appStore = useProxy(_appStore);
  const isDarkMode = appStore.isDarkMode;

  useEffect(() => import.meta.env.DEV && console.log({ chainContext }), [chainContext]);

  const [_wsUrl, _setWsUrl] = useState("");
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: "" });
  const defaultWsUrl = import.meta.env.VITE_APP_DEFAULT_WS_URL

  const dropdownRef = useRef<HTMLDivElement>(null);
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
      chainContext.setCustoNetEndponit(_wsUrl)
    } else {
      setUrlValidation(validation);
    }
  };

  const handleChainSelect = (chainId: string) => {
    chainStore.id = chainId;
  }

  return <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
    <div className="flex gap-2 w-full sm:w-auto">
      <div className="flex-1 min-w-[140px]">
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
            {chainStore.id === "people_rococo" && (
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
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Connect
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
