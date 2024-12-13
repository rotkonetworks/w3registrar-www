import { 
  ChainProvider, ReactiveDotProvider, useAccounts, useClient, useConnectedWallets, useTypedApi, 
  useWalletDisconnector, 
} from "@reactive-dot/react"
import { startTransition, useCallback, useDeferredValue, useEffect } from "react"
import { ApiConfig } from "~/api/config2"
import { useChainRealTimeInfo } from "~/hooks/useChainRealTimeInfo"
import { AccountData } from "~/store/AccountStore"
import { ChainInfo } from "~/store/ChainStore"
import { IPolkadotApiStore } from "~/store/PolkadotApiStore"

interface PolkadotApiWrapperProps {
  config: ApiConfig
  context: IPolkadotApiStore
  accountStore: AccountData
  chainStore: ChainInfo
  isLoading: boolean
  eventHandlers: Record<string, {
    onEvent: (data: any) => void
    onError: (error: Error) => void
    priority?: number
  }>
}

const InternalPolkadotApi = (props: PolkadotApiWrapperProps) => {
  const { config, context, accountStore, chainStore, eventHandlers, isLoading } = props
  //#region accounts
  const accounts = useAccounts()
  useEffect(() => {
    context.accounts = accounts
  }, [accounts])
  useEffect(() => {
    if (!accountStore) {
      return;
    }
    if (!accountStore.address || accounts.length < 1) {
      return;
    }
    if (accountStore.polkadotSigner && accountStore.address) {
      return;
    }
    const foundAccount = accounts.find(account => account.address === accountStore.address)
    if (!foundAccount) {
      return;
    }
    const newAccountData = { polkadotSigner: foundAccount.polkadotSigner, name: foundAccount.name }
    Object.assign(accountStore, newAccountData)
  }, [accountStore?.polkadotSigner, accountStore?.address, accounts])
  //#endregion accounts
  
  const typedApi = useTypedApi<chainStore.id>({ chainId: chainStore.id })
  useEffect(() => {
    if (typedApi) {
      context.typedApi = typedApi
      import.meta.env.DEV && console.log({ 
        typedApi,
        call: typedApi.constants.Identity.ByteDeposit,
      })
    }
  }, [typedApi])

  //#region chains
  const chainClient = useClient({ chainId: chainStore.id })
  useEffect(() => {
    context.chainClient = chainClient
  }, [chainClient])
  useEffect(() => {
    ((async () => {
      const id = chainStore.id;

      let chainProperties
      try {
        chainProperties = (await chainClient.getChainSpecData()).properties
        import.meta.env.DEV && console.log({ id, chainProperties })
      } catch {
        console.error({ id, error })
      }
      const newChainData = {
        name: config.chains[id].name,
        registrarIndex: config.chains[id].registrarIndex,
        ...chainProperties,
      }
      startTransition(() => {
        Object.assign(chainStore, newChainData)
        import.meta.env.DEV && console.log({ id, newChainData })
      })
    })())
  }, [chainStore.id, chainClient])
  const setChainId = useCallback((chainId: keyof Chains) => {
    chainStore.id = chainId;
  }, [])
  useEffect(() => {
    context.setChainId = setChainId
  }, [setChainId])

  const { constants: chainConstants } = useChainRealTimeInfo({
    typedApi,
    chainId: chainStore.id,
    address: accountStore?.address,
    handlers: eventHandlers,
  })
  useEffect(() => {
    context.chainConstants = chainConstants
  }, [chainConstants])
  //#endregion chains

  //#region Wallets
  const connectedWallets = useConnectedWallets()
  useEffect(() => {
    context.connectedWallets = connectedWallets
  }, [connectedWallets])
  const [_, disconnectWallet] = useWalletDisconnector()
  useEffect(() => {
    context.disconnectWallet = disconnectWallet
  }, [disconnectWallet])
  //#endregion Wallets
}
export const PolkadotApiWrapper = ({ config, chainId, accountStore, chainStore, context, eventHandlers }: { 
  config: ApiConfig,
  chainId: keyof Chains,
} & PolkadotApiWrapperProps) => {
  const chainId2 = useDeferredValue(chainId)
  const isLoading = chainId !== chainId2

  return <>
    {!isLoading &&
      <ReactiveDotProvider config={config}>
        <ChainProvider chainId={chainId}>
          <InternalPolkadotApi accountStore={accountStore} config={config} chainStore={chainStore} 
            context={context} eventHandlers={eventHandlers} isLoading={isLoading}
          />
        </ChainProvider>
      </ReactiveDotProvider>
    }
  </>
}
