import { useState, useEffect, useRef } from 'react'
import { getCurrentUserWithRoleFromSession, clearRoleCache } from '@/lib/auth/roles'
import { getSupabaseClient, getCachedSupabaseSession } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'

// Extend Window interface to include custom property
declare global {
  interface Window {
    shouldSuppressRefresh?: () => boolean
  }
}

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

// Debounce constants to prevent excessive refreshes on tab switching
const DEBOUNCE_DELAY = 1000 // 1 second debounce
let refreshTimeout: NodeJS.Timeout | null = null

// Add caching to prevent redundant calls
let cachedRoleData: { user: any; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 seconds cache

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
  const maxRetries = 2 // Reduced from 3
  const isRefreshingRef = useRef(false) // Prevent concurrent refreshes

  // Debounced refresh function to prevent excessive calls
  const debouncedRefresh = () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
    }
    
    refreshTimeout = setTimeout(() => {
      if (!isRefreshingRef.current) {
        refreshUserRole()
      }
    }, DEBOUNCE_DELAY)
  }

  const refreshUserRole = async (): Promise<void> => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log('🔄 useUserRole: Refresh already in progress, skipping...')
      return
    }

    isRefreshingRef.current = true
    console.log('🔄 useUserRole: Starting role refresh...')
    setLoading(true)
    setError(null)

    try {
      let result = null

      // Check cache first
      if (cachedRoleData && Date.now() - cachedRoleData.timestamp < CACHE_DURATION) {
        console.log('✅ useUserRole: Using cached role data')
        result = cachedRoleData.user
      } else {
        // Clear expired cache
        cachedRoleData = null

        // Try the optimized direct approach with shorter timeout
        try {
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Query timed out')), 2000) // Reduced from 3000
          )
          
          const dataPromise = getCurrentUserWithRoleFromSession()
          result = await Promise.race([dataPromise, timeoutPromise])

          // Cache successful result
          if (result) {
            cachedRoleData = { user: result, timestamp: Date.now() }
          }
        } catch (directError) {
          console.log('🔄 useUserRole: Direct query failed, trying single API fallback...')
          
          // Single API fallback (removed multiple fallback chains)
          try {
            const response = await fetch('/api/user-role', {
              cache: 'no-cache', // Prevent browser caching for role checks
              headers: {
                'Cache-Control': 'no-cache'
              }
            })
            
            if (response.ok) {
              const apiData = await response.json()
              if (apiData.user && !apiData.error) {
                result = {
                  user: {
                    id: apiData.user.id,
                    email: apiData.user.email,
                    role: apiData.user.role,
                    permissions: ROLE_PERMISSIONS[apiData.user.role as UserRole] || ROLE_PERMISSIONS.student,
                    created_at: apiData.user.created_at,
                    updated_at: apiData.user.updated_at,
                  },
                  session: { user: apiData.user }
                }
                
                // Cache API result
                cachedRoleData = { user: result, timestamp: Date.now() }
              }
            }
          } catch (apiError) {
            console.error('❌ useUserRole: API fallback failed:', apiError)
          }
        }
      }
      
      if (!result) {
        console.log('🚫 useUserRole: No session or role data, setting unauthenticated state')
        setRole(null)
        setIsAuthenticated(false)
        retryCountRef.current = 0
        return
      }

      const { user, session } = result
      console.log('✅ useUserRole: Retrieved session and role:', {
        email: session.user?.email,
        role: user.role
      })

      setIsAuthenticated(true)
      setRole(user.role)
      retryCountRef.current = 0
      
    } catch (err) {
      console.error('❌ useUserRole: Error in refreshUserRole:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user role'
      
      // Simplified retry logic
      retryCountRef.current += 1
      
      if (retryCountRef.current <= maxRetries) {
        console.log(`⏳ useUserRole: Retrying in ${RETRY_DELAY}ms (attempt ${retryCountRef.current}/${maxRetries})`)
        
        setTimeout(() => {
          if (mounted && !isRefreshingRef.current) {
            refreshUserRole()
          }
        }, RETRY_DELAY)
        return
      } else {
        console.error('❌ useUserRole: Max retries exceeded')
        setError(`Authentication failed. Please refresh the page.`)
        setRole(null)
        setIsAuthenticated(false)
      }
    } finally {
      console.log('✅ useUserRole: Role refresh complete')
      setLoading(false)
      isRefreshingRef.current = false
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
      
      if (event === 'SIGNED_IN') {
        // Clear cache on sign in to ensure fresh data
        clearRoleCache()
        cachedRoleData = null
        retryCountRef.current = 0
        await refreshUserRole()
      } else if (event === 'TOKEN_REFRESHED') {
        // For token refresh, only update if we don't have recent cached data
        console.log('🔄 useUserRole: Token refreshed')
        if (!cachedRoleData || Date.now() - cachedRoleData.timestamp > CACHE_DURATION / 2) {
          retryCountRef.current = 0
          debouncedRefresh()
        } else {
          console.log('🔄 useUserRole: Skipping refresh due to recent cache')
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear cache on sign out
        clearRoleCache()
        cachedRoleData = null
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
      // Clear any pending refresh timeouts
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
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