"use client"

import { useState, useEffect } from "react"
import { TextEditor } from "@/components/text-editor"
import { AuthForm } from "@/components/auth/auth-form"
import { DemoEditor } from "@/components/demo-editor"
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseAvailable, setSupabaseAvailable] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setSupabaseAvailable(false)
        setLoading(false)
        return
      }

      try {
        const supabase = getSupabaseClient()
        setSupabaseAvailable(true)

        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
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
    return <DemoEditor />
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container max-w-7xl px-4 py-8 mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-600">WordWise</h1>
          <p className="mt-2 text-slate-600">Write with confidence</p>
        </header>

        <TextEditor user={user} onSignOut={handleSignOut} />

        <footer className="mt-16 text-center text-sm text-slate-500">
          <p>© 2025 WordWise. A simplified Grammarly clone with document storage.</p>
        </footer>
      </div>
    </main>
  )
}
