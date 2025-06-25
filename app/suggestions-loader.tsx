"use client"

import { useEffect } from "react"

export default function SuggestionsLoader() {
  useEffect(() => {
    // Load the suggestions functionality after the page is fully loaded
    if (typeof window !== "undefined") {
      // Use requestIdleCallback to load non-critical resources
      if ("requestIdleCallback" in window) {
        ;(window as any).requestIdleCallback(() => {
          // Dynamically import the suggestions script
          import("@/components/search-suggestions-initializer")
        })
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(() => {
          import("@/components/search-suggestions-initializer")
        }, 1000)
      }
    }
  }, [])

  return null
}
