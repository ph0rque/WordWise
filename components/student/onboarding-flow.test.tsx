import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import OnboardingFlow from './onboarding-flow'

// Mock the Dialog component since it uses Radix UI
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="dialog-content" className={className}>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <h2 data-testid="dialog-title" className={className}>{children}</h2>,
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <p data-testid="dialog-description" className={className}>{children}</p>
}))

// Mock Progress component
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => 
    <div data-testid="progress" data-value={value} className={className} />
}))

describe('OnboardingFlow', () => {
  const mockProps = {
    isOpen: true,
    onComplete: jest.fn(),
    onSkip: jest.fn(),
    userName: 'TestStudent'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders welcome step correctly', () => {
    render(<OnboardingFlow {...mockProps} />)
    
    expect(screen.getByText(/Welcome to Your Academic Writing Assistant!/)).toBeInTheDocument()
    expect(screen.getByText(/Welcome, TestStudent!/)).toBeInTheDocument()
    expect(screen.getByText(/AI-powered grammar checking/)).toBeInTheDocument()
    expect(screen.getByText(/Academic writing templates/)).toBeInTheDocument()
  })

  it('shows correct progress on first step', () => {
    render(<OnboardingFlow {...mockProps} />)
    
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
    expect(screen.getByText('11% Complete')).toBeInTheDocument()
    expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '11.11111111111111')
  })

  it('navigates to next step when Next button is clicked', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Master the 3 Writing Modes/)).toBeInTheDocument()
      expect(screen.getByText('Step 2 of 9')).toBeInTheDocument()
    })
  })

  it('disables Previous button on first step', () => {
    render(<OnboardingFlow {...mockProps} />)
    
    const previousButton = screen.getByText('Previous')
    expect(previousButton).toBeDisabled()
  })

  it('enables Previous button after first step', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      const previousButton = screen.getByText('Previous')
      expect(previousButton).not.toBeDisabled()
    })
  })

  it('navigates back to previous step when Previous button is clicked', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Go to step 2
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Master the 3 Writing Modes/)).toBeInTheDocument()
    })
    
    // Go back to step 1
    const previousButton = screen.getByText('Previous')
    fireEvent.click(previousButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome to Your Academic Writing Assistant!/)).toBeInTheDocument()
    })
  })

  it('shows writing modes content on step 2', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Draft Mode')).toBeInTheDocument()
      expect(screen.getByText('Revision Mode')).toBeInTheDocument()
      expect(screen.getByText('Final Mode')).toBeInTheDocument()
      expect(screen.getByText(/Focus on getting your ideas down/)).toBeInTheDocument()
    })
  })

  it('shows essay templates content on step 3', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to step 3
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3
    
    await waitFor(() => {
      expect(screen.getByText(/Start Strong with Essay Templates/)).toBeInTheDocument()
      expect(screen.getByText('5-Paragraph Essay')).toBeInTheDocument()
      expect(screen.getByText('Argumentative Essay')).toBeInTheDocument()
      expect(screen.getByText('Compare & Contrast')).toBeInTheDocument()
    })
  })

  it('shows academic phrases content on step 4', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to step 4
    const nextButton = screen.getByText('Next')
    for (let i = 0; i < 3; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Sound Smarter with Academic Phrases/)).toBeInTheDocument()
      expect(screen.getByText('Introductions')).toBeInTheDocument()
      expect(screen.getByText('Transitions')).toBeInTheDocument()
      expect(screen.getByText('Evidence & Analysis')).toBeInTheDocument()
      expect(screen.getByText('Conclusions')).toBeInTheDocument()
    })
  })

  it('shows citation formats on step 5', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to step 5
    const nextButton = screen.getByText('Next')
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Master Citations Like a Pro/)).toBeInTheDocument()
      expect(screen.getByText('MLA Format')).toBeInTheDocument()
      expect(screen.getByText('APA Format')).toBeInTheDocument()
      expect(screen.getByText('Chicago Format')).toBeInTheDocument()
    })
  })

  it('shows goals and progress content on step 6', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to step 6
    const nextButton = screen.getByText('Next')
    for (let i = 0; i < 5; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Set Goals & Track Progress/)).toBeInTheDocument()
      expect(screen.getByText('Writing Goals')).toBeInTheDocument()
      expect(screen.getByText('Achievement System')).toBeInTheDocument()
      expect(screen.getByText('Progress Dashboard')).toBeInTheDocument()
    })
  })

  it('shows keyboard shortcuts on step 7', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to step 7
    const nextButton = screen.getByText('Next')
    for (let i = 0; i < 6; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Write Faster with Shortcuts/)).toBeInTheDocument()
      expect(screen.getByText('Essential')).toBeInTheDocument()
      expect(screen.getByText('Ctrl + S')).toBeInTheDocument()
      expect(screen.getByText('Save your work')).toBeInTheDocument()
    })
  })

  it('shows mobile features on step 8', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to step 8
    const nextButton = screen.getByText('Next')
    for (let i = 0; i < 7; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Write Anywhere, Anytime/)).toBeInTheDocument()
      expect(screen.getByText(/Touch-optimized interface/)).toBeInTheDocument()
      expect(screen.getByText(/Mobile essay templates/)).toBeInTheDocument()
    })
  })

  it('shows completion screen on final step', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to final step
    const nextButton = screen.getByText('Next')
    for (let i = 0; i < 8; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText(/You're Ready to Write!/)).toBeInTheDocument()
      expect(screen.getByText(/Congratulations!/)).toBeInTheDocument()
      expect(screen.getByText('Start Writing!')).toBeInTheDocument()
      expect(screen.getByText(/Learned about writing modes/)).toBeInTheDocument()
    })
  })

  it('calls onComplete when Start Writing button is clicked', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to final step
    const nextButton = screen.getByText('Next')
    for (let i = 0; i < 8; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      const startWritingButton = screen.getByText('Start Writing!')
      fireEvent.click(startWritingButton)
      expect(mockProps.onComplete).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onSkip when Skip Tour button is clicked', () => {
    render(<OnboardingFlow {...mockProps} />)
    
    const skipButton = screen.getByText('Skip Tour')
    fireEvent.click(skipButton)
    
    expect(mockProps.onSkip).toHaveBeenCalledTimes(1)
  })

  it('allows clicking on step indicators to navigate', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Go to step 2 first
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Master the 3 Writing Modes/)).toBeInTheDocument()
    })
    
    // Click on step 1 indicator to go back
    const stepIndicators = screen.getAllByRole('button')
    const step1Indicator = stepIndicators.find(button => button.textContent === '1')
    
    if (step1Indicator) {
      fireEvent.click(step1Indicator)
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome to Your Academic Writing Assistant!/)).toBeInTheDocument()
      })
    }
  })

  it('shows correct progress percentages throughout', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Check initial progress
    expect(screen.getByText('11% Complete')).toBeInTheDocument()
    
    // Navigate and check progress
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('22% Complete')).toBeInTheDocument()
    })
    
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('33% Complete')).toBeInTheDocument()
    })
  })

  it('does not render when isOpen is false', () => {
    render(<OnboardingFlow {...mockProps} isOpen={false} />)
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('shows step completion indicators correctly', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    // Navigate to step 2
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      // Step 1 should be marked as completed (green)
      const stepIndicators = screen.getAllByRole('button')
      const step1Indicator = stepIndicators.find(button => 
        button.className.includes('bg-green-500')
      )
      expect(step1Indicator).toBeInTheDocument()
    })
  })

  it('handles animation states correctly', async () => {
    render(<OnboardingFlow {...mockProps} />)
    
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    // The component should handle the animation transition
    await waitFor(() => {
      expect(screen.getByText(/Master the 3 Writing Modes/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })
}) 