"use client"

import { useState, useEffect } from "react"
import { useRoleBasedFeatures } from "@/lib/hooks/use-user-role"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  LogOut, 
  Settings, 
  GraduationCap, 
  BarChart3, 
  Users,
  FileText
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

interface RoleBasedHeaderProps {
  userEmail?: string
  onSignOut?: () => void
}

export function RoleBasedHeader({ userEmail, onSignOut }: RoleBasedHeaderProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const roleFeatures = useRoleBasedFeatures()
  const {
    showAdminNavigation,
    showStudentTools,
    canViewAdminDashboard,
    canManageStudents,
    canAccessAnalytics,
    currentRole,
    isAuthenticated,
  } = mounted ? roleFeatures : {
    showAdminNavigation: false,
    showStudentTools: false,
    canViewAdminDashboard: false,
    canManageStudents: false,
    canAccessAnalytics: false,
    currentRole: null,
    isAuthenticated: false,
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      if (onSignOut) {
        onSignOut()
      }
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleAdminDashboard = () => {
    router.push('/admin')
  }

  const handleSettings = () => {
    // Navigate to settings page (to be implemented)
    console.log('Navigate to settings')
  }

  if (!mounted || !isAuthenticated || !userEmail) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">WordWise</h1>
          <p className="text-sm text-gray-600">
            {currentRole === 'admin' ? 'Admin Dashboard' : 'Academic Writing Assistant'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center space-x-4">
        {showAdminNavigation && (
          <>
            {canViewAdminDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminDashboard}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            )}
            
            {canManageStudents && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Students</span>
              </Button>
            )}
          </>
        )}

        {showStudentTools && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Editor</span>
            </Button>
          </div>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{userEmail}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b">
              <div className="font-medium text-sm">{userEmail}</div>
              <div className="text-xs text-gray-500 capitalize">
                {currentRole || 'No role assigned'}
              </div>
            </div>
            
            {showAdminNavigation && (
              <>
                <DropdownMenuItem onClick={handleAdminDashboard}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Role-based notification component
export function RoleBasedNotifications() {
  const [mounted, setMounted] = useState(false)
  
  const roleFeatures = useRoleBasedFeatures()
  const { 
    showKeystrokeNotice, 
    showUpgradePrompts, 
    currentRole, 
    isAuthenticated 
  } = mounted ? roleFeatures : {
    showKeystrokeNotice: false,
    showUpgradePrompts: false,
    currentRole: null,
    isAuthenticated: false,
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isAuthenticated) return null

  return (
    <div className="space-y-2">
      {showKeystrokeNotice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Keystroke Recording Active
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Your typing activity is being recorded to help improve your writing skills. 
                This data is securely stored and only accessible to your teachers.
              </p>
            </div>
          </div>
        </div>
      )}

      {showUpgradePrompts && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">
                Complete Your Profile
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                You haven't selected a role yet. Please contact your administrator 
                or choose a role to access all features.
              </p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.href = '/auth/role-setup'}
              >
                Complete Setup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 