import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { AlertProps } from '@/store/AlertStore'
import { IdentityStore, verifiyStatuses } from '@/store/IdentityStore'
import {
  UserCircle,
  AtSign,
  Mail,
  MessageSquare,
  Info,
  CheckCircle,
  Coins,
  AlertCircle
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export function IdentityForm({
  addNotification,
  identityStore,
}: {
  addNotification: (alert: AlertProps | Omit<AlertProps, "key">) => void,
  identityStore: IdentityStore,
}) {
  const [formData, setFormData] = useState({
    display: {
      value: "",
      error: null,
    },
    matrix: {
      value: "",
      error: null,
    },
    email: {
      value: "",
      error: null,
    },
    discord: {
      value: "",
      error: null,
    },
    twitter: {
      value: "",
      error: null,
    },
  })
  const [showCostModal, setShowCostModal] = useState(false)
  const [actionType, setActionType] = useState<"judgement" | "identity">("judgement")
  const [formErrors, setFormErrors] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateForm = () => {
    const errors: string[] = []
    if (!formData.display && !formData.matrix && !formData.email && !formData.discord) {
      errors.push("At least one field must be filled to set identity")
    }
    setFormErrors(errors)
    return errors
  }

  const [errorMessage, setErrorMessage] = useState("")
  const onChainIdentity = identityStore.status

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    if (errors.length > 0) {
      setErrorMessage(errors.join(". "))
      return
    }
    setShowCostModal(true);
  }

  const confirmAction = () => {
    if (actionType === "judgement") {
      addNotification({
        type: 'info',
        message: 'Judgement requested successfully',
      })
    } else {
      addNotification({
        type: 'info',
        message: 'Identity set successfully',
      })
    }
    setShowCostModal(false)
    setErrorMessage("")
  }

  const identityFormFields = {
    display: {
      label: "Display Name",
      icon: <UserCircle className="h-4 w-4" />,
      key: "display",
      placeholder: 'Alice',
      checkForErrors: (v) => v.length > 0 && v.length < 3 ? "At least 3 characters" : null,
    },
    matrix: {
      label: "Matrix",
      icon: <AtSign className="h-4 w-4" />,
      key: "matrix",
      placeholder: '@alice:matrix.org',
      checkForErrors: (v) => v.length > 0 && !/@[a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(v) ? "Invalid format" : null,
    },
    email: {
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      key: "email",
      placeholder: 'alice@example.org',
      checkForErrors: (v) => v.length > 0 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) ? "Invalid format" : null,
    },
    discord: {
      label: "Discord",
      icon: <MessageSquare className="h-4 w-4" />,
      key: "discord",
      placeholder: 'alice#1234',
      checkForErrors: (v) => v.length > 0 && !/^[a-zA-Z0-9_]{2,32}#\d{4}$/.test(v) ? "Invalid format" : null,
    },
    twitter: {
      label: "Twitter",
      icon: <MessageSquare className="h-4 w-4" />,
      key: "twitter",
      placeholder: '@alice',
      checkForErrors: (v) => v.length > 0 && !/^@?(\w){1,15}$/.test(v) ? "Invalid format" : null,
    },
  }

  useEffect(() => {
    import.meta.env.DEV && console.log({ formData })
  }, [formData])

  return (
    <>
      <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
        <CardContent className="space-y-6 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(identityFormFields).map(([key, props]) =>
              <div className="space-y-2" key={props.key}>
                <Label htmlFor="display-name" className="text-inherit flex items-center gap-2">
                  {props.icon}
                  {props.label}
                </Label>
                <Input
                  id={props.key}
                  name={props.key}
                  value={formData[key].value}
                  onChange={event => setFormData(_formData => {
                    const newValue = event.target.value
                    _formData = { ..._formData }
                    _formData[key] = { ..._formData[key] }
                    _formData[key].value = newValue;
                    _formData[key].error = props.checkForErrors(newValue);
                    return _formData;
                  })}
                  placeholder={props.placeholder}
                  className="bg-transparent border-[#E6007A] text-inherit placeholder-[#706D6D] focus:ring-[#E6007A]"
                />
              </div>
            )}
            {formErrors.length > 0 && (
              <div className="text-[#E6007A] text-sm mt-2">
                {formErrors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            <Alert variant="default" className="bg-[#393838] border-[#E6007A] text-[#FFFFFF]">
              <Info className="h-4 w-4" />
              <AlertTitle>On-chain Identity Status</AlertTitle>
              <AlertDescription>
                {onChainIdentity === verifiyStatuses.NoIdentity && "No identity set. You need to set your identity before requesting judgement."}
                {onChainIdentity === verifiyStatuses.IdentitySet && "Identity already set. You can update your identity or request judgement."}
                {onChainIdentity === verifiyStatuses.JudgementRequested && "Judgement already requested. You can update your identity while waiting for judgement."}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button type="submit" className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                {onChainIdentity === verifiyStatuses.NoIdentity ? 'Set Identity' : 'Update Identity'}
              </Button>
              {onChainIdentity !== verifiyStatuses.NoIdentity && (
                <Button type="button" variant="outline"
                  onClick={() => {
                    setShowCostModal(true)
                    setActionType("judgement")
                  }}
                  className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1"
                  disabled={onChainIdentity === verifiyStatuses.JudgementRequested}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Request Judgement
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showCostModal} onOpenChange={setShowCostModal}>
        <DialogContent className="bg-[#2C2B2B] text-[#FFFFFF] border-[#E6007A]">
          <DialogHeader>
            <DialogTitle className="text-[#E6007A]">Confirm Action</DialogTitle>
            <DialogDescription>
              Please review the following information before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Coins className="h-5 w-5 text-[#E6007A]" />
              Transaction Costs
            </h4>
            <p>Estimated transaction fee: 0.01 DOT</p>
            {actionType === "identity" && (
              <p>Identity deposit: 1.5 DOT (refundable)</p>
            )}
            <h4 className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#E6007A]" />
              Important Notes
            </h4>
            <ul className="list-disc list-inside">
              <li>This action cannot be undone easily.</li>
              <li>Ensure all provided information is accurate.</li>
              {actionType === "judgement" && (
                <li>Judgement requests may take some time to process.</li>
              )}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCostModal(false)} className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]">
              Cancel
            </Button>
            <Button onClick={confirmAction} className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
