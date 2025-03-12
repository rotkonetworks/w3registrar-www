import React, { ReactNode, useEffect } from "react"
import { ArrowDownUp, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { 
  Command, CommandList, CommandEmpty, CommandGroup, CommandInput, CommandItem 
} from "../ui/command"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip"
import { Binary, PolkadotSigner, SS58String, TypedApi } from "polkadot-api"
import { ApiConfig } from "~/api/config"
import BigNumber from "bignumber.js"
import { useSpendableBalance, useTypedApi } from "@reactive-dot/react"
import { ChainDescriptorOf, Chains } from "@reactive-dot/core/internal.js"
import { AccountData } from "~/store/AccountStore"
import { XcmParameters } from "~/store/XcmParameters"
import { ApiTx } from "~/types/api"

export default function Teleporter({ 
  address, accounts, chainId, tokenSymbol, tokenDecimals, config, xcmParams,
  otherChains,
  formatAmount
}: {
  address: SS58String,
  accounts: AccountData[],
  chainId: string | number | symbol,
  config: ApiConfig,
  tokenSymbol: string,
  tokenDecimals: number,
  xcmParams: XcmParameters,
  tx: ApiTx,
  otherChains: { id: string, name: string }[],
  formatAmount: (amount: number | bigint | BigNumber | string, options?: { symbol }) => string,
}) {
  const fromAddress = xcmParams.fromAddress
  const setFromAddress = (address: string) => xcmParams.fromAddress = address
  const toAddress = address

  useEffect(() => {
    if (open) {
      setFromAddress(address)
    }
  }, [address, open])

  const amount = BigNumber(xcmParams.txTotalCost.toString())
    .div(BigNumber(10).pow(BigNumber(tokenDecimals)))
    .toString()
  
  const selectedChain = xcmParams.fromChain.id
  const setSelectedChain = (id: keyof Chains) => xcmParams.fromChain.id = id
  const fromChainId = xcmParams.fromChain.id
  const toChainId = chainId as keyof Chains
  
  const genericAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" as SS58String // Alice
  const fromBalance = BigNumber(
    useSpendableBalance(fromAddress || genericAddress, { chainId: fromChainId }).planck.toString()
  )
  const toBalance = BigNumber(
    useSpendableBalance(toAddress || genericAddress, { chainId: toChainId }).planck.toString()
  )
  
  useEffect(() => {
    if (open) {
      setSelectedChain(xcmParams.fromChain.id)
    }
  }, [xcmParams.fromChain.id, open])

  const [comboboxOpen, setComboboxOpen] = React.useState(null)
  
  const handleFromWalletChange = React.useCallback((address: string) => {
    setFromAddress(address)
    setComboboxOpen(null)
  }, [])

  return (
    <div className="grid gap-4 py-4">
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="fromAddress">From Wallet</Label>
          <Popover open={comboboxOpen === "fromAddress"}
            onOpenChange={(nextState) => setComboboxOpen(nextState ? "fromAddress" : null)}
          >
            <PopoverTrigger id="fromAddress" asChild>
              <Button variant="outline" role="combobox"
                className="w-full justify-between bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] hover:bg-[#3A3939] hover:text-[#FFFFFF]"
              >
                {fromAddress ? accounts.find(account => account.encodedAddress === fromAddress)?.name : "Select wallet"}
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
                        onSelect={() => handleFromWalletChange(account.encodedAddress)}
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

        <div className="flex-1 space-y-2">
          <Label htmlFor="toAddress">From Wallet</Label>
          <Input readOnly id="toAddress"
            value={accounts.find(({ encodedAddress }) => encodedAddress === toAddress).name} 
            className="flex-1 bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] placeholder-[#706D6D]"
          />
        </div>
      </div>

      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-2">
          <Label>From Chain:</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={fromChainId as keyof Chains}
                  onValueChange={setSelectedChain as (value: string) => void} 
                >
                  <SelectTrigger className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF]">
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherChains.map(({ id, name }) => 
                      <SelectItem key={id} value={id}>{name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#3A3939] text-[#FFFFFF] border-[#E6007A]">
                <p>{selectedChain as ReactNode}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex-1 space-y-2">
          <Label>To Chain:</Label>
          <Input value={config.chains[toChainId].name} readOnly
            className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] placeholder-[#706D6D]"
          />
        </div>
      </div>

      <Card className="border-[#E6007A] bg-[#2C2B2B]">
        <CardContent className="p-4">
          <h3 className="mb-4 text-lg font-semibold text-[#E6007A]">Transferable Balances</h3>
          <div className="space-y-2 text-[#FFFFFF]">
            <div className="flex justify-between">
              <span>{config.chains[fromChainId].name}</span>
              <span>{formatAmount(fromBalance, {
                symbol: config.chains[fromChainId].symbol,
              })}</span>
            </div>
            <div className="flex justify-between">
              <span>{config.chains[toChainId].name}</span>
              <span>{formatAmount(toBalance, {
                symbol: config.chains[toChainId].symbol,
              })}</span>
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
            value={amount}
            readOnly
            className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF] placeholder-[#706D6D] pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-[#FFFFFF]">{tokenSymbol}</span>
          </div>
        </div>
      </div>

      <Alert className="space-y-2">
        <p>
          Two transactions required, which you need to sign with your wallet and approve of:
          <ol>
            <li>1. Teleport assets between chains</li>
            <li>2. Execute identity transaction</li>
          </ol>
        </p>
      </Alert>
    </div>
  )
}
