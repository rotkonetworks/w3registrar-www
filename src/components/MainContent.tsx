import { ChevronLeft, ChevronRight, UserCircle, IdCard } from "lucide-react"
import { useState, useCallback, memo, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainContentProps } from "~/types"
import { verifyStatuses } from "~/types/Identity"

import { AccountsTree } from "./tabs/AccountsTree"
import { ChallengePage } from "./tabs/ChallengePage"
import { IdentityForm } from "./tabs/IdentityForm"
import { StatusPage } from "./tabs/StatusPage"

const MemoIdeitityForm = memo(IdentityForm)
const MemoChallengesPage = memo(ChallengePage)
const MemoStatusPage = memo(StatusPage)

export const MainContent = ({
  identity, challengeStore, chainStore, typedApi, accountStore,
  chainConstants, identityFormRef, urlParams, isTxBusy, supportedFields,
  addNotification, formatAmount, openTxDialog, updateUrlParams, setOpenDialog,
  accountTreeProps
}: MainContentProps) => {
  const tabs = [
    {
      id: "status",
      name: "Profile",
      icon: <IdCard className="h-5 w-5" />,
      disabled: false,
      content: <div className="flex flex-col gap-4">
        <MemoStatusPage
          identity={identity}
          challengeStore={challengeStore.challenges}
          formatAmount={formatAmount}
          onIdentityClear={() => setOpenDialog("clearIdentity")}
          isTxBusy={isTxBusy}
          chainStore={{ 
            name: chainStore.name?.replace(/ People/g, " "),
            id: (chainStore.id as string).replace(/_people/g, ""),
          }}
          hasWalletConnected={!!accountStore.polkadotSigner}
          address={accountStore.encodedAddress}
          addNotification={addNotification}
        />
        <AccountsTree 
          identity={identity}
          accountTreeProps={accountTreeProps}
          chainStore={chainStore}
          currentAddress={accountStore.address}
          api={typedApi}
          openTxDialog={openTxDialog}
          className="pt-4"
          hasWalletConnected={!!accountStore.polkadotSigner}
        />
      </div>
    },
    {
      id: "identityForm",
      name: "Identity Form",
      icon: <UserCircle className="h-5 w-5" />,
      disabled: !accountStore.polkadotSigner,
      content: <div className="flex flex-col gap-4">
        <MemoIdeitityForm
          ref={identityFormRef}
          identity={identity}
          chainStore={chainStore}
          typedApi={typedApi}
          accountStore={accountStore}
          chainConstants={chainConstants}
          supportedFields={supportedFields}
          openTxDialog={openTxDialog}
          isTxBusy={isTxBusy}
        />
        {identity.status >= verifyStatuses.FeePaid && <MemoChallengesPage 
          addNotification={addNotification} challengeStore={challengeStore}
          identity={identity}
        />}
      </div>
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
    <Tabs defaultValue={tabs[0].name} value={tabs[currentTabIndex].name} className="w-full">
      <TabsList
        className={`flex flex-row dark:bg-[#393838] bg-[#ffffff] text-dark dark:text-light overflow-hidden`}
      >
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={index}
            value={tab.name}
            onClick={() => changeCurrentTab(index)}
            className="flex-grow data-[state=active]:bg-[#E6007A] data-[state=active]:text-[#FFFFFF] flex items-center justify-center py-2 px-1"
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
