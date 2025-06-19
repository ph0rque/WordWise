"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TextEditor } from "@/components/text-editor"
import { EnhancedAuthForm } from "@/components/auth/enhanced-auth-form"
import { DemoEditor } from "@/components/demo-editor"
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase/client"
import type { User, Document } from "@/lib/types"
import { DocumentManager } from "@/components/document-manager"
import { RoleBasedHeader, RoleBasedNotifications } from "@/components/navigation/role-based-header"
import { useRoleBasedFeatures } from "@/lib/hooks/use-user-role"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { GraduationCap, AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { loadingTracker } from "@/lib/utils"
import { RightSidebar } from "@/components/sidebar/right-sidebar"
import { checkAIAvailability } from "@/lib/client-grammar-checker"
import { cn } from "@/lib/utils"

// Loading timeout configuration
const LOADING_TIMEOUT = 10000 // 10 seconds
const ROLE_CHECK_TIMEOUT = 5000 // 5 seconds

function SearchParamsHandler({ onRedirectTo }: { onRedirectTo: (redirectTo: string | null) => void }) {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  
  useEffect(() => {
    onRedirectTo(redirectTo)
  }, [redirectTo, onRedirectTo])
  
  return null
}

export default function Home() {
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  const handleNewDocument = async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("documents")
      .insert({ title: "Untitled Document", content: "" })
      .select()
      .single()
    if (data) {
      setCurrentDocument(data)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    const supabase = getSupabaseClient()
    await supabase.from("documents").delete().eq("id", documentId)
    // After deletion, fetch the most recent document
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()
    setCurrentDocument(data || null)
  }

  // Force reload function for stuck states
  const handleForceReload = () => {
    window.location.reload()
  }

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setMounted(true)
    const checkAI = async () => {
      setAiAvailable(await checkAIAvailability())
    }
    checkAI()
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
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
    setCurrentDocument(null)
    router.push("/")
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
    <div
      className={cn(
        "grid min-h-screen w-full md:grid-cols-[3fr_1.5fr]",
        isSidebarOpen && "md:grid-cols-[3fr_1.5fr]"
      )}
    >
      <main className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <RoleBasedHeader
            userEmail={user.email}
            onSignOut={handleSignOut}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:gap-8">
          {currentDocument ? (
            <TextEditor
              key={currentDocument.id}
              initialDocument={currentDocument}
              onSave={(doc: Document) => setCurrentDocument(doc)}
              onDelete={handleDeleteDocument}
              onNew={handleNewDocument}
              onSelect={setCurrentDocument}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  No documents found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your first document to get started.
                </p>
                <Button className="mt-4" onClick={handleNewDocument}>
                  Create New Document
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-20 w-full max-w-sm transform border-l bg-background transition-transform duration-300 ease-in-out md:static md:z-auto md:w-auto md:max-w-none md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <RightSidebar document={currentDocument} aiAvailable={aiAvailable} />
      </div>
    </div>
  )
}
