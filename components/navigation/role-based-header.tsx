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
  FileText,
  PanelRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { User as SupabaseUser } from "@supabase/supabase-js"

interface RoleBasedHeaderProps {
  user?: SupabaseUser | null;
  onSignOut?: () => void;
  onToggleSidebar?: () => void;
}

export function RoleBasedHeader({ user, onSignOut, onToggleSidebar }: RoleBasedHeaderProps) {
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

  const displayName = user?.user_metadata?.display_name
  const greetingName = displayName || (currentRole === 'student' ? 'Student' : currentRole === 'admin' ? 'Admin' : 'User')

  if (!mounted || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="contents">
      <div className="flex flex-1 items-center gap-4">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">WordWise AI</h1>
          <p className="text-xs text-gray-500">
            Write with confidence. Edit with intelligence.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b">
              <div className="font-medium text-sm">{user.email}</div>
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
        <span className="hidden sm:inline-block text-sm text-gray-600 pr-4">
          Hi, {greetingName}
        </span>
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <PanelRight className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
      </div>
    </div>
  )
}

// Role-based notification component
export function RoleBasedNotifications() {
  const [mounted, setMounted] = useState(false)
  
  const roleFeatures = useRoleBasedFeatures()
  const { 
    showUpgradePrompts, 
    currentRole, 
    isAuthenticated 
  } = mounted ? roleFeatures : {
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