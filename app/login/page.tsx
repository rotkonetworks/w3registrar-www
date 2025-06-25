"use client"

import { ArrowLeft, Mail } from "lucide-react" // Using Mail for Google for now, replace with actual Google icon if available
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/app/components/logo"
import { AuthProviderButton } from "@/components/auth-provider-button"
import { useUser } from "@/contexts/user-context"
import { useWallet } from "@/contexts/wallet-context"

// Placeholder icons - replace with actual SVGs or Lucide icons if better ones exist
const GoogleIcon = () => <Mail className="w-5 h-5" /> // Placeholder
const MatrixIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.79 9.44v5.12h-2.97V9.44h2.97zM6.18 9.44v5.12H3.21V9.44h2.97zm7.31 0v5.12h-2.98V9.44h2.98zM17.03 3h-2.98v4.58h2.98V3zm-10.85 0H3.2v4.58h2.98V3zM9.94 3H6.96v4.58h2.98V3zm0 13.42H6.96V21h2.98v-4.58zm7.09 0h-2.98V21h2.98v-4.58z" />
  </svg>
)
const PolkadotIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-pink-400">
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="12" cy="5" r="2.5" />
    <circle cx="12" cy="19" r="2.5" />
    <circle cx="5" cy="12" r="2.5" />
    <circle cx="19" cy="12" r="2.5" />
    <circle cx="17.66" cy="17.66" r="2.5" />
    <circle cx="6.34" cy="6.34" r="2.5" />
    <circle cx="17.66" cy="6.34" r="2.5" />
    <circle cx="6.34" cy="17.66" r="2.5" />
  </svg>
)
const EthereumIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
    <path d="M12 1.75l-6.25 10.5L12 17l6.25-4.75L12 1.75zM5.75 13l6.25 3.5 6.25-3.5L12 22.25 5.75 13z" />
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const { login } = useUser()
  const { connect: connectWallet, address: walletAddress, isConnected: isWalletConnected, isConnecting } = useWallet()

  const handleSocialLogin = async (provider: string) => {
    toast.info(`Simulating login with ${provider}...`)
    // In a real app, this would involve an OAuth flow.
    // For now, we'll use a mock address or a generic login.
    // The `login` function in UserContext expects an address.
    // We can use a placeholder or modify UserContext to handle social logins differently.
    const mockSocialAddress = `social_${provider.toLowerCase()}_${Date.now().toString(36)}`
    await login(mockSocialAddress) // Assuming login can handle non-wallet addresses for social
    toast.success(`Logged in with ${provider}! (Simulated)`)
    router.push("/") // Or to user's profile
  }

  const handleWalletLogin = async (walletType: "polkadot" | "ethereum") => {
    toast.info(`Connecting to ${walletType} wallet...`)
    try {
      if (!isWalletConnected) {
        await connectWallet() // This sets the address in WalletContext
      }
      // After connectWallet resolves, walletAddress in WalletContext should be updated.
      // We need to ensure login uses the fresh address.
      // A slight delay or effect might be needed if address isn't immediately available.

      // Re-check address after connection attempt
      const currentAddress = walletAddress // This might be stale if connectWallet just updated it.
      // It's better if connectWallet returns the address or login can access it reactively.

      // For this simulation, let's assume connectWallet updates WalletContext,
      // and UserContext's login can then use that.
      // If UserContext's login needs an address passed directly:
      if (currentAddress) {
        // Check if address is available after connection
        await login(currentAddress)
        toast.success(`Logged in with ${walletType} wallet!`)
        router.push("/")
      } else if (isWalletConnected && walletAddress) {
        // If already connected
        await login(walletAddress)
        toast.success(`Logged in with ${walletType} wallet!`)
        router.push("/")
      } else {
        // This case might happen if connectWallet() doesn't update walletAddress immediately
        // or if the user cancels the connection.
        // A more robust solution would involve connectWallet returning the address or using useEffect.
        toast.error("Wallet connection failed or address not available immediately. Please try again.")
      }
    } catch (error) {
      console.error(`Error logging in with ${walletType}:`, error)
      toast.error(`Failed to login with ${walletType}.`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="border-b border-pink-500/30 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:bg-white/10 hover:text-white p-2 md:px-3 md:py-2"
                >
                  <ArrowLeft className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Back to Home</span>
                </Button>
              </Link>
              <Logo />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/70 border-gray-700 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400 pt-1">Login to manage your identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 pb-6">
            <AuthProviderButton
              providerName="Google"
              icon={<GoogleIcon />}
              onClick={() => handleSocialLogin("Google")}
            />
            <AuthProviderButton
              providerName="Matrix"
              icon={<MatrixIcon />}
              onClick={() => handleSocialLogin("Matrix")}
            />
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-600"></div>
              <span className="flex-shrink mx-4 text-xs text-gray-500 uppercase">Or with a Wallet</span>
              <div className="flex-grow border-t border-gray-600"></div>
            </div>
            <AuthProviderButton
              providerName="Polkadot"
              icon={<PolkadotIcon />}
              onClick={() => handleWalletLogin("polkadot")}
              disabled={isConnecting}
            />
            <AuthProviderButton
              providerName="Ethereum"
              icon={<EthereumIcon />}
              onClick={() => handleWalletLogin("ethereum")}
              disabled={isConnecting}
            />
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-pink-500/30 bg-gray-800/50 backdrop-blur-sm py-6 text-center">
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} whodb. All rights reserved.</p>
      </footer>
    </div>
  )
}
