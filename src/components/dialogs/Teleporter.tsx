import * as React from "react"
import { ArrowDownUp, Wallet, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip"
import { Switch } from "../ui/switch"
import { TypedApi } from "polkadot-api"
import { ApiConfig } from "~/api/config2"
import { CommandList } from "cmdk"
import BigNumber from "bignumber.js"

export default function TeleporterDialog({ 
  address, accounts, chainId, typedApi, config, open, onOpenChange, balance
}: {
  address: string,
  accounts: WalletAccount[],
  balance: BigNumber,
  chainId: Chains,
  typedApi: TypedApi,
  config: ApiConfig,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const [fromAddress, setFromAddress] = React.useState(address)
  const [toAddress, setToAddres] = React.useState(address)

  React.useEffect(() => {
    if (open) {
      setFromAddress(address)
      setToAddres(address)
    }
  }, [address, open])

  const [isReversed, setIsReversed] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const relayChainId = chainId.replace("_people", "")
  const [selectedChain, setSelectedChain] = React.useState(relayChainId)

  const fromChainId = React.useMemo(() => isReversed ?chainId :selectedChain, [isReversed, chainId])
  const toChainId = React.useMemo(() => isReversed ? selectedChain : chainId, [isReversed, chainId])

  React.useEffect(() => {
    if (open) {
      setSelectedChain(relayChainId)
    }
  }, [relayChainId, open])

  const parachains = Object.entries(config.chains)
    .filter(([id]) => id.includes(relayChainId) && id !== chainId)
    .map(([id, chain]) => ({ id, name: chain.name }))

  const fixedChain = "People"
  const token = "DOT"

  const [comboboxOpen, setComboboxOpen] = React.useState(null)
  
  const handleFromWalletChange = React.useCallback((address: string) => {
    setFromAddress(address)
    setComboboxOpen(null)
  }, [])
  
  const handleToWalletChange = React.useCallback((address: string) => {
    setToAddres(address)
    setComboboxOpen(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] text-[#FFFFFF] border-[#E6007A] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Teleporter</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="from-wallet">From Wallet</Label>
            <Popover open={comboboxOpen === "fromAddress"}
              onOpenChange={(nextState) => setComboboxOpen(nextState ? "fromAddress" : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] hover:bg-[#3A3939] hover:text-[#FFFFFF]"
                >
                  {fromAddress ? accounts.find(account => account.address === fromAddress)?.name : "Select wallet"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-[#2C2B2B] border-[#E6007A]">
                <Command>
                  <CommandInput placeholder="Search wallet..." className="h-9 border-[#E6007A]" />
                  <CommandEmpty>No wallet found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {accounts.map((account) => (
                        <CommandItem
                          key={account.address}
                          onSelect={() => handleFromWalletChange(account.address)}
                          className="text-[#FFFFFF] hover:bg-[#3A3939]"
                        >
                          {account.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-wallet">To Wallet</Label>
            <Popover open={comboboxOpen === "toAddress"}
              onOpenChange={(nextState) => setComboboxOpen(nextState ? "toAddress" : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] hover:bg-[#3A3939] hover:text-[#FFFFFF]"
                >
                  {toAddress ? accounts.find(account => account.address === toAddress)?.name : "Select wallet"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-[#2C2B2B] border-[#E6007A]">
                <Command>
                  <CommandInput placeholder="Search wallet..." className="h-9 border-[#E6007A]" />
                  <CommandEmpty>No wallet found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {accounts.map((account) => (
                        <CommandItem
                          key={account.address}
                          onSelect={() => handleToWalletChange(account.address)}
                          className="text-[#FFFFFF] hover:bg-[#3A3939]"
                        >
                          {account.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-1 space-y-2">
              <Label>From Chain:</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select value={fromChainId} onValueChange={setSelectedChain} disabled={isReversed}>
                      <SelectTrigger className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF]">
                        <SelectValue placeholder="Select chain" />
                      </SelectTrigger>
                      <SelectContent>
                        {isReversed ? (
                          <SelectItem value={chainId}>{config.chains[chainId].name}</SelectItem>
                        ) : parachains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id}>{chain.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-[#3A3939] text-[#FFFFFF] border-[#E6007A]">
                    <p>{isReversed ? chainId : selectedChain}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <ArrowDownUp className="h-6 w-6 text-[#E6007A]" />
              <Switch
                id="direction-toggle"
                checked={isReversed}
                onCheckedChange={setIsReversed}
                className="data-[state=checked]:bg-[#E6007A]"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>To Chain:</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select value={toChainId} onValueChange={setSelectedChain} disabled={!isReversed}>
                      <SelectTrigger className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF]">
                        <SelectValue placeholder="Select chain" />
                      </SelectTrigger>
                      <SelectContent>
                        {isReversed ? parachains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id}>{chain.name}</SelectItem>
                        )) 
                        : (
                          <SelectItem value={chainId}>{config.chains[chainId].name}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-[#3A3939] text-[#FFFFFF] border-[#E6007A]">
                    <p>{isReversed ? selectedChain : chainId}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <Card className="border-[#E6007A] bg-[#2C2B2B]">
            <CardContent className="p-4">
              <h3 className="mb-4 text-lg font-semibold text-[#E6007A]">Transferable Balances</h3>
              <div className="space-y-2 text-[#FFFFFF]">
                <div className="flex justify-between">
                  <span>{selectedChain}</span>
                  <span>0.0000 {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>{fixedChain}</span>
                  <span>0.0000 {token}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.0000"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value) || value === '') {
                    setAmount(value);
                  }
                }}
                className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] placeholder-[#706D6D] pr-16"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-[#FFFFFF]">{token}</span>
              </div>
            </div>
          </div>

          <Button className="w-full bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]">
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Teleport
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
