"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, GraduationCap } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { RoleSelector } from "@/components/auth/role-selector"
import {
  getCurrentUserRole,
  updateUserRole,
  completeOnboarding,
} from "@/lib/auth/roles"
import type { UserRole } from "@/lib/types"
import { OnboardingConsent } from "@/components/auth/onboarding-consent"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  email: string
}

function SearchParamsHandler({ 
  onMessage,
  onPendingRole, 
  onAutoAssign 
}: { 
  onMessage: (message: string | null) => void
  onPendingRole: (role: string | null) => void
  onAutoAssign: (autoAssign: boolean) => void
}) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const message = searchParams.get('message')
    const pendingRole = searchParams.get('pending_role')
    const autoAssign = searchParams.get('auto_assign') === 'true'
    
    onMessage(message)
    onPendingRole(pendingRole)
    onAutoAssign(autoAssign)
  }, [searchParams, onMessage, onPendingRole, onAutoAssign])
  
  return null
}

export default function RoleSetupPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [isConsented, setIsConsented] = useState(false)
  const [autoAssign, setAutoAssign] = useState(false)
  const [pendingRole, setPendingRole] = useState<string | null>(null)
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

        // Check if there's a pending role from user metadata or URL params
        const userPendingRole = session.user.user_metadata?.pending_role
        if (userPendingRole) {
          setSelectedRole(userPendingRole)
        }
        
        // If there's a pending role from URL params, use that instead
        if (pendingRole) {
          setSelectedRole(pendingRole as UserRole)
        }

        setInitializing(false)
        
        // If auto-assign is true and we have a pending role, automatically complete setup
        if (autoAssign && (pendingRole || userPendingRole)) {
          const roleToAssign = (pendingRole || userPendingRole) as UserRole
          // Auto-consent for students in streamlined flow
          if (roleToAssign === 'student') {
            setIsConsented(true)
          }
          // Don't auto-complete if we need names - let user fill them out
        }
      } catch (error) {
        console.error("Error initializing role setup:", error)
        setError("Failed to initialize role setup. Please try again.")
        setInitializing(false)
      }
    }

    initializeRoleSetup()
  }, [router, pendingRole, autoAssign])

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

    if (loading) return
    if (!firstName || !lastName) {
      setError("Please enter your first and last name.")
      return
    }
    if (selectedRole === "student" && !isConsented) return

    setLoading(true)
    setError("")

    try {
      // Use the new completeOnboarding function
      const { error: onboardingError } = await completeOnboarding(
        selectedRole,
        selectedRole === "student" ? isConsented : false,
        { firstName, lastName }
      )

      if (onboardingError) {
        throw onboardingError
      }
      
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
          <SearchParamsHandler 
            onMessage={setMessage}
            onPendingRole={setPendingRole}
            onAutoAssign={setAutoAssign}
          />
        </Suspense>
      
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-600">WordWise</CardTitle>
          <CardDescription>
            {autoAssign && pendingRole === 'student' 
              ? "Almost there! Just add your name to complete your student account setup."
              : "Complete your account setup"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            {!(autoAssign && pendingRole) && (
              <RoleSelector
                selectedRole={selectedRole}
                onRoleChange={setSelectedRole}
                onConfirm={handleCompleteRoleSetup}
                showConfirmButton={false}
              />
            )}
            
            {autoAssign && pendingRole && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-emerald-900">
                      {pendingRole === 'student' ? 'Student Account' : 'Administrator Account'}
                    </h4>
                    <p className="text-sm text-emerald-700">
                      You've already selected your role. Just add your name below to get started!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedRole === "student" && (
              <OnboardingConsent
                isConsented={isConsented}
                onConsentChange={setIsConsented}
              />
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleCompleteRoleSetup}
                disabled={loading || (selectedRole === "student" && !isConsented) || !firstName || !lastName}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Complete Setup
              </Button>
            </div>
            
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 