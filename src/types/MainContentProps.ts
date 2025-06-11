import { ChainId } from "@reactive-dot/core"
import { ChainDescriptorOf } from "@reactive-dot/core/internal.js"
import { TypedApi } from "polkadot-api"
import { Ref } from "react"

import { AccountTreeNode } from "~/hooks/UseAccountsTree"
import { AlertProps } from "~/hooks/useAlerts"
import { UrlParams } from "~/hooks/useUrlParams"
import { AccountData } from "~/store/AccountStore"
import { ChainInfo } from "~/store/ChainStore"
import { Challenge } from "~/store/challengesStore"

import { IdentityInfo } from "./Identity"

import { DialogMode, IdentityFormRef, OpenTxDialogArgs_modeSet } from "./"

export type MainContentProps = {
  chainStore: ChainInfo
  typedApi: TypedApi<ChainDescriptorOf<ChainId>>
  accountStore: AccountData
  identity: IdentityInfo
  chainConstants: Record<string, number | string | bigint>
  alerts: AlertProps[]
  challengeStore: {
    challenges: Array<Challenge>,
    error: Error | null,
  }
  identityFormRef: Ref<IdentityFormRef>
  isTxBusy: boolean
  urlParams: {
    address: string | null,
    chain: string | null,
  }
  accountTree: {
    data: AccountTreeNode | null,
    loading: boolean,
  }
  addNotification: (alert: AlertProps) => void
  removeNotification: (key: string) => void
  formatAmount: (amount: bigint | string | number) => string
  openTxDialog: (args: OpenTxDialogArgs_modeSet) => void
  updateUrlParams: (params: UrlParams) => void
  setOpenDialog: (mode: DialogMode) => void
}
