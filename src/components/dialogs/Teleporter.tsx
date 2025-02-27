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
import { Switch } from "../ui/switch"
import { Binary, PolkadotSigner, SS58String, TypedApi } from "polkadot-api"
import { ApiConfig } from "~/api/config"
import BigNumber from "bignumber.js"
import { useTypedApi } from "@reactive-dot/react"
import { ChainDescriptorOf, Chains } from "@reactive-dot/core/internal.js"
import { AccountData } from "~/store/AccountStore"
import { getTransferableAmount } from "@paraspell/sdk";

const paraspellNodes = {
  rococo: { name: "rococo" },
  rococo_people: { name: "rococo_people" },
  polkadot: { name: "Polkadot" },
  polkadot_people: { name: "PeoplePolkadot" },
  ksmcc3: { name: "Kusama" },
  ksmcc3_people: { name: "PeopleKusama" },
  westend2: { name: "Westend" },
  westend2_people: { name: "PeopleWestend" },
}

// TODO Consider for removal
export default function Teleporter({ 
  address, accounts, chainId, tokenSymbol, tokenDecimals, typedApi, config, open, signer,
  formatAmount
}: {
  address: SS58String,
  accounts: AccountData[],
  chainId: string | number | symbol,
  typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>,
  config: ApiConfig,
  open: boolean,
  tokenSymbol: string,
  tokenDecimals: number,
  signer: PolkadotSigner,
  formatAmount: (amount: number | bigint | BigNumber | string, decimals?) => string,
}) {
  const [fromAddress, setFromAddress] = React.useState<SS58String>(address)
  const [toAddress, setToAddres] = React.useState<SS58String>(address)

  useEffect(() => {
    if (open) {
      setFromAddress(address)
      setToAddres(address)
    }
  }, [address, open])

  const [isReversed, setIsReversed] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const relayChainId = React.useMemo<keyof Chains>(
    () => (chainId as string).replace("_people", "") as keyof Chains, 
    [chainId]
  )
  const [selectedChain, setSelectedChain] = React.useState<keyof Chains>(relayChainId)

  const fromChainId = React.useMemo<keyof Chains>(
    () => (isReversed ? chainId : selectedChain) as keyof Chains, [isReversed, selectedChain, chainId]
  )
  const toChainId = React.useMemo<keyof Chains>(
    () => (isReversed ? selectedChain : chainId) as keyof Chains, [isReversed, selectedChain, chainId]
  )

  const fetchBalance = async (getTransferableAmountArgs: Parameters<typeof getTransferableAmount>[0]) => {
    try {
      return await getTransferableAmount(getTransferableAmountArgs as any)
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching balance for :', 
        `${getTransferableAmountArgs.node} ${getTransferableAmountArgs.address}`, 
        error
      )
      return null
    }
  }
  const [fromBalance, setFromBalance] = React.useState<bigint | null>()
  useEffect(() => {
    const transferDetails = {
      address: fromAddress,
      node: paraspellNodes[selectedChain].name,
      currency: { symbol: config.chains[fromChainId].symbol },
    }
    fetchBalance(transferDetails).then(setFromBalance)
    if (import.meta.env.DEV) console.log({ transferDetails, fromBalance })
  }, [fromAddress, fromChainId])

  const [toBalance, setToBalance] = React.useState<bigint | null>()
  useEffect(() => {
    const transferDetails = {
      address: toAddress,
      node: paraspellNodes[chainId].name,
      currency: { symbol: config.chains[toChainId].symbol },
    }
    fetchBalance(transferDetails).then(setToBalance)
    if (import.meta.env.DEV) console.log({ transferDetails, toBalance })
  }, [toAddress, toChainId])

  /* 
  const genericAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" as SS58String // Alice
  const fromBalance = BigNumber(
    useSpendableBalance(fromAddress || genericAddress, { chainId: fromChainId }).planck.toString()
  )
  const toBalance = BigNumber(
    useSpendableBalance(toAddress || genericAddress, { chainId: toChainId }).planck.toString()
  ) 
  */
  
  useEffect(() => {
    if (open) {
      setSelectedChain(relayChainId)
    }
  }, [relayChainId, open])

  const parachains = Object.entries(config.chains)
    .filter(([id]) => id.includes(relayChainId) && id !== chainId)
    .map(([id, chain]) => ({ id, name: chain.name }))

  const [comboboxOpen, setComboboxOpen] = React.useState(null)
  
  const handleFromWalletChange = React.useCallback((address: string) => {
    setFromAddress(address)
    setComboboxOpen(null)
  }, [])
  
  const handleToWalletChange = React.useCallback((address: string) => {
    setToAddres(address)
    setComboboxOpen(null)
  }, [])

  const relayChainTypedApi = useTypedApi({ chainId: relayChainId })
  const selectedChainApi = useTypedApi({ chainId: selectedChain })

  const _getParachainId = (
    typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>, 
    setter: (id: number | null) => void
  ) => {
    if (typedApi) {
      (async () => {
        try {
          const paraId = await typedApi.constants.ParachainSystem.SelfParaId()
          if (import.meta.env.DEV) console.log({ paraId })
          setter(paraId)
        } catch (error) {
          if (import.meta.env.DEV) console.error("Error getting parachain ID", error)
          setter(null)
        }
      })()
    }
  }

  const [firstParachainId, setFirstParachainId] = React.useState(null)
  useEffect(() => _getParachainId(typedApi, setFirstParachainId), [typedApi])
  const [secondParachainId, setSecondParachainId] = React.useState(null)
  useEffect(() => _getParachainId(selectedChainApi, setSecondParachainId), [selectedChainApi])

  const getTeleportParams = React.useCallback(({paraId, intoParachain, address, amount}) => ({
    dest: {
      type: "V3",
      value: {
        interior: intoParachain 
          ? { 
            type: "Here", 
            value: null 
          }
          : {
            type: "X1",
            value: {
              type: "Parachain",
              value: paraId,
            }
          }
        ,
        parents: Number(intoParachain),
      },
    },
    beneficiary: {
      type: "V3",
      value: {
        interior: {
          type: "X1",
          value: {
            type: "AccountId32",
            value: {
              id: Binary.fromText(address),
            },
          },
        },
        parents: 0
      }
    },
    assets: {
      type: "V3",
      value: [{
        fun: {
          type: "Fungible",
          value: amount
        },
        id: {
          type: "Concrete",
          value: {
            interior: {
              type: "Here",
              value: null
            },
            parents: Number(intoParachain),
          },
        }
      }]
    },
    fee_asset_index: 0,
    weight_limit: {
      type: "Unlimited",
      value: null,
    }
  }), [])

  const fromParachainId = isReversed ? firstParachainId : secondParachainId
  const toParachainId = isReversed ? secondParachainId : firstParachainId
  const submitTeleport = React.useCallback(() => {
    if (!relayChainTypedApi || !signer || !amount) {
      return;
    }
    const newAmount = BigInt(BigNumber(amount).times(BigNumber(10).pow(BigNumber(tokenDecimals)))
      .toString()
    )
    if (import.meta.env.DEV) console.log("teleporting", newAmount);

    (async () => {
      try {
        if (fromParachainId) {
          const params = getTeleportParams({ 
            paraId: fromParachainId, 
            intoParachain: true,
            address: fromAddress,
            amount: newAmount
          })
          if (import.meta.env.DEV) console.log({ params })
          const result = await relayChainTypedApi.tx.XcmPallet.limited_teleport_assets(params)
            .signAndSubmit(signer)
          if (import.meta.env.DEV) console.log({ result })
        }
        if (toParachainId) {
          const params = getTeleportParams({
            paraId: toParachainId,
            intoParachain: false,
            address: toAddress,
            amount: newAmount
          })
          if (import.meta.env.DEV) console.log({ params })
          const result = await relayChainTypedApi.tx.XcmPallet.limited_teleport_assets(params)
            .signAndSubmit(signer)
          if (import.meta.env.DEV) console.log({ result })
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error teleporting", error)
      }
    })()
  }, [amount, relayChainTypedApi])

  const chains = Object.entries(config.chains)
 
  return (
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
              {toAddress ? accounts.find(account => account.encodedAddress === toAddress)?.name : "Select wallet"}
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
                      onSelect={() => handleToWalletChange(account.encodedAddress)}
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
                <Select value={fromChainId} disabled={isReversed}
                  onValueChange={setSelectedChain as (value: string) => void} 
                >
                  <SelectTrigger className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF]">
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    {isReversed 
                      ?(<SelectItem value={chainId as string}>
                        {config.chains[chainId as string].name}
                      </SelectItem>) 
                      :chains.filter(([id]) => id !== toChainId).map(([id, { name }]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#3A3939] text-[#FFFFFF] border-[#E6007A]">
                <p>{(isReversed ? chainId : selectedChain) as ReactNode}</p>
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
                <Select value={toChainId} onValueChange={setSelectedChain as (value: string) => void} disabled={!isReversed}>
                  <SelectTrigger className="bg-[#2C2B2B] border-[#E6007A] text-[#FFFFFF]">
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    {isReversed 
                      ?chains.filter(([id]) => id !== fromChainId).map(([id, { name }]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      )) 
                      :(<SelectItem value={chainId as string}>
                        {config.chains[chainId as string].name}
                      </SelectItem>
                      )
                    }
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#3A3939] text-[#FFFFFF] border-[#E6007A]">
                <p>{(isReversed ? selectedChain : chainId) as ReactNode}</p>
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
              <span>{config.chains[fromChainId].name}</span>
              <span>{formatAmount(!isReversed ? fromBalance : toBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span>{config.chains[toChainId].name}</span>
              <span>{formatAmount(isReversed ? fromBalance : toBalance)}</span>
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
            <span className="text-[#FFFFFF]">{tokenSymbol}</span>
          </div>
        </div>
      </div>

      <Button className="w-full bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]" 
        onClick={submitTeleport}
      >
        <ArrowDownUp className="mr-2 h-4 w-4" />
        Teleport
      </Button>
    </div>
  )
}
