import { useState, useEffect, useRef } from 'react'
import { getCurrentUserRole } from '@/lib/auth/roles'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

export interface UseUserRoleState {
  role: UserRole | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  isStudent: boolean
  isAuthenticated: boolean
  refreshUserRole: () => Promise<void>
}

// Timeout constants
const RETRY_DELAY = 2000 // 2 seconds

/**
 * Custom hook for managing user role state and providing role-based UI utilities
 */
export function useUserRole(): UseUserRoleState {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  const refreshUserRole = async () => {
    try {
      console.log('🔄 useUserRole: Starting role refresh...')
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      
      // Simple session check without timeout
      console.log('🔍 useUserRole: Getting session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ useUserRole: Session error:', sessionError)
        setRole(null)
        setIsAuthenticated(false)
        setError('Session error: ' + sessionError.message)
        return
      }

      console.log('✅ useUserRole: Session retrieved:', session?.user?.email || "No user")

      if (!session?.user) {
        console.log('🚫 useUserRole: No session, setting unauthenticated state')
        setRole(null)
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)
      
      // Get user role without timeout
      console.log('🔍 useUserRole: Getting user role...')
      const userRole = await getCurrentUserRole()
      console.log('✅ useUserRole: Retrieved role:', userRole)
      setRole(userRole)
      
    } catch (err) {
      console.error('❌ useUserRole: Error in refreshUserRole:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user role'
      setError(errorMessage)
      setRole(null)
      setIsAuthenticated(false)
    } finally {
      console.log('✅ useUserRole: Role refresh complete')
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    refreshUserRole()

    // Listen for auth state changes
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshUserRole()
      } else if (event === 'SIGNED_OUT') {
        setRole(null)
        setIsAuthenticated(false)
        setError(null)
        setLoading(false)
      }
    })

    // Cleanup function
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    role: mounted ? role : null,
    loading: mounted ? loading : true,
    error: mounted ? error : null,
    isAdmin: mounted ? role === 'admin' : false,
    isStudent: mounted ? role === 'student' : false,
    isAuthenticated: mounted ? isAuthenticated : false,
    refreshUserRole,
  }
}

/**
 * Hook for role-based feature flags
 */
export function useRoleBasedFeatures() {
  const { role, isAdmin, isStudent, isAuthenticated, loading, error } = useUserRole()
  
  // Return safe defaults while loading to prevent hydration issues
  if (loading) {
    return {
      canViewAdminDashboard: false,
      canManageStudents: false,
      canViewKeystrokeRecordings: false,
      canAccessAnalytics: false,
      canManageSettings: false,
      canRecordKeystrokes: false,
      canUseAITutor: false,
      canViewWritingAnalytics: false,
      canCreateDocuments: false,
      canUseGrammarChecker: false,
      canSaveWork: false,
      showAdminNavigation: false,
      showStudentTools: false,
      showKeystrokeNotice: false,
      showUpgradePrompts: false,
      currentRole: null,
      hasRole: false,
      isAuthenticated: false,
      loading: true,
      error: null,
    }
  }

  // If there's an error but user is authenticated, provide basic functionality
  if (error && isAuthenticated) {
    console.warn('Role features degraded due to error:', error)
    return {
      canViewAdminDashboard: false,
      canManageStudents: false,
      canViewKeystrokeRecordings: false,
      canAccessAnalytics: false,
      canManageSettings: false,
      canRecordKeystrokes: false,
      canUseAITutor: false,
      canViewWritingAnalytics: false,
      canCreateDocuments: true, // Allow basic functionality
      canUseGrammarChecker: true, // Allow basic functionality
      canSaveWork: true, // Allow basic functionality
      showAdminNavigation: false,
      showStudentTools: false,
      showKeystrokeNotice: false,
      showUpgradePrompts: false, // Don't show upgrade prompts if there's an error
      currentRole: role,
      hasRole: !!role,
      isAuthenticated,
      loading: false,
      error,
    }
  }

  // If there's an error and user is not authenticated, provide minimal functionality
  if (error && !isAuthenticated) {
    console.warn('Authentication failed due to error:', error)
    return {
      canViewAdminDashboard: false,
      canManageStudents: false,
      canViewKeystrokeRecordings: false,
      canAccessAnalytics: false,
      canManageSettings: false,
      canRecordKeystrokes: false,
      canUseAITutor: false,
      canViewWritingAnalytics: false,
      canCreateDocuments: false,
      canUseGrammarChecker: false,
      canSaveWork: false,
      showAdminNavigation: false,
      showStudentTools: false,
      showKeystrokeNotice: false,
      showUpgradePrompts: false,
      currentRole: null,
      hasRole: false,
      isAuthenticated: false,
      loading: false,
      error,
    }
  }
  
  return {
    // Admin-only features
    canViewAdminDashboard: isAdmin,
    canManageStudents: isAdmin,
    canViewKeystrokeRecordings: isAdmin,
    canAccessAnalytics: isAdmin,
    canManageSettings: isAdmin,
    
    // Student-only features
    canRecordKeystrokes: isStudent,
    canUseAITutor: isStudent,
    canViewWritingAnalytics: isStudent,
    
    // Shared features
    canCreateDocuments: isAuthenticated && (isAdmin || isStudent),
    canUseGrammarChecker: isAuthenticated && (isAdmin || isStudent),
    canSaveWork: isAuthenticated && (isAdmin || isStudent),
    
    // Role-specific UI elements
    showAdminNavigation: isAdmin,
    showStudentTools: isStudent,
    showKeystrokeNotice: isStudent,
    showUpgradePrompts: isAuthenticated && !isAdmin && !isStudent, // For users with no role
    
    // Current role info
    currentRole: role,
    hasRole: !!role,
    isAuthenticated,
    loading: false,
    error,
  }
} 