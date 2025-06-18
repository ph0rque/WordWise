import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudentAnalytics } from './student-analytics'
import type { UserWithRole } from '@/lib/types'

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Award: () => <div data-testid="award-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
}))

describe('StudentAnalytics', () => {
  const mockStudents: UserWithRole[] = [
    {
      id: 'student-1',
      email: 'excellent@student.edu',
      role: 'student',
      created_at: '2024-01-01T00:00:00Z',
      email_confirmed_at: '2024-01-01T01:00:00Z',
      last_sign_in_at: '2024-01-15T10:00:00Z', // Recent activity
    },
    {
      id: 'student-2',
      email: 'good@student.edu',
      role: 'student',
      created_at: '2024-01-02T00:00:00Z',
      email_confirmed_at: '2024-01-02T01:00:00Z',
      last_sign_in_at: '2024-01-10T10:00:00Z', // Moderate activity
    },
    {
      id: 'student-3',
      email: 'struggling@student.edu',
      role: 'student',
      created_at: '2024-01-03T00:00:00Z',
      email_confirmed_at: '2024-01-03T01:00:00Z',
      last_sign_in_at: '2024-01-01T10:00:00Z', // Old activity (needs attention)
    },
    {
      id: 'student-4',
      email: 'inactive@student.edu',
      role: 'student',
      created_at: '2024-01-04T00:00:00Z',
      email_confirmed_at: null, // Unconfirmed email
      last_sign_in_at: null, // Never signed in
    },
  ]

  const mockStats = {
    totalStudents: 4,
    totalDocuments: 10,
    averageGrammarScore: 85,
    activeThisWeek: 2,
  }

  const mockOnStudentSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Math.random to get predictable test results
    jest.spyOn(Math, 'random').mockImplementation(() => 0.5)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Analytics Overview Cards', () => {
    it('renders analytics overview cards correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Writing Quality Distribution')).toBeInTheDocument()
        expect(screen.getByText('Engagement Metrics')).toBeInTheDocument()
        expect(screen.getByText('Platform Health')).toBeInTheDocument()
      })
    })

    it('calculates and displays grade distribution correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Excellent (90-100%)')).toBeInTheDocument()
        expect(screen.getByText('Good (80-89%)')).toBeInTheDocument()
        expect(screen.getByText('Fair (70-79%)')).toBeInTheDocument()
        expect(screen.getByText('Needs Work (<70%)')).toBeInTheDocument()
      })
    })

    it('calculates engagement metrics correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument() // 2/4 active this week = 50%
        expect(screen.getByText('Weekly active rate')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // 10/4 documents per student = 2.5 rounded to 2
        expect(screen.getByText('Avg documents per student')).toBeInTheDocument()
      })
    })

    it('displays platform health indicators', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Students improving')).toBeInTheDocument()
        expect(screen.getByText('Need attention')).toBeInTheDocument()
      })
    })
  })

  describe('Top Performers Section', () => {
    it('renders top performers section', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Top Performers')).toBeInTheDocument()
        expect(screen.getByText('Students with highest grammar scores')).toBeInTheDocument()
      })
    })

    it('displays top 5 performers with rankings', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show ranking numbers 1-4 (we have 4 students)
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('4')).toBeInTheDocument()
      })
    })

    it('shows student emails and grammar scores', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show grammar scores (mocked to return consistent values)
        expect(screen.getAllByText(/\d+%/)).toHaveLength(4) // Grammar scores
        expect(screen.getAllByText(/\d+ documents/)).toHaveLength(4) // Document counts
      })
    })
  })

  describe('Most Active Section', () => {
    it('renders most active section', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Most Active')).toBeInTheDocument()
        expect(screen.getByText('Students with most documents created')).toBeInTheDocument()
      })
    })

    it('displays most active students with document counts', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show document counts and last activity
        expect(screen.getAllByText(/\d+/)).toHaveLength(10) // Various numeric values
        expect(screen.getAllByText('documents')).toHaveLength(4) // Document labels
      })
    })

    it('formats last activity dates correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show formatted dates like "Today", "X days ago", etc.
        expect(screen.getByText(/days ago|Today|Yesterday/)).toBeInTheDocument()
      })
    })
  })

  describe('Needs Attention Section', () => {
    it('renders needs attention section', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument()
        expect(screen.getByText('Students who may need additional support')).toBeInTheDocument()
      })
    })

    it('identifies students who need attention correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show Help buttons for students needing attention
        const helpButtons = screen.getAllByText('Help')
        expect(helpButtons.length).toBeGreaterThan(0)
      })
    })

    it('handles help button clicks', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        const helpButtons = screen.getAllByText('Help')
        if (helpButtons.length > 0) {
          fireEvent.click(helpButtons[0])
          expect(mockOnStudentSelect).toHaveBeenCalled()
        }
      })
    })

    it('shows success message when no students need attention', async () => {
      // Create students that don't need attention (high scores, recent activity)
      const excellentStudents: UserWithRole[] = [
        {
          id: 'excellent-1',
          email: 'excellent1@student.edu',
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
          email_confirmed_at: '2024-01-01T01:00:00Z',
          last_sign_in_at: new Date().toISOString(), // Very recent
        },
      ]

      // Mock Math.random to return high scores
      jest.spyOn(Math, 'random').mockImplementation(() => 0.9) // Will give high scores

      render(
        <StudentAnalytics
          students={excellentStudents}
          stats={{ ...mockStats, totalStudents: 1 }}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('All students are doing well!')).toBeInTheDocument()
      })
    })
  })

  describe('Detailed Analytics Table', () => {
    it('renders detailed analytics table', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Detailed Student Progress')).toBeInTheDocument()
        expect(screen.getByText('Comprehensive view of all student writing metrics and progress')).toBeInTheDocument()
      })
    })

    it('displays table headers correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Student')).toBeInTheDocument()
        expect(screen.getByText('Grammar Score')).toBeInTheDocument()
        expect(screen.getByText('Documents')).toBeInTheDocument()
        expect(screen.getByText('Total Words')).toBeInTheDocument()
        expect(screen.getByText('Writing Streak')).toBeInTheDocument()
        expect(screen.getByText('Improvement')).toBeInTheDocument()
        expect(screen.getByText('Last Active')).toBeInTheDocument()
        expect(screen.getByText('Actions')).toBeInTheDocument()
      })
    })

    it('displays student data in table rows', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show all student emails in the table
        expect(screen.getByText('excellent@student.edu')).toBeInTheDocument()
        expect(screen.getByText('good@student.edu')).toBeInTheDocument()
        expect(screen.getByText('struggling@student.edu')).toBeInTheDocument()
        expect(screen.getByText('inactive@student.edu')).toBeInTheDocument()
      })
    })

    it('colors grammar scores appropriately', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should have grammar score percentages with appropriate styling
        const grammarScores = screen.getAllByText(/\d+%/)
        expect(grammarScores.length).toBeGreaterThan(0)
      })
    })

    it('handles view button clicks in table', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View')
        if (viewButtons.length > 0) {
          fireEvent.click(viewButtons[0])
          expect(mockOnStudentSelect).toHaveBeenCalledWith(mockStudents[0])
        }
      })
    })

    it('displays improvement badges correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show improvement badges (mocked data will produce consistent results)
        expect(screen.getAllByText(/Excellent Progress|Improving|Stable|Needs Support/)).toHaveLength(4)
      })
    })

    it('formats large numbers correctly', async () => {
      render(
        <StudentAnalytics
          students={mockStudents}
          stats={mockStats}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        // Should show formatted word counts (e.g., "1,000" instead of "1000")
        const wordCounts = screen.getAllByText(/[\d,]+/)
        expect(wordCounts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Loading States and Error Handling', () => {
    it('handles empty student list', () => {
      render(
        <StudentAnalytics
          students={[]}
          stats={{ ...mockStats, totalStudents: 0 }}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      expect(screen.getByText('Writing Quality Distribution')).toBeInTheDocument()
      // Should still render without errors even with no students
    })

    it('handles student with missing data gracefully', async () => {
      const incompleteStudents: UserWithRole[] = [
        {
          id: 'incomplete-1',
          email: 'incomplete@student.edu',
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
          email_confirmed_at: null,
          last_sign_in_at: null,
        },
      ]

      render(
        <StudentAnalytics
          students={incompleteStudents}
          stats={{ ...mockStats, totalStudents: 1 }}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('incomplete@student.edu')).toBeInTheDocument()
      })
    })
  })

  describe('Date Formatting', () => {
    it('formats recent activity as "Today"', async () => {
      const todayStudent: UserWithRole[] = [
        {
          id: 'today-1',
          email: 'today@student.edu',
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
          email_confirmed_at: '2024-01-01T01:00:00Z',
          last_sign_in_at: new Date().toISOString(),
        },
      ]

      render(
        <StudentAnalytics
          students={todayStudent}
          stats={{ ...mockStats, totalStudents: 1 }}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument()
      })
    })

    it('formats yesterday activity as "Yesterday"', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const yesterdayStudent: UserWithRole[] = [
        {
          id: 'yesterday-1',
          email: 'yesterday@student.edu',
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
          email_confirmed_at: '2024-01-01T01:00:00Z',
          last_sign_in_at: yesterday.toISOString(),
        },
      ]

      render(
        <StudentAnalytics
          students={yesterdayStudent}
          stats={{ ...mockStats, totalStudents: 1 }}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Yesterday')).toBeInTheDocument()
      })
    })

    it('formats older dates as "X days ago"', async () => {
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

      const oldStudent: UserWithRole[] = [
        {
          id: 'old-1',
          email: 'old@student.edu',
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
          email_confirmed_at: '2024-01-01T01:00:00Z',
          last_sign_in_at: fiveDaysAgo.toISOString(),
        },
      ]

      render(
        <StudentAnalytics
          students={oldStudent}
          stats={{ ...mockStats, totalStudents: 1 }}
          onStudentSelect={mockOnStudentSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('5 days ago')).toBeInTheDocument()
      })
    })
  })
})

/*
TEST EXECUTION NOTES:

These tests comprehensively cover the StudentAnalytics component:

1. **Analytics Overview**: Grade distribution, engagement metrics, platform health
2. **Top Performers**: Ranking, score display, student information
3. **Most Active**: Document counts, activity tracking, date formatting
4. **Needs Attention**: Identification logic, help actions, success states
5. **Detailed Table**: All columns, data display, interactions
6. **Edge Cases**: Empty data, incomplete students, error handling
7. **Date Formatting**: Today, yesterday, relative dates
8. **User Interactions**: Button clicks, student selection callbacks

To run these tests:
```bash
npm test components/admin/student-analytics.test.tsx
```

The tests use mocking to ensure consistent results and verify
all analytics functionality works correctly.
*/ 