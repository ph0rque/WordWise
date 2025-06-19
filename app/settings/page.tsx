"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Trash2, AlertTriangle, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getCurrentUserRole } from "@/lib/auth/roles"
import { RoleBasedHeader } from "@/components/navigation/role-based-header"

const GRADE_OPTIONS = [
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
]

const HUMANITIES_OPTIONS = [
  { value: "english", label: "English" },
  { value: "literature", label: "Literature" },
  { value: "composition", label: "Composition" },
  { value: "history", label: "History" },
  { value: "social-studies", label: "Social Studies" },
  { value: "world-history", label: "World History" },
  { value: "us-history", label: "US History" },
  { value: "government", label: "Government" },
  { value: "civics", label: "Civics" },
  { value: "creative-writing", label: "Creative Writing" },
  { value: "other", label: "Other Humanities" },
]

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  
  // Form fields
  const [displayName, setDisplayName] = useState("")
  const [grade, setGrade] = useState("")
  const [humanitiesClasses, setHumanitiesClasses] = useState<string[]>([])
  
  const router = useRouter()

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/auth')
          return
        }

        // Check if user is a student
        const userRole = await getCurrentUserRole()
        if (userRole !== 'student') {
          router.push('/')
          return
        }

        setUser(session.user)
        
        // Load user settings
        const metadata = session.user.user_metadata || {}
        setDisplayName(metadata.display_name || "")
        setGrade(metadata.grade || "")
        setHumanitiesClasses(metadata.humanities_classes || [])
        
        setLoading(false)
      } catch (error) {
        console.error("Error initializing settings:", error)
        setError("Failed to load settings. Please try again.")
        setLoading(false)
      }
    }

    initializeSettings()
  }, [router])

  const handleSaveSettings = async () => {
    if (!user) return
    
    if (!displayName.trim()) {
      setError("Display name is required.")
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = getSupabaseClient()
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          grade: grade,
          humanities_classes: humanitiesClasses,
        }
      })

      if (updateError) {
        throw updateError
      }

      setMessage("Settings saved successfully!")
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error("Error saving settings:", err)
      setError("Failed to save settings. Please try again.")
    }
    
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== "DELETE") {
      setError("Please type DELETE to confirm account deletion.")
      return
    }

    setDeleting(true)
    setError(null)

    try {
      // Get the current session to include in the request
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          confirmation: deleteConfirmation
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Account deletion successful - sign out locally and redirect to home page
      const clientSupabase = getSupabaseClient()
      await clientSupabase.auth.signOut()
      
      // Clear any local storage or session data
      localStorage.clear()
      sessionStorage.clear()
      
      // Redirect to home page
      router.push('/')
    } catch (err) {
      console.error("Error deleting account:", err)
      setError(err instanceof Error ? err.message : "Failed to delete account. Please contact support.")
      setDeleting(false)
    }
  }

  const handleSignOut = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-gray-600">Loading settings...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <RoleBasedHeader user={user} onSignOut={handleSignOut} />
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and information</p>
          </div>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your display name and academic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">This is how your name will appear in the app</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Your current grade level helps us provide appropriate content</p>
              </div>

              <div className="space-y-2">
                <Label>Humanities Classes</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-md bg-gray-50">
                  {HUMANITIES_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={humanitiesClasses.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setHumanitiesClasses([...humanitiesClasses, option.value])
                          } else {
                            setHumanitiesClasses(humanitiesClasses.filter(cls => cls !== option.value))
                          }
                        }}
                      />
                      <Label
                        htmlFor={option.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Optional: Select all humanities classes you're currently taking</p>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                <p className="text-sm text-red-700 mb-4">
                  This will permanently delete your account and all associated documents. 
                  This action cannot be undone.
                </p>
                
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Account
                      </DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account 
                        and remove all your documents and data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <strong>This will delete:</strong>
                        </p>
                        <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                          <li>Your user account</li>
                          <li>All your documents</li>
                          <li>All your writing history</li>
                          <li>All your preferences and settings</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation">
                          Type <strong>DELETE</strong> to confirm
                        </Label>
                        <Input
                          id="delete-confirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteDialogOpen(false)
                          setDeleteConfirmation("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteConfirmation !== "DELETE"}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {message && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
} 