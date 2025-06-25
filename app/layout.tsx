import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { NetworkProvider } from "@/contexts/network-context"
import { UserProvider } from "@/contexts/user-context"
import { WalletProvider } from "@/contexts/wallet-context"
import { VerificationProvider } from "@/contexts/verification-context"
import { BalanceProvider } from "@/contexts/balance-context"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "whodb - Decentralized Identity Search",
  description:
    "Search and verify blockchain identities across multiple networks. Find people by name, wallet address, or social handles.",
  metadataBase: new URL("https://whodb.com"),
  keywords: [
    "blockchain identity",
    "decentralized identity",
    "identity verification",
    "web3 identity",
    "blockchain search",
  ],
  openGraph: {
    title: "whodb - Decentralized Identity Search",
    description: "Search and verify blockchain identities across multiple networks",
    type: "website",
  },
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827", // Corresponds to dark theme bg-gray-900
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} dark-theme`}>
      <head>
        <link rel="preload" href="/whodb_icon_compact.svg" as="image" type="image/svg+xml" fetchPriority="high" />
        <link rel="icon" href="/whodb_icon_compact.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-gray-900 text-white antialiased">
        <ThemeProvider>
          <NetworkProvider>
            <WalletProvider>
              <BalanceProvider>
                <VerificationProvider>
                  <UserProvider>{children}</UserProvider>
                </VerificationProvider>
              </BalanceProvider>
            </WalletProvider>
          </NetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
