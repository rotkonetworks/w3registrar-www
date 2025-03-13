import { useState, useEffect, useCallback, useMemo, startTransition, memo, useRef, Ref } from "react"
import { ChevronLeft, ChevronRight, UserCircle, Shield, FileCheck, Coins, AlertCircle, Bell } from "lucide-react"

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
import Teleporter from "./dialogs/Teleporter"
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { useUrlParams } from "~/hooks/useUrlParams"
import { useDarkMode } from "~/hooks/useDarkMode"
import type { ChainId } from "@reactive-dot/core";
import { LoadingContent, LoadingTabs } from "~/pages/Loading"
import { ChainDescriptorOf, Chains } from "@reactive-dot/core/internal.js"
import { ApiRuntimeCall, ApiStorage, ApiTx } from "~/types/api"
import { GenericDialog } from "./dialogs/GenericDialog"
import { HelpCarousel, SLIDES_COUNT } from "~/help/helpCarousel"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { xcmParameters as _xcmParams } from "~/store/XcmParameters"
import { Switch } from "./ui/switch"
import { 
  DialogMode, EstimatedCostInfo, MainContentProps, OpenTxDialogArgs, OpenTxDialogArgs_modeSet,
  SignSubmitAndWatchParams
} from "~/types"

const MemoIdeitityForm = memo(IdentityForm)
const MemoChallengesPage = memo(ChallengePage)
const MemoStatusPage = memo(StatusPage)

const MainContent = ({
  identityStore, challengeStore, chainStore, typedApi, accountStore,
  chainConstants, alertsStore, identityFormRef, urlParams, isTxBusy, supportedFields,
  addNotification, removeNotification, formatAmount, openTxDialog, updateUrlParams, setOpenDialog,
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
        openTxDialog={openTxDialog}
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
    {alertsStore.size > 0 && 
      <div
        className="fixed bottom-[2rem] left-[2rem] z-[9999] max-w-sm max-h-sm isolate pointer-events-auto"
      >
        <Accordion type="single" collapsible defaultValue="notifications">
          <AccordionItem value="notifications">
            <AccordionTrigger 
              className="rounded-full p-2 bg-[#E6007A] text-[#FFFFFF] dark:bg-[#BC0463] dark:text-[#FFFFFF] hover:no-underline"
            >
              <Bell className="h-6 w-6" /> {alertsStore.size}
            </AccordionTrigger>
            <AccordionContent
              className="bg-[#FFFFFF] dark:bg-[#2C2B2B] p-2 rounded-lg overflow-y-auto max-h-sm"
            >
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    }

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

  const formatAmount = useCallback((amount: number | bigint | BigNumber | string, options?: { 
   decimals?: number, // TODO Actually use this by implementing rounding
   symbol?: string
  }) => {
    if (amount === undefined || amount === null) {
      return "---"
    }
    const newAmount = BigNumber(amount.toString()).dividedBy(BigNumber(10).pow(chainStore.tokenDecimals)).toString()
    return `${newAmount} ${options?.symbol || chainStore.tokenSymbol}`;
  }, [chainStore.tokenDecimals, chainStore.tokenSymbol])
  
  const [isTxBusy, setTxBusy] = useState(false)
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ isTxBusy })
  }, [isTxBusy])

  //#region TeleportAccordion
  const xcmParams = useProxy(_xcmParams)

  const relayChainId = useMemo<keyof Chains>(
    () => (chainStore.id as string).replace("_people", "") as keyof Chains,
    [chainStore.id]
  )
  const relayAndParachains = Object.entries(config.chains)
    .filter(([id]) => id.includes(relayChainId) && id !== chainStore.id)
    .map(([id, chain]) => ({ id, name: chain.name }))
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ relayChainId, relayAndParachains });
    xcmParams.fromChain.id = relayChainId
  }, [relayChainId, relayAndParachains])
  const fromTypedApi = useTypedApi({ chainId: xcmParams.fromChain.id || relayChainId as ChainId })
  
  const _getParachainId = async (typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>) => {
    if (typedApi) {
      try {
        const paraId = await typedApi.constants.ParachainSystem.SelfParaId()
        if (import.meta.env.DEV) console.log({ paraId })
        return paraId
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error getting parachain ID", error)
      }
    }
  }

  //const [fromParachainId, setFromParachainId] = useState(null)
  useEffect(() => {
    if (fromTypedApi) {
      _getParachainId(fromTypedApi).then(id => {
        xcmParams.fromChain.paraId = id
      })
    }
  }, [fromTypedApi])
  const [parachainId, setParachainId] = useState<number>()
  useEffect(() => {
    if (typedApi) {
      _getParachainId(typedApi).then(id => {
        setParachainId(id)
      })
    }
  }, [typedApi])

  const getTeleportCall = useCallback(() => {
    const txArguments = ({
      dest: {
        type: "V3",
        value: {
          interior: {
            type: "X1",
            value: {
              type: "Parachain",
              value: parachainId,
            }
          },
          parents: 0,
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
                // using  Binary.fromString() instead of fromBytes() which caused assets to go to 
                //  the wrong address. 
                id: Binary.fromBytes(getAccountData(accountStore.address).polkadotSigner.publicKey),
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
            value: BigInt(xcmParams.txTotalCost.toString())
          },
          id: {
            type: "Concrete",
            value: xcmParams.fromChain.paraId
              ?{
                interior: {
                  type: "X1",
                  value: xcmParams.fromChain.paraId,
                },
                parents: 1,
              }
              : {
                interior: {
                  type: "Here",
                  value: null
                },
                parents: 0,
              }
            ,
          }
        }]
      },
      fee_asset_index: 0,
      weight_limit: {
        type: "Unlimited",
        value: null,
      }
    })
    if (import.meta.env.DEV) console.log({ txArguments })

    return fromTypedApi.tx.XcmPallet.teleport_assets(txArguments)
  }, [fromTypedApi, accountStore.address, xcmParams.txTotalCost, xcmParams.fromChain.paraId, parachainId])
  //#endregion TeleportAccordion

  //#region Transactions
  // Keep hashes of recent notifications to prevent duplicates, as a transaction might produce 
  //  multiple notifications
  const recentNotifsIds = useRef<string[]>([])
  const signSubmitAndWatch = useCallback((
    params: SignSubmitAndWatchParams
  ) => new Promise(async (resolve, reject) => {
    const { call, messages, name } = params;
    let api = params.api;

    if (!api) {
      api = typedApi
    }
    if (isTxBusy) {
      reject(new Error("Transaction already in progress"))
      return
    }
    setTxBusy(true)

    const nonce = await (async () => {
      try {
        return await ((api.apis.AccountNonceApi as any)
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
      reject(new Error("Failed to get nonce"))
      return
    }

    const signedCall = call.signSubmitAndWatch(accountStore.polkadotSigner,
      { at: "best", nonce: nonce }
    )
    let txHash: HexString | null = null

    const disposeSubscription = (callback?: () => void) => {
      setTxBusy(false)
      if (txHash) {
        recentNotifsIds.current = recentNotifsIds.current.filter(id => id !== txHash)
      }
      if (!subscription.closed)
        subscription.unsubscribe();
      callback?.()
    }

    const subscription = signedCall.subscribe({
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
            disposeSubscription(() => resolve(result))
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
              disposeSubscription(() => reject(new Error("Invalid transaction")))
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
            disposeSubscription(() => reject(new Error("Transaction failed")))
          }
        }
        if (import.meta.env.DEV) console.log({ _result, recentNotifsIds: recentNotifsIds.current })
      },
      error: (error) => {
        if (import.meta.env.DEV) console.error(error)
        if (!recentNotifsIds.current.includes(txHash)) {
          addNotification({
            type: "error",
            message: messages.error || "Error submitting transaction. Please try again.",
          })
          disposeSubscription(() => reject(error))
        }
      },
      complete: () => {
        if (import.meta.env.DEV) console.log("Completed")
        disposeSubscription()
      }
    })
  }), [accountStore.polkadotSigner, isTxBusy])
  //#endregion Transactions


  const _clearIdentity = useCallback(() => typedApi.tx.Identity.clear_identity({}), [typedApi])
  const onIdentityClear = useCallback(async () => {
    await signSubmitAndWatch({
      call: _clearIdentity(),
      messages: {
        broadcasted: "Clearing identity...",
        loading: "Waiting for finalization...",
        success: "Identity cleared",
        error: "Error clearing identity",
      },
      name: "Identity.IdentityCleared"
    })
  }, [_clearIdentity])
  
  const [openDialog, setOpenDialog] = useState<DialogMode>(null)

  //#region CostExtimations
  const [estimatedCosts, setEstimatedCosts] = useState<EstimatedCostInfo>({})
  //#endregion CostExtimations
  
  const [txToConfirm, setTxToConfirm] = useState<ApiTx | null>(null)
  
  //region TeleportAccordion
  const teleportExpanded = xcmParams.enabled
  const setTeleportExpanded = (nextState: boolean) => {
    xcmParams.enabled = nextState
  }

  useEffect(() => {
    xcmParams.txTotalCost = BigNumber(Object.values(estimatedCosts)
      .reduce(
        (total, current) => BigNumber(total as BigNumber).plus(BigNumber(current as BigNumber)), 
        0n
      )
      .toString()
    ).times(1.1)
  }, [estimatedCosts])
  //#endregion TeleportAccordion

  const openTxDialog = useCallback((args: OpenTxDialogArgs) => {
    if (import.meta.env.DEV) console.log({ args })
    if (args.mode) {
      setOpenDialog(args.mode)
      setEstimatedCosts((args as OpenTxDialogArgs_modeSet).estimatedCosts)
      setTxToConfirm((args as OpenTxDialogArgs_modeSet).tx)
    } else {
      setOpenDialog(null)
      setEstimatedCosts({})
      setTxToConfirm(null)
      xcmParams.enabled = false
    }
  }, [])
  const closeTxDialog = useCallback(() => openTxDialog({ mode: null }), [openTxDialog])

  const handleOpenChange = useCallback((nextState: boolean): void => {
    setOpenDialog(previousState => nextState ? previousState : null)
  }, [])

  const onAccountSelect = useCallback(async (accountAction: { type: string, account: AccountData }) => {
    if (import.meta.env.DEV) console.log({ newValue: accountAction })
    switch (accountAction.type) {
      case "Wallets":
        setWalletDialogOpen(true);
        break;
      case "Disconnect":
        setOpenDialog("disconnect")
        break;
      case "RemoveIdentity":
        const tx = _clearIdentity()
        openTxDialog({
          mode: "clearIdentity",
          tx: tx,
          estimatedCosts: {
            fees: await tx.getEstimatedFees(accountStore.address, { at: "best" }),
          },
        })
        break;
      case "account":
        updateAccount({ ...accountAction.account });
        break;
      default:
        if (import.meta.env.DEV) console.log({ accountAction })
        throw new Error("Invalid action type");
    }
  }, [])

  const onRequestWalletConnection = useCallback(() => setWalletDialogOpen(true), [])  

  const mainProps: MainContentProps = { 
    chainStore, typedApi, accountStore, identityStore, chainConstants, alertsStore,
    challengeStore: { challenges, error: challengeError }, identityFormRef, urlParams, isTxBusy,
    supportedFields,
    addNotification, removeNotification, formatAmount, openTxDialog, updateUrlParams, setOpenDialog,
  }

  //#region HelpDialog
  const openHelpDialog = useCallback(() => setOpenDialog("help"), [])
  const [helpSlideIndex, setHelpSlideIndex] = useState(0)
  //#endregion HelpDialog  
  
  const submitTransaction = async () => {
    if (xcmParams.enabled) {
      try {
        // TODO Include teleportation amount...
        await signSubmitAndWatch({
          api: fromTypedApi,
          call: getTeleportCall(),
          messages: {
            broadcasted: "Teleporting assets...",
            loading: "Teleporting assets...",
            success: "Assets teleported successfully",
            error: "Error teleporting assets",
          },
          name: "TeleportAssets"
        })
      } catch (error) {
        if (import.meta.env.DEV) console.error(error)
        addNotification({
          type: "error",
          message: "Error teleporting assets. Please try again.",
        })
        return
      }
    }

    switch (openDialog) {
      case "clearIdentity":
        await onIdentityClear()
        break
      case "disconnect":
        connectedWallets.forEach(w => disconnectWallet(w))
        Object.keys(accountStore).forEach((k) => delete accountStore[k])
        updateUrlParams({ ...urlParams, address: null, })
        break
      case "setIdentity":
        await signSubmitAndWatch({
          call: txToConfirm,
          messages: {},
          name: "Set Identity"
        })
        break
      case "requestJudgement":
        await signSubmitAndWatch({
          call: txToConfirm,
          messages: {},
          name: "Request Judgement"
        })
        break
      default:
        throw new Error("Unexpected openDialog value")
    }
    closeTxDialog()
  }

  return <>
    <ConnectionDialog open={walletDialogOpen} 
      onClose={() => { setWalletDialogOpen(false) }} 
      dark={isDark}
    />
    <div 
      className="min-h-screen p-4 transition-colors duration-300 flex flex-grow flex-col flex-stretch bg-[#FFFFFF] text-[#1E1E1E] dark:bg-[#2C2B2B] dark:text-[#FFFFFF]"
    >
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

    <Dialog 
      open={["clearIdentity", "disconnect", "setIdentity", "requestJudgement"].includes(openDialog)} 
      onOpenChange={v => v 
        ?openTxDialog({
          mode: openDialog as DialogMode,
          tx: txToConfirm,
          estimatedCosts,
        }) 
        :closeTxDialog()
      }
    >
      <DialogContent className="dark:bg-[#2C2B2B] dark:text-[#FFFFFF] border-[#E6007A]">
        <DialogHeader>
          <DialogTitle className="text-[#E6007A]">Confirm Action</DialogTitle>
          <DialogDescription>
            Please review the following information before proceeding.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[66vh] sm:max-h-[75vh]">
          {Object.keys(estimatedCosts).length > 0 &&
            <div>
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
          <div>
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
              {openDialog === "setIdentity" && (<>
                <li>Identity data will be set on chain.</li>
                <li>
                  Deposit of {formatAmount(identityStore.deposit)} will be taken, which will be 
                  released if you clear your identity.
                </li>
              </>)}
              {openDialog === "requestJudgement" && (<>
                <li>
                  After having fees paid, you will have go to second tab and complete all challenges 
                  in order to be verified.
                </li>
              </>)}
              {["setIdentity", "requestJudgement"].includes(openDialog) && (<>
                <li>Your identity information will remain publicly visible on-chain to everyone until you clear it.</li>
                <li>Please ensure all provided information is accurate before continuing.</li>
              </>)}
            </ul>
          </div>
          <Accordion type="single" collapsible value={teleportExpanded ? "teleport" : null} 
            onValueChange={(v) => setTeleportExpanded(v === "teleport")}
          >
            <AccordionItem value="teleport">
              <AccordionTrigger className="bg-transparent flex items-center gap-2">
                <div className="flex items-center gap-2">
                  Trasnfer from other account
                  <Switch checked={teleportExpanded} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Teleporter accounts={displayedAccounts} chainId={chainStore.id} config={config} 
                  address={accountStore.encodedAddress} tx={txToConfirm} xcmParams={xcmParams} 
                  tokenSymbol={chainStore.tokenSymbol} tokenDecimals={chainStore.tokenDecimals}
                  otherChains={relayAndParachains}
                  formatAmount={formatAmount}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeTxDialog}
            className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
          >
            Cancel
          </Button>
          <Button 
            onClick={submitTransaction} disabled={isTxBusy}
            className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]"
          >
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
  </>
}
