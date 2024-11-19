import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bell, Sun, Moon } from "lucide-react";
import { appStore as _appStore, pushAlert } from "~/store";
import { useProxy } from "valtio/utils";

const Header = () => {
  const appStore = useProxy(_appStore);
  const isDarkMode = appStore.isDarkMode;

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
        <Select onValueChange={() => { } }>
          <SelectTrigger className="w-full bg-transparent border-[#E6007A] text-inherit">
            <SelectValue placeholder="Network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="polkadot">Polkadot</SelectItem>
            <SelectItem value="kusama">Kusama</SelectItem>
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
      <Button variant="outline" size="icon" onClick={() => appStore.isDarkMode = !appStore.isDarkMode} className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]">
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  </div>;
}

export default Header;
