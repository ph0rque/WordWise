"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, GraduationCap } from 'lucide-react'
import type { UserRole } from '@/lib/types'

function SearchParamsHandler({ onRole }: { onRole: (role: string | null) => void }) {
  const searchParams = useSearchParams()
  const role = searchParams.get('role')
  
  useEffect(() => {
    onRole(role)
  }, [role, onRole])
  
  return null
}

export default function AssignRolePage() {
  const router = useRouter()
  const [pendingRole, setPendingRole] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!pendingRole || !['student', 'admin'].includes(pendingRole)) {
      setError('Invalid role specified')
      setLoading(false)
      return
    }

    // Auto-assign the role when the page loads
    assignRole()
  }, [pendingRole])

  const assignRole = async () => {
    try {
      setAssigning(true)
      setError('')

      const supabase = getSupabaseClient()
      
      // Get current user and session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('No active session. Please sign in again.')
        setLoading(false)
        return
      }

      console.log('Assigning role:', pendingRole, 'to user:', session.user.id)

      // Call our API to assign the role
      const response = await fetch('/api/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          role: pendingRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign role')
      }

      console.log('Role assigned successfully:', result)
      setSuccess(true)
      
      // Wait a moment then redirect
      setTimeout(() => {
        if (pendingRole === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      }, 2000)

    } catch (err) {
      console.error('Error assigning role:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setLoading(false)
      setAssigning(false)
    }
  }

  const handleRetry = () => {
    assignRole()
  }

  const handleManualRedirect = () => {
    if (pendingRole === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  if (loading || assigning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Suspense fallback={null}>
          <SearchParamsHandler onRole={setPendingRole} />
        </Suspense>
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Setting up your account...
            </h2>
            <p className="text-gray-600 text-center">
              Assigning your {pendingRole} role. This will only take a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Suspense fallback={null}>
          <SearchParamsHandler onRole={setPendingRole} />
        </Suspense>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-600">WordWise</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to WordWise!
            </h2>
            <p className="text-gray-600 mb-4">
              Your {pendingRole} account has been set up successfully.
              You'll be redirected to your dashboard shortly.
            </p>
            <Button onClick={handleManualRedirect} className="w-full">
              Continue to {pendingRole === 'admin' ? 'Admin Dashboard' : 'Editor'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Suspense fallback={null}>
          <SearchParamsHandler onRole={setPendingRole} />
        </Suspense>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-600">WordWise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Setup Error
              </h2>
            </div>
            
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/auth/role-setup')}
                className="w-full"
              >
                Manual Role Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
} 