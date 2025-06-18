"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TextEditor, SuggestionsPanel, useSuggestionsPanelProps } from "@/components/text-editor"
import { EnhancedAuthForm } from "@/components/auth/enhanced-auth-form"
import { DemoEditor } from "@/components/demo-editor"
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase/client"
import type { User, Document } from "@/lib/types"
import { DocumentManager } from "@/components/document-manager"
import { RoleBasedHeader, RoleBasedNotifications } from "@/components/navigation/role-based-header"
import { useRoleBasedFeatures } from "@/lib/hooks/use-user-role"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { GraduationCap, AlertCircle, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { loadingTracker } from "@/lib/utils"

// Loading timeout configuration
const LOADING_TIMEOUT = 10000 // 10 seconds
const ROLE_CHECK_TIMEOUT = 5000 // 5 seconds

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [supabaseAvailable, setSupabaseAvailable] = useState(false)
  const [refreshDocumentsFlag, setRefreshDocumentsFlag] = useState(0)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [aiAvailable, setAiAvailable] = useState(false)
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [applySuggestion, setApplySuggestion] = useState<any>(null)
  const [ignoreSuggestion, setIgnoreSuggestion] = useState<any>(null)
  const [getIconForType, setGetIconForType] = useState<any>(null)
  const [suggestionsPanelProps, setSuggestionsPanelProps] = useState<any>({})
  const [mounted, setMounted] = useState(false)
  const [initializationComplete, setInitializationComplete] = useState(false)

  // Timeout refs for cleanup
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const roleCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Role-based features - only use after component mounts to avoid hydration issues
  const roleFeatures = useRoleBasedFeatures()
  const {
    canCreateDocuments,
    canUseGrammarChecker,
    showAdminNavigation,
    showUpgradePrompts,
    currentRole,
    isAuthenticated: roleBasedAuth,
  } = mounted && initializationComplete ? roleFeatures : {
    canCreateDocuments: false,
    canUseGrammarChecker: false,
    showAdminNavigation: false,
    showUpgradePrompts: false,
    currentRole: null,
    isAuthenticated: false,
  }

  const refreshDocuments = () => setRefreshDocumentsFlag((f) => f + 1)

  const handleSelectDocument = (doc: Document) => {
    setCurrentDocument(doc)
  }

  const handleNewDocument = (doc: Document) => {
    setCurrentDocument(doc)
    refreshDocuments()
  }

  // Force reload function for stuck states
  const handleForceReload = () => {
    window.location.reload()
  }

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Start tracking initialization
        loadingTracker.startLoading('auth-init', 'Initializing authentication')
        
        // Set up loading timeout
        loadingTimeoutRef.current = setTimeout(() => {
          console.warn('Loading timeout reached, forcing completion')
          loadingTracker.failLoading('auth-init', 'Timeout reached')
          setLoadingError('Loading is taking longer than expected. Please try refreshing the page.')
          setLoading(false)
        }, LOADING_TIMEOUT)

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          console.log("Supabase not configured, showing demo mode")
          loadingTracker.endLoading('auth-init')
          setSupabaseAvailable(false)
          setLoading(false)
          setInitializationComplete(true)
          return
        }

        const supabase = getSupabaseClient()
        setSupabaseAvailable(true)
        console.log("Supabase configured, initializing auth...")

        // Get initial session with timeout
        loadingTracker.startLoading('session-check', 'Checking user session')
        const sessionPromise = supabase.auth.getSession()
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )

        const {
          data: { session },
        } = await Promise.race([sessionPromise, sessionTimeout]) as any

        loadingTracker.endLoading('session-check')
        console.log("Current session:", session?.user?.email || "No user")
        setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          console.log("Auth state changed:", session?.user?.email || "No user")
          const newUser = session?.user ? { id: session.user.id, email: session.user.email! } : null
          setUser(newUser)
          
          // Handle redirect after authentication
          if (newUser && redirectTo) {
            console.log("Redirecting authenticated user to:", redirectTo)
            router.push(redirectTo)
          }
        })

        // Clear loading timeout since we completed successfully
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
          loadingTimeoutRef.current = null
        }

        loadingTracker.endLoading('auth-init')
        setLoading(false)
        setInitializationComplete(true)
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Supabase initialization error:", error)
        loadingTracker.failLoading('auth-init', error instanceof Error ? error.message : 'Unknown error')
        loadingTracker.failLoading('session-check', 'Auth initialization failed')
        setLoadingError(error instanceof Error ? error.message : 'Failed to initialize authentication')
        setSupabaseAvailable(false)
        setLoading(false)
        setInitializationComplete(true)
      }
    }

    initializeAuth()

    // Cleanup timeouts on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      if (roleCheckTimeoutRef.current) {
        clearTimeout(roleCheckTimeoutRef.current)
      }
    }
  }, [])

  // Additional timeout for role checking
  useEffect(() => {
    if (user && mounted && !initializationComplete) {
      roleCheckTimeoutRef.current = setTimeout(() => {
        console.warn('Role check timeout, proceeding anyway')
        setInitializationComplete(true)
      }, ROLE_CHECK_TIMEOUT)
    }

    return () => {
      if (roleCheckTimeoutRef.current) {
        clearTimeout(roleCheckTimeoutRef.current)
      }
    }
  }, [user, mounted, initializationComplete])

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      console.log("User signed out")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // Show loading with error handling and manual refresh option
  if (loading || !mounted || !initializationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600">Loading WordWise...</p>
          
          {loadingError && (
            <div className="max-w-md mx-auto">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  {loadingError}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleForceReload}
                variant="outline" 
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          )}
          
          {/* Show manual refresh option after 5 seconds */}
          {!loadingError && (
            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-2">Taking longer than expected?</p>
              <Button 
                onClick={handleForceReload}
                variant="ghost" 
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // If Supabase is not configured, show demo mode
  if (!supabaseAvailable) {
    console.log("Showing demo editor")
    return <DemoEditor />
  }

  if (!user) {
    console.log("No user, showing auth form")
    return (
      <>
        {redirectTo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
            <p className="text-blue-800 text-sm">
              Please sign in to access <strong>{redirectTo}</strong>
            </p>
          </div>
        )}
        <EnhancedAuthForm />
      </>
    )
  }

  console.log("User authenticated, showing main app")

  // Show role setup prompt if user has no role
  if (user && showUpgradePrompts) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <RoleBasedHeader userEmail={user.email} onSignOut={handleSignOut} />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="p-8 bg-white rounded-lg shadow-sm border">
              <GraduationCap className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to WordWise!</h1>
              <p className="text-gray-600 mb-6">
                To get started, please select your role to access the appropriate features.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth/role-setup'}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Complete Profile Setup
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Redirect admins to dashboard if they're on the main page
  if (showAdminNavigation && currentRole === 'admin') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <RoleBasedHeader userEmail={user.email} onSignOut={handleSignOut} />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                As an administrator, you might want to visit the{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => window.location.href = '/admin'}
                >
                  Admin Dashboard
                </Button>{" "}
                to manage students and view analytics.
              </AlertDescription>
            </Alert>
            
            <div className="p-8 bg-white rounded-lg shadow-sm border">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Text Editor</h1>
              <p className="text-gray-600 mb-6">
                You can use the text editor below or visit the admin dashboard to manage students.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Role-based header */}
      <RoleBasedHeader userEmail={user.email} onSignOut={handleSignOut} />
      
      <div className="container max-w-7xl px-4 py-8 mx-auto">
        {/* Role-based notifications */}
        <div className="mb-6">
          <RoleBasedNotifications />
        </div>

        {/* Check if user has permissions for main features */}
        {!canCreateDocuments || !canUseGrammarChecker ? (
          <div className="text-center py-12">
            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access the text editor. 
                Please contact your administrator for assistance.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex flex-row items-start gap-8">
            {/* Main editor area */}
            <div className="basis-2/3 min-w-0">
              <TextEditor
                user={user}
                onSignOut={handleSignOut}
                refreshDocuments={refreshDocuments}
                currentDocument={currentDocument}
                setCurrentDocument={setCurrentDocument}
                onSuggestionsPanelPropsChange={setSuggestionsPanelProps}
              />
            </div>
            {/* Sidebar area */}
            <div className="basis-1/3 flex flex-col items-stretch">
              {/* Suggestions and My Documents stacked */}
              <div className="space-y-6">
                {canUseGrammarChecker && (
                  <SuggestionsPanel {...suggestionsPanelProps} />
                )}
                {canCreateDocuments && (
                  <DocumentManager
                    onSelectDocument={handleSelectDocument}
                    onNewDocument={handleNewDocument}
                    currentDocumentId={currentDocument?.id}
                    refreshDocumentsFlag={refreshDocumentsFlag}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        
        <footer className="mt-16 text-center text-sm text-slate-500">
          <p>© 2025 WordWise. An AI-powered academic writing assistant for high school students.</p>
        </footer>
      </div>
    </main>
  )
}
