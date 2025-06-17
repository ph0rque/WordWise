"use client"

import type React from "react"

import { useEffect } from "react"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // Global ResizeObserver error suppression
    const handleResizeObserverError = (e: ErrorEvent) => {
      if (
        e.message.includes("ResizeObserver loop completed with undelivered notifications") ||
        e.message.includes("ResizeObserver loop limit exceeded")
      ) {
        e.stopImmediatePropagation()
        e.preventDefault()
        return false
      }
    }

    // Also handle unhandled promise rejections that might be related
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      if (e.reason?.message?.includes("ResizeObserver") || e.reason?.toString?.()?.includes("ResizeObserver")) {
        e.preventDefault()
        return false
      }
    }

    window.addEventListener("error", handleResizeObserverError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleResizeObserverError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
