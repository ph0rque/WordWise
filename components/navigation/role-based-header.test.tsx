import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { RoleBasedHeader, RoleBasedNotifications } from './role-based-header'
import { useRoleBasedFeatures } from '@/lib/hooks/use-user-role'
import { getSupabaseClient } from '@/lib/supabase/client'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/hooks/use-user-role', () => ({
  useRoleBasedFeatures: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  GraduationCap: () => <div data-testid="graduation-cap-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
}))

describe('RoleBasedHeader', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  const mockSupabaseClient = {
    auth: {
      signOut: jest.fn(),
    },
  }

  const mockOnSignOut = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('Student User', () => {
    beforeEach(() => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showAdminNavigation: false,
        showStudentTools: true,
        canViewAdminDashboard: false,
        canManageStudents: false,
        canAccessAnalytics: false,
        currentRole: 'student',
        isAuthenticated: true,
      })
    })

    it('renders student interface correctly', () => {
      render(
        <RoleBasedHeader 
          userEmail="student@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      expect(screen.getByText('WordWise')).toBeInTheDocument()
      expect(screen.getByText('Academic Writing Assistant')).toBeInTheDocument()
      expect(screen.getByText('student@example.com')).toBeInTheDocument()
      expect(screen.getByText('Editor')).toBeInTheDocument()
    })

    it('shows student tools in navigation', () => {
      render(
        <RoleBasedHeader 
          userEmail="student@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      const editorButton = screen.getByText('Editor')
      expect(editorButton).toBeInTheDocument()
      
      fireEvent.click(editorButton)
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })

    it('does not show admin navigation', () => {
      render(
        <RoleBasedHeader 
          userEmail="student@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.queryByText('Students')).not.toBeInTheDocument()
    })

    it('shows correct role in user menu', () => {
      render(
        <RoleBasedHeader 
          userEmail="student@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      // Click user menu to open dropdown
      const userMenuButton = screen.getByRole('button', { name: /student@example.com/i })
      fireEvent.click(userMenuButton)

      expect(screen.getByText('student')).toBeInTheDocument()
    })
  })

  describe('Admin User', () => {
    beforeEach(() => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showAdminNavigation: true,
        showStudentTools: false,
        canViewAdminDashboard: true,
        canManageStudents: true,
        canAccessAnalytics: true,
        currentRole: 'admin',
        isAuthenticated: true,
      })
    })

    it('renders admin interface correctly', () => {
      render(
        <RoleBasedHeader 
          userEmail="admin@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      expect(screen.getByText('WordWise')).toBeInTheDocument()
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    })

    it('shows admin navigation buttons', () => {
      render(
        <RoleBasedHeader 
          userEmail="admin@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Students')).toBeInTheDocument()
    })

    it('handles dashboard navigation', () => {
      render(
        <RoleBasedHeader 
          userEmail="admin@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      const dashboardButton = screen.getByText('Dashboard')
      fireEvent.click(dashboardButton)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })

    it('handles students navigation', () => {
      render(
        <RoleBasedHeader 
          userEmail="admin@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      const studentsButton = screen.getByText('Students')
      fireEvent.click(studentsButton)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })

    it('shows admin options in user menu', () => {
      render(
        <RoleBasedHeader 
          userEmail="admin@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      // Click user menu to open dropdown
      const userMenuButton = screen.getByRole('button', { name: /admin@example.com/i })
      fireEvent.click(userMenuButton)

      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getAllByText('Admin Dashboard')).toHaveLength(2) // In dropdown and header
      expect(screen.getAllByText('Manage Students')).toHaveLength(1)
    })

    it('does not show student tools', () => {
      render(
        <RoleBasedHeader 
          userEmail="admin@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      expect(screen.queryByText('Editor')).not.toBeInTheDocument()
    })
  })

  describe('User Menu Interactions', () => {
    beforeEach(() => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showAdminNavigation: false,
        showStudentTools: true,
        canViewAdminDashboard: false,
        canManageStudents: false,
        canAccessAnalytics: false,
        currentRole: 'student',
        isAuthenticated: true,
      })
    })

    it('handles settings navigation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      render(
        <RoleBasedHeader 
          userEmail="student@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /student@example.com/i })
      fireEvent.click(userMenuButton)

      // Click settings
      const settingsItem = screen.getByText('Settings')
      fireEvent.click(settingsItem)

      expect(consoleSpy).toHaveBeenCalledWith('Navigate to settings')
      consoleSpy.mockRestore()
    })

    it('handles sign out correctly', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({})
      
      render(
        <RoleBasedHeader 
          userEmail="student@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /student@example.com/i })
      fireEvent.click(userMenuButton)

      // Click sign out
      const signOutItem = screen.getByText('Sign Out')
      fireEvent.click(signOutItem)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
        expect(mockOnSignOut).toHaveBeenCalled()
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('handles sign out errors gracefully', async () => {
      mockSupabaseClient.auth.signOut.mockRejectedValue(new Error('Sign out failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(
        <RoleBasedHeader 
          userEmail="student@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /student@example.com/i })
      fireEvent.click(userMenuButton)

      // Click sign out
      const signOutItem = screen.getByText('Sign Out')
      fireEvent.click(signOutItem)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Unauthenticated State', () => {
    it('renders nothing when not authenticated', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showAdminNavigation: false,
        showStudentTools: false,
        canViewAdminDashboard: false,
        canManageStudents: false,
        canAccessAnalytics: false,
        currentRole: null,
        isAuthenticated: false,
      })

      const { container } = render(
        <RoleBasedHeader 
          userEmail="test@example.com" 
          onSignOut={mockOnSignOut}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when no email provided', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showAdminNavigation: false,
        showStudentTools: true,
        canViewAdminDashboard: false,
        canManageStudents: false,
        canAccessAnalytics: false,
        currentRole: 'student',
        isAuthenticated: true,
      })

      const { container } = render(
        <RoleBasedHeader onSignOut={mockOnSignOut} />
      )

      expect(container.firstChild).toBeNull()
    })
  })
})

describe('RoleBasedNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Student Notifications', () => {
    it('shows keystroke recording notice for students', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showKeystrokeNotice: true,
        showUpgradePrompts: false,
        currentRole: 'student',
        isAuthenticated: true,
      })

      render(<RoleBasedNotifications />)

      expect(screen.getByText('Keystroke Recording Active')).toBeInTheDocument()
      expect(screen.getByText(/Your typing activity is being recorded/)).toBeInTheDocument()
    })

    it('does not show keystroke notice for non-students', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showKeystrokeNotice: false,
        showUpgradePrompts: false,
        currentRole: 'admin',
        isAuthenticated: true,
      })

      render(<RoleBasedNotifications />)

      expect(screen.queryByText('Keystroke Recording Active')).not.toBeInTheDocument()
    })
  })

  describe('Upgrade Prompts', () => {
    it('shows upgrade prompt for users without roles', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showKeystrokeNotice: false,
        showUpgradePrompts: true,
        currentRole: null,
        isAuthenticated: true,
      })

      render(<RoleBasedNotifications />)

      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
      expect(screen.getByText(/You haven't selected a role yet/)).toBeInTheDocument()
      expect(screen.getByText('Complete Setup')).toBeInTheDocument()
    })

    it('handles complete setup button click', () => {
      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showKeystrokeNotice: false,
        showUpgradePrompts: true,
        currentRole: null,
        isAuthenticated: true,
      })

      render(<RoleBasedNotifications />)

      const completeButton = screen.getByText('Complete Setup')
      fireEvent.click(completeButton)

      expect(window.location.href).toBe('/auth/role-setup')
    })

    it('does not show upgrade prompt for users with roles', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showKeystrokeNotice: false,
        showUpgradePrompts: false,
        currentRole: 'student',
        isAuthenticated: true,
      })

      render(<RoleBasedNotifications />)

      expect(screen.queryByText('Complete Your Profile')).not.toBeInTheDocument()
    })
  })

  describe('Multiple Notifications', () => {
    it('shows both keystroke notice and upgrade prompt when applicable', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showKeystrokeNotice: true,
        showUpgradePrompts: true,
        currentRole: 'student',
        isAuthenticated: true,
      })

      render(<RoleBasedNotifications />)

      expect(screen.getByText('Keystroke Recording Active')).toBeInTheDocument()
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated State', () => {
    it('renders nothing when not authenticated', () => {
      ;(useRoleBasedFeatures as jest.Mock).mockReturnValue({
        showKeystrokeNotice: false,
        showUpgradePrompts: false,
        currentRole: null,
        isAuthenticated: false,
      })

      const { container } = render(<RoleBasedNotifications />)
      expect(container.firstChild).toBeNull()
    })
  })
})

/*
TEST EXECUTION NOTES:

These tests comprehensively cover the role-based header and notification components:

1. **RoleBasedHeader Component**:
   - Student interface rendering and functionality
   - Admin interface with management tools
   - User menu interactions and navigation
   - Sign out functionality and error handling
   - Unauthenticated state handling

2. **RoleBasedNotifications Component**:
   - Student-specific keystroke recording notices
   - Upgrade prompts for users without roles
   - Multiple notification scenarios
   - Unauthenticated state handling

To run these tests:
```bash
npm test components/navigation/role-based-header.test.tsx
```

The tests use mocking to verify all role-based UI functionality
works correctly across different user roles and states.
*/ 