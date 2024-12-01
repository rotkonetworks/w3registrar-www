import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AtSign, Mail, MessageSquare, UserCircle, Copy, CheckCircle, RefreshCcw, Verified, Check } from "lucide-react"
import { AlertProps } from "~/store/AlertStore"
import { IdentityStore, verifiyStatuses } from "~/store/IdentityStore"
import { ChallengeStatus, ChallengeStore } from "~/store/challengesStore"

export function ChallengePage({
  addNotification,
  identityStore,
  challengeStore,
  requestVerificationSecret,
  verifyField,
}: {
  identityStore: IdentityStore,
  addNotification: (alert: AlertProps | Omit<AlertProps, "key">) => void,
  challengeStore: ChallengeStore,
  requestVerificationSecret: (field: string) => Promise<string>,
  verifyField: (field: string, secret: string) => Promise<boolean>,
}) {
  const challenges = challengeStore

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addNotification({
      type: 'info', 
      message: 'Challenge code copied to clipboard', 
    })
  }

  const getStatusBadge = (status: ChallengeStatus) => {
    switch (status) {
      case ChallengeStatus.Passed:
        return <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge>
      case ChallengeStatus.Failed:
        return <Badge variant="destructive" className="bg-[#670D35] text-[#FFFFFF]">Failed</Badge>
      default:
        return <Badge variant="secondary" className="bg-[#706D6D] text-[#FFFFFF]">Pending</Badge>
    }
  }

  const getIcon = (field: string) => {
    switch (field) {
      case "matrix":
        return <AtSign className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "discord":
        return <MessageSquare className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
      <CardContent className="space-y-6 p-4 overflow-x-auto">
        <div className="min-w-[300px]">
          <div className="mb-4">
            <Label className="text-inherit flex items-center gap-2 mb-2">
              <UserCircle className="h-4 w-4" />
              Display Name
            </Label>
            <div className="flex justify-between items-center">
              <span>{identityStore.info?.display || "Not Set"}</span>
              {identityStore.status === verifiyStatuses.IdentityVerified && (
                <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge>
              )}
            </div>
          </div>
          {Object.entries(challenges).map(([field, { code, status }]) => (
            <div key={field} className="mb-4 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor={field} className="text-inherit flex items-center gap-2">
                  {getIcon(field)}
                  <span className="hidden sm:inline">{field.charAt(0).toUpperCase() + field.slice(1)} Challenge</span>
                  <span className="sm:hidden">{field.charAt(0).toUpperCase()}</span>
                </Label>
                {getStatusBadge(status)}
              </div>
              <div className="flex space-x-2 items-center">
                {code &&
                  <Input id={field} value={code} readOnly 
                    className="bg-transparent border-[#E6007A] text-inherit flex-grow" 
                  />
                }
                {status === ChallengeStatus.Pending &&
                  <>
                    <Button variant="outline" size="icon" 
                      className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                      onClick={() => copyToClipboard(code)} 
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" 
                      className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                      onClick={() => requestVerificationSecret(field)
                        .then(challenge => {
                          challengeStore[field].code = challenge
                        })
                        .catch(error => console.error(error))
                      }
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" 
                      className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                      onClick={() => verifyField(field, code)
                        .then(result => {
                          console.log({ result })
                          challengeStore[field].status = result 
                            ? ChallengeStatus.Passed 
                            : ChallengeStatus.Failed
                        })
                        .catch(error => console.error(error))
                      }
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </>
                }
              </div>
            </div>
          ))}
        </div>
        <Button onClick={() => {
          addNotification({
            type: 'info', 
            message: 'Challenges verified successfully', 
          })
        }} className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] w-full">
          <CheckCircle className="mr-2 h-4 w-4" />
          Verify Challenges
        </Button>
      </CardContent>
    </Card>
  )
}

