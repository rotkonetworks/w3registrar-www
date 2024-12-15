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

export default function Teleporter() {
  const [open, setOpen] = React.useState(false)
  const [isReversed, setIsReversed] = React.useState(false)
  const [fromWallet, setFromWallet] = React.useState("")
  const [toWallet, setToWallet] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [selectedChain, setSelectedChain] = React.useState("Asset Hub")

  const chains = [
    "Asset Hub",
    "Bridge Hub",
    "Collectives",
    "Hydration"
  ]

  const fixedChain = "People"
  const token = "DOT"

  const userWallets = [
    { name: "Alice", address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" },
    { name: "Bob", address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty" },
    { name: "Charlie", address: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y" },
  ]

  // Assume the first wallet is the current user's wallet
  const currentUserWallet = userWallets[0]

  React.useEffect(() => {
    // Set default wallets when the component mounts
    setFromWallet(currentUserWallet.address)
    setToWallet(currentUserWallet.address)
  }, [])

  const handleFromWalletChange = (address: string) => {
    setFromWallet(address)
    // If toWallet hasn't been explicitly set, update it to match fromWallet
    if (toWallet === currentUserWallet.address) {
      setToWallet(address)
    }
  }

  return (
    <div className="flex justify-center p-4">
      <Button onClick={() => setOpen(true)} className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]">
        Open Teleporter
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1E1E1E] text-[#FFFFFF] border-[#E6007A] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Teleporter</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="from-wallet">From Wallet</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] hover:bg-[#3A3939] hover:text-[#FFFFFF]"
                  >
                    {fromWallet ? userWallets.find((wallet) => wallet.address === fromWallet)?.name : "Select wallet"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-[#2C2B2B] border-[#E6007A]">
                  <Command>
                    <CommandInput placeholder="Search wallet..." className="h-9 border-[#E6007A]" />
                    <CommandEmpty>No wallet found.</CommandEmpty>
                    <CommandGroup>
                      {userWallets.map((wallet) => (
                        <CommandItem
                          key={wallet.address}
                          onSelect={() => handleFromWalletChange(wallet.address)}
                          className="text-[#FFFFFF] hover:bg-[#3A3939]"
                        >
                          {wallet.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-wallet">To Wallet</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] hover:bg-[#3A3939] hover:text-[#FFFFFF]"
                  >
                    {toWallet ? userWallets.find((wallet) => wallet.address === toWallet)?.name : "Select wallet"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-[#2C2B2B] border-[#E6007A]">
                  <Command>
                    <CommandInput placeholder="Search wallet..." className="h-9 border-[#E6007A]" />
                    <CommandEmpty>No wallet found.</CommandEmpty>
                    <CommandGroup>
                      {userWallets.map((wallet) => (
                        <CommandItem
                          key={wallet.address}
                          onSelect={() => setToWallet(wallet.address)}
                          className="text-[#FFFFFF] hover:bg-[#3A3939]"
                        >
                          {wallet.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
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
                      <Select
                        value={isReversed ? fixedChain : selectedChain}
                        onValueChange={setSelectedChain}
                        disabled={isReversed}
                      >
                        <SelectTrigger className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF]">
                          <SelectValue placeholder="Select chain" />
                        </SelectTrigger>
                        <SelectContent>
                          {isReversed ? (
                            <SelectItem value={fixedChain}>{fixedChain}</SelectItem>
                          ) : chains.map((chain) => (
                            <SelectItem key={chain} value={chain}>{chain}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-[#3A3939] text-[#FFFFFF] border-[#E6007A]">
                      <p>{isReversed ? fixedChain : selectedChain}</p>
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
                      <Select
                        value={isReversed ? selectedChain : fixedChain}
                        onValueChange={setSelectedChain}
                        disabled={!isReversed}
                      >
                        <SelectTrigger className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF]">
                          <SelectValue placeholder="Select chain" />
                        </SelectTrigger>
                        <SelectContent>
                          {isReversed ? chains.map((chain) => (
                            <SelectItem key={chain} value={chain}>{chain}</SelectItem>
                          )) : (
                            <SelectItem value={fixedChain}>{fixedChain}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-[#3A3939] text-[#FFFFFF] border-[#E6007A]">
                      <p>{isReversed ? selectedChain : fixedChain}</p>
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
    </div>
  )
}
