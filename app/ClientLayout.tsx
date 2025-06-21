"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserRole } from '@/lib/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Wifi, AlertTriangle } from 'lucide-react'
import { TabFocusManager } from '@/components/tab-focus-manager'

interface ClientLayoutProps {
  children: React.ReactNode
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading WordWise...</h2>
          <p className="text-gray-500 text-sm">Setting up your writing environment...</p>
        </div>
      </div>
    </div>
  )
}

function ErrorFallback({ error, onRetry }: { error: string, onRetry: () => void }) {
  const [isRetrying, setIsRetrying] = useState(false)
  
  const handleRetry = async () => {
    setIsRetrying(true)
    await onRetry()
    setTimeout(() => setIsRetrying(false), 1000)
  }

  const isConnectionError = error.includes('timeout') || error.includes('Connection') || error.includes('network')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          {isConnectionError ? (
            <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          ) : (
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          )}
          
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {isConnectionError ? 'Connection Issue' : 'Loading Error'}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {isConnectionError 
              ? 'We\'re having trouble connecting to our servers. This might be a temporary network issue.'
              : 'Something went wrong while loading your account.'
            }
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Button 
            onClick={handleRetry} 
            className="w-full" 
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>

        {isConnectionError && (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium">Troubleshooting tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
              <li>Disable browser extensions temporarily</li>
              <li>Clear browser cache and cookies</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { loading, error, refreshUserRole, isAuthenticated } = useUserRole()
  const router = useRouter()
  const pathname = usePathname()
  const [showError, setShowError] = useState(false)

  // Show error after 15 seconds of loading
  useEffect(() => {
    if (loading && !error) {
      const timer = setTimeout(() => {
        setShowError(true)
      }, 15000)
      
      return () => clearTimeout(timer)
    } else {
      setShowError(false)
    }
  }, [loading, error])

  // Handle retry
  const handleRetry = async () => {
    setShowError(false)
    await refreshUserRole()
  }

  // Show loading spinner for reasonable time
  if (loading && !error && !showError) {
    return <LoadingSpinner />
  }

  // Show error fallback if there's an error or loading takes too long
  if (error || showError) {
    return (
      <ErrorFallback 
        error={error || 'Loading is taking longer than expected. This might be a connection issue.'} 
        onRetry={handleRetry} 
      />
    )
  }

  return (
    <TabFocusManager>
      {children}
    </TabFocusManager>
  )
}
