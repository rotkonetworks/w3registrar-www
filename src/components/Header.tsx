import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bell, Sun, Moon } from "lucide-react";
import { appStore as _appStore } from "~/store";
import { pushAlert } from '~/store/AlertStore';
import { useProxy } from "valtio/utils";
import { ApiConfig } from "~/api/config2";
import { useEffect } from "react";
import { ChainStore } from "~/store/chainStore";

const Header = ({ chainConfig, chainStore }: { 
  chainConfig: ApiConfig;
  chainStore: ChainStore;
}) => {
  const appStore = useProxy(_appStore);
  const isDarkMode = appStore.isDarkMode;

  useEffect(() => import.meta.env.DEV && console.log({ chainConfig }), [chainConfig])

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
        <Select onValueChange={() => {  }}>
          <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit">
            <SelectValue placeholder={chainStore.name} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(chainConfig?.chains)
              .filter(([key]) => key.includes("people"))
              .map(([key, net]) => (
                <SelectItem key={key} value={key} 
                  onClick={() => handleChainSelect(key)}
                >
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
