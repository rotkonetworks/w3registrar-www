import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AtSign, Mail, MessageSquare, Copy, CheckCircle } from "lucide-react"
import { AlertProps } from "~/store/AlertStore"
import { ChallengeStatus, ChallengeStore } from "~/store/challengesStore"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LoadingPlaceholder } from "~/pages/Loading"
import { XIcon } from "~/assets/icons/x"
import { DiscordIcon } from "~/assets/icons/discord"

export function ChallengePage({
  addNotification,
  challengeStore,
  verifyField,
}: {
  addNotification: (alert: AlertProps | Omit<AlertProps, "key">) => void,
  challengeStore: ChallengeStore,
  verifyField: (field: string, secret: string) => Promise<boolean>,
}) {
  const [pendingFields, setPendingFields] = useState<Record<string, boolean>>({})
  const [localChallengeStore, setLocalChallengeStore] = useState(challengeStore)

  const challengeFieldsConfig = useMemo<ChallengeStore>(() => ({
    ...Object.fromEntries(Object.entries(localChallengeStore)
      .map(([field, { code, status }]) => [field, { type: "matrixChallenge", code, status }])
    ),
  }), [localChallengeStore])

  const [formData, setFormData] = useState<Record<string, {
    value: string,
    error: string | null,
  }>>({})

  useEffect(() => {
    setLocalChallengeStore(challengeStore)
  }, [challengeStore])

  useEffect(() => {
    setFormData(Object.fromEntries(Object.keys(challengeFieldsConfig)
      .filter(key => challengeFieldsConfig[key].type === "input")
      .map(key => [key, {
        value: formData[key]?.value || "",
        error: formData[key]?.error || null,
      }])
    ))
  }, [challengeFieldsConfig])

  const setFormField = useCallback((field: string, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value
      }
    }))
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification({
        type: 'info',
        message: 'Challenge code copied to clipboard',
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      addNotification({
        type: 'error',
        message: 'Failed to copy to clipboard',
      })
    }
  }

  const getStatusBadge = (status: ChallengeStatus) => {
    switch (status) {
      case ChallengeStatus.Passed:
        return <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge>
      case ChallengeStatus.Failed:
        return <Badge variant="destructive" className="bg-[#670D35] text-[#FFFFFF]">Failed</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
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

  const updateChallengeStatus = useCallback((field: keyof ChallengeStore, result: boolean) => {
    const newStatus = result ? ChallengeStatus.Passed : ChallengeStatus.Failed
    setLocalChallengeStore(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        status: newStatus
      }
    }))
    challengeStore[field].status = newStatus
  }, [challengeStore])

  const verifyChallenge = useCallback(async (field: string, code: string) => {
    if (pendingFields[field]) return

    try {
      setPendingFields(prev => ({ ...prev, [field]: true }))
      const result = await verifyField(field, code)
      updateChallengeStatus(field as keyof ChallengeStore, result)
      addNotification({
        type: result ? 'success' : 'error',
        message: result
          ? `${field.charAt(0).toUpperCase() + field.slice(1)} verification successful`
          : `${field.charAt(0).toUpperCase() + field.slice(1)} verification failed - please try again`
      })
    } catch (error) {
      console.error('Verification failed:', error)
      addNotification({
        type: 'error',
        message: `Failed to verify ${field}`
      })
    } finally {
      setPendingFields(prev => ({ ...prev, [field]: false }))
    }
  }, [pendingFields, verifyField, updateChallengeStatus, addNotification])


  const noChallenges = Object.keys(challengeStore).length

  const inviteLinkIcons = {
    matrix: <AtSign className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    discord: <DiscordIcon className="h-4 w-4" />,
    twitter: <XIcon className="h-4 w-4" />,
  }

  return noChallenges > 0 
    ?<Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
      <CardContent className="space-y-6 p-4 overflow-x-auto">
        <div className="min-w-[300px]">
          {Object.entries(challengeFieldsConfig).map(([field, { type, code, status }]) => (
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
                      disabled={pendingFields[field]}
                      onClick={async () => {
                        if (type === "input") {
                          const clipText = await window.navigator.clipboard.readText()
                          setFormField(field, clipText)
                        } else if (code) {
                          await copyToClipboard(code)
                        }
                      }} 
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    {import.meta.env[`VITE_APP_INVITE_LINK_${field.toUpperCase()}`] && 
                      <a href={import.meta.env[`VITE_APP_INVITE_LINK_${field.toUpperCase()}`]} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="icon" 
                          className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                        >
                          {inviteLinkIcons[field]}
                        </Button>
                      </a>
                    }
                  </>
                }
              </div>
            </div>
          ))}
        </div>
        <Button 
          className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] w-full"
          disabled={Object.values(pendingFields).some(Boolean)}
          onClick={() => {
            const pendingChallenges = Object.entries(localChallengeStore)
              .filter(([_, { status }]) => status === ChallengeStatus.Pending)

            Promise.all(
              pendingChallenges.map(async ([field, { code }]) => {
                await verifyChallenge(field, code)
              })
            ).then(() => {
              addNotification({
                type: 'info',
                message: 'Challenge verifications completed',
              })
            })
          }}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Verify Challenges
        </Button>
      </CardContent>
    </Card>
    : <LoadingPlaceholder className="flex w-full h-[70vh] flex-center font-bold text-3xl">
      Loading Challenges...
    </LoadingPlaceholder>
}
