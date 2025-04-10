import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Command, CommandInput, CommandEmpty, CommandList, CommandGroup, CommandItem } from "./command";
import { ChevronDown } from "lucide-react";
import { SS58String } from "polkadot-api";
import { AccountData } from "~/store/AccountStore";
import { Button } from "./button";
import { useState } from "react";

export const AccountSelector = ({
  accounts, address, handleAddressChange, id, open, handleOpen, disabled = false
}: {
  id: string,
  accounts: AccountData[],
  address?: SS58String,
  handleAddressChange: (address: SS58String) => void,
  open?: boolean,
  handleOpen?: (open: boolean) => void,
  disabled?: boolean
}) => {
  const [_open, setOpen] = useState(false);

  return <Popover 
    open={typeof open === "boolean" ? open : _open} 
    onOpenChange={(open) => {
      setOpen(open);
      if (handleOpen) {
        handleOpen(open);
      }
    }}
  >
    <PopoverTrigger id={id} asChild>
      <Button role="combobox" className="w-full justify-between" disabled={disabled}>
        {accounts.find(account => account.encodedAddress === address)?.name ?? "Select wallet"}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-full p-0 bg-[#2C2B2B] border-[#E6007A]">
      <Command>
        <CommandInput placeholder="Search account..." className="h-9 border-[#E6007A]" />
        <CommandEmpty>No account found.</CommandEmpty>
        <CommandList>
          <CommandGroup>
            {accounts.map((account) => (
              <CommandItem
                key={account.address}
                onSelect={() => {
                  handleAddressChange(account.address);
                  handleOpen ? handleOpen(false) : setOpen(false);
                }}
                className="text-[#FFFFFF] hover:bg-[#3A3939]"
              >
                {account.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
};
