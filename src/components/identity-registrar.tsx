import { useState, useEffect } from "react"
import { 
  ChevronLeft, ChevronRight, Bell, Sun, Moon, UserCircle, Shield, FileCheck, Copy, AtSign, Mail, 
  MessageSquare, CheckCircle, AlertCircle, Coins, Trash2, RefreshCcw, Info 
} from "lucide-react"

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
import { ConnectionDialog } from "dot-connect/react.js"
import Header from "./Header"
import { appStore } from "~/store"
import { alertsStore as _alertsStore, pushAlert, removeAlert, AlertProps } from '~/store/AlertStore'
import { useSnapshot } from "valtio"
import { useProxy } from "valtio/utils"

export function IdentityRegistrarComponent() {
  const [currentPage, setCurrentPage] = useState(0)
  const [account, setAccount] = useState("")
  const [network, setNetwork] = useState("")
  const [notifications, setNotifications] = useState<Array<{ type: 'error' | 'info', message: string }>>([])
  const alertsStore = useProxy(_alertsStore);
  const { isDarkMode } = useSnapshot(appStore)
  const [errorMessage, setErrorMessage] = useState("")
  const [identityStatus, setIdentityStatus] = useState({
    displayName: "",
    verified: false,
    judgement: "None",
    deposit: "0 DOT",
    fields: {
      matrix: "Not Set",
      email: "Not Set",
      discord: "Not Set",
    }
  })
  const [onChainIdentity, setOnChainIdentity] = useState<'none' | 'set' | 'requested'>('none')

  const pages = [
    { name: "Identity Form", icon: <UserCircle className="h-5 w-5" /> },
    { name: "Challenges", icon: <Shield className="h-5 w-5" /> },
    { name: "Status", icon: <FileCheck className="h-5 w-5" /> }
  ]

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const addNotification = (alert: AlertProps) => {
    pushAlert(alert);
  }

  const removeNotification = (key: string) => {
    removeAlert(key)
  }

  const updateIdentityStatus = (newStatus: Partial<typeof identityStatus>) => {
    setIdentityStatus(prev => ({ ...prev, ...newStatus }))
    addNotification({ 
      key: (new Date()).toISOString(), 
      type: 'info', 
      message: 'Identity status updated' 
    })
  }

  const checkOnChainIdentity = () => {
    window.setTimeout(() => {
      const statuses = ['none', 'set', 'requested'] as const
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      setOnChainIdentity(randomStatus)
    }, 1000)
  }

  useEffect(() => {
    if (account && network) {
      checkOnChainIdentity()
    }
  }, [account, network])

  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  return <>
    <ConnectionDialog open={walletDialogOpen} 
      onClose={() => { setWalletDialogOpen(false) }} 
    />
    <div className={`min-h-screen p-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#2C2B2B] text-[#FFFFFF]' : 'bg-[#FFFFFF] text-[#1E1E1E]'}`}>
      <div className="container mx-auto max-w-3xl font-mono">
        <Header />

        {errorMessage && (
          <Alert variant="destructive" className="mb-4 bg-[#FFCCCB] border-[#E6007A] text-[#670D35]">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {[...alertsStore.entries()].map(([key, alert]) => (
          <Alert 
            key={alert.key} 
            variant={alert.type === 'error' ? "destructive" : "default"} 
            className={`mb-4 ${
              alert.type === 'error' 
                ? 'bg-[#FFCCCB] border-[#E6007A] text-[#670D35]' 
                : isDarkMode 
                  ? 'bg-[#393838] border-[#E6007A] text-[#FFFFFF]' 
                  : 'bg-[#FFE5F3] border-[#E6007A] text-[#670D35]'
            }`}
          >
            <AlertTitle>{alert.type === 'error' ? 'Error' : 'Notification'}</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              {alert.message}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeNotification(alert.key)} 
                className={`${
                  isDarkMode 
                    ? 'text-[#FFFFFF] hover:text-[#E6007A]' 
                    : 'text-[#670D35] hover:text-[#E6007A]'
                }`}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        ))}

        <Tabs defaultValue={pages[currentPage].name} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#393838] overflow-hidden">
            {pages.map((page, index) => (
              <TabsTrigger 
                key={index} 
                value={page.name} 
                onClick={() => setCurrentPage(index)}
                className="data-[state=active]:bg-[#E6007A] data-[state=active]:text-[#FFFFFF] flex items-center justify-center py-2 px-1"
              >
                {page.icon}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={pages[0].name}>
            <IdentityForm />
          </TabsContent>
          <TabsContent value={pages[1].name}>
            <ChallengePage />
          </TabsContent>
          <TabsContent value={pages[2].name}>
            <StatusPage />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1))}
            disabled={currentPage === pages.length - 1}
            className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463]"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </>
}

function IdentityForm() {
  const [formData, setFormData] = useState({
    displayName: "",
    matrix: "",
    email: "",
    discord: ""
  })
  const [showCostModal, setShowCostModal] = useState(false)
  const [actionType, setActionType] = useState<"judgement" | "identity">("judgement")
  const [formErrors, setFormErrors] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateForm = () => {
    const errors: string[] = []
    if (!formData.displayName && !formData.matrix && !formData.email && !formData.discord) {
      errors.push("At least one field must be filled to set identity")
    }
    setFormErrors(errors)
    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    if (errors.length > 0) {
      setErrorMessage(errors.join(". "))
      return
    }
    setShowCostModal(true)
    setActionType(onChainIdentity === 'none' ? "identity" : "judgement")
  }

  const confirmAction = () => {
    if (actionType === "judgement") {
      updateIdentityStatus({
        displayName: formData.displayName || "Not Set",
        deposit: "1.5 DOT",
        fields: {
          matrix: formData.matrix ? "Pending" : "Not Set",
          email: formData.email ? "Pending" : "Not Set",
          discord: formData.discord ? "Pending" : "Not Set",
        }
      })
      addNotification('info', 'Judgement requested successfully')
    } else {
      updateIdentityStatus({ 
        verified: false, 
        judgement: "None",
        displayName: formData.displayName || "Not Set",
        fields: {
          matrix: formData.matrix ? "Set" : "Not Set",
          email: formData.email ? "Set" : "Not Set",
          discord: formData.discord ? "Set" : "Not Set",
        }
      })
      addNotification('info', 'Identity set successfully')
    }
    setShowCostModal(false)
    setErrorMessage("")
  }

  return (
    <>
      <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
        <CardContent className="space-y-6 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-inherit flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Display Name
              </Label>
              <Input 
                id="display-name" 
                name="displayName" 
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Alice" 
                className="bg-transparent border-[#E6007A] text-inherit placeholder-[#706D6D] focus:ring-[#E6007A]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matrix" className="text-inherit flex items-center gap-2">
                <AtSign className="h-4 w-4" />
                Matrix
              </Label>
              <Input 
                id="matrix" 
                name="matrix" 
                value={formData.matrix}
                onChange={handleInputChange}
                placeholder="@alice:matrix.w3reg.org" 
                className="bg-transparent border-[#E6007A] text-inherit placeholder-[#706D6D] focus:ring-[#E6007A]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-inherit flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="alice@w3reg.org" 
                className="bg-transparent border-[#E6007A] text-inherit placeholder-[#706D6D] focus:ring-[#E6007A]" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord" className="text-inherit flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discord
              </Label>
              <Input 
                id="discord" 
                name="discord" 
                value={formData.discord}
                onChange={handleInputChange}
                placeholder="alice#1234" 
                className="bg-transparent border-[#E6007A] text-inherit placeholder-[#706D6D] focus:ring-[#E6007A]" 
              />
            </div>
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
                {onChainIdentity === 'none' && "No identity set. You need to set your identity before requesting judgement."}
                {onChainIdentity === 'set' && "Identity already set. You can update your identity or request judgement."}
                {onChainIdentity === 'requested' && "Judgement already requested. You can update your identity while waiting for judgement."}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button type="submit" className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                {onChainIdentity === 'none' ? 'Set Identity' : 'Update Identity'}
              </Button>
              {onChainIdentity !== 'none' && (
                <Button type="button" variant="outline" onClick={() => {
                  setShowCostModal(true)
                  setActionType("judgement")
                }} className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1" disabled={onChainIdentity === 'requested'}>
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

function ChallengePage() {
  const [challenges, setChallenges] = useState({
    matrix: { code: "234567", status: "pending" },
    email: { code: "345678", status: "verified" },
    discord: { code: "456789", status: "failed" },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addNotification('info', 'Challenge code copied to clipboard')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge>
      case "failed":
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

  return (
    <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)]">
      <CardContent className="space-y-6 p-4 overflow-x-auto">
        <div className="min-w-[300px]">
          <div className="mb-4">
            <Label className="text-inherit flex items-center gap-2 mb-2">
              <UserCircle className="h-4 w-4" />
              Display Name
            </Label>
            <div className="flex justify-between items-center">
              <span>{identityStatus.displayName || "Not Set"}</span>
              {identityStatus.verified && (
                <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge>
              )}
            </div>
          </div>
          {Object.entries(challenges).map(([field, { code, status }]) => (
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
                <Input id={field} value={code} readOnly className="bg-transparent border-[#E6007A] text-inherit flex-grow" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(code)} className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={() => {
          addNotification('info', 'Challenges verified successfully')
          setErrorMessage("")
          updateIdentityStatus({ verified: true, judgement: "Reasonable" })
        }} className="bg-[#E6007A] text-[#FFFFFF] hover:bg-[#BC0463] w-full">
          <CheckCircle className="mr-2 h-4 w-4" />
          Verify Challenges
        </Button>
      </CardContent>
    </Card>
  )
}

function StatusPage() {
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

  return (
    <Card className="bg-transparent border-[#E6007A] text-inherit shadow-[0_0_10px_rgba(230,0,122,0.1)] overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-inherit flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Identity Status
        </CardTitle>
        <CardDescription className="text-[#706D6D]">Current status of your Polkadot identity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="min-w-[300px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <strong className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Display Name:
              </strong> 
              <span>{identityStatus.displayName || "Not Set"}</span>
            </div>
            <div className="flex justify-between items-center">
              <strong className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Verification:
              </strong> 
              {identityStatus.verified ? 
                <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge> : 
                <Badge variant="destructive" className="bg-[#670D35] text-[#FFFFFF]">Not Verified</Badge>
              }
            </div>
            <div className="flex justify-between items-center">
              <strong className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Judgement:
              </strong> 
              <span>{identityStatus.judgement}</span>
            </div>
            <div className="flex justify-between items-center">
              <strong className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Deposit:
              </strong> 
              <span>{identityStatus.deposit}</span>
            </div>
          </div>
          <div className="mt-4">
            <strong>Field Statuses:</strong>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {Object.entries(identityStatus.fields).map(([field, status]: 
                [string, "Verified" | "Unverified"]
              ) => (
                <div key={field} className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    {getIcon(field)}
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </span>
                  <Badge variant={status === "Verified" ? "success" : "secondary"} 
                    className={status === "Verified" 
                      ? "bg-[#E6007A] text-[#FFFFFF]" 
                      : "bg-[#706D6D] text-[#FFFFFF]"
                    }
                  >
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Alert variant="default" className="bg-[#393838] border-[#E6007A] text-[#FFFFFF]">
          <Info className="h-4 w-4" />
          <AlertTitle>On-chain Identity Status</AlertTitle>
          <AlertDescription>
            {onChainIdentity === 'none' && "No identity set on-chain."}
            {onChainIdentity === 'set' && "Identity set on-chain."}
            {onChainIdentity === 'requested' && "Judgement requested and pending."}
          </AlertDescription>
        </Alert>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button variant="destructive" onClick={() => {
            updateIdentityStatus({
              displayName: "",
              verified: false,
              judgement: "None",
              deposit: "0 DOT",
              fields: {
                matrix: "Not Set",
                email: "Not Set",
                discord: "Not Set",
              }
            })
            addNotification('info', 'Identity cleared successfully')
            setErrorMessage("")
          }} className="bg-[#670D35] text-[#FFFFFF] hover:bg-[#91094c] flex-1">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Identity
          </Button>
          <Button variant="outline" onClick={() => {
            updateIdentityStatus({ verified: false, judgement: "None" })
            addNotification('info', 'Judgement cleared successfully')
            setErrorMessage("")
          }} className="border-[#E6007A] text-inherit hover:bg-[#E6007A] hover:text-[#FFFFFF] flex-1" disabled={onChainIdentity !== 'requested'}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Clear Judgement
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}