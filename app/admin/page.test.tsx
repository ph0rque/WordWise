import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import AdminDashboard from './page'
import { getCurrentUserRole } from '@/lib/auth/roles'
import { getSupabaseClient } from '@/lib/supabase/client'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth/roles', () => ({
  getCurrentUserRole: jest.fn(),
  requireAdmin: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}))

jest.mock('@/components/admin/student-analytics', () => ({
  StudentAnalytics: ({ students, stats, onStudentSelect }: any) => (
    <div data-testid="student-analytics">
      <div data-testid="analytics-students-count">{students.length}</div>
      <div data-testid="analytics-total-students">{stats.totalStudents}</div>
      <button onClick={() => onStudentSelect(students[0])} data-testid="select-first-student">
        Select First Student
      </button>
    </div>
  ),
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loading-icon" />,
  Users: () => <div data-testid="users-icon" />,
  GraduationCap: () => <div data-testid="graduation-cap-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  CheckCircle2: () => <div data-testid="success-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
}))

describe('AdminDashboard', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  }

  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: null,
          })),
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  }

  const mockStudents = [
    {
      id: 'student-1',
      email: 'student1@example.com',
      role: 'student' as const,
      created_at: '2024-01-01T00:00:00Z',
      email_confirmed_at: '2024-01-01T01:00:00Z',
      last_sign_in_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 'student-2',
      email: 'student2@example.com',
      role: 'student' as const,
      created_at: '2024-01-02T00:00:00Z',
      email_confirmed_at: '2024-01-02T01:00:00Z',
      last_sign_in_at: null,
    },
    {
      id: 'student-3',
      email: 'student3@example.com',
      role: 'student' as const,
      created_at: '2024-01-03T00:00:00Z',
      email_confirmed_at: null,
      last_sign_in_at: null,
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(getCurrentUserRole as jest.Mock).mockResolvedValue('admin')
  })

  describe('Authentication and Authorization', () => {
    it('redirects non-admin users to home page', async () => {
      ;(getCurrentUserRole as jest.Mock).mockResolvedValue('student')
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('redirects to auth page if no session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      })
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth')
      })
    })

    it('loads dashboard for admin user with valid session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })
      
      // Mock students data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockStudents,
              error: null
            }))
          }))
        }))
      })

      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('WordWise Admin')).toBeInTheDocument()
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Loading', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })
    })

    it('shows loading state initially', () => {
      render(<AdminDashboard />)
      
      expect(screen.getByText('Loading admin dashboard...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
    })

    it('handles errors gracefully', async () => {
      ;(getCurrentUserRole as jest.Mock).mockRejectedValue(new Error('Database error'))
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load admin dashboard. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Student Management', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'auth.users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: mockStudents,
                  error: null
                }))
              }))
            }))
          }
        }
        if (table === 'documents') {
          return {
            select: jest.fn(() => Promise.resolve({
              data: [
                { id: 'doc-1', user_id: 'student-1', created_at: '2024-01-10T00:00:00Z' },
                { id: 'doc-2', user_id: 'student-1', created_at: '2024-01-11T00:00:00Z' },
              ],
              error: null
            }))
          }
        }
        return {
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })
    })

    it('displays student statistics correctly', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Total students
        expect(screen.getByText('Total Students')).toBeInTheDocument()
      })
    })

    it('renders student list with correct information', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('student1@example.com')).toBeInTheDocument()
        expect(screen.getByText('student2@example.com')).toBeInTheDocument()
        expect(screen.getByText('student3@example.com')).toBeInTheDocument()
      })
    })

    it('shows correct student status badges', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        // Active student (signed in recently)
        expect(screen.getByText('Active')).toBeInTheDocument()
        // Inactive student (never signed in)
        expect(screen.getByText('Inactive')).toBeInTheDocument()
        // Pending student (email not confirmed)
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })

    it('filters students based on search term', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search students by email...')
        fireEvent.change(searchInput, { target: { value: 'student1' } })
      })
      
      // Should show filtered results
      expect(screen.getByText('1 of 3 students')).toBeInTheDocument()
    })

    it('navigates to student detail page when view details is clicked', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        const viewButton = screen.getAllByText('View Details')[0]
        fireEvent.click(viewButton)
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/students/student-1')
    })

    it('displays empty state when no students', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'auth.users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('No students registered yet.')).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Tab', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockStudents,
              error: null
            }))
          }))
        }))
      })
    })

    it('switches to analytics tab and renders analytics component', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('Analytics Overview')
        fireEvent.click(analyticsTab)
      })
      
      expect(screen.getByTestId('student-analytics')).toBeInTheDocument()
      expect(screen.getByTestId('analytics-students-count')).toHaveTextContent('3')
    })

    it('passes correct props to analytics component', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('Analytics Overview')
        fireEvent.click(analyticsTab)
      })
      
      expect(screen.getByTestId('analytics-total-students')).toHaveTextContent('3')
    })

    it('handles student selection from analytics component', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('Analytics Overview')
        fireEvent.click(analyticsTab)
        
        const selectButton = screen.getByTestId('select-first-student')
        fireEvent.click(selectButton)
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/students/student-1')
    })
  })

  describe('Header and Navigation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockStudents,
              error: null
            }))
          }))
        }))
      })
    })

    it('displays admin user information in header', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
        expect(screen.getByText('Administrator')).toBeInTheDocument()
      })
    })

    it('handles sign out correctly', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({})
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        const signOutButton = screen.getByText('Sign Out')
        fireEvent.click(signOutButton)
      })
      
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/auth')
    })

    it('handles sign out errors gracefully', async () => {
      mockSupabaseClient.auth.signOut.mockRejectedValue(new Error('Sign out failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        const signOutButton = screen.getByText('Sign Out')
        fireEvent.click(signOutButton)
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Stats Cards', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'auth.users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: mockStudents,
                  error: null
                }))
              }))
            }))
          }
        }
        if (table === 'documents') {
          return {
            select: jest.fn(() => Promise.resolve({
              data: Array.from({ length: 10 }, (_, i) => ({
                id: `doc-${i}`,
                user_id: `student-${i % 3}`,
                created_at: '2024-01-10T00:00:00Z'
              })),
              error: null
            }))
          }
        }
        return {
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })
    })

    it('displays correct statistics', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Total students
        expect(screen.getByText('10')).toBeInTheDocument() // Total documents (mocked)
        expect(screen.getByText('85%')).toBeInTheDocument() // Average grammar score (placeholder)
      })
    })

    it('calculates active users correctly', async () => {
      render(<AdminDashboard />)
      
      await waitFor(() => {
        // Should show 1 active user (student-1 has recent login)
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles database errors when loading students', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' }
            }))
          }))
        }))
      })
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load admin dashboard. Please try again.')).toBeInTheDocument()
      })
    })

    it('handles partial data loading gracefully', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-1', email: 'admin@example.com' }
          }
        }
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'auth.users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                  data: mockStudents,
                  error: null
                }))
              }))
            }))
          }
        }
        // Simulate documents failing to load
        if (table === 'documents') {
          return {
            select: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Documents table error' }
            }))
          }
        }
        return {
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })
      
      render(<AdminDashboard />)
      
      await waitFor(() => {
        // Should still show students even if documents failed to load
        expect(screen.getByText('student1@example.com')).toBeInTheDocument()
        expect(screen.getByText('0')).toBeInTheDocument() // Documents count should be 0
      })
    })
  })
})

/*
TEST EXECUTION NOTES:

These tests comprehensively cover the AdminDashboard component:

1. **Authentication & Authorization**: Admin role checking, session validation
2. **Dashboard Loading**: Loading states, error handling
3. **Student Management**: Student list, search, status badges, navigation
4. **Analytics Integration**: Tab switching, component integration
5. **Header & Navigation**: User info display, sign out functionality
6. **Statistics Display**: Stats calculation and display
7. **Error Handling**: Database errors, partial failures

To run these tests:
```bash
npm test admin/page.test.tsx
```

The tests use extensive mocking to isolate component behavior and verify
all admin dashboard functionality works correctly.
*/ 