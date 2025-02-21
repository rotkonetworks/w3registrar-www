import { useState, useEffect, useCallback, useMemo, startTransition, memo, useRef, Ref } from "react"
import { ChevronLeft, ChevronRight, UserCircle, Shield, FileCheck, Coins, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ConnectionDialog } from "dot-connect/react.js"
import Header from "./Header"
import { chainStore as _chainStore, ChainInfo } from '~/store/ChainStore'
import { alertsStore as _alertsStore, pushAlert, removeAlert, AlertProps, AlertPropsOptionalKey } from '~/store/AlertStore'
import { useProxy } from "valtio/utils"
import { identityStore as _identityStore, IdentityStore, verifyStatuses } from "~/store/IdentityStore"
import { challengeStore as _challengeStore, ChallengeStore } from "~/store/challengesStore"
import { 
  useAccounts, useClient, useConnectedWallets, useTypedApi, useWalletDisconnector 
} from "@reactive-dot/react"
import { accountStore as _accountStore, AccountData } from "~/store/AccountStore"
import { IdentityForm, IdentityFormData } from "./tabs/IdentityForm"
import { ChallengePage } from "./tabs/ChallengePage"
import { StatusPage } from "./tabs/StatusPage"
import { IdentityData } from "@polkadot-api/descriptors"
import { useChainRealTimeInfo } from "~/hooks/useChainRealTimeInfo"
import { Binary, HexString, SS58String, TypedApi } from "polkadot-api"
import { NotifyAccountState, useChallengeWebSocket } from "~/hooks/useChallengeWebSocket"
import BigNumber from "bignumber.js"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { config } from "~/api/config"
import TeleporterDialog from "./dialogs/Teleporter"
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { useUrlParams } from "~/hooks/useUrlParams"
import { useDarkMode } from "~/hooks/useDarkMode"
import type { ChainId } from "@reactive-dot/core";
import { LoadingContent, LoadingTabs } from "~/pages/Loading"
import { ChainDescriptorOf, Chains } from "@reactive-dot/core/internal.js"
import { ApiRuntimeCall, ApiStorage, ApiTx } from "~/types/api"
import { GenericDialog } from "./dialogs/GenericDialog"
import { Overview } from "~/help"
import { HelpCarousel, SLIDES_COUNT } from "~/help/helpCarousel"

const MemoIdeitityForm = memo(IdentityForm)
const MemoChallengesPage = memo(ChallengePage)
const MemoStatusPage = memo(StatusPage)

type MainContentProps = {
  identityStore: IdentityStore,
  challengeStore: { challenges: ChallengeStore, error: string | null },
  chainStore: ChainInfo, 
  typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>, 
  accountStore: AccountData,
  chainConstants, 
  alertsStore: Map<string, AlertProps>,
  addNotification: any, 
  formatAmount: any, 
  supportedFields: string[],
  signSubmitAndWatch: any,
  removeNotification: any,
  identityFormRef: Ref<unknown>,
  urlParams: Record<string, string>,
  updateUrlParams: any,
  setOpenDialog: any,
  isTxBusy: boolean,
}
const MainContent = ({
  identityStore, challengeStore, chainStore, typedApi, accountStore,
  chainConstants, alertsStore, identityFormRef, urlParams, isTxBusy, supportedFields,
  addNotification, removeNotification, formatAmount,
  signSubmitAndWatch, updateUrlParams, setOpenDialog,
}: MainContentProps) => {
  const tabs = [
    {
      id: "identityForm",
      name: "Identity Form",
      icon: <UserCircle className="h-5 w-5" />,
      disabled: false,
      content: <MemoIdeitityForm
        ref={identityFormRef}
        identityStore={identityStore}
        chainStore={chainStore}
        typedApi={typedApi}
        accountStore={accountStore}
        chainConstants={chainConstants}
        supportedFields={supportedFields}
        formatAmount={formatAmount}
        signSubmitAndWatch={signSubmitAndWatch}
        isTxBusy={isTxBusy}
      />
    },
    {
      id: "challenges",
      name: "Challenges",
      icon: <Shield className="h-5 w-5" />,
      disabled: identityStore.status < verifyStatuses.FeePaid,
      content: <MemoChallengesPage
        addNotification={addNotification}
        challengeStore={challengeStore}
      />
    },
    {
      id: "status",
      name: "Status",
      icon: <FileCheck className="h-5 w-5" />,
      disabled: identityStore.status < verifyStatuses.NoIdentity,
      content: <MemoStatusPage
        identityStore={identityStore}
        challengeStore={challengeStore.challenges}
        formatAmount={formatAmount}
        onIdentityClear={() => setOpenDialog("clearIdentity")}
        isTxBusy={isTxBusy}
        chainName={chainStore.name?.replace(/ People/g, " ")}
      />
    },
  ]
  const enabledTabsIndexes = tabs
    .map((tab, index) => ({ index, id: tab.id, disabled: tab.disabled }))
    .filter(tab => !tab.disabled)
  
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
    
  useEffect(() => {
    if (!urlParams) {
      return;
    }
    const tab = tabs.find(tab => tab.id === urlParams.tab && !tab.disabled);
    if (tab && !tab.disabled) {
      setCurrentTabIndex(tabs.indexOf(tab))
    }
  }, [urlParams.tab])
  const changeCurrentTab = useCallback((index: number) => {
    const tab = tabs[index];
    updateUrlParams({ ...urlParams, tab: tab.id })
    setCurrentTabIndex(index)
  }, [urlParams, tabs, updateUrlParams])

  const advanceToPrevTab = useCallback(() => {
    const prevIndex = enabledTabsIndexes.slice().reverse()
      .find(({ index }) => index < currentTabIndex)
    if (prevIndex) {
      changeCurrentTab(prevIndex.index)
    }
  }, [currentTabIndex, enabledTabsIndexes, changeCurrentTab])
  const advanceToNextTab = useCallback(() => {
    const nextIndex = enabledTabsIndexes.find(({ index }) => index > currentTabIndex)
    if (nextIndex) {
      changeCurrentTab(nextIndex.index)
    }
  }, [currentTabIndex, enabledTabsIndexes, changeCurrentTab])

  return <>
    {[...alertsStore.entries()].map(([, alert]) => (
      <Alert
        key={alert.key}
        variant={alert.type === 'error' ? "destructive" : "default"}
        className={`mb-4 ${alert.type === 'error'
          ? 'bg-red-200 border-[#E6007A] text-red-800 dark:bg-red-800 dark:text-red-200'
          : 'bg-[#FFE5F3] border-[#E6007A] text-[#670D35] dark:bg-[#393838] dark:text-[#FFFFFF]'
        }`}
      >
        <AlertTitle>{alert.type === 'error' ? 'Error' : 'Notification'}</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          {alert.message}
          {alert.closable === true && <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeNotification(alert.key)}
              className="bg-transparent text-[#670D35] hover:text-[#E6007A] dark:text-[#FFFFFF] dark:hover:text-[#E6007A]"
            >
              Dismiss
            </Button>
          </>}
        </AlertDescription>
      </Alert>
    ))}

    <Tabs defaultValue={tabs[0].name} value={tabs[currentTabIndex].name} className="w-full">
      <TabsList
        className="grid w-full grid-cols-3 dark:bg-[#393838] bg-[#ffffff] text-dark dark:text-light overflow-hidden"
      >
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={index}
            value={tab.name}
            onClick={() => changeCurrentTab(index)}
            className="data-[state=active]:bg-[#E6007A] data-[state=active]:text-[#FFFFFF] flex items-center justify-center py-2 px-1"
            disabled={tab.disabled}
          >
            {tab.icon}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, index) => (
        <TabsContent key={index} value={tab.name} className="p-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>

    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={advanceToPrevTab}
        disabled={enabledTabsIndexes.slice().reverse().findIndex(({ index }) => index < currentTabIndex) === -1}
        className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
      </Button>
      <Button
        onClick={advanceToNextTab}
        disabled={enabledTabsIndexes.findIndex(({ index }) => index > currentTabIndex) === -1}
        className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]"
      >
        Next <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </>
}

export function IdentityRegistrarComponent() {
  const alertsStore = useProxy(_alertsStore);
  const { isDark, setDark } = useDarkMode()

  const identityStore = useProxy(_identityStore);
  const chainStore = useProxy(_chainStore);
  const typedApi = useTypedApi({ chainId: chainStore.id as ChainId })

  const accountStore = useProxy(_accountStore)

  const { urlParams, updateUrlParams } = useUrlParams()

  //#region notifications
  const addNotification = useCallback((alert: AlertPropsOptionalKey) => {
    const key = (alert as AlertProps).key || (new Date()).toISOString();
    pushAlert({ ...alert, key, closable: alert.closable ?? true });
  }, [pushAlert])

  const removeNotification = useCallback((key: string) => {
    removeAlert(key)
  }, [removeAlert])
  //#endregion notifications

  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  //#region accounts
  const accounts = useAccounts()
  const displayedAccounts = useMemo(() => accounts.map(account => ({
    ...account,
    encodedAddress: encodeAddress(account.polkadotSigner.publicKey, chainStore.ss58Format),
  })), [accounts, chainStore.ss58Format])

  const getAccountData = useCallback((address: SS58String) => {
    let foundAccount: AccountData | null;
    let decodedAddress: Uint8Array;
    try {
      decodedAddress = decodeAddress(address); // Validate address as well
    } catch (error) {
      console.error("Error decoding address from URL:", error)
      addNotification({
        type: "error",
        message: "Invalid address in URL. Could not decode",
        closable: false,
        key: "invalidAddress",
      })
      return null;
    }
    foundAccount = accounts.find(account => {
      const publicKey = account.polkadotSigner.publicKey;
      return publicKey.every((byte, index) => byte === decodedAddress[index]);
    });

    if (!foundAccount) {
      return null;
    }

    return {
      name: foundAccount.name,
      polkadotSigner: foundAccount.polkadotSigner,
      address: address,
      encodedAddress: encodeAddress(foundAccount.polkadotSigner.publicKey, chainStore.ss58Format),
    };
  }, [accounts, chainStore.ss58Format]);

  const connectedWallets = useConnectedWallets()
  const [_, disconnectWallet] = useWalletDisconnector()

  useEffect(() => {
    if (!connectedWallets.length) {
      addNotification({
        type: "error",
        message: "Please connect a wallet so that you can choose an account and continue.",
        closable: false,
        key: "noConnectedWallets",
      })
      return;
    } else {
      removeAlert("noConnectedWallets");
    }
  }, [connectedWallets.length])
  useEffect(() => {
    if (!urlParams.address) {
      addNotification({
        type: "error",
        message: "Please pick an account that is registered in your wallets from account dropdown.",
        closable: false,
        key: "invalidAccount",
      })
      return;
    }
    const accountData = getAccountData(urlParams.address);
    if (import.meta.env.DEV) console.log({ accountData });
    if (accountData) {
      Object.assign(accountStore, accountData);
      removeAlert("invalidAccount");
      removeAlert("invalidAddress");
    } else {
      addNotification({
        type: "error",
        message: "Please pick an account that is registered in your wallets from account dropdown.",
        closable: false,
        key: "invalidAccount",
      })
    }
  }, [accountStore.polkadotSigner, urlParams.address, getAccountData])

  const updateAccount = useCallback(({ name, address, polkadotSigner }: AccountData) => {
    const account = { name, address, polkadotSigner };
    if (import.meta.env.DEV) console.log({ account });
    Object.assign(accountStore, account);
    updateUrlParams({ ...urlParams, address,  })
  }, [accountStore, urlParams]);
  //#endregion accounts

  //#region identity
  const identityFormRef = useRef<{ reset: () => void, }>()
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ identityFormRef })
  }, [identityFormRef.current])
  const fetchIdAndJudgement = useCallback(() => (typedApi.query.Identity.IdentityOf as ApiStorage)
    .getValue(accountStore.address, { at: "best" })
    .then((result) => {
      if (import.meta.env.DEV) console.log({ identityOf: result });
      if (result) {
        // For most of the cases, the result is an array of IdentityOf, but for Westend it's an object
        const identityOf = result[0] || result;
        const identityData = Object.fromEntries(Object.entries(identityOf.info)
          .filter(([_, value]: [never, IdentityData]) => value?.type?.startsWith("Raw"))
          .map(([key, value]: [keyof IdentityFormData, IdentityData]) => [key, 
            (value.value as Binary).asText()
          ])
          // TODO Handle other formats, like Blake2_256, etc.
        );
        identityStore.deposit = identityOf.deposit
        identityStore.info = identityData;
        identityStore.status = verifyStatuses.IdentitySet;
        const idJudgementOfId = identityOf.judgements;
        const judgementsData: typeof identityStore.judgements = idJudgementOfId.map((judgement) => ({
          registrar: {
            index: judgement[0],
          },
          state: judgement[1].type,
          fee: judgement[1].value,
        }));
        if (judgementsData.length > 0) {
          identityStore.judgements = judgementsData;
          identityStore.status = verifyStatuses.JudgementRequested;
        }
        if (judgementsData.find(j => j.state === "FeePaid")) {
          identityStore.status = verifyStatuses.FeePaid;
        }
        if (judgementsData.find(judgement => ["Reasonable", "KnownGood"].includes(judgement.state))) {
          identityStore.status = verifyStatuses.IdentityVerified;
        }
        const idDeposit = identityOf.deposit;
        // TODO Compute approximate reserve
        if (import.meta.env.DEV) console.log({ identityOf, identityData, judgementsData, idDeposit, });
      } else {
        identityStore.status = verifyStatuses.NoIdentity;
        identityStore.info = null
        identityStore.deposit = null
      }
      identityFormRef.current.reset()
      return identityStore;
    })
    .catch(e => {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.error("Couldn't get identityOf.", e);
      }
    })
  , [accountStore.address, typedApi]);
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ typedApi, accountStore })
    identityStore.deposit = null;
    identityStore.info = null
    identityStore.status = verifyStatuses.Unknown;
    if (accountStore.address) {
      fetchIdAndJudgement();
    }
  }, [accountStore.address, fetchIdAndJudgement])
  //#endregion identity
  
  // Make sure to clear anything else that might change according to the chain or account
  useEffect(() => {
    alertsStore.forEach(alert => {
      delete alertsStore[alert.key]
    })
  }, [chainStore.id, accountStore.address])

  //#region chains
  const chainClient = useClient({ chainId: chainStore.id as keyof Chains })

  const IdentityField = {
    display: 1 << 0,
    legal: 1 << 1,
    web: 1 << 2,
    matrix: 1 << 3,
    email: 1 << 4,
    pgp_fingerprint: 1 << 5,
    image: 1 << 6,
    twitter: 1 << 7,
    github: 1 << 8,
    discord: 1 << 9,
  } as const;
  const getSupportedFields = (bitfield: number): string[] => {
    const result: string[] = [];
    for (const key in IdentityField) {
      if (bitfield & IdentityField[key as keyof typeof IdentityField]) {
        result.push(key);
      }
    }
    return result;
  }

  const _formattedChainId = (chainStore.name as string)?.split(' ')[0]?.toUpperCase()
  const registrarIndex = import.meta.env[`VITE_APP_REGISTRAR_INDEX__PEOPLE_${_formattedChainId}`] as number
  const [supportedFields, setSupportedFields] = useState<string[]>([])
  useEffect(() => {
    (typedApi.query.Identity.Registrars as ApiStorage)
      .getValue()
      .then((result) => {
        const fields = result[registrarIndex].fields
        const _supportedFields = getSupportedFields(fields > 0 ? Number(fields) : (1 << 10) -1)
        setSupportedFields(_supportedFields)
        if (import.meta.env.DEV) console.log({ supportedFields: _supportedFields, result })
      })
  }, [chainStore.id, typedApi, registrarIndex])
  
  useEffect(() => {
    ((async () => {
      const id = chainStore.id;
      
      let chainProperties
      try {
        chainProperties = (await chainClient.getChainSpecData()).properties
        if (import.meta.env.DEV) console.log({ id, chainProperties })
      } catch {
        if (import.meta.env.DEV) console.error({ id, })
      }
      const newChainData = {
        name: config.chains[id].name,
        registrarIndex: config.chains[id].registrarIndex,
        ...chainProperties,
      }
      startTransition(() => {
        Object.assign(chainStore, newChainData)
        if (import.meta.env.DEV) console.log({ id, newChainData })
      })
    }) ())
  }, [chainStore.id, chainClient])
  const onChainSelect = useCallback((chainId: string | number | symbol) => {
    updateUrlParams({ ...urlParams, chain: chainId as string })
    chainStore.id = chainId
  }, [urlParams])
  
  const eventHandlers = useMemo<Record<string, { 
    onEvent: (data: any) => void; 
    onError?: (error: Error) => void; 
    priority: number 
  }>>(() => ({
    "Identity.JudgementGiven": {
      onEvent: async data => {
        const newIdentity = await fetchIdAndJudgement()
        if ((newIdentity as IdentityStore)?.status === verifyStatuses.IdentityVerified) {
          addNotification({
            type: "info",
            message: "Judgement Given! Identity verified successfully. Congratulations!",
          })
        } else {
          addNotification({
            type: "error",
            message: "Judgement Given! Identity not verified. Please remove it and try again.",
          })
        }
      },
      onError: error => { },
      priority: 4,
    },
  }), [])

  const [pendingTx, setPendingTx] = useState<
    Array<{ hash: HexString, type: string, who: SS58String, [key: string]: any, txHash: HexString }>
  >([])
  const { constants: chainConstants } = useChainRealTimeInfo({
    typedApi,
    chainId: chainStore.id,
    address: accountStore.encodedAddress,
    handlers: eventHandlers,
  })
  //#endregion chains
  
  //#region challenges
  const { challenges, 
    error: challengeError, 
    isConnected: isChallengeWsConnected,
    subscribe: subscribeToChallenges,
    connect: connectToChallenges,
    disconnect: disconnectFromChallenges,
  } = useChallengeWebSocket({
    url: import.meta.env.VITE_APP_CHALLENGES_API_URL as string,
    address: accountStore.encodedAddress,
    network: (chainStore.id as string).split("_")[0],
    identityStore: { info: identityStore.info, status: identityStore.status, },
    addNotification,
  });
  useEffect(() => {
    if (isChallengeWsConnected && identityStore.status === verifyStatuses.FeePaid) {
      subscribeToChallenges()
    }
  }, [isChallengeWsConnected])
  //#endregion challenges

  const formatAmount = useCallback((amount: number | bigint | BigNumber | string, decimals?) => {
    if (!amount) {
      return "---"
    }
    const newAmount = BigNumber(amount.toString()).dividedBy(BigNumber(10).pow(chainStore.tokenDecimals)).toString()
    return `${newAmount} ${chainStore.tokenSymbol}`;
  }, [chainStore.tokenDecimals, chainStore.tokenSymbol])
  
  const [isTxBusy, setTxBusy] = useState(false)
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ isTxBusy })
  }, [isTxBusy])

  // Keep hashes of recent notifications to prevent duplicates, as a transaction might produce 
  //  multiple notifications
  const recentNotifsIds = useRef<string[]>([])
  const signSubmitAndWatch = useCallback(async (
    call: ApiTx,
    messages: {
      broadcasted?: string,
      loading?: string,
      success?: string,
      error?: string,
    },
    eventType: string,
  ) => {
    if (isTxBusy) {
      return
    }
    setTxBusy(true)

    const nonce = await (async () => {
      try {
        return await ((typedApi.apis.AccountNonceApi as any)
          .account_nonce(accountStore.address, { at: "best", }) as ApiRuntimeCall
        )
      } catch (error) {
        if (import.meta.env.DEV) console.error(error)
        return null
      }
    })()
    if (import.meta.env.DEV) console.log({ nonce });
    if (nonce === null) {
      setTxBusy(false)
      addNotification({
        type: "error",
        message: "Couldn't get nonce. Please try again.",
      })
      return
    }

    const signedCall = call.signSubmitAndWatch(accountStore.polkadotSigner, 
      { at: "best", nonce: nonce }
    )
    let txHash: HexString | null = null
    signedCall.subscribe({
      next: (result) => {
        txHash = result.txHash;
        const _result: (typeof result) & {
          found: boolean,
          ok: boolean,
          isValid: boolean,
        } = { 
          found: result["found"] || false,
          ok: result["ok"] || false,
          isValid: result["isValid"],
          ...result,
        };
        if (result.type === "broadcasted") {
          addNotification({
            key: result.txHash,
            type: "loading",
            closable: false,
            message: messages.broadcasted || "Transaction broadcasted",
          })
        }
        else if (_result.type === "txBestBlocksState") {
          if (_result.ok) {
            addNotification({
              key: _result.txHash,
              type: "success",
              message: messages.success || "Transaction finalized",
            })
            fetchIdAndJudgement()
            setTxBusy(false)
            recentNotifsIds.current = recentNotifsIds.current.filter(id => id !== _result.txHash)
          }
          else if (!_result.isValid) {
            if (!recentNotifsIds.current.includes(txHash)) {
              recentNotifsIds.current = [...recentNotifsIds.current, txHash]
              addNotification({
                key: _result.txHash,
                type: "error",
                message: messages.error || "Transaction failed because it's invalid",
              })
              fetchIdAndJudgement()
              setTxBusy(false)
            }
          }
        }
        else if (_result.type === "finalized") {
          // Tx need only be processed successfully. If Ok, it's already been found in best blocks.
          if (!_result.ok) {
            addNotification({
              key: _result.txHash,
              type: "error",
              message: messages.error || "Transaction failed",
            })
            fetchIdAndJudgement()
            setTxBusy(false)
          }
        }
        if (import.meta.env.DEV) console.log({ _result, recentNotifsIds: recentNotifsIds.current })
      },
      error: (error) => {
        if (import.meta.env.DEV) console.error(error);
        if (!recentNotifsIds.current.includes(txHash)) {
          addNotification({
            type: "error",
            message: messages.error || "Error submitting transaction. Please try again.",
          })
          setTxBusy(false)
          recentNotifsIds.current = recentNotifsIds.current.filter(id => id !== txHash)
        }
      },
      complete: () => {
        if (import.meta.env.DEV) console.log("Completed")
        recentNotifsIds.current = recentNotifsIds.current.filter(id => id !== txHash)
      }
    })
    return signedCall
  }, [accountStore.polkadotSigner, isTxBusy])

  const _clearIdentity = useCallback(() => typedApi.tx.Identity.clear_identity({}), [typedApi])
  const onIdentityClear = useCallback(async () => {
    signSubmitAndWatch(_clearIdentity(), 
      {
        broadcasted: "Clearing identity...",
        loading: "Waiting for finalization...",
        success: "Identity cleared",
        error: "Error clearing identity",
      },
      "Identity.IdentityCleared"
    )
  }, [_clearIdentity])
  
  type DialogMode = "clearIdentity" | "disconnect" | "teleport" | "help" | null
  const [openDialog, setOpenDialog] = useState<DialogMode>(null)

  //#region CostExtimations
  const [estimatedCosts, setEstimatedCosts] = useState<{ fees?: bigint; deposits?: bigint; }>({})
  useEffect(() => {
    if (openDialog === "clearIdentity") {
      _clearIdentity().getEstimatedFees(accountStore.address)
        .then(fees => setEstimatedCosts({ fees, }))
        .catch(error => {
          if (import.meta.env.DEV) console.error(error)
          setEstimatedCosts({})
        })
    } else {
      setEstimatedCosts({})
    }
  }, [openDialog, chainStore.id])
  //#endregion CostExtimations
  
  const handleOpenChange = useCallback((nextState: boolean): void => {
    setOpenDialog(previousState => nextState ? previousState : null)
  }, [])

  const onAccountSelect = useCallback((newValue: { type: string, account: AccountData }) => {
    if (import.meta.env.DEV) console.log({ newValue })
    switch (newValue.type) {
      case "Wallets":
        setWalletDialogOpen(true);
        break;
      case "Disconnect":
        setOpenDialog("disconnect")
        break;
      case "Teleport":
        setOpenDialog("teleport")
        break;
      case "RemoveIdentity":
        setOpenDialog("clearIdentity")
        break;
      case "account":
        updateAccount({ ...newValue.account });
        break;
      default:
        if (import.meta.env.DEV) console.log({ newValue })
        throw new Error("Invalid action type");
    }
  }, [])

  const onRequestWalletConnection = useCallback(() => setWalletDialogOpen(true), [])  

  const mainProps: MainContentProps = { 
    chainStore, typedApi, accountStore, identityStore, chainConstants, alertsStore,
    challengeStore: { challenges, error: challengeError }, identityFormRef, urlParams, isTxBusy,
    supportedFields,
    addNotification, removeNotification, formatAmount, 
    signSubmitAndWatch, updateUrlParams, setOpenDialog,
  }

  const openHelpDialog = useCallback(() => setOpenDialog("help"), [])
  const [helpSlideIndex, setHelpSlideIndex] = useState(0)
  
  return <>
    <ConnectionDialog open={walletDialogOpen} 
      onClose={() => { setWalletDialogOpen(false) }} 
      dark={isDark}
    />
    <div className={`min-h-screen p-4 transition-colors duration-300 flex flex-grow flex-col flex-stretch 
      ${isDark 
        ? 'bg-[#2C2B2B] text-[#FFFFFF]' 
        : 'bg-[#FFFFFF] text-[#1E1E1E]'
      }`
    }>
      <div className="container mx-auto max-w-3xl font-mono flex flex-grow flex-col flex-stretch">
        <Header config={config} accounts={displayedAccounts} onChainSelect={onChainSelect} 
          onAccountSelect={onAccountSelect} identityStore={identityStore} 
          onRequestWalletConnections={onRequestWalletConnection}
          accountStore={{
            address: accountStore.encodedAddress,
            name: accountStore.name,
          }} 
          chainStore={{
            name: chainStore.name,
            id: chainStore.id,
          }} 
          onToggleDark={() => setDark(!isDark)}
          isDark={isDark}
          isTxBusy={isTxBusy}
          openHelpDialog={openHelpDialog}
        />

        {(() => {
          if (!accountStore.address || !chainStore.id) {
            return <MainContent {...mainProps} />;
          }

          if (identityStore.status === verifyStatuses.Unknown) {
            return (
              <div className="w-full flex flex-grow flex-col flex-stretch">
                <LoadingTabs />
                <LoadingContent>
                  <div className="flex flex-col items-stretch border-primary">
                    <HelpCarousel className="rounded-lg bg-background/30" currentSlideIndex={3} />
                    <span className="sm:text-3xl text-xl text-center font-bold pt-4">
                      Loading identity data...
                    </span>
                  </div>
                </LoadingContent>
              </div>
            );
          }

          return <MainContent {...mainProps} />;
        })()}
      </div>
    </div>

    {/* TODO Refactor into GenericDialog */}
    <Dialog open={["clearIdentity", "disconnect"].includes(openDialog)} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="dark:bg-[#2C2B2B] dark:text-[#FFFFFF] border-[#E6007A]">
        <DialogHeader>
          <DialogTitle className="text-[#E6007A]">Confirm Action</DialogTitle>
          <DialogDescription>
            Please review the following information before proceeding.
          </DialogDescription>
        </DialogHeader>
        {Object.keys(estimatedCosts).length > 0 &&
          <div className="py-4">
            <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Coins className="h-5 w-5 text-[#E6007A]" />
              Transaction Costs
            </h4>
            {estimatedCosts.fees &&
              <p>Estimated transaction fee: {formatAmount(estimatedCosts.fees)}</p>
            }
            {estimatedCosts.deposits && (
              <p>Estimated deposit: {formatAmount(estimatedCosts.deposits)}</p>
            )}
          </div>
        }
        <div className="py-4">
          <h4 className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#E6007A]" />
            Important Notes
          </h4>
          <ul className="list-disc list-inside">
            {openDialog === "clearIdentity" && (<>
              <li>All identity data will be deleted from chain..</li>
              <li>You will have to set identity again.</li>
              <li>You will lose verification status.</li>
              <li>Your deposit of {formatAmount(identityStore.deposit)} will be returned.</li>
            </>)}
            {openDialog === "disconnect" && (<>
              <li>No data will be removed on chain.</li>
              <li>Current account and wallet will be disconnected.</li>
            </>)}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenDialog(null)} 
            className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
          >
            Cancel
          </Button>
          <Button onClick={() => {
            switch (openDialog) {
              case "clearIdentity":
                onIdentityClear();
                break;
              case "disconnect":
                connectedWallets.forEach(w => disconnectWallet(w));
                Object.keys(accountStore).forEach((k) => delete accountStore[k]);
                updateUrlParams({ ...urlParams, address: null, })
                break;
              default:
                throw new Error("Unexpected openDialog value");
            }
            setOpenDialog(null)
          }} className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <GenericDialog open={openDialog === "help"} onOpenChange={(v) => {
      handleOpenChange(v)
      setHelpSlideIndex(0)
    }} 
      title="Quick start guide"
      // description={<Overview />}
      footer={<>
        {helpSlideIndex < SLIDES_COUNT -1 && (
          <Button variant="outline" onClick={() => {
            setOpenDialog(null)
            setHelpSlideIndex(0)
          }}>Skip</Button>
        )}
        <Button 
          onClick={() => {
            if (helpSlideIndex === SLIDES_COUNT - 1) {
              setOpenDialog(null)
              setHelpSlideIndex(0)
            } else {
              setHelpSlideIndex(prev => prev + 1)
            }
          }}
        >
          {helpSlideIndex >= SLIDES_COUNT -1 ? "Close" : "Next"}
        </Button>
      </>}
    >
      <HelpCarousel currentSlideIndex={helpSlideIndex} onSlideIndexChange={setHelpSlideIndex} />
    </GenericDialog>
    <TeleporterDialog accounts={displayedAccounts} chainId={chainStore.id} config={config} 
      typedApi={typedApi} open={openDialog === "teleport"} address={accountStore.encodedAddress}
      onOpenChange={handleOpenChange} formatAmount={formatAmount}
      tokenSymbol={chainStore.tokenSymbol} tokenDecimals={chainStore.tokenDecimals}
      signer={accountStore.polkadotSigner}
    />
  </>
}
