"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TextEditor } from "@/components/text-editor"
import { EnhancedAuthForm } from "@/components/auth/enhanced-auth-form"
import { DemoEditor } from "@/components/demo-editor"
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase/client"
import type { Document } from "@/lib/types"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { DocumentManager } from "@/components/document-manager"
import { RoleBasedHeader, RoleBasedNotifications } from "@/components/navigation/role-based-header"
import { useRoleBasedFeatures } from "@/lib/hooks/use-user-role"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { GraduationCap, AlertCircle, RefreshCw, Loader2, PanelRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { RightSidebar } from "@/components/sidebar/right-sidebar"
import { checkAIAvailability } from "@/lib/client-grammar-checker"
import { cn } from "@/lib/utils"

function SearchParamsHandler({ onRedirectTo }: { onRedirectTo: (redirectTo: string | null) => void }) {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  
  useEffect(() => {
    onRedirectTo(redirectTo)
  }, [redirectTo, onRedirectTo])
  
  return null
}

export default function Page() {
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  
  const [user, setUser] = useState<SupabaseUser | null>(null)
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasDocuments, setHasDocuments] = useState(false)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)

  // Role-based features - only use after component mounts to avoid hydration issues
  const roleFeatures = useRoleBasedFeatures()
  const {
    canCreateDocuments,
    canUseGrammarChecker,
    showAdminNavigation,
    showUpgradePrompts,
    currentRole,
    isAuthenticated: roleBasedAuth,
    loading: roleLoading,
    error: roleError,
  } = roleFeatures

  const refreshDocuments = () => setRefreshDocumentsFlag((f) => f + 1)

  const handleSelectDocument = (doc: Document) => {
    setCurrentDocument(doc)
  }

  const handleNewDocument = async () => {
    const supabase = getSupabaseClient()
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      console.error("Error getting user for new document:", userError)
      return
    }

    console.log("Creating new document for user:", userData.user.id)
    
    const { data, error } = await supabase
      .from("documents")
      .insert({ 
        title: "Untitled Document", 
        content: "",
        user_id: userData.user.id
      })
      .select()
      .single()
      
    if (error) {
      console.error("Error creating new document:", error)
    } else if (data) {
      console.log("New document created:", data)
      setCurrentDocument(data)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    const supabase = getSupabaseClient()
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      console.error("Error getting user for document deletion:", userError)
      return
    }

    console.log("Deleting document for user:", userData.user.id)
    
    await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", userData.user.id) // Ensure user can only delete their own documents
      
    // After deletion, fetch the most recent document for this user
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userData.user.id)
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
        console.log("🔄 Starting auth initialization...")
        
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          console.log("Supabase not configured, showing demo mode")
          setSupabaseAvailable(false)
          setLoading(false)
          return
        }

        console.log("✅ Supabase is configured")
        const supabase = getSupabaseClient()
        setSupabaseAvailable(true)
        console.log("Supabase configured, initializing auth...")

        // Simple session check without timeout
        console.log("🔍 Getting session...")
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError)
          setUser(null)
        } else {
          console.log("✅ Session retrieved:", session?.user?.email || "No user")
          setUser(session?.user || null)
        }

        // Listen for auth changes and handle token refresh
        console.log("🔗 Setting up auth state listener...")
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.email || "No user")
          
          // Handle different auth events
          switch (event) {
            case 'SIGNED_IN':
              console.log("✅ User signed in")
              setUser(session?.user || null)
              break
            case 'SIGNED_OUT':
              console.log("👋 User signed out")
              setUser(null)
              setCurrentDocument(null)
              break
            case 'TOKEN_REFRESHED':
              console.log("🔄 Token refreshed")
              setUser(session?.user || null)
              break
            default:
              break
          }
        })

        // Set up automatic session refresh every 50 minutes (before 1-hour expiry)
        const refreshInterval = setInterval(async () => {
          try {
            console.log("🔄 Auto-refreshing session...")
            const { error } = await supabase.auth.refreshSession()
            if (error) {
              console.error("❌ Session refresh failed:", error)
            } else {
              console.log("✅ Session refreshed successfully")
            }
          } catch (error) {
            console.error("❌ Session refresh error:", error)
          }
        }, 50 * 60 * 1000) // 50 minutes

        // Cleanup function
        return () => {
          subscription.unsubscribe()
          clearInterval(refreshInterval)
        }
      } catch (error) {
        console.error("❌ Supabase initialization error:", error)
        setLoadingError("Failed to initialize authentication. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
    setCurrentDocument(null)
    router.push("/")
  }

  // Show loading with error handling and manual refresh option
  if (loading || roleLoading || !mounted) {
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
                  {loadingError || roleError}
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

  // If not authenticated, show auth form
  if (!roleBasedAuth) {
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md p-4">
            <EnhancedAuthForm />
          </div>
        </div>
      </>
    )
  }

  

  // Show role setup prompt if user has no role
  if (showUpgradePrompts) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <RoleBasedHeader 
          user={user}
          onSignOut={handleSignOut}
        />
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
        <RoleBasedHeader 
          user={user}
          onSignOut={handleSignOut}
        />
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

  // Main authenticated view
  return (
    <div className="flex h-screen w-full bg-white">
      <main className="flex flex-col flex-1">
        <header className="flex h-16 items-center border-b bg-gray-50 px-6">
          <RoleBasedHeader 
            user={user}
            onSignOut={handleSignOut}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div className={cn(
            "container mx-auto grid max-w-7xl grid-cols-1 gap-8 p-4",
            isRightSidebarCollapsed ? "md:grid-cols-1" : "md:grid-cols-[3fr_1.5fr]"
          )}>
            <main className="flex flex-col gap-4">
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
                <div className="flex h-full min-h-[500px] items-center justify-center rounded-lg border border-dashed shadow-sm">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {hasDocuments ? "Select a document to get started" : "No documents found"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {hasDocuments 
                        ? "Choose a document from your collection or create a new one."
                        : "Create your first document to get started."
                      }
                    </p>
                    <Button className="mt-4" onClick={handleNewDocument}>
                      Create New Document
                    </Button>
                  </div>
                </div>
              )}
            </main>
            {!isRightSidebarCollapsed && (
              <aside className="hidden md:flex md:flex-col md:gap-4 md:h-full md:max-h-[calc(100vh-8rem)] md:overflow-hidden">
                <div className="flex-1 min-h-0">
                  <RightSidebar 
                    document={currentDocument} 
                    aiAvailable={aiAvailable}
                    onCollapse={() => setIsRightSidebarCollapsed(true)}
                  />
                </div>
                
                {/* Document Manager positioned under the sidebar */}
                <div className="flex-shrink-0">
                  <DocumentManager
                    onSelectDocument={handleSelectDocument}
                    onNewDocument={setCurrentDocument}
                    currentDocumentId={currentDocument?.id}
                    refreshDocumentsFlag={refreshDocumentsFlag}
                    onDocumentsLoaded={setHasDocuments}
                  />
                </div>
              </aside>
            )}
          </div>
          
          {/* Floating expand button when sidebar is collapsed */}
          {isRightSidebarCollapsed && (
            <div className="fixed top-20 right-4 z-30 hidden md:block">
              <Button
                onClick={() => setIsRightSidebarCollapsed(false)}
                size="sm"
                variant="outline"
                className="bg-white shadow-lg hover:shadow-xl transition-shadow"
                title="Show writing tools and analysis"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Mobile Sidebar */}
          {isSidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
          <div
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full max-w-sm transform border-l bg-background transition-transform duration-300 ease-in-out md:hidden",
              isSidebarOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex flex-col gap-4 p-4">
              <RightSidebar document={currentDocument} aiAvailable={aiAvailable} />
              
              {/* Document Manager for mobile */}
              <DocumentManager
                onSelectDocument={handleSelectDocument}
                onNewDocument={setCurrentDocument}
                currentDocumentId={currentDocument?.id}
                refreshDocumentsFlag={refreshDocumentsFlag}
                onDocumentsLoaded={setHasDocuments}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
