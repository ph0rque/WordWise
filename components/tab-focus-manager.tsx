"use client"

import { useEffect, useRef } from 'react'

// Extend Window interface to include custom property
declare global {
  interface Window {
    shouldSuppressRefresh?: () => boolean
  }
}

interface TabFocusManagerProps {
  children: React.ReactNode
}

/**
 * Component to handle tab and app focus/blur events and prevent unnecessary reloads
 * when switching between tabs or applications
 */
export function TabFocusManager({ children }: TabFocusManagerProps) {
  const lastFocusTime = useRef<number>(0)
  const lastBlurTime = useRef<number>(0)
  const isInitialized = useRef<boolean>(false)
  const suppressRefreshUntil = useRef<number>(0)

  useEffect(() => {
    // Track when the page becomes visible/hidden (tab switching)
    const handleVisibilityChange = () => {
      const now = Date.now()
      
      if (document.visibilityState === 'visible') {
        console.log('🔍 Tab became visible')
        
        // Only trigger actions if it's been more than 30 seconds since last focus
        // This prevents unnecessary reloads for quick tab switches
        const timeSinceLastFocus = now - lastFocusTime.current
        
        if (timeSinceLastFocus > 30000 && isInitialized.current) {
          console.log('🔄 Tab focus: Long absence detected, checking for updates...')
          window.dispatchEvent(new CustomEvent('longTabReturn', { 
            detail: { timeSinceLastFocus } 
          }))
        } else {
          console.log('🔄 Tab focus: Quick switch detected, skipping refresh')
          // Suppress any refreshes for the next 2 seconds to prevent other event handlers
          suppressRefreshUntil.current = now + 2000
        }
        
        lastFocusTime.current = now
      } else {
        console.log('🔍 Tab became hidden')
        lastBlurTime.current = now
      }
    }

    // Track window focus/blur for app switching
    const handleFocus = () => {
      const now = Date.now()
      console.log('🔍 Window focused (app switching)')
      
      // Calculate time since last blur
      const timeSinceBlur = lastBlurTime.current > 0 ? now - lastBlurTime.current : 0
      
      if (timeSinceBlur > 0 && timeSinceBlur < 30000 && isInitialized.current) {
        console.log(`🔄 App focus: Quick app switch detected (${Math.round(timeSinceBlur/1000)}s), suppressing refresh`)
        // Suppress refreshes for quick app switches (under 30 seconds)
        suppressRefreshUntil.current = now + 2000
        
        // Dispatch a custom event to notify other components to skip refreshes
        window.dispatchEvent(new CustomEvent('suppressRefresh', { 
          detail: { duration: 2000, reason: 'quick_app_switch' } 
        }))
      } else if (timeSinceBlur >= 30000 && isInitialized.current) {
        console.log('🔄 App focus: Long absence detected, allowing refresh')
        // Allow refresh for long absences
        window.dispatchEvent(new CustomEvent('longAppReturn', { 
          detail: { timeSinceBlur } 
        }))
      }
      
      lastFocusTime.current = now
    }

    const handleBlur = () => {
      const now = Date.now()
      console.log('🔍 Window blurred (app switching)')
      lastBlurTime.current = now
    }

    // Global method to check if refreshes should be suppressed
    window.shouldSuppressRefresh = () => {
      return Date.now() < suppressRefreshUntil.current
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Mark as initialized after first render
    setTimeout(() => {
      isInitialized.current = true
    }, 1000)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      delete window.shouldSuppressRefresh
    }
  }, [])

  return <>{children}</>
} 