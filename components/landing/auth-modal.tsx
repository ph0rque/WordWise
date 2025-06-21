"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { CompactRoleSelector } from "@/components/auth/role-selector"
import { OnboardingConsent } from "@/components/auth/onboarding-consent"
import type { UserRole } from "@/lib/types"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [currentTab, setCurrentTab] = useState<'signin' | 'signup'>('signin')
  const [consentSettings, setConsentSettings] = useState<any>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check consent for students
    if (selectedRole === 'student' && !consentSettings) {
      setError("Please review and accept the keystroke recording consent to continue.")
      return
    }
    
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
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: {
            role: selectedRole,
            display_name: displayName,
            has_consented_to_keystrokes: selectedRole === 'student' ? !!consentSettings : false
          }
        },
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        setMessage(`Welcome! Check your email for the confirmation link to activate your ${selectedRole} account.`)
        // Don't close modal immediately, let user see the message
        setTimeout(() => {
          onClose()
        }, 3000)
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
        setMessage("Welcome back! Redirecting...")
        // Close modal and let the app handle redirect
        setTimeout(() => {
          onClose()
          window.location.reload() // Refresh to trigger auth state change
        }, 1000)
      }
    } catch (err) {
      setError("Supabase configuration error. Please check your environment variables.")
      console.error("Supabase error:", err)
    }
    setLoading(false)
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setEmail("")
      setPassword("")
      setDisplayName("")
      setError("")
      setMessage("")
      setLoading(false)
      setCurrentTab('signin')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>WordWise Authentication</DialogTitle>
        </DialogHeader>
        <Card className="border-none shadow-none">
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
                      type="text"
                      placeholder="Display Name (e.g., John Smith)"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
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
                  
                  {/* Keystroke Consent for Students */}
                  {selectedRole === "student" && (
                    <OnboardingConsent
                      isConsented={!!consentSettings}
                      onConsentChange={setConsentSettings}
                    />
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || (selectedRole === 'student' && !consentSettings)}
                  >
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
      </DialogContent>
    </Dialog>
  )
} 