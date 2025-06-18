"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { RoleSelector, CompactRoleSelector } from "./role-selector"
import { getCurrentUserRole } from "@/lib/auth/roles"
import type { UserRole } from "@/lib/types"
import { useRouter } from "next/navigation"

interface AuthStep {
  step: 'auth' | 'role-selection' | 'complete'
}

export function EnhancedAuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [authStep, setAuthStep] = useState<AuthStep['step']>('auth')
  const [currentTab, setCurrentTab] = useState<'signin' | 'signup'>('signin')
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [checkingRole, setCheckingRole] = useState(false)
  const router = useRouter()

  // Check if user already has a role assigned (for existing users)
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setCheckingRole(true)
          const userRole = await getCurrentUserRole()
          
          if (userRole) {
            // User has a role, redirect to appropriate dashboard
            handleRoleBasedRedirect(userRole)
          } else {
            // User exists but no role assigned, show role selection
            setPendingUserId(session.user.id)
            setAuthStep('role-selection')
          }
          setCheckingRole(false)
        }
      } catch (error) {
        console.error("Error checking existing user:", error)
        setCheckingRole(false)
      }
    }

    checkExistingUser()
  }, [])

  const handleRoleBasedRedirect = (role: UserRole) => {
    if (role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const supabase = getSupabaseClient()

      // Get the current site URL for the confirmation redirect
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?step=role-selection`,
          data: {
            // We'll store the selected role temporarily, but won't set it until email is confirmed
            pending_role: selectedRole
          }
        },
      })

      if (error) {
        setError(error.message)
      } else if (data.user && !data.session) {
        // Email confirmation required
        setMessage(`Check your email for the confirmation link! Make sure to check your spam folder. Your ${selectedRole} account will be activated after email verification.`)
        setAuthStep('complete')
      } else if (data.user && data.session) {
        // No email confirmation required (immediate signup)
        setPendingUserId(data.user.id)
        setAuthStep('role-selection')
      }
    } catch (err) {
      setError("Supabase configuration error. Please check your environment variables.")
      console.error("Supabase error:", err)
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Check if user has a role assigned
        const userRole = await getCurrentUserRole()
        
        if (userRole) {
          // User has a role, redirect appropriately
          handleRoleBasedRedirect(userRole)
        } else {
          // User needs role assignment
          setPendingUserId(data.user.id)
          setAuthStep('role-selection')
        }
      }
    } catch (err) {
      setError("Supabase configuration error. Please check your environment variables.")
      console.error("Supabase error:", err)
    }
    setLoading(false)
  }

  const handleCompleteRoleSelection = async () => {
    if (!pendingUserId) {
      setError("No user session found. Please try signing in again.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const supabase = getSupabaseClient()
      
      // Update user metadata with role
      // Note: In production, this should be done via server-side API to update user metadata
      // For now, we'll store the role selection and handle it in the callback
      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      })

      if (error) {
        console.error("Error updating user role:", error)
        setError("Failed to assign role. Please try again or contact support.")
      } else {
        setMessage(`Welcome! Your ${selectedRole} account has been set up successfully.`)
        setAuthStep('complete')
        
        // Redirect after a brief delay
        setTimeout(() => {
          handleRoleBasedRedirect(selectedRole)
        }, 2000)
      }
    } catch (err) {
      console.error("Role assignment error:", err)
      setError("Failed to complete setup. Please try again.")
    }
    
    setLoading(false)
  }

  const handleBackToAuth = () => {
    setAuthStep('auth')
    setError("")
    setMessage("")
    setPendingUserId(null)
  }

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600">Checking your account...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Role Selection Step
  if (authStep === 'role-selection') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToAuth}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl text-emerald-600">WordWise</CardTitle>
            </div>
            <CardDescription>Complete your account setup</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleSelector
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
              onConfirm={handleCompleteRoleSelection}
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
          </CardContent>
        </Card>
      </div>
    )
  }

  // Completion Step
  if (authStep === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-600">WordWise</CardTitle>
            <CardDescription>Setup Complete!</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            
            {message && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            )}
            
            <p className="text-gray-600 mb-4">
              You'll be redirected to your dashboard shortly.
            </p>
            
            <Button 
              onClick={() => handleRoleBasedRedirect(selectedRole)}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Auth Form (Sign In / Sign Up)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-600">WordWise</CardTitle>
          <CardDescription>Write with confidence. Edit with intelligence.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'signin' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                {/* Compact Role Selector for Signup */}
                <CompactRoleSelector
                  selectedRole={selectedRole}
                  onRoleChange={setSelectedRole}
                />
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up as {selectedRole === 'student' ? 'Student' : 'Teacher/Administrator'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
        </CardContent>
      </Card>
    </div>
  )
} 