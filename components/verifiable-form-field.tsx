"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle, Loader2, AlertTriangle, ShieldQuestion, ClipboardCopy, Github } from "lucide-react"
import { useVerification } from "@/contexts/verification-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface VerifiableFormFieldProps {
  fieldId: "email" | "matrix" | "twitter" | "website" | "github" | "pgpFingerprint"
  label: string
  icon: React.ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  verificationInstructions: {
    method: "code" | "oauth" | "dns-challenge" | "challenge"
    contactAddress?: string
  }
}

export function VerifiableFormField({
  fieldId,
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  verificationInstructions,
}: VerifiableFormFieldProps) {
  const { startVerification, confirmVerification, getFieldStatus, isVerifying } = useVerification()
  const [challengeOrCode, setChallengeOrCode] = useState<string | null>(null)
  const [signedChallenge, setSignedChallenge] = useState<string>("")

  const fieldStatus = getFieldStatus(fieldId)

  const handleVerifyClick = async () => {
    if (!value) {
      toast.error(`Please enter your ${label.toLowerCase()} before verifying.`)
      return
    }
    const payload = await startVerification(fieldId, verificationInstructions.method, label)
    if (payload) {
      setChallengeOrCode(payload)
    }
    if (verificationInstructions.method === "oauth" && fieldId === "github") {
      toast.info("Opening GitHub for authentication...")
      // In a real app, client_id would come from env vars
      window.open(`https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&scope=read:user`, "_blank")
    }
  }

  const handleConfirmVerification = () => {
    if (fieldId === "pgpFingerprint" && verificationInstructions.method === "challenge") {
      if (!signedChallenge.trim()) {
        toast.error("Please paste the signed PGP challenge.")
        return
      }
      confirmVerification(fieldId, signedChallenge)
    } else {
      confirmVerification(fieldId)
    }
  }

  const copyToClipboard = (text: string, message = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text)
    toast.success(message)
  }

  const isInputDisabled = fieldStatus?.status === "pending" || fieldStatus?.status === "verified"
  const isVerifyingThisField = isVerifying(fieldId)

  const renderStatusIcon = () => {
    switch (fieldStatus?.status) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "pending":
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <ShieldQuestion className="w-4 h-4 text-gray-500" />
    }
  }

  const renderVerificationButton = () => {
    if (fieldStatus?.status === "verified") {
      return (
        <span className="text-xs text-green-400 font-medium flex items-center h-8 px-3">
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Verified
        </span>
      )
    }

    if (fieldStatus?.status === "pending") {
      return (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleConfirmVerification}
          disabled={isVerifyingThisField}
          className="text-xs h-8 px-2.5 border border-yellow-500/70 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
        >
          {isVerifyingThisField ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Check Verification"}
        </Button>
      )
    }

    const isGithubOauth = verificationInstructions.method === "oauth" && fieldId === "github"
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleVerifyClick}
        disabled={!value || isVerifyingThisField}
        className="text-xs h-8 disabled:opacity-60 px-2.5 border border-pink-500/70 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
      >
        {isVerifyingThisField ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isGithubOauth ? (
          <>
            <Github className="w-3 h-3 mr-1" /> Verify with GitHub
          </>
        ) : (
          "Verify"
        )}
      </Button>
    )
  }

  return (
    <div className="space-y-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldId} className="flex items-center text-white text-sm">
          {icon}
          {label}
        </Label>
        {renderStatusIcon()}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          id={fieldId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-700 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          disabled={isInputDisabled || isVerifyingThisField}
        />
        {renderVerificationButton()}
      </div>

      {fieldStatus?.status === "pending" && challengeOrCode && (
        <div className="p-2.5 mt-2.5 text-xs text-yellow-200 bg-yellow-900/30 border border-yellow-500/40 rounded-md space-y-1.5">
          <p className="font-semibold text-yellow-100 mb-1">Action Required:</p>
          {verificationInstructions.method === "code" && (
            <>
              <p>
                Send this code to <strong className="text-yellow-100">{verificationInstructions.contactAddress}</strong>{" "}
                via {label}:
              </p>
              <div className="my-1.5 p-1.5 bg-gray-900 rounded-md flex items-center justify-between">
                <span className="font-mono text-sm tracking-wider text-white">{challengeOrCode}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 text-gray-300 hover:text-white"
                  onClick={() => copyToClipboard(challengeOrCode)}
                  aria-label="Copy verification code"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          )}
          {verificationInstructions.method === "challenge" && fieldId === "pgpFingerprint" && (
            <>
              <p>1. Sign the following challenge string with your PGP key ({value || "your key"}):</p>
              <div className="my-1.5 p-2 bg-gray-900 rounded-md">
                <pre className="font-mono text-xs text-white whitespace-pre-wrap break-all">{challengeOrCode}</pre>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs h-auto p-1 mt-1.5 text-gray-300 hover:text-white"
                  onClick={() => copyToClipboard(challengeOrCode, "PGP Challenge copied!")}
                >
                  <ClipboardCopy className="w-3 h-3 mr-1" /> Copy Challenge
                </Button>
              </div>
              <p>2. Paste the full PGP signed message (including headers and footers) below:</p>
              <Textarea
                value={signedChallenge}
                onChange={(e) => setSignedChallenge(e.target.value)}
                placeholder="-----BEGIN PGP SIGNED MESSAGE-----&#10;Hash: SHA256&#10;&#10;...&#10;-----BEGIN PGP SIGNATURE-----&#10;...&#10;-----END PGP SIGNATURE-----"
                className="bg-gray-900 text-white font-mono text-xs h-28 mt-1.5 p-2"
                aria-label="Paste PGP signed message"
              />
            </>
          )}
          {verificationInstructions.method === "dns-challenge" && fieldId === "website" && (
            <>
              <p>
                Add the following TXT record to your domain&apos;s DNS settings for{" "}
                <strong className="text-yellow-100">{value || "your website"}</strong>:
              </p>
              <div className="my-1.5 p-1.5 bg-gray-900 rounded-md font-mono text-sm text-white flex items-center justify-between">
                <span>whodb-verification={challengeOrCode}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 text-gray-300 hover:text-white"
                  onClick={() => copyToClipboard(`whodb-verification=${challengeOrCode}`)}
                  aria-label="Copy DNS TXT record value"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-yellow-300/80">
                Note: DNS changes can take some time to propagate globally.
              </p>
            </>
          )}
          {verificationInstructions.method === "oauth" && fieldId === "github" && (
            <p>A new tab should have opened for GitHub authentication. Please complete the process there.</p>
          )}
          <p className="mt-2 font-medium">
            After completing the required action, click the "Check Verification" button above.
          </p>
        </div>
      )}
    </div>
  )
}
