import { render, screen, waitFor } from '@testing-library/react'
import DocumentPage from './page'

// Mock all external dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'test-doc-id' })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-doc-id',
              title: 'Test Document',
              content: 'Test content',
              user_id: 'test-user',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            error: null
          }))
        }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user' } },
        error: null
      }))
    }
  }))
}))

jest.mock('@/lib/hooks/use-user-role', () => ({
  useRoleBasedFeatures: jest.fn(() => ({
    canCreateDocuments: true,
    canSaveWork: true
  }))
}))

jest.mock('@/components/text-editor', () => {
  return function MockTextEditor(props: any) {
    return (
      <div data-testid="text-editor">
        Mock Text Editor for {props.initialDocument?.title}
      </div>
    )
  }
})

jest.mock('@/components/sidebar/right-sidebar', () => {
  return function MockRightSidebar(props: any) {
    return (
      <div data-testid="right-sidebar">
        Mock Right Sidebar
      </div>
    )
  }
})

jest.mock('@/components/editor/document-actions', () => {
  return function MockDocumentActions(props: any) {
    return (
      <div data-testid="document-actions">
        <button onClick={props.onNew}>New</button>
        <button onClick={props.onSave}>Save</button>
        <button onClick={props.onDelete}>Delete</button>
        <button onClick={props.onSwitch}>Switch</button>
      </div>
    )
  }
})

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

describe('DocumentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<DocumentPage />)
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })

  it('renders document editor after loading', async () => {
    render(<DocumentPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('text-editor')).toBeInTheDocument()
    })

    expect(screen.getByText('Mock Text Editor for Test Document')).toBeInTheDocument()
  })

  it('displays document title in breadcrumb', async () => {
    render(<DocumentPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })
  })

  it('shows home breadcrumb link', async () => {
    render(<DocumentPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    })
  })

  it('renders document actions', async () => {
    render(<DocumentPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('document-actions')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch' })).toBeInTheDocument()
  })

  it('renders right sidebar by default', async () => {
    render(<DocumentPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('right-sidebar')).toBeInTheDocument()
    })
  })
})

describe('DocumentPage Error States', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays error message when document not found', async () => {
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
      })),
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-user' } },
          error: null
        }))
      }
    }

    const { getSupabaseClient } = require('@/lib/supabase/client')
    getSupabaseClient.mockReturnValue(mockSupabase)

    render(<DocumentPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Document not found or you do not have permission to view it/)).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /Back to Documents/ })).toHaveAttribute('href', '/')
  })

  it('displays error message when user is not authenticated', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test-doc-id',
                title: 'Test Document',
                content: 'Test content',
                user_id: 'test-user',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            }))
          }))
        }))
      })),
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: null },
          error: { message: 'Not authenticated' }
        }))
      }
    }

    const { getSupabaseClient } = require('@/lib/supabase/client')
    getSupabaseClient.mockReturnValue(mockSupabase)

    render(<DocumentPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Document not found/)).toBeInTheDocument()
    })
  })
}) 