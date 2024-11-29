import { useEffect, useMemo, useState } from 'react'
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Binary, TypedApi } from 'polkadot-api'
import { ChainInfo } from '~/store/ChainStore'
import { AccountData } from '~/store/AccountStore'

export function IdentityForm<Chain>({
  addNotification,
  identityStore,
  chainStore,
  accountStore,
  typedApi,
}: {
  addNotification: (alert: AlertProps | Omit<AlertProps, "key">) => void,
  identityStore: IdentityStore,
  chainStore: ChainInfo,
  accountStore: AccountData,
  typedApi: TypedApi<Chain>,
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

  const onChainIdentity = identityStore.status

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (forbiddenSubmission) {
      return
    }
    setActionType("identity")
    setShowCostModal(true);
  }

  const confirmAction = () => {
    let call;
    if (actionType === "judgement") {
      call = typedApi.tx.Identity.request_judgement({
        max_fee: 0n,
        reg_index: chainStore.registrarIndex,
      })
      addNotification({
        type: 'info',
        message: 'Judgement requested successfully',
      })
    } else if (actionType === "identity") {
      call = typedApi.tx.Identity.set_identity({
        info: {
          ...(Object.fromEntries(Object.entries(formData)
            .map(([key, { value }]) => [key, {
              type: `Raw${value.length}`,
              value: Binary.fromText(value),
            }])
          )),
          legal: {
            type: "None",
          },
          github: {
            type: "None",
          },
          image: {
            type: "None",
          },
          web: {
            type: "None",
          },
        },
      });
      addNotification({
        type: 'info',
        message: 'Identity set successfully',
      })
    }
    else {
      throw new Error("Unexpected action type")
    }
    call.signAndSubmit(accountStore.polkadotSigner)
    setShowCostModal(false)
  }

  const identityFormFields = {
    display: {
      label: "Display Name",
      icon: <UserCircle className="h-4 w-4" />,
      key: "display",
      placeholder: 'Alice',
      checkForErrors: (v) => v.length > 0 && v.length < 3 ? "At least 3 characters" : null,
      required: true,
    },
    matrix: {
      label: "Matrix",
      icon: <AtSign className="h-4 w-4" />,
      key: "matrix",
      placeholder: '@alice:matrix.org',
      checkForErrors: (v) => v.length > 0 && !/@[a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(v) ? "Invalid format" : null,
      required: true,
    },
    email: {
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      key: "email",
      placeholder: 'alice@example.org',
      checkForErrors: (v) => v.length > 0 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) ? "Invalid format" : null,
      required: true,
    },
    discord: {
      label: "Discord",
      icon: <MessageSquare className="h-4 w-4" />,
      key: "discord",
      placeholder: 'alice#1234',
      checkForErrors: (v) => v.length > 0 && !/^[a-zA-Z0-9_]{2,32}#\d{4}$/.test(v) ? "Invalid format" : null,
      required: true,
    },
    twitter: {
      label: "Twitter",
      icon: <MessageSquare className="h-4 w-4" />,
      key: "twitter",
      placeholder: '@alice',
      checkForErrors: (v) => v.length > 0 && !/^@?(\w){1,15}$/.test(v) ? "Invalid format" : null,
      required: true,
    },
  }

  useEffect(() => {
    import.meta.env.DEV && console.log({ formData })
  }, [formData])

  const forbiddenSubmission = useMemo(() => {
    return Object.entries(formData).some(([key, field]) => field.error !== null 
      || (identityFormFields[key].required && field.value === "")
    )
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
                    if (identityFormFields[key].required && _formData[key].value === "") {
                      _formData[key].error = "Required";
                    }
                    return _formData;
                  })}
                  placeholder={props.placeholder}
                  className="bg-transparent border-[#E6007A] text-inherit placeholder-[#706D6D] focus:ring-[#E6007A]"
                />
                {formData[key].error && (
                  <div className="text-[#E6007A] text-sm mt-1">
                    <p>{formData[key].error}</p>
                  </div>
                )}
              </div>
            )}
            {forbiddenSubmission && (
              <div className="text-[#E6007A] text-sm mt-5">
                <p>Fill the correctly before proceeding</p>
              </div>
            )}
            <Alert variant="default" className="bg-[#393838] border-[#E6007A] text-[#FFFFFF]">
              <Info className="h-4 w-4" />
              <AlertTitle>On-chain Identity Status</AlertTitle>
              <AlertDescription>
                {onChainIdentity === verifiyStatuses.NoIdentity && "No identity set. You need to set your identity before requesting judgement."}
                {onChainIdentity === verifiyStatuses.IdentitySet && "Identity already set. You can update your identity or request judgement."}
                {onChainIdentity === verifiyStatuses.JudgementRequested && "Judgement already requested. You can update your identity while waiting for judgement."}
                {onChainIdentity === verifiyStatuses.IdentityVerified && "Your identity is verified! Congrats!"}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button type="submit" disabled={forbiddenSubmission}
                className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {onChainIdentity === verifiyStatuses.NoIdentity ? 'Set Identity' : 'Update Identity'}
              </Button>
              {onChainIdentity === verifiyStatuses.IdentitySet && (
                <Button type="button" variant="outline"
                  onClick={() => {
                    setShowCostModal(true)
                    setActionType("judgement")
                  }}
                  className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1"
                  disabled={forbiddenSubmission}
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
