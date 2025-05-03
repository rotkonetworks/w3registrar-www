import { Challenge, ChallengeStore } from "~/store/challengesStore"
import { Identity, verifyStatuses } from "~/types/Identity"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, UserCircle, CheckCircle, AlertCircle, Coins, Trash, FileCheck, Share2 } from "lucide-react"
import BigNumber from "bignumber.js"
import { IdentityStatusInfo } from "../IdentityStatusInfo"
import { VerificationStatusBadge } from "../VerificationStatusBadge"
import { SOCIAL_ICONS } from "~/assets/icons"
import { StatusBadge } from "../challenges/StatusBadge"
import { SS58String } from "polkadot-api"
import { AlertPropsOptionalKey } from "~/hooks/useAlerts"

export function StatusPage({
  identity,
  challengeStore,
  isTxBusy,
  formatAmount,
  onIdentityClear,
  hasWalletConnected,
  address,
  chainStore,
  addNotification,
}: {
  identity: Identity,
  challengeStore: ChallengeStore,
  isTxBusy: boolean,
  formatAmount: (amount: number | bigint | BigNumber | string, decimals?) => string
  onIdentityClear: () =>  void,
  hasWalletConnected: boolean,
  address: SS58String,
  chainStore: {
    name: string,
    id: string,
  },
  addNotification: (AlertPropsOptionalKey) => void,
}) {
  const getIcon = (field: string) => {
    return SOCIAL_ICONS[field] || <MessageSquare className="h-4 w-4" />
  }

  const onChainIdentity = identity.status

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-inherit flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Identity Status
        </CardTitle>
        <CardDescription className="text-[#706D6D]">
          This is the current status of your identity on the {chainStore.name} chain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-row flex-wrap justify-end items-center gap-0 xs:gap-2">
            <strong className="flex items-center">
              <UserCircle className="h-4 w-4" />
              Display Name:
            </strong> 
            <div className="grow shrink-0" />
            <span className="justify-self-end">{identity.info?.display || "<Not Set>"}</span>
          </div>
          <div className="flex flex-row flex-wrap justify-end items-center gap-0 xs:gap-2">
            <strong className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verification:
            </strong>
            <div className="grow shrink-0" />
            <VerificationStatusBadge status={identity.status} />
          </div>
          <div className="flex flex-row flex-wrap justify-end items-center gap-0 xs:gap-2">
            <strong className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Judgement:
            </strong>
            <div className="grow shrink-0" />
            <span>{ verifyStatuses[identity.status].match(/[A-Z][a-z]+/g).join(" ") }</span>
          </div>
          <div className="flex flex-row flex-wrap justify-end items-center gap-0 xs:gap-2">
            <strong className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Deposit:
            </strong>
            <div className="grow shrink-0" />
            <span>{formatAmount(identity.deposit)}</span>
          </div>
        </div>
        <div className="mt-4">
          <strong>Field Statuses:</strong>
          <div className="flex flex-col gap-2 mt-2">
            {Object.entries(challengeStore)
              .filter(([ field ]) => field !== "display_name")
              .map(([field, { status }]: 
                [string, Challenge]
              ) => (
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2 max-w-full">
                    <div className="flex flex-col xs:flex-row gap-x-2 max-w-full">
                      <div className="flex items-center gap-2 shrink-0">
                        {getIcon(field)}
                        <span className="font-bold">{field.charAt(0).toUpperCase() + field.slice(1)}:</span>
                      </div>
                      <span className="overflow-hidden truncate w-full sm:w-auto">{identity.info[field]}</span>
                    </div>
                  </span>
                  <div className="flex flex-row gap-2 items-center justify-end grow">
                    <StatusBadge status={status} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <IdentityStatusInfo status={identity.status} />
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          {hasWalletConnected && <Button variant="outline" 
            onClick={onIdentityClear} 
            className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1" 
            disabled={onChainIdentity <= verifyStatuses.NoIdentity || isTxBusy}
          >
            <Trash className="mr-2 h-4 w-4" />
            Clear Identity
          </Button>}
          <Button variant="primary" className="flex-1" onClick={() => {
            const url = `${window.location.origin}/?address=${address}&network=${chainStore.id}`;
            navigator.clipboard.writeText(url)
              .then(() => {
                addNotification({
                  type: "success",
                  title: "Link Copied",
                  message: "The link has been copied to your clipboard.",
                  duration: 5000,
                })
              })
              .catch(err => {
                addNotification({
                  type: "error",
                  title: "Copy Failed",
                  message: "Failed to copy the link.",
                  duration: 5000,
                })
              });
          }}>
            <Share2 />Copy Link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
