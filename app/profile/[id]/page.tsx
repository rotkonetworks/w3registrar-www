"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, Share2, Edit3, Users, ListChecksIcon, ContactIcon } from "lucide-react"
import { toast } from "sonner"

import { Logo } from "@/app/components/logo"
import { type Profile, getProfile } from "@/lib/profile"
import { shortenAddress } from "@/lib/utils"
import { ContactInformation } from "@/components/contact-information"
import { AccountHierarchy } from "@/components/account-hierarchy"
import { VerificationTimeline } from "@/components/verification-timeline"
import { getVerificationBadge } from "@/components/verification-badge"
import { useUser } from "@/contexts/user-context"

type ProfileTab = "contact" | "timeline"

export default function ProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile: loggedInUserProfile } = useUser()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwnProfileState, setIsOwnProfileState] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>("contact")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true)
      try {
        if (typeof id === "string") {
          const fetchedProfile = await getProfile(id)
          setProfile(fetchedProfile)
          setIsOwnProfileState(loggedInUserProfile?.id === fetchedProfile.id || fetchedProfile.isOwnProfile || false)
        } else {
          toast.error("Invalid profile ID.")
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Profile not found or an error occurred.")
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfileData()
  }, [id, router, loggedInUserProfile])

  const handleEditProfile = () => {
    if (profile) {
      router.push(`/register?editId=${profile.id}`)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} copied!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <Link href="/">
          <Button className="bg-pink-500 hover:bg-pink-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  const tabItems = [
    { id: "contact", label: "Contact", icon: ContactIcon },
    { id: "timeline", label: "Timeline", icon: ListChecksIcon },
  ] as { id: ProfileTab; label: string; icon: React.ElementType }[]

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="border-b border-pink-500/30 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-400 p-2 md:px-3">
                  <ArrowLeft className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline text-sm">Back</span>
                </Button>
              </Link>
              <Logo />
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-pink-400 border border-pink-400 hover:bg-pink-500/10 hover:text-pink-300 p-2 md:px-3"
                onClick={() =>
                  copyToClipboard(
                    `${process.env.NEXT_PUBLIC_APP_URL || "https://whodb.com"}/profile/${profile.id}`,
                    "Profile link",
                  )
                }
              >
                <Share2 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline text-sm">{copiedField === "Profile link" ? "Copied!" : "Share"}</span>
              </Button>
              {isOwnProfileState && (
                <Button
                  size="sm"
                  className="bg-pink-500 hover:bg-pink-600 text-white p-2 md:px-3"
                  onClick={handleEditProfile}
                >
                  <Edit3 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline text-sm">Edit Profile</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Profile Header Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 shadow-md">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <img
                src={profile.avatar || `/placeholder.svg?width=80&height=80&query=${profile.displayName}+avatar`}
                alt={`${profile.displayName}'s avatar`}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-pink-500/50 flex-shrink-0"
                width={64}
                height={64}
              />
              <div className="flex-grow min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate" title={profile.displayName}>
                    {profile.displayName}
                  </h1>
                  <div className="mt-1 sm:mt-0 flex-shrink-0">
                    {getVerificationBadge(profile.verified, profile.judgement)}
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-400 mt-0.5">
                  <span className="font-mono truncate" title={profile.walletAddress}>
                    {shortenAddress(profile.walletAddress, 6, 6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(profile.walletAddress, "Wallet address")}
                    className="ml-1.5 text-gray-500 hover:text-pink-400 transition-colors flex-shrink-0"
                    title="Copy wallet address"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                {profile.nickname && (
                  <div className="flex items-center text-xs text-pink-400 mt-1 bg-gray-700/50 px-1.5 py-0.5 rounded-full self-start w-fit">
                    <span className="truncate" title={profile.nickname}>
                      {profile.nickname}
                    </span>
                    <span className="text-gray-500 text-xs ml-0.5 hidden sm:inline">.alt</span>
                    <button
                      onClick={() => copyToClipboard(profile.nickname!, "Nickname")}
                      className="ml-1.5 text-gray-500 hover:text-white transition-colors flex-shrink-0"
                      title="Copy nickname"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mt-4 md:mt-5 mb-3 md:mb-4">
            <div className="border-b border-gray-700">
              <nav
                className="flex flex-wrap sm:flex-nowrap -mb-px space-x-px sm:space-x-1"
                aria-label="Profile sections"
              >
                {tabItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center whitespace-nowrap px-2 py-2 sm:px-3 sm:py-2.5 font-medium text-xs sm:text-sm rounded-t-md transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900
               ${
                 activeTab === tab.id
                   ? "text-pink-400 border-b-2 border-pink-500 bg-gray-800/40"
                   : "text-gray-400 hover:text-white hover:bg-gray-700/40"
               }`}
                    aria-current={activeTab === tab.id ? "page" : undefined}
                    title={tab.label}
                  >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 sm:mr-1.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px] py-2 space-y-6">
            {activeTab === "contact" && (
              <>
                <ContactInformation profile={profile} />
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3 mt-6 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-pink-400" />
                    Subidentities
                  </h2>
                  <AccountHierarchy profile={profile} isOwnProfile={isOwnProfileState} />
                </div>
              </>
            )}
            {activeTab === "timeline" && <VerificationTimeline profile={profile} />}
          </div>
        </div>
      </div>
    </div>
  )
}
