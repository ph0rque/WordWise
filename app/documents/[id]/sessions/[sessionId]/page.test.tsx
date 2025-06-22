import { render, screen, waitFor } from '@testing-library/react'
import { useParams } from 'next/navigation'
import SessionPage from './page'
import { getSupabaseClient } from '@/lib/supabase/client'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}))

// Mock PlaybackViewer component
jest.mock('@/components/keystroke/playback-viewer', () => ({
  PlaybackViewer: jest.fn(({ recordingId }) => (
    <div data-testid="playback-viewer">
      <div data-testid="recording-id">{recordingId}</div>
    </div>
  ))
}))

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>

const mockDocument = {
  id: 'test-doc-id',
  title: 'Test Document',
  content: 'Test content',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  user_id: 'test-user-id'
}

const mockSession = {
  id: 'test-session-id',
  title: 'Test Session',
  start_time: '2023-01-01T10:00:00Z',
  end_time: '2023-01-01T11:00:00Z',
  duration_ms: 3600000,
  total_keystrokes: 1500,
  total_characters: 2000,
  average_wpm: 25,
  created_at: '2023-01-01T10:00:00Z',
  status: 'completed' as const
}

describe('SessionPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({
      id: 'test-doc-id',
      sessionId: 'test-session-id'
    })

    const mockSupabase = {
      from: jest.fn((table: string) => ({
        select: jest.fn(() => ({
          eq: jest.fn((field: string, value: string) => {
            if (table === 'documents') {
              return {
                single: jest.fn(() => Promise.resolve({
                  data: mockDocument,
                  error: null
                }))
              }
            } else if (table === 'keystroke_recordings') {
              return {
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({
                    data: mockSession,
                    error: null
                  }))
                }))
              }
            }
            return {
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Not found' }
              }))
            }
          })
        }))
      }))
    }

    mockGetSupabaseClient.mockReturnValue(mockSupabase as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with session data', async () => {
    render(<SessionPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Writing Session Playback')).toBeInTheDocument()
    })
    
    // Check for the elements separately since they may be in different DOM nodes
    expect(screen.getByText('Test Document')).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return content.includes('1500') && content.includes('keystrokes')
    })).toBeInTheDocument()
    expect(screen.getByText('Back to Sessions')).toBeInTheDocument()
  })

  it('renders breadcrumb navigation correctly', async () => {
    render(<SessionPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
    
    const breadcrumb = screen.getByRole('navigation')
    expect(breadcrumb).toHaveTextContent('Test Document')
    expect(breadcrumb).toHaveTextContent('Writing Sessions')
    expect(breadcrumb).toHaveTextContent('Session at') // Don't check exact time due to timezone differences
  })

  it('renders playback viewer for completed sessions', async () => {
    render(<SessionPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('playback-viewer')).toBeInTheDocument()
    })
    
    expect(screen.getByTestId('recording-id')).toHaveTextContent('test-session-id')
  })

  it('shows message for non-completed sessions', async () => {
    const incompleteSession = { ...mockSession, status: 'active' as const }
    
    const mockSupabase = {
      from: jest.fn((table: string) => ({
        select: jest.fn(() => ({
          eq: jest.fn((field: string, value: string) => {
            if (table === 'documents') {
              return {
                single: jest.fn(() => Promise.resolve({
                  data: mockDocument,
                  error: null
                }))
              }
            } else if (table === 'keystroke_recordings') {
              return {
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({
                    data: incompleteSession,
                    error: null
                  }))
                }))
              }
            }
            return {
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Not found' }
              }))
            }
          })
        }))
      }))
    }

    mockGetSupabaseClient.mockReturnValue(mockSupabase as any)

    render(<SessionPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Session Not Complete')).toBeInTheDocument()
    })
    
    expect(screen.getByText('This session is still active. Playback is only available for completed sessions.')).toBeInTheDocument()
  })

  it('handles session not found error', async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => ({
        select: jest.fn(() => ({
          eq: jest.fn((field: string, value: string) => {
            if (table === 'documents') {
              return {
                single: jest.fn(() => Promise.resolve({
                  data: mockDocument,
                  error: null
                }))
              }
            } else if (table === 'keystroke_recordings') {
              return {
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({
                    data: null,
                    error: { message: 'Session not found' }
                  }))
                }))
              }
            }
            return {
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Not found' }
              }))
            }
          })
        }))
      }))
    }

    mockGetSupabaseClient.mockReturnValue(mockSupabase as any)

    render(<SessionPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Session not found or you do not have permission to view it.')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Back to Sessions')).toBeInTheDocument()
    expect(screen.getByText('Back to Documents')).toBeInTheDocument()
  })
}) 