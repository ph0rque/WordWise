"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { RoleSelector } from "@/components/auth/role-selector"
import { getCurrentUserRole, updateUserRole } from "@/lib/auth/roles"
import type { UserRole } from "@/lib/types"

interface User {
  id: string
  email: string
}

function SearchParamsHandler({ onMessage }: { onMessage: (message: string | null) => void }) {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  
  useEffect(() => {
    onMessage(message)
  }, [message, onMessage])
  
  return null
}

export default function RoleSetupPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeRoleSetup = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          // No session, redirect to auth
          router.push('/auth')
          return
        }

        setUserId(session.user.id)

        // Check if user already has a role
        const existingRole = await getCurrentUserRole()
        if (existingRole) {
          // User already has a role, redirect appropriately
          handleRoleBasedRedirect(existingRole)
          return
        }

        // Check if there's a pending role from user metadata
        if (session.user.user_metadata?.pending_role) {
          setSelectedRole(session.user.user_metadata.pending_role)
        }

        setInitializing(false)
      } catch (error) {
        console.error("Error initializing role setup:", error)
        setError("Failed to initialize role setup. Please try again.")
        setInitializing(false)
      }
    }

    initializeRoleSetup()
  }, [router])

  const handleRoleBasedRedirect = (role: UserRole) => {
    if (role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  const handleCompleteRoleSetup = async () => {
    if (!userId) {
      setError("No user session found. Please try signing in again.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Use the updateUserRole function from our auth helpers
      await updateUserRole(userId, selectedRole)
      
      setMessage(`Welcome! Your ${selectedRole} account has been set up successfully.`)
      
      // Redirect after a brief delay
      setTimeout(() => {
        handleRoleBasedRedirect(selectedRole)
      }, 2000)
    } catch (err) {
      console.error("Role assignment error:", err)
      setError("Failed to complete setup. Please try again.")
    }
    
    setLoading(false)
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600">Setting up your account...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      {/* Search params handler in Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler onMessage={setMessage} />
      </Suspense>
      
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-600">WordWise</CardTitle>
          <CardDescription>Complete your account setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                Your email has been verified! Now choose your role to complete the setup.
              </AlertDescription>
            </Alert>
          </div>

          <RoleSelector
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            onConfirm={handleCompleteRoleSetup}
            showConfirmButton={true}
          />
          
          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
              <span className="text-gray-600">Setting up your account...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 