import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AtSign, Mail, MessageSquare, Copy, CheckCircle, Globe, UserCircle, Shield } from "lucide-react"
import { AlertPropsOptionalKey } from "~/store/AlertStore"
import { ChallengeStatus, ChallengeStore } from "~/store/challengesStore"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LoadingPlaceholder } from "~/pages/Loading"
import { XIcon } from "~/assets/icons/x"
import { DiscordIcon } from "~/assets/icons/discord"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

export function ChallengePage({
  addNotification,
  // TODO Add status as in IdentityInfo
  challengeStore,
}: {
  addNotification: (alert: AlertPropsOptionalKey) => void,
  challengeStore: { challenges: ChallengeStore, error: string | null };
}) {
  const [pendingFields, setPendingFields] = useState<Record<string, boolean>>({})
  const [localChallengeStore, setLocalChallengeStore] = useState(challengeStore.challenges)

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
    setLocalChallengeStore(challengeStore.challenges)
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
      case "web":
        return <Globe className="h-4 w-4" />
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


  const noChallenges = Object.keys(challengeStore.challenges).length

  const inviteLinkIcons = {
    matrix: <AtSign className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    discord: <DiscordIcon className="h-4 w-4" />,
    twitter: <XIcon className="h-4 w-4" />,
    web: <Globe className="h-4 w-4" />,
  }
  const inviteInstreuctions = {
    matrix: "Accept the invite and paste it in the Matrix chat",
    email: "Send an emaiol to the provided address with the code",
    discord: "Join the Discord server and paste the code in the #verification channel",
    twitter: "Send a DM to the provided Twitter account with the code",
  }


  if (challengeStore.error) {
    return (
      <Alert
        key={"challengeError"}
        variant="destructive"
        className="mb-4 bg-red-200 border-[#E6007A] text-red-800 dark:bg-red-800 dark:text-red-200"
      >
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          There was an error loading the challenges. Please reload the page and try again later.
          {/* TODO Add reload button */}
        </AlertDescription>
      </Alert>
    );
  }

  if (noChallenges === 0) {
    return (
      <LoadingPlaceholder className="flex w-full h-[70vh] flex-center font-bold text-3xl">
        Loading Challenges...
      </LoadingPlaceholder>
    );
  }

  return (
    <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
      <CardHeader>
        <CardTitle className="text-inherit flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Identity Challenges
        </CardTitle>
        <CardDescription className="text-[#706D6D]">
          Complete these identity verification challenges by copying each code and submitting it via
          the chat link. All challenges must be passed for affirmative judgment. You can hover over 
          the link for more info.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 overflow-x-auto">
        {Object.entries(challengeFieldsConfig).map(([field, { type, code, status }]) => (
          <div key={field} className="mb-4 last:mb-0">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor={field} className="text-inherit flex items-center gap-2">
                {getIcon(field)}
                <span>{field.charAt(0).toUpperCase() + field.slice(1)} Code</span>
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
                    <a href={import.meta.env[`VITE_APP_INVITE_LINK_${field.toUpperCase()}`]} 
                      target="_blank" rel="noreferrer" title={inviteInstreuctions[field]}
                    >
                      <Button variant="outline" size="icon" 
                        className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
                      >
                        {inviteLinkIcons[field]}
                      </Button>
                    </a>
                  }
                  
                  {field === "web" &&
                    <Button
                      variant="outline"
                      className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
                      disabled={pendingFields[field]}
                    >
                      Verify
                    </Button>
                  }
                </>
              }
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
