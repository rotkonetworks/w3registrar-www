import { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { IdentityStore, verifyStatuses } from '@/store/IdentityStore'
import { 
  UserCircle, AtSign, Mail, MessageSquare, CheckCircle, Coins, AlertCircle, Globe, Fingerprint, Github, Image, IdCard, 
  XIcon
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Binary, TypedApi } from 'polkadot-api'
import { ChainInfo } from '~/store/ChainStore'
import { AccountData } from '~/store/AccountStore'
import BigNumber from 'bignumber.js'
import { IdentityStatusInfo } from '../IdentityStatusInfo'
import { Observable } from 'rxjs'
import { ChainDescriptorOf, Chains } from '@reactive-dot/core/internal.js'
import { ApiTx } from '~/types/api'
import { DiscordIcon } from '~/assets/icons/discord'

// BUG Comflicts with IdentityFormData from ~/store/IdentityStore
export type IdentityFormData = Record<string, {
  value: string
  error: string | null
}>

export const IdentityForm = forwardRef((
  {
    identityStore,
    chainStore,
    accountStore,
    typedApi,
    chainConstants,
    isTxBusy,
    supportedFields,
    formatAmount,
    signSubmitAndWatch,
  }: {
    identityStore: IdentityStore,
    chainStore: ChainInfo,
    accountStore: AccountData,
    typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>,
    chainConstants: Record<string, any>,
    isTxBusy: boolean,
    supportedFields: string[],
    formatAmount: (amount: number | bigint | BigNumber | string, decimals?) => string,
    signSubmitAndWatch: (
      call: ApiTx,
      messages: {
        broadcasted?: string,
        loading?: string,
        success?: string,
        error?: string,
      },
      eventType: string,
    ) => Observable<unknown>,
  },
  ref: Ref<unknown> & { reset: () => void },
) => {
  const _reset = useCallback(() => Object.fromEntries(
    ['display', 'matrix', 'email', 'discord', 'twitter', 'web'].map(key => [
      key,
      { value: "", error: null }
    ])
  ), [])
  const [formData, setFormData] = useState<IdentityFormData>(_reset())

  const [actionType, setActionType] = useState<"judgement" | "identity" | null>(null)
  const [showCostModal, setShowCostModal] = useState(false)
  useEffect(() => {
    if (!showCostModal) {
      setActionType(null)
    }
  }, [showCostModal])

  const onChainIdentity = identityStore.status

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (forbiddenSubmission) {
      return
    }
    setActionType("identity")
    setShowCostModal(true);
  }

  const identityFormFields = {
    display: {
      label: "Display Name",
      icon: <UserCircle className="h-4 w-4" />,
      key: "display",
      placeholder: 'Alice',
      checkForErrors: (v) => v.length > 0 && v.length < 3 ? "At least 3 characters" : null,
      required: false,
    },
    matrix: {
      label: "Matrix",
      icon: <AtSign className="h-4 w-4" />,
      key: "matrix",
      placeholder: '@alice:matrix.org',
      checkForErrors: (v) => v.length > 0
        && !/@[a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(v) ? "Invalid format" : null
      ,
      required: false,
    },
    email: {
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      key: "email",
      placeholder: 'alice@example.org',
      checkForErrors: (v) => v.length > 0
        && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) ? "Invalid format" : null,
      required: false,
    },
    discord: {
      label: "Discord",
      icon: <DiscordIcon className="h-4 w-4" />,
      key: "discord",
      placeholder: 'alice#1234',
      checkForErrors: (v) => v.length > 0 && !/^[a-zA-Z0-9_]{2,32}(#\d+)?$/.test(v)
        ? "Invalid format"
        : null,
      required: false,
    },
    twitter: {
      label: "Twitter",
      icon: <XIcon className="h-4 w-4" />,
      key: "twitter",
      placeholder: '@alice',
      checkForErrors: (v) => v.length > 0 && !/^@?(\w){1,15}$/.test(v) ? "Invalid format" : null,
      required: false,
    },
    web: {
      label: "Website",
      icon: <Globe className="h-4 w-4" />,
      key: "web",
      placeholder: 'alice.org',
      checkForErrors: (v) => {
        if (v.length === 0) return null;
        try {
          const url = new URL(v.startsWith('http') ? v : `https://${v}`);
          return null;
        } catch {
          return "Invalid URL format";
        }
      },
      transform: (value: string) => {
        if (!value) return "";
        return value.replace(/^https?:\/\//, '').replace(/\/+$/, '');
      },
      required: false,
    },
    legal: {
      label: "Legal Name",
      icon: <IdCard className="h-4 w-4" />,
      key: "legal",
      placeholder: 'Alice',
      checkForErrors: (v) => v.length > 0 && v.length < 3 ? "At least 3 characters" : null,
      required: false,
    },
    image: {
      label: "Image",
      icon: <Image className="h-4 w-4" />,
      key: "image",
      placeholder: 'https://example.org/alice.png',
      checkForErrors: (v) => {
        if (v.length === 0) return null;
        try {
          new URL(v);
          return null;
        } catch {
          return "Invalid URL format";
        }
      },
      required: false,
    },
    github: {
      label: "GitHub",
      icon: <Github className="h-4 w-4" />,
      key: "github",
      placeholder: 'alice',
      checkForErrors: (v) => v.length > 0 && !/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/.test(v)
        ? "Invalid format"
        : null,
      required: false,
    },
    pgp_fingerprint: {
      label: "PGP Fingerprint",
      icon: <Fingerprint className="h-4 w-4" />,
      key: "pgp_fingerprint",
      placeholder: '0x1234...',
      checkForErrors: (v) => v.length > 0 && !/^0x[a-fA-F0-9]{40}$/.test(v)
        ? "Invalid format"
        : null,
      required: false,
    }
  }
  const setId_requiredFields = [
    "display", 
    "legal",
    "web", 
    "matrix", 
    "email", 
    "image",
    "twitter", 
    "github", 
    "discord", 
  ]
  const getCall = useCallback((): ApiTx | null => {
    if (actionType === "judgement") {
      return typedApi.tx.Identity.request_judgement({
        max_fee: 0n,
        reg_index: chainStore.registrarIndex,
      })
    } else if (actionType === "identity") {
      const info = {
        ...Object.fromEntries(setId_requiredFields.map(key => [key, { type: "None" }])),
        ...(Object.fromEntries(Object.entries(formData)
          .filter(([_, { value }]) => value && value !== "")
          .map(([key, { value }]): [string, { value: string }] => [key, {
            value: identityFormFields[key].transform 
              ? identityFormFields[key].transform(value)
              : value
          }])
          .map(([key, { value }]) => [key, key !== "pgp_fingerprint" 
            ? { type: `Raw${value.length}`, value: Binary.fromText(value) }
            : value
          ])
        )),
      }
      if (import.meta.env.DEV) console.log({ info })
      return typedApi.tx.Identity.set_identity({ info, });
    } 
    else if (actionType === null) {
      return null
    } else {
      throw new Error("Unexpected action type")
    }
  }, [actionType, chainStore, formData])

  const [estimatedCosts, setEstimatedCosts] = useState<{
    fees?: number | bigint | BigNumber,
    deposits?: number | bigint | BigNumber
  }>({})
  useEffect(() => {
    const call = getCall()
    if (actionType === "judgement") {
      call.getEstimatedFees(accountStore.address)
        .then(fees =>  setEstimatedCosts({ fees, }))
        .catch(error => {
          if (import.meta.env.DEV) console.error(error)
          setEstimatedCosts({  })
        })
    } else if (actionType === "identity") {
      call.getEstimatedFees(accountStore.address)
        .then(fees => setEstimatedCosts({ fees, 
          deposits: BigNumber(chainConstants.basicDeposit).plus(BigNumber(chainConstants.byteDeposit)
            .times(Object.values(formData)
              .reduce((total, { value }) => BigNumber(total).plus(value?.length || 0), BigNumber(0))
            )
          ),
        }))
        .catch(error => {
          if (import.meta.env.DEV) console.error(error)
          setEstimatedCosts({})
        })
    }
    else if (actionType === null) {
      setEstimatedCosts({  })
      return
    }
    call.getEncodedData()
      .then(encodedCall => {
        if (import.meta.env.DEV) console.log({ encodedCall: encodedCall.asHex() });
      })
      .catch(error => {
        if (import.meta.env.DEV) console.error(error);
      });
  }, [actionType, chainStore, formData])
  const confirmAction = useCallback(() => {
    const call = getCall();
    if (!call) {
      return
    }
    signSubmitAndWatch(call, {
      broadcasted: `Broadcasted ${actionType === "judgement" ? "requesting judgement" : "setting identity"}`,
      loading: `Processing ${actionType === "judgement" ? "requesting judgement" : "setting identity"}`,
      success: `${actionType === "judgement" ? "judgement requested" : "identity set"}`,
      error: `Failed to ${actionType === "judgement" ? "request judgement" : "set identity"}`,
    }, actionType === "judgement" ? "Identity.JudgementRequested" : "Identity.IdentitySet")
    setShowCostModal(false)
  }, [getCall])

  const _resetFromIdStore = useCallback((identityStoreInfo) => (
    {...(Object.entries(identityFormFields).reduce((all, [key]) => {
      all[key] = {
        value: identityStore.info![key] || "",
        error: null,
      }
      return all
    }, { })
    )}
  ), [])

  const [formResetFlag, setFormResetFlag] = useState(true)
  useEffect(() => {
    if (!formResetFlag) {
      return
    }
    setFormResetFlag(false)
    if (identityStore.info) {
      if (import.meta.env.DEV) console.log({ identityStore })
      setFormData(() => _resetFromIdStore(identityStore))
    } else {
      setFormData(_reset)
    }
  }, [identityStore.info, formResetFlag])
  
  useImperativeHandle(ref, () => ({
    reset: () => setFormResetFlag(true)
  }), [identityStore])

  useEffect(() => {
    if (import.meta.env.DEV) console.log({ formData })
  }, [formData])

  const forbiddenSubmission = useMemo(() => {
    return (
      Object.entries(formData)
        .filter(([key, { value, error }]) => !value).length >= Object.keys(formData).length
      || 
      Object.entries(formData)
        .filter(([key, { value, error }]) => error).length > 0 
    )
  }, [formData])

  return (
    <>
      <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
        <CardHeader>
          <CardTitle className="text-inherit flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Identity Information
          </CardTitle>
          <CardDescription className="text-[#706D6D]">
            This form allows you to 
            {identityStore.status === verifyStatuses.NoIdentity ? ' set' : ' update'}{" "}
            your identity data. It has all the fields that 
            {" "}{import.meta.env.VITE_APP_WALLET_CONNECT_PROJECT_DISPLAY_NAME}{" "}
            supports for identity verification. Please make sure that all contact information is 
            accurate before proceeding. 
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(identityFormFields)
              .filter(([key]) => supportedFields.includes(key))
              .map(([key, props]) =>
                <div className="space-y-2" key={props.key}>
                  <Label htmlFor="display-name" className="text-inherit flex items-center gap-2">
                    {props.icon}
                    {props.label}
                  </Label>
                  <Input
                    id={props.key}
                    name={props.key}
                    value={formData[key]?.value || ""}
                    disabled={!accountStore.address}
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
                  {formData[key]?.error && (
                    <div className="text-[#E6007A] text-sm mt-1">
                      <p>{formData[key].error}</p>
                    </div>
                  )}
                </div>
              )
            }
            {forbiddenSubmission && (
              <div className="text-[#E6007A] text-sm mt-5">
                <p>Please fill at least one field before proceeding. No validation errors allowed.</p>
              </div>
            )}
            <IdentityStatusInfo status={identityStore.status} />
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button type="submit" disabled={forbiddenSubmission || isTxBusy}
                className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {onChainIdentity === verifyStatuses.NoIdentity ? 'Set Identity' : 'Update Identity'}
              </Button>
              {onChainIdentity === verifyStatuses.IdentitySet && (
                <Button type="button" variant="outline"
                  onClick={() => {
                    setShowCostModal(true)
                    setActionType("judgement")
                  }}
                  className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1"
                  disabled={forbiddenSubmission || isTxBusy}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Request Judgement
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TODO Refactor into GenericDialog */}
      <Dialog open={showCostModal} onOpenChange={value => {
        setShowCostModal(value)
        setActionType(_actionType => value ? _actionType : null)
      }}>
        <DialogContent className="dark:bg-[#2C2B2B] dark:text-[#FFFFFF] border-[#E6007A]">
          <DialogHeader>
            <DialogTitle className="text-[#E6007A]">Confirm Action</DialogTitle>
            <DialogDescription>
              Please review the following information before proceeding.
            </DialogDescription>
          </DialogHeader>
          {Object.keys(estimatedCosts).length > 0 && 
            <div className="py-4">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#E6007A]" />
                Transaction Costs
              </h4>
              {estimatedCosts.fees &&
                <p>Estimated transaction fee: {formatAmount(estimatedCosts.fees)}</p>
              }
              {estimatedCosts.deposits && (
                <p>Estimated deposit: {formatAmount(estimatedCosts.deposits)} (refundable)</p>
              )}
            </div>
          }
          <div className="py-4">
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
})
