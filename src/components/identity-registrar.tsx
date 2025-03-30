import { useState, useEffect, useCallback, useMemo, startTransition, useRef } from "react"
import { Coins, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

import { ConnectionDialog } from "dot-connect/react.js"
import Header from "./Header"
import { chainStore as _chainStore } from '~/store/ChainStore'
import { useProxy } from "valtio/utils"
import { verifyStatuses } from "~/types/Identity"
import { challengeStore as _challengeStore } from "~/store/challengesStore"
import { 
  useClient, useSpendableBalance, useTypedApi
} from "@reactive-dot/react"
import { accountStore as _accountStore, AccountData } from "~/store/AccountStore"
import { useChainRealTimeInfo } from "~/hooks/useChainRealTimeInfo"
import { Binary, HexString, InvalidTxError, SS58String, TypedApi } from "polkadot-api"
import { useChallengeWebSocket } from "~/hooks/useChallengeWebSocket"
import BigNumber from "bignumber.js"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { config } from "~/api/config"
import Teleporter from "./dialogs/Teleporter"
import { useUrlParams } from "~/hooks/useUrlParams"
import { useDarkMode } from "~/hooks/useDarkMode"
import type { ChainId } from "@reactive-dot/core";
import { LoadingContent, LoadingTabs } from "~/pages/Loading"
import { ChainDescriptorOf, Chains } from "@reactive-dot/core/internal.js"
import { ApiRuntimeCall, ApiTx } from "~/types/api"
import { GenericDialog } from "./dialogs/GenericDialog"
import { HelpCarousel, SLIDES_COUNT } from "~/help/helpCarousel"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { xcmParameters as _xcmParams } from "~/store/XcmParameters"
import { Switch } from "./ui/switch"
import { 
  DialogMode, EstimatedCostInfo, MainContentProps, OpenTxDialogArgs, OpenTxDialogArgs_modeSet,
  SignSubmitAndWatchParams, 
} from "~/types"
import { CHAIN_UPDATE_INTERVAL } from "~/constants"
import { wait } from "~/utils"
import { useFormatAmount } from "~/hooks/useFormatAmount"
import { errorMessages } from "~/utils/errorMessages"
import { useAlerts } from "~/hooks/useAlerts"
import { AlertsAccordion } from "./AlertsAccordion"
import { MainContent } from "./MainContent"
import { useWalletAccounts } from "~/hooks/useWalletAccounts"
import { useIdentity } from "~/hooks/useIdentity"
import { useSupportedFields } from "~/hooks/useSupportedFields"
import { useXcmParameters } from "~/hooks/useXcmParameters"

export function IdentityRegistrarComponent() {
  const {
    alerts, add: addAlert, remove: removeAlert, clearAll: clearAllAlerts, size: alertsCount
  } = useAlerts();
  const { isDark, setDark } = useDarkMode()

  const chainStore = useProxy(_chainStore);
  const typedApi = useTypedApi({ chainId: chainStore.id as ChainId })

  const accountStore = useProxy(_accountStore)

  const { urlParams, updateUrlParams } = useUrlParams()

  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  // Use our clean wallet accounts hook
  const { 
    accounts: displayedAccounts, 
    getWalletAccount, 
    connectedWallets,
    disconnectAllWallets 
  } = useWalletAccounts({
    chainSs58Format: chainStore.ss58Format
  });

  // UI-specific account handling
  useEffect(() => {
    if (!connectedWallets.length) {
      addAlert({
        type: "error",
        message: "Please connect a wallet so that you can choose an account and continue.",
        closable: false,
        key: "noConnectedWallets",
      })
      return;
    } else {
      removeAlert("noConnectedWallets");
    }
  }, [connectedWallets.length, addAlert, removeAlert]);

  useEffect(() => {
    if (!urlParams.address) {
      addAlert({
        type: "error",
        message: "Please pick an account that is registered in your wallets from account dropdown.",
        closable: false,
        key: "invalidAccount",
      })
      return;
    }
    const accountData = getWalletAccount(urlParams.address);
    if (import.meta.env.DEV) console.log({ accountData });
    if (accountData) {
      Object.assign(accountStore, accountData);
      removeAlert("invalidAccount");
      removeAlert("invalidAddress");
    } else {
      addAlert({
        type: "error",
        message: "Please pick an account that is registered in your wallets from account dropdown.",
        closable: false,
        key: "invalidAccount",
      })
    }
  }, [accountStore.polkadotSigner, urlParams.address, getWalletAccount, addAlert, removeAlert]);

  const updateAccount = useCallback(({ name, address, polkadotSigner }: AccountData) => {
    const account = { name, address, polkadotSigner };
    if (import.meta.env.DEV) console.log({ account });
    Object.assign(accountStore, account);
    updateUrlParams({ ...urlParams, address });
  }, [accountStore, urlParams, updateUrlParams]);

  //#region identity
  const identityFormRef = useRef<{ reset: () => void, }>()

  const _formattedChainId = (chainStore.name as string)?.split(' ')[0]?.toUpperCase()
  const registrarIndex = import.meta.env[`VITE_APP_REGISTRAR_INDEX__PEOPLE_${_formattedChainId}`] as number
  
  // Make sure to clear anything else that might change according to the chain or account
  useEffect(() => {
    clearAllAlerts()
  }, [chainStore.id, accountStore.address])

  //#region chains
  const chainClient = useClient({ chainId: chainStore.id as keyof Chains })

  // Use the new hook for supported fields
  const supportedFields = useSupportedFields({ typedApi, registrarIndex, });
  
  // Use the hook for core identity functionality
  const { 
    identity, fetchIdAndJudgement, prepareClearIdentityTx, 
  } = useIdentity({ typedApi, address: accountStore.address, });
  useEffect(() => {
    identityFormRef.current?.reset()
  }, [identity])
  
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
        if (newIdentity?.status === verifyStatuses.IdentityVerified) {
          addAlert({
            type: "info",
            message: "Judgement Given! Identity verified successfully. Congratulations!",
          })
        } else {
          addAlert({
            type: "error",
            message: "Judgement Given! Identity not verified. Please remove it and try again.",
          })
        }
      },
      onError: error => { },
      priority: 4,
    },
  }), [fetchIdAndJudgement, addAlert])

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
    identity: { info: identity.info, status: identity.status, },
    addNotification: addAlert,
  });
  useEffect(() => {
    if (isChallengeWsConnected && identity.status === verifyStatuses.FeePaid) {
      subscribeToChallenges()
    }
  }, [isChallengeWsConnected])
  //#endregion challenges
  
  const formatAmount = useFormatAmount({
    tokenDecimals: chainStore.tokenDecimals,
    symbol: chainStore.tokenSymbol
  });
  
  const [isTxBusy, setTxBusy] = useState(false)
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ isTxBusy })
  }, [isTxBusy])

  //#region Transactions
  const getNonce = useCallback(async (api: TypedApi<ChainDescriptorOf<ChainId>>, address: SS58String) => {
    try {
      return await ((api.apis.AccountNonceApi as any)
        .account_nonce(address, { at: "best", }) as ApiRuntimeCall
      )
    } catch (error) {
      if (import.meta.env.DEV) console.error(error)
      return null
    }
  }, [])

  // Keep hashes of recent notifications to prevent duplicates, as a transaction might produce 
  //  multiple notifications
  const recentNotifsIds = useRef<string[]>([])
  const signSubmitAndWatch = useCallback((
    params: SignSubmitAndWatchParams
  ) => new Promise(async (resolve, reject) => {
    const { call, name } = params;
    let api = params.api;
    
    if (import.meta.env.DEV) console.log({ call: call.decodedCall, signSubmitAndWatchParams: params })

    if (!api) {
      api = typedApi
    }
    if (isTxBusy) {
      reject(new Error("Transaction already in progress"))
      addAlert({
        type: "error",
        message: "There is a transaction already in progress. Please wait for it to finish.",
      })
      return
    }
    setTxBusy(true)

    const nonce = params.nonce ?? await getNonce(api, accountStore.address)
    if (import.meta.env.DEV) console.log({ nonce });
    if (nonce === null) {
      setTxBusy(false)
      addAlert({
        type: "error",
        message: "Unable to prepare transaction. Please try again in a moment.",
      })
      if (import.meta.env.DEV) console.error("Failed to get nonce")
      reject(new Error("Failed to get nonce"))
      return
    }

    const signer = params.signer ?? accountStore.polkadotSigner
    const signedCall = call.signSubmitAndWatch(signer,
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
        // TODO Add result type as below
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
          addAlert({
            key: result.txHash,
            type: "loading",
            closable: false,
            message: `${name} transaction broadcasted`,
          })
        }
        else if (_result.type === "txBestBlocksState") {
          if (_result.ok) {
            if (params.awaitFinalization) {
              addAlert({
                key: _result.txHash,
                type: "loading",
                message: `Waiting for ${name.toLowerCase()} to finalize...`,
                closable: false,
              })
            } else {
              addAlert({
                key: _result.txHash,
                type: "success",
                message: `${name} completed successfully`,
              })
              fetchIdAndJudgement()
              disposeSubscription(() => resolve(result))
            }
          } else if (!_result.isValid) {
            if (!recentNotifsIds.current.includes(txHash)) {
              recentNotifsIds.current = [...recentNotifsIds.current, txHash]
              addAlert({
                key: _result.txHash,
                type: "error",
                message: `${name} failed: invalid transaction`,
              })
              fetchIdAndJudgement()
              disposeSubscription(() => reject(new Error("Invalid transaction")))
            }
          }
        }
        else if (_result.type === "finalized") {
          // Tx need only be processed successfully. If Ok, it's already been found in best blocks.
          if (!_result.ok) {
            addAlert({
              key: _result.txHash,
              type: "error",
              message: `${name} failed`,
            })
            fetchIdAndJudgement()
            disposeSubscription(() => reject(new Error("Transaction failed")))
          } else {
            if (params.awaitFinalization) {
              addAlert({
                key: _result.txHash,
                type: "success",
                message: `${name} completed successfully`,
              })
              fetchIdAndJudgement()
              disposeSubscription(() => resolve(result))
            }
          }
        }
        if (import.meta.env.DEV) console.log({ _result, recentNotifsIds: recentNotifsIds.current })
      },
      error: (error) => {
        if (import.meta.env.DEV) console.error(error);
        if (error.message === "Cancelled") {
          if (import.meta.env.DEV) console.log("Cancelled");
          addAlert({
            type: "error",
            message: `${name} transaction didn't get signed. Please sign it and try again`,
          })
          disposeSubscription()
          return
        }
        // TODO Handle other errors
        if (!recentNotifsIds.current.includes(txHash)) {
          if (error instanceof InvalidTxError || error.invalid) {
            const errorDetails: {
              type: string,
              value: {
                type: string,
                value: {
                  type: string,
                  value: string,
                },
              },
            } = JSON.parse(error.message);

            const { type: pallet, value: { type: errorType } } = errorDetails;
            
            if (import.meta.env.DEV) console.log({ errorDetails });
            addAlert({
              type: "error",
              message: errorMessages[pallet]?.[errorType] ?? errorMessages[pallet]?.default
                ?? `Error with ${name}: Please try again`
              ,
            })
            disposeSubscription(() => reject(error))
            return
          }
          addAlert({
            type: "error",
            message: `Error with ${name}: ${error.message || "Please try again"}`,
          })
          disposeSubscription(() => reject(error))
        }
      },
      complete: () => {
        if (import.meta.env.DEV) console.log("Completed")
        disposeSubscription()
      }
    })
  }), [accountStore.polkadotSigner, isTxBusy, fetchIdAndJudgement])
  //#endregion Transactions

  const onIdentityClear = useCallback(async () => {
    await signSubmitAndWatch({
      call: prepareClearIdentityTx(),
      name: "Clear Identity"
    })
  }, [prepareClearIdentityTx])
  
  const [openDialog, setOpenDialog] = useState<DialogMode>(null)

  //#region CostExtimations
  const [estimatedCosts, setEstimatedCosts] = useState<EstimatedCostInfo>({})
  //#endregion CostExtimations
  
  // Use our new hook for XCM parameters
  const { 
    xcmParams, 
    relayAndParachains, 
    fromTypedApi, 
    getTeleportCall, 
    getParachainId,
    teleportExpanded, 
    setTeleportExpanded 
  } = useXcmParameters({
    chainId: chainStore.id,
    estimatedCosts
  });

  const [parachainId, setParachainId] = useState<number>()
  useEffect(() => {
    if (typedApi) {
      getParachainId(typedApi).then(id => {
        if (id !== null) {
          setParachainId(id)
        }
      })
    }
  }, [typedApi, getParachainId])

  //#region Balances
  const genericAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" as SS58String // Alice
  const fromBalance = BigNumber(useSpendableBalance(
    xcmParams.fromAddress || genericAddress, { chainId: xcmParams.fromChain.id }
  ).planck.toString())
  const balance = BigNumber(useSpendableBalance(
    accountStore.address || genericAddress, { chainId: chainStore.id as keyof Chains }
  ).planck.toString())
  //#endregion Balances

  const [txToConfirm, setTxToConfirm] = useState<ApiTx | null>(null)
  
  const hasEnoughBalance = useMemo(
    () => balance.isGreaterThanOrEqualTo(xcmParams.txTotalCost.plus(chainConstants.existentialDeposit)), 
    [balance, chainConstants.existentialDeposit, xcmParams.txTotalCost]
  )
  const minimunTeleportAmount = useMemo(() => {
    const calculatedTeleportAmount = xcmParams.txTotalCost.times(1.1)
    return hasEnoughBalance 
      ? calculatedTeleportAmount 
      : calculatedTeleportAmount.plus(chainConstants.existentialDeposit)
  }, [xcmParams.txTotalCost, hasEnoughBalance, chainConstants.existentialDeposit])

  const balanceRef = useRef(balance)
  useEffect(() => {
    balanceRef.current = balance
  }, [balance])
  const submitTransaction = async () => {
    if (xcmParams.enabled) {
      try {
        await signSubmitAndWatch({
          nonce: await getNonce(fromTypedApi, xcmParams.fromAddress),
          signer: getWalletAccount(xcmParams.fromAddress).polkadotSigner,
          awaitFinalization: true,
          call: getTeleportCall({
            amount: minimunTeleportAmount,
            fromApi: fromTypedApi,
            signer: getWalletAccount(xcmParams.fromAddress).polkadotSigner,
            parachainId
          }),
          name: "Teleport Assets"
        })
      } catch (error) {
        if (import.meta.env.DEV) console.error(error)
        addAlert({
          type: "error",
          message: "Error teleporting assets. Please try again.",
        })
        return
      }

      const maxBlocksAwait = 10
      let awaitedBlocks;
      for (awaitedBlocks = 0; awaitedBlocks < maxBlocksAwait; awaitedBlocks++) {
        await wait(CHAIN_UPDATE_INTERVAL)
        if (import.meta.env.DEV) console.log({ awaitedBlocks })
        if (balanceRef.current.isGreaterThanOrEqualTo(xcmParams.txTotalCost.plus(chainConstants.existentialDeposit))) {
          break
        }
        addAlert({
          key: "awaitingAssets",
          type: "loading",
          message: "Waiting to receive transferred amount...",
          closable: false,
        })
      }
      removeAlert("awaitingAssets")
      if (awaitedBlocks === maxBlocksAwait) {
        addAlert({
          type: "error",
          message: "Balance insufficient. It's not possible to set identity.",
        })
        return
      }
    }

    switch (openDialog) {
      case "clearIdentity":
        await onIdentityClear()
        break
      case "disconnect":
        disconnectAllWallets();
        Object.keys(accountStore).forEach((k) => delete accountStore[k]);
        updateUrlParams({ ...urlParams, address: null });
        break
      case "setIdentity":
        await signSubmitAndWatch({
          call: txToConfirm,
          name: "Set Identity"
        })
        break
      case "requestJudgement":
        await signSubmitAndWatch({
          call: txToConfirm,
          name: "Request Judgement"
        })
        break
      default:
        throw new Error("Unexpected openDialog value")
    }
    closeTxDialog()
  }

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
        const tx = prepareClearIdentityTx()
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
  }, [updateAccount, prepareClearIdentityTx, openTxDialog, accountStore.address])

  const onRequestWalletConnection = useCallback(() => setWalletDialogOpen(true), [])  

  const mainProps: MainContentProps = { 
    chainStore, typedApi, accountStore, identity: identity, chainConstants, alerts: alerts as any,
    challengeStore: { challenges, error: challengeError }, identityFormRef, urlParams, isTxBusy,
    supportedFields,
    addNotification: addAlert, removeNotification: removeAlert, formatAmount, openTxDialog, updateUrlParams, setOpenDialog,
  }

  //#region HelpDialog
  const openHelpDialog = useCallback(() => setOpenDialog("help"), [])
  const [helpSlideIndex, setHelpSlideIndex] = useState(0)
  //#endregion HelpDialog  
  
  //const teleportAmount = formatAmount(xcmParams.txTotalCost)

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
          onAccountSelect={onAccountSelect} identity={identity} 
          onRequestWalletConnections={onRequestWalletConnection}
          accountStore={{
            address: accountStore.encodedAddress,
            name: accountStore.name,
          }} 
          chainStore={{
            name: chainStore.name,
            id: chainStore.id,
            symbol: chainStore.tokenSymbol,
            tokenDecimals: chainStore.tokenDecimals,
          }} 
          onToggleDark={() => setDark(!isDark)}
          isDark={isDark}
          isTxBusy={isTxBusy}
          openHelpDialog={openHelpDialog}
          balance={balance}
        />

        {(() => {
          if (!accountStore.address || !chainStore.id) {
            return <MainContent {...mainProps} />;
          }

          if (identity.status === verifyStatuses.Unknown) {
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

    {/* Update alerts notification section */}
    <AlertsAccordion alerts={alerts} removeAlert={removeAlert} count={alertsCount} />

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
              <ul className="list-disc list-inside">
                {estimatedCosts.fees &&
                  <li>Total estimated cost: {formatAmount(estimatedCosts.fees)}</li>
                }
                {estimatedCosts.deposits &&
                  <li>Existential deposit: {formatAmount(estimatedCosts.deposits)}</li>
                }
                <li>Current balance: {formatAmount(balance)}</li>
              </ul>
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
                <li>Your deposit of {formatAmount(identity.deposit)} will be returned.</li>
              </>)}
              {openDialog === "disconnect" && (<>
                <li>No data will be removed on chain.</li>
                <li>Current account and wallet will be disconnected.</li>
              </>)}
              {openDialog === "setIdentity" && (<>
                <li>Identity data will be set on chain.</li>
                <li>
                  Deposit of {formatAmount(identity.deposit)} will be taken, which will be 
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
                  otherChains={relayAndParachains} fromBalance={fromBalance} toBalance={balance}
                  teleportAmount={minimunTeleportAmount}
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
