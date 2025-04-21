import { Challenge, ChallengeStatus, ChallengeStore } from "~/store/challengesStore"
import { Identity, verifyStatuses } from "~/types/Identity"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, UserCircle, CheckCircle, AlertCircle, Coins, Trash, FileCheck } from "lucide-react"
import BigNumber from "bignumber.js"
import { IdentityStatusInfo } from "../IdentityStatusInfo"
import { VerificationStatusBadge } from "../VerificationStatusBadge"
import { SOCIAL_ICONS } from "~/assets/icons"

export function StatusPage({
  identity,
  challengeStore,
  isTxBusy,
  chainName,
  formatAmount,
  onIdentityClear,
}: {
  identity: Identity,
  challengeStore: ChallengeStore,
  isTxBusy: boolean,
  chainName: string,
  formatAmount: (amount: number | bigint | BigNumber | string, decimals?) => string
  onIdentityClear: () =>  void,
}) {
  const getIcon = (field: string) => {
    return SOCIAL_ICONS[field] || <MessageSquare className="h-4 w-4" />
  }

  const onChainIdentity = identity.status

  return (
    <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)] overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-inherit flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Identity Status
        </CardTitle>
        <CardDescription className="text-[#706D6D]">
          This is the current status of your identity on the {chainName} chain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex justify-between items-center">
            <strong className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Display Name:
            </strong> 
            <span>{identity.info?.display || "<Not Set>"}</span>
          </div>
          <div className="flex justify-between items-center max-[450px]:flex-wrap">
            <strong className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verification:
            </strong> 
            <VerificationStatusBadge status={identity.status} />
          </div>
          <div className="flex justify-between items-center">
            <strong className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Judgement:
            </strong> 
            <span>{ verifyStatuses[identity.status].match(/[A-Z][a-z]+/g).join(" ") }</span>
          </div>
          <div className="flex justify-between items-center">
            <strong className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Deposit:
            </strong> 
            <span>{formatAmount(identity.deposit)}</span>
          </div>
        </div>
        <div className="mt-4">
          <strong>Field Statuses:</strong>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {Object.entries(challengeStore)
              .map(([field, { status, code }]: 
                [string, Challenge]
              ) => (
                <div key={field} className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    {getIcon(field)}
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </span>
                  <Badge 
                    variant={(() => {
                      if (status === ChallengeStatus.Passed) {
                        return "success";
                      }
                      else if (status === ChallengeStatus.Failed) {
                        return "destructive";
                      }
                      return "secondary";
                    })()}
                  >
                    {ChallengeStatus[status].match(/[A-Z][a-z]+/g).join(" ")}
                  </Badge>
                </div>
              ))
            }
          </div>
        </div>
        <IdentityStatusInfo status={identity.status} />
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button variant="outline" 
            onClick={onIdentityClear} 
            className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1" 
            disabled={onChainIdentity <= verifyStatuses.NoIdentity || isTxBusy}
          >
            <Trash className="mr-2 h-4 w-4" />
            Clear Identity
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
