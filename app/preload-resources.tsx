"use client"

import { useEffect } from "react"

export default function PreloadResources() {
  useEffect(() => {
    // Preload critical resources after the page has loaded
    if (typeof window !== "undefined") {
      // Wait until the page is idle
      if ("requestIdleCallback" in window) {
        ;(window as any).requestIdleCallback(() => {
          // Preload the search page
          const link = document.createElement("link")
          link.rel = "prefetch"
          link.href = "/search"
          document.head.appendChild(link)
        })
      }
    }
  }, [])

  return null
}
