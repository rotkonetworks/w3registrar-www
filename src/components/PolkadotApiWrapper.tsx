import { ChainProvider, ReactiveDotProvider, useAccounts, useClient, useConnectedWallets, useTypedApi, useWalletDisconnector } from "@reactive-dot/react"
import { startTransition, Suspense, useCallback, useEffect } from "react"
import { useProxy } from "valtio/utils"
import { useChainRealTimeInfo } from "~/hooks/useChainRealTimeInfo"
import { AccountData } from "~/store/AccountStore"
import { ChainInfo } from "~/store/ChainStore"
import { IdentityStore } from "~/store/IdentityStore"
import { IPolkadotApiStore, polkadotApiStore } from "~/store/PolkadotApiStore"

const InternalPolkadotApi = ({
  context,
  accountStore,
  chainStore,
  identityStore,
  eventHandlers,
}: {
  context: IPolkadotApiStore,
  accountStore: AccountData,
  chainStore: ChainInfo,
  identityStore: IdentityStore,
  eventHandlers: Record<string, {
    onEvent: (data: any) => void,
    onError: (error: Error) => void,
    priority?: number,
  }>
}) => {
  //#region accounts
  const accounts = useAccounts()
  useEffect(() => {
    context.accounts = accounts
  }, [accounts])
  useEffect(() => {
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
  }, [accountStore.polkadotSigner, accountStore.address, accounts])
  //#endregion accounts
  
  const typedApi = useTypedApi<chainStore.id>({ chainId: chainStore.id })
  useEffect(() => {
    context.typedApi = typedApi
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
        name: chainContext.chains[id].name,
        registrarIndex: chainContext.chains[id].registrarIndex,
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
    address: accountStore.address,
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
export const PolkadotApiWrapper = ({ config, chainId }) => {
  <Suspense>
    <ReactiveDotProvider config={config}>
      <ChainProvider chainId={chainId}>
        <InternalPolkadotApi />
      </ChainProvider>
    </ReactiveDotProvider>
  </Suspense>
}
