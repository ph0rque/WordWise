import { render, screen, waitFor } from '@testing-library/react'
import { useParams } from 'next/navigation'
import DocumentSessionsPage from './page'
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

// Mock MyRecordings component
jest.mock('@/components/student/my-recordings', () => ({
  MyRecordings: jest.fn(({ documentId, documentTitle, className }) => (
    <div data-testid="my-recordings">
      <div data-testid="document-id">{documentId}</div>
      <div data-testid="document-title">{documentTitle}</div>
      <div data-testid="class-name">{className}</div>
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

describe('DocumentSessionsPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({
      id: 'test-doc-id'
    })

    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockDocument,
              error: null
            }))
          }))
        }))
      }))
    }

    mockGetSupabaseClient.mockReturnValue(mockSupabase as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with document data', async () => {
    render(<DocumentSessionsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Writing Sessions for "Test Document"')).toBeInTheDocument()
    })
    
    expect(screen.getByText('View and analyze your writing sessions for this document. Each session shows your keystroke patterns, writing speed, and productivity metrics.')).toBeInTheDocument()
    expect(screen.getByText('Back to Document')).toBeInTheDocument()
  })

  it('renders breadcrumb navigation correctly', async () => {
    render(<DocumentSessionsPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
    
    const breadcrumb = screen.getByRole('navigation')
    expect(breadcrumb).toHaveTextContent('Test Document')
    expect(breadcrumb).toHaveTextContent('Writing Sessions')
  })

  it('passes correct props to MyRecordings component', async () => {
    render(<DocumentSessionsPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('document-id')).toHaveTextContent('test-doc-id')
    })
    
    expect(screen.getByTestId('document-title')).toHaveTextContent('Test Document')
    expect(screen.getByTestId('class-name')).toHaveTextContent('min-h-[600px]')
  })

  it('handles document not found error', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Document not found' }
            }))
          }))
        }))
      }))
    }

    mockGetSupabaseClient.mockReturnValue(mockSupabase as any)

    render(<DocumentSessionsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Document not found or you do not have permission to view it.')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Back to Documents')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    // Mock a never-resolving promise to keep loading state
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => new Promise(() => {})) // Never resolves
          }))
        }))
      }))
    }

    mockGetSupabaseClient.mockReturnValue(mockSupabase as any)

    render(<DocumentSessionsPage />)
    
    // Check for the loading spinner element
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
}) 