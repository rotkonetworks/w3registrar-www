import { ChainStoreType } from "~/store/ChainStore"
import { IdentityInfo } from "./Identity"
import { Alert } from "~/hooks/useAlerts"
import { AccountData } from "~/store/AccountStore"
import { TypedApi } from "polkadot-api"
import { ChainId } from "@reactive-dot/core"
import { ChainDescriptorOf } from "@reactive-dot/core/internal.js"
import { DialogMode, OpenTxDialogArgs_modeSet } from "./"
import { Challenge } from "~/store/challengesStore"
import { SupportedField } from "~/hooks/useSupportedFields"
import { AccountTreeNode } from "~/hooks/UseAccountsTree"

export type MainContentProps = {
  chainStore: ChainStoreType
  typedApi: TypedApi<ChainDescriptorOf<ChainId>>
  accountStore: AccountData
  identity: IdentityInfo
  chainConstants: Record<string, any>
  alerts: Alert[]
  challengeStore: {
    challenges: Array<Challenge>,
    error: Error | null,
  }
  identityFormRef: any
  isTxBusy: boolean
  urlParams: {
    address: string | null,
    chain: string | null,
  }
  supportedFields: SupportedField[]
  accountTree: {
    data: AccountTreeNode | null,
    loading: boolean,
  }
  addNotification: (alert: Alert) => void
  removeNotification: (key: string) => void
  formatAmount: (amount: bigint | string | number) => string
  openTxDialog: (args: OpenTxDialogArgs_modeSet) => void
  updateUrlParams: (params: any) => void
  setOpenDialog: (mode: DialogMode) => void
}
