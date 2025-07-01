"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react" // Added useEffect
import { FormField } from "@/components/form-field"
import { FieldRequirements } from "@/components/field-requirements"
import { VerifiableFormField } from "@/components/verifiable-form-field"
import { useVerification } from "@/contexts/verification-context"
import {
  User,
  AtSign,
  Mail,
  MessageSquare,
  Twitter,
  Globe,
  Github,
  Key,
  ShieldCheck,
  Info,
  AlertTriangle,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

export interface IdentityData {
  // Exporting for use in register page
  displayName: string
  nickname: string
  email: string
  matrix: string
  twitter: string
  website: string
  github: string
  pgpFingerprint: string
}

interface IdentityFieldsFormProps {
  initialData: IdentityData
  onSubmit: (data: Omit<IdentityData, "nickname">) => void // onSubmit might not be used if validation is external
  isSubmitting: boolean
  isEditMode: boolean // New prop to indicate if we are editing
  onDataChange: (data: IdentityData) => void // Callback to inform parent of data changes
}

export function IdentityFieldsForm({
  initialData,
  onSubmit,
  isSubmitting,
  isEditMode,
  onDataChange,
}: IdentityFieldsFormProps) {
  const [formData, setFormData] = useState(initialData)
  const { getVerifiedFields, getFieldStatus, getAllFilledFields, resetFieldVerification, setInitialVerifications } =
    useVerification()

  // When initialData changes (e.g., loaded for edit mode), update formData
  useEffect(() => {
    setFormData(initialData)
    if (isEditMode) {
      // If editing, we could set initial verification statuses based on `initialData`
      // For now, the requirement is to re-verify all changed fields.
      // So, when a field *changes*, its status is reset.
      // Or, we could reset all verifiable fields to 'unverified' when edit mode starts.
      const fieldsToReset: (keyof IdentityData)[] = [
        "email",
        "matrix",
        "twitter",
        "website",
        "github",
        "pgpFingerprint",
      ]
      fieldsToReset.forEach((field) => {
        if (initialData[field]) {
          // Only reset if there was initial data, implying it might need re-verification
          resetFieldVerification(field)
        }
      })
    }
  }, [initialData, isEditMode, resetFieldVerification, setInitialVerifications])

  const handleChange = (field: keyof IdentityData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    onDataChange(newFormData) // Inform parent of data change

    if (isEditMode && field !== "displayName" && field !== "nickname") {
      // If in edit mode and a verifiable field changes, reset its verification status
      // Only reset if the new value is different from the initial value for that field
      if (value !== initialData[field]) {
        resetFieldVerification(field)
      }
    }
  }

  const filledFields = useMemo(() => getAllFilledFields(formData), [formData, getAllFilledFields])
  const verifiedFieldsCount = useMemo(() => getVerifiedFields().length, [getVerifiedFields])

  // This internal handleSubmit is not directly used by a submit button within this form anymore.
  // The parent (register page) controls submission.
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation logic is now primarily in the parent component (RegisterPage)
    // using canProceedFromIdentityStep.
    // This onSubmit prop might be for a different purpose or can be removed if not needed.
    const { nickname, ...dataToSubmit } = formData
    onSubmit(dataToSubmit)
  }

  const formSections = [
    {
      title: "Primary Identity",
      icon: <User className="w-5 h-5 text-pink-400 mr-2" />,
      fields: [
        <FormField
          key="displayName"
          id="displayName"
          label="Display Name"
          icon={<User className="w-4 h-4 text-gray-400 mr-2" />}
          value={formData.displayName}
          onChange={(value) => handleChange("displayName", value)}
          placeholder="e.g., Satoshi Nakamoto"
          description="This name will be publicly visible. Verified on-chain after submission."
          className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
        />,
        <FormField
          key="nickname"
          id="nickname"
          label="Nickname (DNS-like)"
          icon={<AtSign className="w-4 h-4 text-gray-400 mr-2" />}
          value={formData.nickname}
          onChange={(value) => handleChange("nickname", value)}
          placeholder="e.g., satoshi.dot"
          description="Register a human-readable DNS name for your on-chain identity. This helps others find and remember your identity."
          className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
          disabled={false}
        />,
      ],
    },
    {
      title: "Online Presence & Contact",
      icon: <Globe className="w-5 h-5 text-pink-400 mr-2" />,
      fields: [
        <VerifiableFormField
          key="email"
          fieldId="email"
          label="Email Address"
          icon={<Mail className="w-4 h-4 text-pink-400 mr-2" />}
          value={formData.email}
          onChange={(value) => handleChange("email", value)}
          placeholder="satoshi@gmx.com"
          type="email"
          verificationInstructions={{ method: "code", contactAddress: "verify@whodb.com" }}
        />,
        <VerifiableFormField
          key="website"
          fieldId="website"
          label="Website"
          icon={<Globe className="w-4 h-4 text-pink-400 mr-2" />}
          value={formData.website}
          onChange={(value) => handleChange("website", value)}
          placeholder="https://bitcoin.org"
          type="url"
          verificationInstructions={{ method: "dns-challenge" }}
        />,
        <VerifiableFormField
          key="twitter"
          fieldId="twitter"
          label="Twitter / X Handle"
          icon={<Twitter className="w-4 h-4 text-pink-400 mr-2" />}
          value={formData.twitter}
          onChange={(value) => handleChange("twitter", value)}
          placeholder="@satoshi"
          verificationInstructions={{ method: "code", contactAddress: "@whodb_verify on X" }}
        />,
        <VerifiableFormField
          key="github"
          fieldId="github"
          label="GitHub Username"
          icon={<Github className="w-4 h-4 text-pink-400 mr-2" />}
          value={formData.github}
          onChange={(value) => handleChange("github", value)}
          placeholder="satoshi-nakamoto"
          verificationInstructions={{ method: "oauth" }}
        />,
        <VerifiableFormField
          key="matrix"
          fieldId="matrix"
          label="Matrix Handle"
          icon={<MessageSquare className="w-4 h-4 text-pink-400 mr-2" />}
          value={formData.matrix}
          onChange={(value) => handleChange("matrix", value)}
          placeholder="@satoshi:matrix.org"
          verificationInstructions={{ method: "code", contactAddress: "@verify:whodb.org" }}
        />,
      ],
    },
    {
      title: "Security",
      icon: <ShieldCheck className="w-5 h-5 text-pink-400 mr-2" />,
      fields: [
        <VerifiableFormField
          key="pgpFingerprint"
          fieldId="pgpFingerprint"
          label="PGP Fingerprint"
          icon={<Key className="w-4 h-4 text-pink-400 mr-2" />}
          value={formData.pgpFingerprint}
          onChange={(value) => handleChange("pgpFingerprint", value)}
          placeholder="XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX"
          verificationInstructions={{ method: "challenge" }}
        />,
      ],
    },
  ]

  const hasDisplayName = formData.displayName.trim() !== ""

  return (
    // The form tag is still here, but submission is handled by parent.
    <form onSubmit={handleFormSubmit} className="space-y-8">
      <FieldRequirements verifiedFieldsCount={verifiedFieldsCount} hasDisplayName={hasDisplayName} className="mb-6" />

      <div className="flex items-start p-3 mb-6 text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-500/30 rounded-md">
        <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-400" />
        <span>
          <strong>Important:</strong> Only fill fields you are comfortable publishing and verifying online.
          {isEditMode && " Changed fields will require re-verification."}
        </span>
      </div>

      <div className="flex items-start p-3 mb-6 text-sm text-blue-300 bg-blue-900/20 border border-blue-500/30 rounded-md">
        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
        <span>
          You must fill your Display Name OR fill and <strong>successfully verify at least one other field</strong> to
          continue. All other entered fields must also be verified.
        </span>
      </div>

      {formSections.map((section, sectionIndex) => (
        <div key={section.title}>
          <div className="flex items-center mb-4">
            {section.icon}
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
          </div>
          <div className="space-y-4">{section.fields.map((fieldComponent) => fieldComponent)}</div>
          {sectionIndex < formSections.length - 1 && <Separator className="my-8 bg-gray-700" />}
        </div>
      ))}
      {/* Submit button is typically in the parent RegisterPage now */}
    </form>
  )
}
