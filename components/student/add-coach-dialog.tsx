'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Loader2, AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react'

interface AddCoachDialogProps {
  onCoachAdded: () => void
  triggerButton?: React.ReactNode
}

export function AddCoachDialog({ onCoachAdded, triggerButton }: AddCoachDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  })
  const [mode, setMode] = useState<'existing' | 'new'>('existing')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/student/coaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mode
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError(`User with email "${formData.email}" not found. They need to sign up to WordWise first, or you can create a new account for them.`)
          return
        }
        throw new Error(data.error || data.message || 'Failed to add coach')
      }

      setSuccess(mode === 'existing' ? 'Coach added successfully!' : 'Coach created and added successfully!')
      setFormData({ email: '', password: '', firstName: '', lastName: '' })
      onCoachAdded()
      
      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false)
        setSuccess('')
      }, 2000)

    } catch (error) {
      console.error('Error adding coach:', error)
      setError(error instanceof Error ? error.message : 'Failed to add coach')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const generatePassword = () => {
    // Generate a simple password (in production, consider more secure generation)
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
    setFormData(prev => ({ ...prev, password }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Coach</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <span>Add Coach</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Mode Toggle */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="mode"
                  value="existing"
                  checked={mode === 'existing'}
                  onChange={(e) => setMode(e.target.value as 'existing' | 'new')}
                  className="text-emerald-600"
                />
                <span className="text-sm">Existing User</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="mode"
                  value="new"
                  checked={mode === 'new'}
                  onChange={(e) => setMode(e.target.value as 'existing' | 'new')}
                  className="text-emerald-600"
                />
                <span className="text-sm">Create New Account</span>
              </label>
            </div>
          </div>

          {mode === 'existing' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                This will add an existing WordWise user as your coach. They must already have an account or have admin privileges.
              </p>
            </div>
          )}

          {mode === 'new' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  This will create a new coach account with admin privileges to help guide your writing.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Coach Email Address *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="coach@school.edu"
            />
            <p className="text-xs text-gray-500">
              Your coach will be able to view your writing progress and provide guidance.
            </p>
          </div>

          {mode === 'new' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  className="text-xs"
                >
                  Generate
                </Button>
              </div>
              <Input
                id="password"
                type="text"
                required={mode === 'new'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
              />
              <p className="text-xs text-gray-500">
                Share this password with your coach. They can change it after first login.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.email || (mode === 'new' && !formData.password)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {mode === 'existing' ? 'Adding Coach...' : 'Creating Coach...'}
                </>
              ) : (
                mode === 'existing' ? 'Add Coach' : 'Create Coach'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 