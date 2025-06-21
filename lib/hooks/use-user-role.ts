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
const SESSION_TIMEOUT = 8000 // 8 seconds max for session operations
const ROLE_TIMEOUT = 12000 // 12 seconds max for role operations (includes DB query)
const RETRY_DELAY = 3000 // 3 seconds between retries

// Helper function to create promises with timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

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
      console.log('🔄 useUserRole: Starting role refresh...')
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      
      // Get session with timeout
      console.log('🔍 useUserRole: Getting session with timeout...')
      const sessionPromise = supabase.auth.getSession()
      const { data: { session }, error: sessionError } = await withTimeout(
        sessionPromise, 
        SESSION_TIMEOUT, 
        'Session retrieval'
      )
      
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
        retryCountRef.current = 0 // Reset retry count on successful operation
        return
      }

      setIsAuthenticated(true)
      
      // Get user role with timeout
      console.log('🔍 useUserRole: Getting user role with timeout...')
      const rolePromise = getCurrentUserRole()
      const userRole = await withTimeout(
        rolePromise,
        ROLE_TIMEOUT,
        'Role retrieval'
      )
      
      console.log('✅ useUserRole: Retrieved role:', userRole)
      setRole(userRole)
      retryCountRef.current = 0 // Reset retry count on success
      
    } catch (err) {
      console.error('❌ useUserRole: Error in refreshUserRole:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user role'
      
      // Handle timeout errors specifically
      if (errorMessage.includes('timed out')) {
        retryCountRef.current += 1
        
        if (retryCountRef.current <= maxRetries) {
          console.log(`⏳ useUserRole: Timeout occurred, retrying in ${RETRY_DELAY}ms (attempt ${retryCountRef.current}/${maxRetries})`)
          
          // Set a temporary loading state and retry after delay
          setTimeout(() => {
            if (mounted) {
              refreshUserRole()
            }
          }, RETRY_DELAY)
          return
        } else {
          console.error('❌ useUserRole: Max retries exceeded, falling back to unauthenticated state')
          setError(`Connection timeout after ${maxRetries} attempts. Please refresh the page.`)
          setRole(null)
          setIsAuthenticated(false)
        }
      } else {
        setError(errorMessage)
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