import { useState, useEffect, useCallback } from 'react'
import { Storage, Blake2256, Blake2128Concat, Bytes, Struct, Option } from "@polkadot-api/substrate-bindings"

const IdentityOf = Storage("Identity")(
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
  [Bytes(32), Blake2128Concat] as const
)

// Raw interface for internal state
interface IdentityInfo {
  display?: Uint8Array
  legal?: Uint8Array
  web?: Uint8Array
  matrix?: Uint8Array
  email?: Uint8Array
  pgpFingerprint?: Uint8Array
  image?: Uint8Array
  twitter?: Uint8Array
  discord?: Uint8Array
  additional?: Uint8Array
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
  accountId?: Uint8Array
  chainHead: {
    storage: (blockHash: string, key: string) => Promise<string>
    latestFinalizedBlockHash: string
  }
}

export function useIdentity({ accountId, chainHead }: UseIdentityProps) {
  const [identity, setIdentity] = useState<IdentityInfo | null>(null)
  const [originalHash, setOriginalHash] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const encodeFields = useCallback((fields: Partial<IdentityFields>): IdentityInfo => {
    return Object.entries(fields).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value ? encoder.encode(value) : undefined
    }), {}) as IdentityInfo
  }, [])

  const decodeFields = useCallback((info: IdentityInfo): IdentityFields => {
    return Object.entries(info).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value ? decoder.decode(value) : undefined
    }), {}) as IdentityFields
  }, [])

  const calculateHash = useCallback((info: IdentityInfo): Uint8Array => {
    const encoded = IdentityOf.dec.enc(info)
    return Blake2256(encoded)
  }, [])

  const fetchIdentity = useCallback(async () => {
    if (!accountId || !chainHead.latestFinalizedBlockHash) {
      setIdentity(null)
      setOriginalHash(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const storageKey = IdentityOf.enc(accountId)
      const result = await chainHead.storage(
        chainHead.latestFinalizedBlockHash,
        storageKey
      )

      if (result) {
        const decoded = IdentityOf.dec(result)
        setIdentity(decoded)
        setOriginalHash(calculateHash(decoded))
      } else {
        setIdentity(null)
        setOriginalHash(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch identity'))
    } finally {
      setLoading(false)
    }
  }, [accountId, chainHead, calculateHash])

  // Update a field with string value (handles encoding)
  const updateField = useCallback((field: keyof IdentityFields, value?: string) => {
    setIdentity(prev => {
      if (!prev) return null
      return {
        ...prev,
        [field]: value ? encoder.encode(value) : undefined
      }
    })
  }, [])

  const getCurrentHash = useCallback((): Uint8Array | null => {
    if (!identity) return null
    return calculateHash(identity)
  }, [identity, calculateHash])

  const hasChanges = useCallback((): boolean => {
    const currentHash = getCurrentHash()
    if (!currentHash || !originalHash) return false
    return !currentHash.every((byte, i) => byte === originalHash[i])
  }, [getCurrentHash, originalHash])

  return {
    // Return decoded fields for display
    identity: identity ? decodeFields(identity) : null,
    // Return raw identity for submission
    rawIdentity: identity,
    loading,
    error,
    updateField,
    hasChanges: hasChanges(),
    currentHash: getCurrentHash(),
    originalHash,
    //reset,
    //refetch: fetchIdentity,
    // Utility functions
    encodeFields,
    decodeFields,
    calculateHash
  }
}

// Example usage
export function IdentityEditor({ accountId }: { accountId: Uint8Array }) {
  const {
    identity,
    loading,
    error,
    updateField,
    hasChanges
  } = useIdentity({
    accountId,
    chainHead: {
      storage: async () => '', 
      latestFinalizedBlockHash: '0x...'
    }
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!identity) return <div>No identity found</div>

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={identity.display || ''}
        onChange={e => updateField('display', e.target.value)}
        placeholder="Display name"
      />
      {/* Other fields */}
      {hasChanges && (
        <div>Unsaved changes detected!</div>
      )}
    </div>
  )
}
