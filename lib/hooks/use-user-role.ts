import { useState, useEffect, useRef } from 'react'
import { getCurrentUserWithRoleFromSession } from '@/lib/auth/roles'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'

export interface UseUserRoleState {
  role: UserRole | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  isStudent: boolean
  isAuthenticated: boolean
  refreshUserRole: () => Promise<void>
}

// Retry constants
const RETRY_DELAY = 3000 // 3 seconds between retries

/**
 * Custom hook for managing user role state and providing role-based UI utilities
 */
export function useUserRole(): UseUserRoleState {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const refreshUserRole = async () => {
    try {
      console.log('🔄 useUserRole: Starting optimized role refresh...')
      setLoading(true)
      setError(null)

      // Get session + user + role with API fallback
      console.log('🔍 useUserRole: Getting session and role data...')
      
      let result = null
      
      try {
        // Try the direct approach first (with timeout)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Direct query timed out')), 3000)
        )
        
        const dataPromise = getCurrentUserWithRoleFromSession()
        result = await Promise.race([dataPromise, timeoutPromise])
      } catch (directError) {
        console.log('🔄 useUserRole: Direct query failed, trying API fallback...')
        
        // Fallback to API route
        try {
          const response = await fetch('/api/user-role')
          if (response.ok) {
            const apiData = await response.json()
            if (apiData.user && !apiData.error) {
              // Convert API response to expected format
              result = {
                user: {
                  id: apiData.user.id,
                  email: apiData.user.email,
                  role: apiData.user.role,
                                     permissions: ROLE_PERMISSIONS[apiData.user.role as UserRole] || ROLE_PERMISSIONS.student,
                  created_at: apiData.user.created_at,
                  updated_at: apiData.user.updated_at,
                },
                session: { user: apiData.user } // Mock session for compatibility
              }
            }
          }
        } catch (apiError) {
          console.error('❌ useUserRole: API fallback also failed:', apiError)
        }
      }
      
      if (!result) {
        console.log('🚫 useUserRole: No session or role data, setting unauthenticated state')
        setRole(null)
        setIsAuthenticated(false)
        retryCountRef.current = 0 // Reset retry count on successful operation
        return
      }

      const { user, session } = result
      console.log('✅ useUserRole: Retrieved session and role:', {
        email: session.user?.email,
        role: user.role
      })

      setIsAuthenticated(true)
      setRole(user.role)
      retryCountRef.current = 0 // Reset retry count on success
      
    } catch (err) {
      console.error('❌ useUserRole: Error in refreshUserRole:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user role'
      
      // Handle errors with retry logic
      retryCountRef.current += 1
      
      if (retryCountRef.current <= maxRetries) {
        console.log(`⏳ useUserRole: Error occurred, retrying in ${RETRY_DELAY}ms (attempt ${retryCountRef.current}/${maxRetries})`)
        
        // Set a temporary loading state and retry after delay
        setTimeout(() => {
          if (mounted) {
            refreshUserRole()
          }
        }, RETRY_DELAY)
        return
      } else {
        console.error('❌ useUserRole: Max retries exceeded, falling back to unauthenticated state')
        setError(`Failed to authenticate after ${maxRetries} attempts. Please refresh the page.`)
        setRole(null)
        setIsAuthenticated(false)
      }
    } finally {
      console.log('✅ useUserRole: Role refresh complete')
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // Add a small delay to prevent SSR issues
    const initTimeout = setTimeout(() => {
      refreshUserRole()
    }, 100)

    // Listen for auth state changes
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 useUserRole: Auth state changed:', event)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reset retry count on successful auth events
        retryCountRef.current = 0
        await refreshUserRole()
      } else if (event === 'SIGNED_OUT') {
        setRole(null)
        setIsAuthenticated(false)
        setError(null)
        setLoading(false)
        retryCountRef.current = 0
      }
    })

    // Cleanup function
    return () => {
      clearTimeout(initTimeout)
      subscription.unsubscribe()
      setMounted(false)
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