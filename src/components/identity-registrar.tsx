import { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight, UserCircle, Shield, FileCheck, Coins, Info, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ConnectionDialog } from "dot-connect/react.js"
import Header from "./Header"
import { chainStore as _chainStore } from '~/store/ChainStore'
import { appStore } from '~/store/AppStore'
import { alertsStore as _alertsStore, pushAlert, removeAlert, AlertProps } from '~/store/AlertStore'
import { useSnapshot } from "valtio"
import { useProxy } from "valtio/utils"
import { identityStore as _identityStore, verifiyStatuses } from "~/store/IdentityStore"
import { challengeStore as _challengeStore, Challenge, ChallengeStatus } from "~/store/challengesStore"
import { useAccounts, useChainSpecData, useConnectedWallets, useTypedApi, useWalletDisconnector } from "@reactive-dot/react"
import { accountStore as _accountStore } from "~/store/AccountStore"
import { IdentityForm } from "./tabs/IdentityForm"
import { ChallengePage } from "./tabs/ChallengePage"
import { StatusPage } from "./tabs/StatusPage"
import { IdentityJudgement } from "@polkadot-api/descriptors"
import { useChainRealTimeInfo } from "~/hooks/useChainRealTimeInfo"
import { TypedApi } from "polkadot-api"
import { useIdentityWebSocket } from "~/hooks/useIdentityWebSocket"
import BigNumber from "bignumber.js"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { config } from "~/api/config"

export function IdentityRegistrarComponent() {
  const [currentPage, setCurrentPage] = useState(0)
  const alertsStore = useProxy(_alertsStore);
  const { isDarkMode } = useSnapshot(appStore)

  //#region Chains
  const identityStore = useProxy(_identityStore);
  const challengeStore = useProxy(_challengeStore);
  const chainContext = config;
  const chainStore = useProxy(_chainStore);
  const typedApi = useTypedApi({ chainId: chainStore.id })
  //# endregion Chains

  const pages = [
    { 
      name: "Identity Form", 
      icon: <UserCircle className="h-5 w-5" />,
    },
    { 
      name: "Challenges", 
      icon: <Shield className="h-5 w-5" />,
      disabled: identityStore.status < verifiyStatuses.FeePaid,
    },
    { 
      name: "Status", 
      icon: <FileCheck className="h-5 w-5" />,
      disabled: identityStore.status < verifiyStatuses.NoIdentity,
    },
  ]

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const addNotification = useCallback((alert: AlertProps | Omit<AlertProps, "key">) => {
    const key = (alert as AlertProps).key || (new Date()).toISOString();
    pushAlert({ ...alert, key });
  }, [pushAlert])
  const removeNotification = useCallback((key: string) => {
    removeAlert(key)
  }, [removeAlert])

  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  //#region accounts
  const accountStore = useProxy(_accountStore)

  const accounts = useAccounts()
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

  //#region identity
  const getIdAndJudgement = useCallback(() => typedApi.query.Identity.IdentityOf
    .getValue(accountStore.address)
    .then((result) => {
      import.meta.env.DEV && console.log({ identityOf: result })
      if (!result) {
        identityStore.status = verifiyStatuses.NoIdentity;
        identityStore.info = null
        return;
      }
      const identityOf = result[0];
      const identityData = Object.fromEntries(Object.entries(identityOf.info)
        .filter(([_, value]) => value?.type?.startsWith("Raw"))
        .map(([key, value]) => [key, value.value.asText()])
      );
      identityStore.deposit = identityOf.deposit
      identityStore.info = identityData;
      identityStore.status = verifiyStatuses.IdentitySet;
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
        identityStore.status = verifiyStatuses.JudgementRequested;
      }
      if (judgementsData.find(j => j.state === IdentityJudgement.FeePaid().type)) {
        identityStore.status = verifiyStatuses.FeePaid;
      }
      if (judgementsData.find(j => [
        IdentityJudgement.Reasonable().type,
        IdentityJudgement.KnownGood().type,
      ].includes(j.state))) {
        identityStore.status = verifiyStatuses.IdentityVerified;
      }
      const idDeposit = identityOf.deposit;
      // TODO Compute approximate reserve
      import.meta.env.DEV && console.log({
        identityOf,
        identityData,
        judgementsData,
        idDeposit,
      });
    })
    .catch(e => {
      if (import.meta.env.DEV) {
        console.error("Couldn't get identityOf");
        console.error(e);
      }
    })
  , [accountStore.address, typedApi]);
  useEffect(() => console.log({ getIdAndJudgement }), [getIdAndJudgement])
  useEffect(() => {
    if (accountStore.address) {
      getIdAndJudgement();
    }
  }, [accountStore.address, typedApi])
  //#endregion identity
  
  //#region chains
  const chainSpecData = useChainSpecData()
  
  useEffect(() => {
    (async () => {
      const id = import.meta.env.VITE_APP_DEFAULT_CHAIN || chainStore.id;
      
      const newChainData = {
        name: chainContext.chains[id].name,
        registrarIndex: chainContext.chains[id].registrarIndex,
        ...chainSpecData.properties,
      }
      Object.assign(chainStore, newChainData)
      import.meta.env.DEV && console.log({ id, newChainData })
    })()
  }, [chainStore.id])
  
  const eventHandlers = useMemo<Record<string, { onEvent: (data: any) => void; onError?: (error: Error) => void; priority: number }>>(() => ({
    "Identity.IdentitySet": {
      onEvent: data => {
        getIdAndJudgement()
        addNotification({
          type: "info", 
          message: "Identity Set for this account",
        })
      },
      onError: error => { },
      priority: 2,
    },
    "Identity.IdentityCleared": {
      onEvent: data => {
        getIdAndJudgement()
        addNotification({
          type: "info",
          message: "Identity cleared for this account",
        })
      },
      onError: error => { },
      priority: 1,
    },
    "Identity.JudgementRequested": {
      onEvent: data => {
        getIdAndJudgement()
        addNotification({
          type: "info",
          message: "Judgement Requested for this account",
        })
      },
      onError: error => { },
      priority: 3,
    },
    "Identity.JudgementGiven": {
      onEvent: data => {
        getIdAndJudgement()
        addNotification({
          type: "info",
          message: "Judgement Given for this account",
        })
      },
      onError: error => { },
      priority: 4,
    },
  }), [accountStore.address, chainStore.id])  
  
  const { constants: chainConstants } = useChainRealTimeInfo({
    typedApi,
    chainId: chainStore.id,
    address: accountStore.address,
    handlers: eventHandlers,
  })
  useEffect(() => console.log(chainConstants), [chainConstants])
  //#endregion chains
  
  const onNotification = useCallback((notification: NotifyAccountState): void => {
    import.meta.env.DEV && console.log('Received notification:', notification)
  }, [])
  
  //#region challenges
  const identityWebSocket = useIdentityWebSocket({
    url: import.meta.env.VITE_APP_CHALLENGES_API_URL,
    account: accountStore.address,
    onNotification: onNotification
  });
  const { accountState, error, requestVerificationSecret, verifyIdentity } = identityWebSocket
  const idWsDeps = [accountState, error, accountStore.address, identityStore.info, chainStore.id]
  useEffect(() => {
    if (error) {
      import.meta.env.DEV && console.error(error)
      return
    }
    if (idWsDeps.some((value) => value === undefined)) {
      return
    }
    import.meta.env.DEV && console.log({ accountState })
    if (accountState) {
      const {
        pending_challenges,
        verification_state: { fields: verifyState },
      } = accountState;
      const pendingChallenges = Object.fromEntries(pending_challenges)

      const challenges: Record<string, Challenge> = {};
      Object.entries(verifyState)
        .forEach(([key, value]) => challenges[key] = {
          status: identityStore.status === verifiyStatuses.IdentityVerified
            ? ChallengeStatus.Passed
            : value ? ChallengeStatus.Passed : ChallengeStatus.Pending,
          code: !value && pendingChallenges[key],
        })
      Object.assign(challengeStore, challenges)

      import.meta.env.DEV && console.log({
        origin: "accountState",
        pendingChallenges,
        verifyState,
        challenges,
      })
    }
  }, idWsDeps)
  //#endregion challenges

  const formatAmount = useCallback((amount: number | bigint | BigNumber | string, decimals?) => {
    if (!amount) {
      return "---"
    }
    const newAmount = BigNumber(amount.toString()).dividedBy(BigNumber(10).pow(chainStore.tokenDecimals)).toString()
    return `${newAmount} ${chainStore.tokenSymbol}`;
  }, [chainStore.tokenDecimals, chainStore.tokenSymbol])
  
  const _clearIdentity = useCallback(() => typedApi.tx.Identity.clear_identity(), [typedApi])
  const onIdentityClear = useCallback(() => _clearIdentity().signAndSubmit(
    accountStore?.polkadotSigner
  ), [_clearIdentity])
  
  const connectedWallets = useConnectedWallets()
  const [_, disconnectWallet] = useWalletDisconnector()
  
  const [openDialog, setOpenDialog] = useState<"clearIdentity"| "disconnect" | null>(null)

  //#region CostExtimations
  const [estimatedCosts, setEstimatedCosts] = useState({})
  useEffect(() => {
    if (openDialog === "clearIdentity") {
      _clearIdentity().getEstimatedFees(accountStore.address)
        .then(fees => setEstimatedCosts({ fees, }))
        .catch(error => {
          import.meta.env.DEV && console.error(error)
          setEstimatedCosts({})
        })
    } else {
      setEstimatedCosts({})
    }
  }, [openDialog, chainStore.id])
  //#endregion CostExtimations

  return <>
    <ConnectionDialog open={walletDialogOpen} 
      onClose={() => { setWalletDialogOpen(false) }} 
      dark={appStore.isDarkMode}
    />
    <div className={`min-h-screen p-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#2C2B2B] text-[#FFFFFF]' : 'bg-[#FFFFFF] text-[#1E1E1E]'}`}>
      <div className="container mx-auto max-w-3xl font-mono">
        <Header chainContext={chainContext} chainStore={chainStore} accountStore={accountStore} 
          identityStore={identityStore}
          onRequestWalletConnections={() => setWalletDialogOpen(true)}
          onIdentityClear={() => setOpenDialog("clearIdentity")}
          onDisconnect={() => setOpenDialog("disconnect")}
        />

        {[...alertsStore.entries()].map(([, alert]) => (
          <Alert 
            key={alert.key} 
            variant={alert.type === 'error' ? "destructive" : "default"} 
            className={`mb-4 ${
              alert.type === 'error' 
                ? 'bg-[#FFCCCB] border-[#E6007A] text-[#670D35]' 
                : isDarkMode 
                  ? 'bg-[#393838] border-[#E6007A] text-[#FFFFFF]' 
                  : 'bg-[#FFE5F3] border-[#E6007A] text-[#670D35]'
            }`}
          >
            <AlertTitle>{alert.type === 'error' ? 'Error' : 'Notification'}</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              {alert.message}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeNotification(alert.key)} 
                className={`${
                  isDarkMode 
                    ? 'text-[#FFFFFF] hover:text-[#E6007A]' 
                    : 'text-[#670D35] hover:text-[#E6007A]'
                }`}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        ))}

        <Tabs defaultValue={pages[currentPage].name} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#393838] overflow-hidden">
            {pages.map((page, index) => (
              <TabsTrigger 
                key={index} 
                value={page.name} 
                onClick={() => setCurrentPage(index)}
                className="data-[state=active]:bg-[#E6007A] data-[state=active]:text-[#FFFFFF] flex items-center justify-center py-2 px-1"
                disabled={page.disabled}
              >
                {page.icon}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={pages[0].name}>
            <IdentityForm 
              addNotification={addNotification}
              identityStore={identityStore}
              chainStore={chainStore}
              typedApi={typedApi as TypedApi<ChainInfo.id>}
              accountStore={accountStore}
              chainConstants={chainConstants}
              formatAmount={formatAmount}
            />
          </TabsContent>
          <TabsContent value={pages[1].name}>
            <ChallengePage 
              identityStore={identityStore}
              addNotification={addNotification}
              challengeStore={challengeStore}
              requestVerificationSecret={requestVerificationSecret}
              verifyField={verifyIdentity}
            />
          </TabsContent>
          <TabsContent value={pages[2].name}>
            <StatusPage 
              identityStore={identityStore}
              addNotification={addNotification}
              challengeStore={challengeStore}
              formatAmount={formatAmount}
              onIdentityClear={() => setOpenDialog("clearIdentity")}
            />
          </TabsContent>
        </Tabs>

        <Alert variant="default" className="bg-[#393838] border-[#E6007A] text-[#FFFFFF]">
          <Info className="h-4 w-4" />
          <AlertTitle>On-chain Identity Status
            : <strong>{verifiyStatuses[identityStore.status].match(/[A-Z][a-z]+/g).join(" ")}</strong>
          </AlertTitle>
          <AlertDescription>
            {identityStore.status === verifiyStatuses.NoIdentity 
              && "No identity set. You need to set your identity before requesting judgement."
            }
            {identityStore.status === verifiyStatuses.IdentitySet 
              && "Identity already set. You can update your identity or request judgement."
            }
            {identityStore.status === verifiyStatuses.JudgementRequested 
              && "Judgement request sent. You should pay the fee, which is 0.2 DOT."
            }
            {identityStore.status === verifiyStatuses.FeePaid 
              && "Judgement reqyested and paid fee. You need to complete the challenges."
            }
            {identityStore.status === verifiyStatuses.IdentityVerified 
              && "Your identity is verified! Congrats!"
            }
          </AlertDescription>
        </Alert>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1))}
            disabled={currentPage === pages.length - 1}
            className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <Dialog open={openDialog} onOpenChange={(state) => {
      setOpenDialog(_state => state ? _state : null)
    }}>
      <DialogContent className="bg-[#2C2B2B] text-[#FFFFFF] border-[#E6007A]">
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
                delete window.localStorage.account;
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
  </>
}
