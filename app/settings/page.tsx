"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/app/components/logo"
import { useUser } from "@/contexts/user-context"

export default function SettingsPage() {
  const { userProfile, isLoggedIn } = useUser()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin"></div>
      </div>
    )
  }

  if (!isLoggedIn || !userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">You need to be logged in</h1>
        <p className="text-gray-400 mb-6">Please log in to access your settings</p>
        <Link href="/login">
          <Button className="bg-pink-500 hover:bg-pink-600 text-white">Go to Login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-pink-500/30 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href={`/profile/${userProfile.id}`}>
                <Button variant="ghost" className="text-gray-400 p-2 md:px-3 md:py-2">
                  <ArrowLeft className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Back to Profile</span>
                </Button>
              </Link>
              {/* Logo will use 'default' variant */}
              <Logo />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
            <p className="text-gray-400">Manage your account settings and preferences</p>
          </div>
          <Separator className="my-6 bg-gray-700" />

          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-white">
                Display Name
              </Label>
              <Input
                id="name"
                value={userProfile.displayName || ""}
                className="bg-gray-800 border-gray-700 text-white mt-1"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                value={userProfile.email || ""}
                className="bg-gray-800 border-gray-700 text-white mt-1"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="walletAddress" className="text-white">
                Wallet Address
              </Label>
              <Input
                id="walletAddress"
                value={userProfile.walletAddress}
                className="bg-gray-800 border-gray-700 text-white font-mono text-sm mt-1"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="network" className="text-white">
                Network
              </Label>
              <Input
                id="network"
                value={userProfile.network || "Not specified"}
                className="bg-gray-800 border-gray-700 text-white mt-1"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
