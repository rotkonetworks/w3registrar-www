import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AtSign, Mail, MessageSquare, UserCircle, Copy, CheckCircle, RefreshCcw, Verified, Check } from "lucide-react"
import { AlertProps } from "~/store/AlertStore"
import { IdentityStore, verifiyStatuses } from "~/store/IdentityStore"
import { ChallengeStatus, ChallengeStore } from "~/store/challengesStore"
import { useCallback, useEffect, useMemo, useState } from "react"
import { VerificationStatusBadge } from "../VerificationStatusBadge"

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
  // TODO Review when API changes are made
  const testChallengeStore = useMemo(() => {
    return {
      ...Object.fromEntries(Object.entries(challengeStore)
        .map(([field, { code, status }]) => [field, { type: "matrixChallenge", code, status }])
      ),
      email: {
        type: 'input',
        status: ChallengeStatus.Pending,
      },
    }
  }, [challengeStore])

  const [formData, setFormData] = useState<Record<string, {
    value: string,
    error: string | null,
  }>>({})

  useEffect(() => {
    setFormData(Object.fromEntries(Object.keys(testChallengeStore)
      .filter(key => testChallengeStore[key].type === "input")
      .map(key => [key, { 
        value: formData[key]?.value || "", 
        error: formData[key]?.error || null, 
      }])
    ))
  }, [testChallengeStore])

  const setFormField = useCallback((field: string, value: string): void => {
    setFormData(_formData => {
      const newValue = value
      _formData = { ..._formData }
      _formData[field] = { ..._formData[field] }
      _formData[field].value = newValue
      //_formData[field].error = props.checkForErrors(newValue);
      /* if (identityFormFields[field].required && _formData[field].value === "") {
        _formData[field].error = "Required";
      } */
      return _formData
    })
  }, [])

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

  const [pendingTransaction, setPendingTransaction] = useState(false)
  const onVerifyStatusReceived = (field: keyof ChallengeStore, result: boolean) => {
    challengeStore[field].status = result ? ChallengeStatus.Passed : ChallengeStatus.Failed
  }

  return (
    <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
      <CardContent className="space-y-6 p-4 overflow-x-auto">
        <div className="min-w-[300px]">
          <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-center">
              <Label className="text-inherit flex items-center gap-2 mb-2">
                <UserCircle className="h-4 w-4" />
                Display Name
              </Label>
              <VerificationStatusBadge status={identityStore.status} />
            </div>
            <div className="flex space-x-2 items-center">
              <div className="flex justify-between items-center">
                <span>{identityStore.info?.display || "Not Set"}</span>
                {identityStore.status === verifiyStatuses.IdentityVerified && (
                  <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge>
                )}
              </div>
            </div>
          </div>
          {Object.entries(testChallengeStore).map(([field, { type, code, status }]) => (
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
                {type === "input" &&
                  <Input id={field + "-challenge"} value={formData[field]?.value || ""}
                    onChange={event => setFormField(field, event.target.value)}
                    className="bg-transparent border-[#E6007A] text-inherit flex-grow" 
                  />
                }
                {status === ChallengeStatus.Pending &&
                  <>
                    <Button variant="outline" size="icon" 
                      className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                      onClick={async () => {
                        if (type === "input") {
                          setFormField(field, await window.navigator.clipboard.readText())
                        } else if (code) {
                          copyToClipboard(code)
                        }
                      }} 
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {code &&
                      <Button variant="outline" size="icon" 
                        className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                        onClick={() => requestVerificationSecret(field)
                          .then(challenge => {
                            challengeStore[field].code = challenge
                          })
                          .catch(error => {
                            if (import.meta.env.DEV) console.error(error)
                          })
                        }
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    }
                    <Button variant="outline" size="icon" 
                      className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                      onClick={() => {
                        if (code) {
                          setPendingTransaction(true)
                          verifyField(field, code)
                            .then(result => {
                              onVerifyStatusReceived(field, result)
                              addNotification({
                                type: result ? 'success' : 'error',
                                message: result
                                  ? `${field.charAt(0).toUpperCase() + field.slice(1)} verification successful`
                                  : `${field.charAt(0).toUpperCase() + field.slice(1)} verification failed - please try again`
                              })
                            })
                            .catch(error => { if (import.meta.env.DEV) console.error(error) })
                            .finally(() => setPendingTransaction(false))
                        } else if (type === "input") {
                          // TODO Implement actual verification when API is ready
                          onVerifyStatusReceived(field, true)
                          console.log("Verification successful")
                        }
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </>
                }
              </div>
            </div>
          ))}
        </div>
        <Button 
          className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] w-full"
          onClick={() => {
            setPendingTransaction(true)
            Promise.all(Object.entries(challengeStore)
              .filter(([key, { status }]) => status === ChallengeStatus.Pending)
              .map(([key, { code }]) => verifyField(key, code)
                .then(result => {
                  onVerifyStatusReceived(result)
                })
                .catch(error => { if (import.meta.env.DEV) console.error(error) })
              )
            )
              .then(() => {
                addNotification({
                  type: 'info', 
                  message: 'Challenges verified successfully', 
                })
              })
              .catch(error => { if (import.meta.env.DEV) console.error(error) })
              .finally(() => setPendingTransaction(false))
          }}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Verify Challenges
        </Button>
      </CardContent>
    </Card>
  )
}

