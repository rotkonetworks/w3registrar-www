"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

export type Network = "paseo" | "polkadot" | "kusama"

interface NetworkContextType {
  network: Network
  setNetwork: (network: Network) => void
  networkColor: string
  networkDisplayName: string
  isEncrypted: boolean // True if data is signed/encrypted for privacy
  isFree: boolean
}

const networkDetails = {
  polkadot: {
    color: "text-purple-500",
    displayName: "Polkadot",
    isEncrypted: false,
    isFree: false,
  },
  paseo: {
    color: "text-pink-500",
    displayName: "Paseo",
    isEncrypted: false,
    isFree: true,
  },
  kusama: {
    color: "text-cyan-500", // Kept cyan for text consistency, icon will be black/white
    displayName: "Kusama (Private)", // Indicate privacy
    isEncrypted: true, // Kusama data will be signed/private
    isFree: false,
  },
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<Network>("polkadot")

  useEffect(() => {
    const savedNetwork = localStorage.getItem("network") as Network | null
    if (savedNetwork && Object.keys(networkDetails).includes(savedNetwork)) {
      setNetwork(savedNetwork)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("network", network)
  }, [network])

  const networkColor = networkDetails[network].color
  const networkDisplayName = networkDetails[network].displayName
  const isEncrypted = networkDetails[network].isEncrypted
  const isFree = networkDetails[network].isFree

  return (
    <NetworkContext.Provider value={{ network, setNetwork, networkColor, networkDisplayName, isEncrypted, isFree }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider")
  }
  return context
}
