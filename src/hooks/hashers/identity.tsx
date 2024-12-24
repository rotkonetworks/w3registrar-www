import { useState, useEffect, useCallback, useMemo } from 'react'
import { Storage, Blake2256, Bytes, Struct, Option, } from "@polkadot-api/substrate-bindings"

// Raw interface for internal state
interface IdentityInfo {
  display?: Uint8Array;
  legal?: Uint8Array;
  web?: Uint8Array;
  matrix?: Uint8Array;
  email?: Uint8Array;
  pgpFingerprint?: Uint8Array;
  image?: Uint8Array;
  twitter?: Uint8Array;
  discord?: Uint8Array;
  additional?: Uint8Array;
}

// User-friendly interface for external use
interface IdentityFields {
  display?: string
  legal?: string
  web?: string
  matrix?: string
  email?: string
  pgpFingerprint?: string
  image?: string
  twitter?: string
  discord?: string
  additional?: string
}

interface UseIdentityProps {
  identity: IdentityFields;
}

export function useIdentityEncoder(identity: IdentityFields) {
  const IdentityOf = useMemo(() => Storage("Identity")(
    "IdentityOf",
    Struct({
      display: Option(Bytes()),
      legal: Option(Bytes()),
      web: Option(Bytes()),
      matrix: Option(Bytes()),
      email: Option(Bytes()),
      pgpFingerprint: Option(Bytes()),
      image: Option(Bytes()),
      twitter: Option(Bytes()),
      discord: Option(Bytes()),
      additional: Option(Bytes())
    }),
    [Bytes(32), Blake2256] as const
  ), [])

  const [originalHash, setOriginalHash] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const encodeFields = useCallback((): IdentityInfo => {
    if (identity) {
      return Object.entries(identity).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value ? encoder.encode(value) : undefined
      }), {}) as IdentityInfo
    }
  }, [identity])

  const decodeFields = useCallback((info: IdentityInfo): IdentityFields => {
    return Object.entries(info).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value ? decoder.decode(value) : undefined
    }), {}) as IdentityFields
  }, [identity])

  const calculateHash = useCallback((): Uint8Array => {
    if (identity) {
      const encoded = IdentityOf.dec.enc(encodeFields())
      return Blake2256(encoded)
    }
  }, [identity])

  const getCurrentHash = useCallback((): Uint8Array | null => {
    if (!identity) return null
    return calculateHash(identity)
  }, [identity, calculateHash])

  const hasChanges = useCallback((): boolean => {
    const currentHash = getCurrentHash()
    if (!currentHash || !originalHash) return false
    return !currentHash.every((byte, i) => byte === originalHash[i])
  }, [getCurrentHash, originalHash])

  useEffect(() => {
    if (identity) {
      const encoded = encodeFields();
      import.meta.env.DEV && console.log({ 
        encoded: encoded,
        hash: `0x${Buffer.from(calculateHash()).toString("hex")}`,
      })
    }
  }, [identity])

  return {
    // Return raw identity for submission
    rawIdentity: identity,
    loading,
    error,
    hasChanges: hasChanges(),
    currentHash: getCurrentHash(),
    originalHash,
    // Utility functions
    encodeFields,
    decodeFields,
    calculateHash
  }
}
