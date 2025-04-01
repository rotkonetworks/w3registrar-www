import { TypedApi } from "polkadot-api"

export type DialogMode = "clearIdentity" | "disconnect" | "teleport" | "help" | "requestJudgement" |
  "setIdentity" | null

export type EstimatedCostInfo = {
  fees?: bigint | BigNumber
  deposits?: bigint | BigNumber
}

export type OpenTxDialogArgs_modeSet = {
  mode: DialogMode
  tx: ApiTx
  estimatedCosts: EstimatedCostInfo
}
export type OpenTxDialogArgs = OpenTxDialogArgs_modeSet | { mode: null }

export type MainContentProps = {
  identity: Identity,
  challengeStore: { challenges: ChallengeStore, error: string | null },
  chainStore: ChainInfo,
  typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>,
  accountStore: AccountData,
  chainConstants,
  alerts: Map<string, AlertProps>,
  addNotification: any,
  formatAmount: any,
  supportedFields: string[],
  removeNotification: any,
  identityFormRef: Ref<unknown>,
  urlParams: Record<string, string>,
  updateUrlParams: any,
  setOpenDialog: any,
  isTxBusy: boolean,
  openTxDialog: (params: OpenTxDialogArgs) => void,
}

export type SignSubmitAndWatchParams = {
  call: ApiTx;
  name: string;
  api?: TypedApi<ChainDescriptorOf<keyof Chains>>;
  awaitFinalization?: boolean;
  nonce?: number;
  signer?: PolkadotSigner;
};

export type FormatAmountOptions = {
  decimals?: number,
  symbol: string,
  tokenDecimals: number,
}
export type AssetAmount = number | bigint | BigNumber | string

export type FormatAmountFn = (
  amount: AssetAmount,
  options: FormatAmountOptions,
) => string
