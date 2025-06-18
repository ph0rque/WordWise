import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserRole, useRoleBasedFeatures } from './use-user-role'
import { getCurrentUserRole } from '@/lib/auth/roles'
import { getSupabaseClient } from '@/lib/supabase/client'

// Mock dependencies
jest.mock('@/lib/auth/roles', () => ({
  getCurrentUserRole: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}))

describe('useUserRole', () => {
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('Authentication State Management', () => {
    it('initializes with loading state', () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      const { result } = renderHook(() => useUserRole())

      expect(result.current.loading).toBe(true)
      expect(result.current.role).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('handles authenticated user with role', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('student')

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('student')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isStudent).toBe(true)
      expect(result.current.isAdmin).toBe(false)
    })

    it('handles admin user', async () => {
      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('admin')

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('admin')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isStudent).toBe(false)
      expect(result.current.isAdmin).toBe(true)
    })

    it('handles unauthenticated user', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isStudent).toBe(false)
      expect(result.current.isAdmin).toBe(false)
    })

    it('defaults to student role when getCurrentUserRole returns null', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue(null)

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('student')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isStudent).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('handles authentication errors gracefully', async () => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Auth error'))

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Auth error')
      expect(result.current.role).toBe('student') // Fallback
    })

    it('handles role fetching errors', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockRejectedValue(new Error('Role fetch error'))

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Role fetch error')
      expect(result.current.role).toBe('student') // Fallback
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('Auth State Changes', () => {
    it('handles sign in event', async () => {
      let authCallback: any

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate sign in
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('admin')

      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.role).toBe('admin')
        expect(result.current.isAuthenticated).toBe(true)
      })
    })

    it('handles sign out event', async () => {
      let authCallback: any

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      // Start with authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('student')

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Simulate sign out
      await act(async () => {
        authCallback('SIGNED_OUT', null)
      })

      expect(result.current.role).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Refresh Functionality', () => {
    it('allows manual refresh of user role', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('student')

      const { result } = renderHook(() => useUserRole())

      await waitFor(() => {
        expect(result.current.role).toBe('student')
      })

      // Change mock to return admin
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('admin')

      await act(async () => {
        await result.current.refreshUserRole()
      })

      expect(result.current.role).toBe('admin')
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isStudent).toBe(false)
    })
  })
})

describe('useRoleBasedFeatures', () => {
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('Student Features', () => {
    it('provides correct features for student role', async () => {
      const mockUser = {
        id: 'student-123',
        email: 'student@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('student')

      const { result } = renderHook(() => useRoleBasedFeatures())

      await waitFor(() => {
        expect(result.current.currentRole).toBe('student')
      })

      // Student-only features
      expect(result.current.canRecordKeystrokes).toBe(true)
      expect(result.current.canUseAITutor).toBe(true)
      expect(result.current.canViewWritingAnalytics).toBe(true)

      // Admin-only features (should be false)
      expect(result.current.canViewAdminDashboard).toBe(false)
      expect(result.current.canManageStudents).toBe(false)
      expect(result.current.canViewKeystrokeRecordings).toBe(false)

      // Shared features
      expect(result.current.canCreateDocuments).toBe(true)
      expect(result.current.canUseGrammarChecker).toBe(true)
      expect(result.current.canSaveWork).toBe(true)

      // UI elements
      expect(result.current.showAdminNavigation).toBe(false)
      expect(result.current.showStudentTools).toBe(true)
      expect(result.current.showKeystrokeNotice).toBe(true)
      expect(result.current.showUpgradePrompts).toBe(false)
    })
  })

  describe('Admin Features', () => {
    it('provides correct features for admin role', async () => {
      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('admin')

      const { result } = renderHook(() => useRoleBasedFeatures())

      await waitFor(() => {
        expect(result.current.currentRole).toBe('admin')
      })

      // Admin-only features
      expect(result.current.canViewAdminDashboard).toBe(true)
      expect(result.current.canManageStudents).toBe(true)
      expect(result.current.canViewKeystrokeRecordings).toBe(true)
      expect(result.current.canAccessAnalytics).toBe(true)
      expect(result.current.canManageSettings).toBe(true)

      // Student-only features (should be false)
      expect(result.current.canRecordKeystrokes).toBe(false)
      expect(result.current.canUseAITutor).toBe(false)
      expect(result.current.canViewWritingAnalytics).toBe(false)

      // Shared features
      expect(result.current.canCreateDocuments).toBe(true)
      expect(result.current.canUseGrammarChecker).toBe(true)
      expect(result.current.canSaveWork).toBe(true)

      // UI elements
      expect(result.current.showAdminNavigation).toBe(true)
      expect(result.current.showStudentTools).toBe(false)
      expect(result.current.showKeystrokeNotice).toBe(false)
      expect(result.current.showUpgradePrompts).toBe(false)
    })
  })

  describe('Unauthenticated User', () => {
    it('provides correct features for unauthenticated user', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      const { result } = renderHook(() => useRoleBasedFeatures())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })

      // All role-specific features should be false
      expect(result.current.canViewAdminDashboard).toBe(false)
      expect(result.current.canManageStudents).toBe(false)
      expect(result.current.canRecordKeystrokes).toBe(false)
      expect(result.current.canUseAITutor).toBe(false)

      // Shared features should be false (requires auth)
      expect(result.current.canCreateDocuments).toBe(false)
      expect(result.current.canUseGrammarChecker).toBe(false)
      expect(result.current.canSaveWork).toBe(false)

      // UI elements
      expect(result.current.showAdminNavigation).toBe(false)
      expect(result.current.showStudentTools).toBe(false)
      expect(result.current.showKeystrokeNotice).toBe(false)
      expect(result.current.showUpgradePrompts).toBe(false)
    })
  })

  describe('User With No Role', () => {
    it('shows upgrade prompts for authenticated user with no role', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue(null)

      const { result } = renderHook(() => useRoleBasedFeatures())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Should show upgrade prompts for authenticated user with no role
      expect(result.current.showUpgradePrompts).toBe(true)
      expect(result.current.hasRole).toBe(true) // Because we default to 'student'
      expect(result.current.currentRole).toBe('student') // Default fallback
    })
  })

  describe('Feature Flag Changes', () => {
    it('updates features when role changes', async () => {
      let authCallback: any

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      // Start with student
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('student')

      const { result } = renderHook(() => useRoleBasedFeatures())

      await waitFor(() => {
        expect(result.current.showStudentTools).toBe(true)
        expect(result.current.showAdminNavigation).toBe(false)
      })

      // Change to admin
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('admin')

      await act(async () => {
        authCallback('TOKEN_REFRESHED', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.showStudentTools).toBe(false)
        expect(result.current.showAdminNavigation).toBe(true)
        expect(result.current.canManageStudents).toBe(true)
      })
    })
  })
})

/*
TEST EXECUTION NOTES:

These tests comprehensively cover the role-based UI hooks:

1. **useUserRole Hook**:
   - Authentication state management
   - Role detection and assignment
   - Error handling and fallbacks
   - Auth state change listeners
   - Manual refresh functionality

2. **useRoleBasedFeatures Hook**:
   - Student-specific features and permissions
   - Admin-specific features and permissions
   - Unauthenticated user restrictions
   - Upgrade prompts for users without roles
   - Dynamic feature flag updates

To run these tests:
```bash
npm test lib/hooks/use-user-role.test.ts
```

The tests use extensive mocking to ensure isolated testing of the hooks
and verify all role-based functionality works correctly.
*/ 