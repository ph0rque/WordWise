"use client"

import { useState, useEffect } from "react"
import { TextEditor, SuggestionsPanel, useSuggestionsPanelProps } from "@/components/text-editor"
import { AuthForm } from "@/components/auth/auth-form"
import { DemoEditor } from "@/components/demo-editor"
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase/client"
import type { User, Document } from "@/lib/types"
import { DocumentManager } from "@/components/document-manager"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

  const refreshDocuments = () => setRefreshDocumentsFlag((f) => f + 1)

  const handleSelectDocument = (doc: Document) => {
    setCurrentDocument(doc)
  }

  const handleNewDocument = (doc: Document) => {
    setCurrentDocument(doc)
    refreshDocuments()
  }

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured, showing demo mode")
        setSupabaseAvailable(false)
        setLoading(false)
        return
      }

      try {
        const supabase = getSupabaseClient()
        setSupabaseAvailable(true)
        console.log("Supabase configured, initializing auth...")

        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("Current session:", session?.user?.email || "No user")
        setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("Auth state changed:", session?.user?.email || "No user")
          setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)
        })

        setLoading(false)
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Supabase initialization error:", error)
        setSupabaseAvailable(false)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      console.log("User signed out")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
    return <AuthForm />
  }

  console.log("User authenticated, showing main app")
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container max-w-7xl px-4 py-8 mx-auto">
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
            {/* Email/user info at the top */}
            <div className="flex justify-end mb-6">
              <div className="bg-white rounded-lg px-4 py-2 shadow flex items-center gap-2">
                <span className="text-sm text-slate-700">{user.email}</span>
              </div>
            </div>
            {/* Suggestions and My Documents stacked */}
            <div className="space-y-6">
              <SuggestionsPanel {...suggestionsPanelProps} />
              <DocumentManager
                onSelectDocument={handleSelectDocument}
                onNewDocument={handleNewDocument}
                currentDocumentId={currentDocument?.id}
                refreshDocumentsFlag={refreshDocumentsFlag}
              />
            </div>
          </div>
        </div>
        <footer className="mt-16 text-center text-sm text-slate-500">
          <p>© 2025 WordWise. A simplified Grammarly clone with document storage.</p>
        </footer>
      </div>
    </main>
  )
}
