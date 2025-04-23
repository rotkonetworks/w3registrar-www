import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AtSign, Mail, MessageSquare, Copy, CheckCircle, Globe, UserCircle, Shield } from "lucide-react"
import { ChallengeStatus, ChallengeStore } from "~/store/challengesStore"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LoadingPlaceholder } from "~/pages/Loading"
import { XIcon } from "~/assets/icons/x"
import { DiscordIcon } from "~/assets/icons/discord"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { HelpCarousel } from "~/help/helpCarousel"
import { SOCIAL_ICONS } from "~/assets/icons"
import { AlertPropsOptionalKey } from "~/hooks/useAlerts"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Identity } from "~/types/Identity"
import _ from "lodash"

export function ChallengePage({ addNotification, challengeStore, identity, }: {
  addNotification: (alert: AlertPropsOptionalKey) => void,
  challengeStore: { challenges: ChallengeStore, error: string | null, loading: boolean },
  identity: Identity,
}) {
  const [localChallengeStore, setLocalChallengeStore] = useState(challengeStore.challenges)
  useEffect(() => {
    console.log("ChallengeStore", challengeStore)
    if (!challengeStore.loading && !_.isEqual(challengeStore.challenges, localChallengeStore)) {
      setLocalChallengeStore(challengeStore.challenges)
    }
  }, [challengeStore, localChallengeStore])

  const challengeFieldsConfig = useMemo<ChallengeStore>(() => ({
    ...Object.fromEntries(Object.entries(localChallengeStore)
      .filter(([field]) => field !== "display_name")
      .map(([field, { code, status }]) => [field, { type: "matrixChallenge", code, status }])
    ),
  }), [localChallengeStore])

  const [formData, setFormData] = useState<Record<string, {
    value: string,
    error: string | null,
  }>>({})

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
    return SOCIAL_ICONS[field]
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


  const noChallenges = Object.keys(challengeFieldsConfig).length ?? 0

  /* TODO Implement verification for :
    * GitHub
    * Image
    * PGP Fingerprint
    * Legal
  */
  // TODO Add descriptions and icon for domain verification
  
  const inviteLinkIcons = {
    matrix: <AtSign className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    discord: <DiscordIcon className="h-4 w-4" />,
    twitter: <XIcon className="h-4 w-4" />,
    web: <Globe className="h-4 w-4" />,
  }
  const inviteAltDescription = {
    matrix: "Accept the invite and paste it in the Matrix chat",
    email: "Send an email to the provided address with the code",
    discord: "Join the Discord server and paste the code in the #verification channel",
    twitter: "Send a DM to the provided Twitter account with the code",
  }

  const FullDescriptionPopOver = ({ button, name, url, onclick, description }: {
    button: React.ReactNode,
    name: string,
    url?: string,
    onclick?: () => void,
    description: React.ReactNode,
  }) => {
    if (!url && !onclick) {
      throw new Error("Either url or onclick must be provided")
    }

    return <Popover>
      <PopoverTrigger className="bg-transparent cursor-help" asChild>
        {button}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4 bg-[#2C2B2B] border-[#E6007A]" sideOffset={5}>
        {description}
        <a href={url} target="_blank" rel="noreferrer">
          <Button variant="primary" className="mt-2 w-full">
            {`Join ${name}`}
          </Button>
        </a>
      </PopoverContent>
    </Popover>
  }
  const inviteFullDescriptions = {
    matrix: ({ button }) => (
      <FullDescriptionPopOver
        button={button}
        name="Matrix"
        url={import.meta.env.VITE_APP_INVITE_LINK_MATRIX}
        description={
          <ul className="list-disc pl-4">
            <li>
              <strong>Step 1:</strong> Click the button to join the Matrix server.
            </li>
            <li>
              <strong>Step 2:</strong> 
              Once you are in the server, find the 
              {" "}<code>{import.meta.env.VITE_APP_CHALLENGES_PRIVATE_ACCOUNT_MATRIX}</code> bot
              in the admin members list.
            </li>
            <li>
              <strong>Step 3:</strong> Send a DM to the user with the code.
            </li>
            <li>
              <strong>Step 4:</strong> Wait for the bot to verify your code.
            </li>
          </ul>
        }
      />
    ),
    twitter: ({ button }) => (
      <FullDescriptionPopOver
        button={button}
        name="Twitter"
        url={import.meta.env.VITE_APP_INVITE_LINK_TWITTER}
        description={
          <div>
            <ul className="list-disc pl-4">
              <li>
                <strong>Step 1:</strong> Click the button to send a DM to the 
                {" "}<code>@{import.meta.env.VITE_APP_CHALLENGES_PRIVATE_ACCOUNT_TWITTER}</code> X
                account.
              </li>
              <li>
                <strong>Step 2:</strong> Send the code in the DM.
              </li>
              <li>
                <strong>Step 3:</strong> Wait for the account to verify your code.
              </li>
            </ul>
          </div>
        }
      />
    ),
    discord: ({ button }) => (
      <FullDescriptionPopOver
        button={button}
        name="Discord"
        url={import.meta.env.VITE_APP_INVITE_LINK_DISCORD}
        description={
          <div>
            <ul className="list-disc pl-4">
              <li>
                <strong>Step 1:</strong> Click the button to join the Discord server.
              </li>
              <li>
                <strong>Step 2:</strong> Once you are in the server, find the 
                {" "}<code>{import.meta.env.VITE_APP_CHALLENGES_PRIVATE_ACCOUNT_DISCORD}</code> bot
                in the admin members list.
              </li>
              <li>
                <strong>Step 3:</strong> Send a DM to the user with the code.
              </li>
              <li>
                <strong>Step 4:</strong> Wait for the bot to verify your code.
              </li>
            </ul>
          </div>
        }
      />
    ),
    email: ({ button }) => (
      <FullDescriptionPopOver
        button={button}
        name="Email"
        url={import.meta.env.VITE_APP_INVITE_LINK_EMAIL}
        description={
          <div>
            <ul className="list-disc pl-4">
              <li>
                <strong>Step 1:</strong> Click the button to send an email to the provided address.
              </li>
              <li>
                <strong>Step 2:</strong> Send the code in the email as the message body.
              </li>
              <li>
                <strong>Note:</strong> Subject does not matter, don't worry about it!
              </li>
              <li>
                <strong>Step 3:</strong> Wait for the email to verify your code.
              </li>
            </ul>
          </div>
        }
      />
    ),
  }

  if (challengeStore.loading && noChallenges === 0) {
    return (
      <LoadingPlaceholder className="flex flex-col w-full h-[70vh] flex-center">
        <HelpCarousel className="rounded-lg bg-background/30" autoPlayInterval={4000} />
        <span className="sm:text-3xl text-xl text-center font-bold pt-4">
          Loading Challenges...
        </span>
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
          the chat link. All challenges must be passed for affirmative judgment. You have click the
          link for instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 overflow-x-auto">
        {Object.entries(challengeFieldsConfig).map(([field, { type, code, status }]) => {
          const actualButton = 
            <Button variant="outline" size="icon"
              className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
            >
              {inviteLinkIcons[field]}
            </Button>

          return <div key={field} className="mb-4 last:mb-0">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
              <Label htmlFor={field} className="text-inherit flex flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    {getIcon(field)}
                    <span className="font-bold">{field.charAt(0).toUpperCase() + field.slice(1)} Code:</span>
                  </div>
                  <span className="overflow-hidden truncate w-full sm:w-auto">{identity.info[field]}</span>
                </div>
              </Label>
              <div className="ml-auto">
                {getStatusBadge(status)}
              </div>
            </div>
            <div className="flex justify-end flex-wrap gap-2">
              {code &&
                <Input id={field} value={code} readOnly 
                  className="bg-transparent border-[#E6007A] text-inherit flex-grow flex-shrink-0 flex-basis-[120px]" 
                />
              }
              {status === ChallengeStatus.Pending &&
                <>
                  <Button variant="outline" size="icon" 
                    className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0"
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
                    inviteFullDescriptions[field]
                      ? inviteFullDescriptions[field]({
                        button: actualButton
                      })
                  : <a href={import.meta.env[`VITE_APP_INVITE_LINK_${field.toUpperCase()}`]}
                    target="_blank" rel="noreferrer" title={inviteAltDescription[field]}
                  >
                    {actualButton}
                  </a>
                  }

                  {field === "web" &&
                    <Button
                      variant="outline"
                      className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
                    >
                      Verify
                    </Button>}
                </>}
            </div>
          </div>
        })}

        {noChallenges > 0 &&
          <Alert
            key={"useOwnAccounts"}
          >
            <AlertTitle>Note</AlertTitle>
            <AlertDescription className="flex flex-col justify-between items-center gap-2">
              <p>
                Please use your own accounts for verification. Otherwise, you will not be able to 
                prove ownership of the linked accounts, thus failing the challenge.
              </p>
            </AlertDescription>
          </Alert>
        }

        {challengeStore.error &&
          <Alert
            key={"challengeError"}
            variant="destructive"
            className="mb-4 bg-red-200 border-[#E6007A] text-red-800 dark:bg-red-800 dark:text-red-200"
          >
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex flex-col justify-between items-stretch gap-2">
              <p>
                There was an error loading the challenges. Please wait a moment and try again.
              </p>
              <p>
                {challengeStore.error}
              </p>
            </AlertDescription>
          </Alert>
        }
      </CardContent>
    </Card>
  );
}
