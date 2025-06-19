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
const ROLE_FETCH_TIMEOUT = 8000 // 8 seconds
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
      
      // Add timeout for session check with better error handling
      console.log('🔍 useUserRole: Getting session...')
      let session = null
      
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 8000)
        )

        const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise]) as any
        session = sessionData?.session
        console.log('✅ useUserRole: Session retrieved:', session?.user?.email || "No user")
      } catch (sessionError) {
        console.warn('⚠️ useUserRole: Session check failed:', sessionError)
        // Try to get session synchronously as fallback
        try {
          const { data: fallbackData } = await supabase.auth.getSession()
          session = fallbackData?.session
          console.log('✅ useUserRole: Fallback session retrieved:', session?.user?.email || "No user")
        } catch (fallbackError) {
          console.error('❌ useUserRole: Fallback session check also failed:', fallbackError)
          setRole(null)
          setIsAuthenticated(false)
          setError('Unable to verify session. Please refresh the page.')
          return
        }
      }

      if (!session?.user) {
        console.log('🚫 useUserRole: No session, setting unauthenticated state')
        setRole(null)
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)
      
      // Get user role with timeout and better error handling
      console.log('🔍 useUserRole: Getting user role...')
      let userRole = null
      
      try {
        const rolePromise = getCurrentUserRole()
        const roleTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Role fetch timeout')), 8000)
        )

        userRole = await Promise.race([rolePromise, roleTimeoutPromise]) as UserRole | null
        console.log('✅ useUserRole: Retrieved role:', userRole)
      } catch (roleError) {
        console.warn('⚠️ useUserRole: Role fetch failed:', roleError)
        // Continue with null role - user is authenticated but role is unknown
        userRole = null
      }
      
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