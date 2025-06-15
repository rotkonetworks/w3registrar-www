import { ChainDescriptorOf, Chains } from '@reactive-dot/core/internal.js'
import BigNumber from 'bignumber.js'
import { UserCircle, AtSign, Mail, CheckCircle, Globe, Fingerprint, Github, Image, IdCard, XIcon } from 'lucide-react'
import { Binary, TypedApi } from 'polkadot-api'
import { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DiscordIcon } from '~/assets/icons/discord'
import { AccountData } from '~/store/AccountStore'
import { ChainInfo } from '~/store/ChainStore'
import { EstimatedCostInfo, OpenTxDialogArgs } from '~/types'
import { Identity, verifyStatuses } from '~/types/Identity'

import { IdentityStatusInfo } from '../IdentityStatusInfo'

export type FormDataValue = {
  value: string
  error: string | null
}

export type IdentityFormData = {
  display?: FormDataValue
  legal?: FormDataValue
  web?: FormDataValue
  matrix?: FormDataValue
  email?: FormDataValue
  image?: FormDataValue
  twitter?: FormDataValue
  github?: FormDataValue
  discord?: FormDataValue
  pgp_fingerprint?: FormDataValue
}

export const IdentityForm = forwardRef((
  {
    identity,
    chainStore,
    accountStore,
    typedApi,
    chainConstants,
    isTxBusy,
    supportedFields,
    openTxDialog,
  }: {
    identity: Identity,
    chainStore: ChainInfo,
    accountStore: AccountData,
    typedApi: TypedApi<ChainDescriptorOf<keyof Chains>>,
    chainConstants: Record<string, bigint | BigNumber | string>,
    isTxBusy: boolean,
    supportedFields: string[],
    openTxDialog: (params: OpenTxDialogArgs) => void,
  },
  ref: Ref<unknown> & { reset: () => void },
) => {
  const _reset = useCallback(() => Object.fromEntries(
    supportedFields.map(key => [
      key,
      { value: "", error: null }
    ])
  ), [supportedFields])
  const [formData, setFormData] = useState<IdentityFormData>(_reset())

  const handleSubmitIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (forbiddenSubmission) {
      return
    }
    type RawIdentityField = {
      type: string
      value: Binary
    } | {
      type: "None"
    }

    type RawIdentityData = Record<keyof Omit<IdentityFormData, "pgp_fingerprint">, RawIdentityField> & {
      pgp_fingerprint?: Binary
    }

    const initialInfo = {
      display: { type: "None" },
      legal: { type: "None" },
      web: { type: "None" },
      matrix: { type: "None" },
      email: { type: "None" },
      image: { type: "None" },
      twitter: { type: "None" },
      github: { type: "None" },
      discord: { type: "None" }
    } as Record<keyof Omit<IdentityFormData, "pgp_fingerprint">, RawIdentityField>;

    const info: RawIdentityData = {
      ...initialInfo,
      ...(Object.fromEntries(Object.entries(formData)
        .filter(([key, { value }]: [string, FormDataValue]) =>
          value && value !== "" && key !== "pgp_fingerprint" &&
          key in initialInfo // ensure key is valid for RawIdentityData
        )
        .map(([key, { value }]: [string, FormDataValue]) => [key,
          identityFormFields[key].transform ? identityFormFields[key].transform(value) : value
        ])
        .map(([key, value]: [string, string]) => [key,
          {
            type: `Raw${value.length}`, value: Binary.fromText(value)
          }
        ])
      )),
    }
    if (identityFormFields.pgp_fingerprint && formData.pgp_fingerprint?.value) {
      info.pgp_fingerprint = Binary.fromHex(
        identityFormFields.pgp_fingerprint.transform(formData.pgp_fingerprint.value)
      );
    } else {
      delete info.pgp_fingerprint; // Ensure it's not included if empty
    }
    console.log({ info })
    const tx = typedApi.tx.Identity.set_identity({ info, });

    let estimatedCosts: EstimatedCostInfo;
    try {
      estimatedCosts = {
        fees: await tx.getEstimatedFees(accountStore.address, { at: "best" }),
        deposits: BigNumber(chainConstants.basicDeposit?.toString())
          .plus(BigNumber(chainConstants.byteDeposit?.toString())
            .times(Object.values(formData)
              .reduce((total, { value }) => BigNumber(total).plus(value?.length || 0), BigNumber(0))
            )
          )
        ,
      }
    } catch (error) {
      console.error(error)
      estimatedCosts = {}
      return
    }

    openTxDialog({ mode: "setIdentity", tx, estimatedCosts, })
  }
  const handleRequestJudgement = async () => {
    const tx = typedApi.tx.Identity.request_judgement({
      max_fee: 0n,
      reg_index: chainStore.registrarIndex,
    })
    const estimatedCosts = { fees: await tx.getEstimatedFees(accountStore.address, { at: "best" }) }
    openTxDialog({ mode: "requestJudgement", tx, estimatedCosts, })
  }

  const identityFormFields: Record<keyof IdentityFormData, {
    label: string
    icon: JSX.Element
    key: string
    placeholder: string
    checkForErrors: (v: string) => string | null
    transform?: (value: string) => string
    required?: boolean
  }> = {
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
          new URL(v.startsWith('http') ? v : `https://${v}`); // Ensure URL is valid
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
      checkForErrors: (v) => v.length > 0 && !/^(0x)?[a-fA-F0-9]{40}$/.test(v)
        ? "Invalid format"
        : null,
      transform: (value: string) => {
        if (!value) return null;
        value = value.trim().toLowerCase();
        return value.startsWith('0x') ? value.slice(2) : value;
      },
      required: false,
    }
  }

  const _resetFromIdStore = useCallback((identityInfo) => ({
    ..._reset(),
    ...(Object.entries(identityInfo).reduce((all, [key]) => {
      all[key] = {
        value: identityInfo![key],
        error: null,
      }
      return all
    }, {}))
  }), [_reset])

  const [formResetFlag, setFormResetFlag] = useState(true)
  useEffect(() => {
    if (!formResetFlag) {
      return
    }
    setFormResetFlag(false)
    if (identity.info) {
      console.log({ identity })
      setFormData(() => _resetFromIdStore(identity.info))
    } else {
      setFormData(_reset)
    }
  }, [identity, formResetFlag, _resetFromIdStore, _reset])

  useImperativeHandle(ref, () => ({
    reset: () => setFormResetFlag(true)
  }), [])

  useEffect(() => {
    console.log({ formData })
  }, [formData])

  const forbiddenSubmission = useMemo(() => {
    return (
      Object.entries(formData)
        .filter(([, { value }]) => !value).length >= Object.keys(formData).length
      ||
      Object.entries(formData)
        .filter(([, { error }]) => error).length > 0
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
            {identity.status === verifyStatuses.NoIdentity ? ' set' : ' update'}{" "}
            your identity data. It has all the fields that
            {" "}{import.meta.env.VITE_APP_WALLET_CONNECT_PROJECT_DISPLAY_NAME}{" "}
            supports for identity verification. Please make sure that all contact information is
            accurate before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <form onSubmit={handleSubmitIdentity} className="space-y-4">
            {Object.entries(identityFormFields)
              .filter(([key]) => supportedFields.includes(key))
              .map(([key, { label, icon, placeholder, checkForErrors, }]: [string, {
                label: string
                icon: JSX.Element
                key: string
                placeholder: string
                checkForErrors: (v: string) => string | null
              }]) =>
                <div className="space-y-2" key={key}>
                  <Label htmlFor="display-name" className="text-inherit flex items-center gap-2">
                    {icon} {label}
                  </Label>
                  <Input
                    id={key}
                    name={key}
                    value={formData[key]?.value || ""}
                    disabled={!accountStore.address}
                    onChange={event => setFormData(_formData => {
                      let newValue = event.target.value.toLowerCase().trim();
                      if (key === 'pgp_fingerprint') {
                        const hasPrefix = /^0x/i.test(newValue);
                        const filtered = newValue.replace(/[^0-9a-fA-FxX]/g, '');
                        if (hasPrefix) {
                          newValue = '0x' + filtered.replace(/^0x/i, '');
                        } else if (filtered.toLowerCase().startsWith('0x')) {
                          newValue = '0x' + filtered.substring(2);
                        } else {
                          newValue = '0x' + filtered;
                        }
                        console.log("Filtered PGP fingerprint:", newValue);
                      }
                      _formData = { ..._formData }
                      _formData[key] = { ..._formData[key] }
                      _formData[key].value = newValue;
                      _formData[key].error = checkForErrors(newValue);
                      if (identityFormFields[key].required && _formData[key].value === "") {
                        _formData[key].error = "Required";
                      }
                      return _formData;
                    })}
                    placeholder={placeholder}
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
            <IdentityStatusInfo status={identity.status} />
            {accountStore.polkadotSigner && <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button type="submit" disabled={forbiddenSubmission || isTxBusy}
                className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {identity.status === verifyStatuses.NoIdentity ? 'Set Identity' : 'Update Identity'}
              </Button>
              {identity.status === verifyStatuses.IdentitySet && accountStore.polkadotSigner && (
                <Button type="button" variant="secondary" disabled={forbiddenSubmission || isTxBusy}
                  onClick={handleRequestJudgement}
                  className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Request Judgement
                </Button>
              )}
            </div>}
          </form>
        </CardContent>
      </Card>
    </>
  )
})
IdentityForm.displayName = "IdentityForm"
