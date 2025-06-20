'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AddCoachDialog } from './add-coach-dialog'
import { GraduationCap, Mail, Calendar, AlertCircle, Trash2, Plus } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Coach {
  id: string
  email: string
  name: string
  added_at: string
}

export function CoachesList() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCoaches = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('Not authenticated')
        return
      }

      // Get coaches from user metadata
      const coachesData = user.user_metadata?.coaches || []
      setCoaches(coachesData)
      
    } catch (err) {
      console.error('Error loading coaches:', err)
      setError('Failed to load coaches')
    } finally {
      setLoading(false)
    }
  }

  const removeCoach = async (coachId: string) => {
    try {
      const response = await fetch(`/api/student/coaches/${coachId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove coach')
      }

      // Remove from local state
      setCoaches(prev => prev.filter(coach => coach.id !== coachId))
      
    } catch (err) {
      console.error('Error removing coach:', err)
      setError('Failed to remove coach')
    }
  }

  const handleCoachAdded = () => {
    // Reload coaches list
    loadCoaches()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    loadCoaches()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              <span>My Coaches</span>
            </CardTitle>
            <CardDescription>
              Coaches can view your writing progress and provide personalized guidance
            </CardDescription>
          </div>
          <AddCoachDialog onCoachAdded={handleCoachAdded} />
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading coaches...</p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Coaches Yet</h3>
            <p className="text-gray-500 mb-4">
              Add a coach to get personalized writing guidance and feedback.
            </p>
            <AddCoachDialog 
              onCoachAdded={handleCoachAdded}
              triggerButton={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Coach
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {coaches.map((coach) => (
              <div key={coach.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{coach.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>{coach.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Added {formatDate(coach.added_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCoach(coach.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
          </div>
        )}
      </CardContent>
    </Card>
  )
} 