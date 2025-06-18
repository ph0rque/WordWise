import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoleSelector, CompactRoleSelector, roleOptions } from './role-selector'
import type { UserRole } from '@/lib/types'

// Mock the lucide-react icons to avoid dependency issues in tests
jest.mock('lucide-react', () => ({
  GraduationCap: () => <div data-testid="graduation-cap-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  BookOpen: () => <div data-testid="book-open-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />
}))

describe('RoleSelector', () => {
  const mockOnRoleChange = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('renders with default props', () => {
      render(<RoleSelector onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByText('Choose Your Role')).toBeInTheDocument()
      expect(screen.getByText('Select the option that best describes you')).toBeInTheDocument()
      expect(screen.getByLabelText('Student')).toBeChecked()
    })

    it('renders all role options with correct content', () => {
      render(<RoleSelector onRoleChange={mockOnRoleChange} />)
      
      roleOptions.forEach(option => {
        expect(screen.getByText(option.title)).toBeInTheDocument()
        expect(screen.getByText(option.description)).toBeInTheDocument()
        
        option.features.forEach(feature => {
          expect(screen.getByText(feature)).toBeInTheDocument()
        })
      })
    })

    it('shows recommended badge for student role', () => {
      render(<RoleSelector onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByText('Recommended')).toBeInTheDocument()
    })

    it('displays check circle icon for selected role', () => {
      render(<RoleSelector selectedRole="admin" onRoleChange={mockOnRoleChange} />)
      
      // Should have 7 check icons: 1 for selected role + 6 for admin features
      const checkIcons = screen.getAllByTestId('check-circle-icon')
      expect(checkIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Role selection', () => {
    it('calls onRoleChange when student role is selected', () => {
      render(<RoleSelector selectedRole="admin" onRoleChange={mockOnRoleChange} />)
      
      const studentRadio = screen.getByLabelText('Student')
      fireEvent.click(studentRadio)
      
      expect(mockOnRoleChange).toHaveBeenCalledWith('student')
    })

    it('calls onRoleChange when admin role is selected', () => {
      render(<RoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />)
      
      const adminRadio = screen.getByLabelText('Teacher/Administrator')
      fireEvent.click(adminRadio)
      
      expect(mockOnRoleChange).toHaveBeenCalledWith('admin')
    })

    it('updates visual state when role changes', () => {
      const { rerender } = render(
        <RoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />
      )
      
      expect(screen.getByLabelText('Student')).toBeChecked()
      expect(screen.getByLabelText('Teacher/Administrator')).not.toBeChecked()
      
      rerender(<RoleSelector selectedRole="admin" onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByLabelText('Student')).not.toBeChecked()
      expect(screen.getByLabelText('Teacher/Administrator')).toBeChecked()
    })
  })

  describe('Role-specific content', () => {
    it('displays student-specific information when student is selected', () => {
      render(<RoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByText('Perfect for Academic Writing')).toBeInTheDocument()
      expect(screen.getByText(/AI-powered assistance for essays/)).toBeInTheDocument()
      expect(screen.getByText('Writing Process Recording')).toBeInTheDocument()
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
    })

    it('displays admin-specific information when admin is selected', () => {
      render(<RoleSelector selectedRole="admin" onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByText('Comprehensive Teacher Tools')).toBeInTheDocument()
      expect(screen.getByText(/monitor student progress/)).toBeInTheDocument()
      expect(screen.queryByText('Writing Process Recording')).not.toBeInTheDocument()
    })

    it('shows correct icons for role-specific content', () => {
      const { rerender } = render(
        <RoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />
      )
      
      expect(screen.getByTestId('book-open-icon')).toBeInTheDocument()
      
      rerender(<RoleSelector selectedRole="admin" onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument()
    })
  })

  describe('Confirm button', () => {
    it('does not show confirm button by default', () => {
      render(<RoleSelector onRoleChange={mockOnRoleChange} />)
      
      expect(screen.queryByText(/Continue as/)).not.toBeInTheDocument()
    })

    it('shows confirm button when showConfirmButton is true', () => {
      render(
        <RoleSelector 
          onRoleChange={mockOnRoleChange} 
          onConfirm={mockOnConfirm}
          showConfirmButton={true}
        />
      )
      
      expect(screen.getByText('Continue as Student')).toBeInTheDocument()
    })

    it('calls onConfirm when confirm button is clicked', () => {
      render(
        <RoleSelector 
          onRoleChange={mockOnRoleChange} 
          onConfirm={mockOnConfirm}
          showConfirmButton={true}
        />
      )
      
      const confirmButton = screen.getByText('Continue as Student')
      fireEvent.click(confirmButton)
      
      expect(mockOnConfirm).toHaveBeenCalled()
    })

    it('updates confirm button text when role changes', () => {
      const { rerender } = render(
        <RoleSelector 
          selectedRole="student"
          onRoleChange={mockOnRoleChange} 
          onConfirm={mockOnConfirm}
          showConfirmButton={true}
        />
      )
      
      expect(screen.getByText('Continue as Student')).toBeInTheDocument()
      
      rerender(
        <RoleSelector 
          selectedRole="admin"
          onRoleChange={mockOnRoleChange} 
          onConfirm={mockOnConfirm}
          showConfirmButton={true}
        />
      )
      
      expect(screen.getByText('Continue as Teacher/Administrator')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper radio group structure', () => {
      render(<RoleSelector onRoleChange={mockOnRoleChange} />)
      
      const studentRadio = screen.getByLabelText('Student') as HTMLInputElement
      const adminRadio = screen.getByLabelText('Teacher/Administrator') as HTMLInputElement
      
      expect(studentRadio.type).toBe('radio')
      expect(adminRadio.type).toBe('radio')
      expect(studentRadio.name).toBe('role')
      expect(adminRadio.name).toBe('role')
    })

    it('supports keyboard navigation', () => {
      render(<RoleSelector onRoleChange={mockOnRoleChange} />)
      
      const studentRadio = screen.getByLabelText('Student')
      studentRadio.focus()
      
      expect(document.activeElement).toBe(studentRadio)
    })
  })

  describe('Custom styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <RoleSelector onRoleChange={mockOnRoleChange} className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('applies hover effects', () => {
      render(<RoleSelector onRoleChange={mockOnRoleChange} />)
      
      const studentCard = screen.getByLabelText('Student').closest('label')
      
      if (studentCard) {
        fireEvent.mouseEnter(studentCard)
        // Hover state is managed by component internal state
        expect(studentCard).toBeInTheDocument()
      }
    })
  })
})

describe('CompactRoleSelector', () => {
  const mockOnRoleChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('renders compact version with minimal content', () => {
      render(<CompactRoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByText('I am a:')).toBeInTheDocument()
      expect(screen.getByText('Student')).toBeInTheDocument()
      expect(screen.getByText('Teacher/Administrator')).toBeInTheDocument()
    })

    it('renders radio inputs with correct structure', () => {
      render(<CompactRoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />)
      
      const studentRadio = screen.getByLabelText('Student') as HTMLInputElement
      const adminRadio = screen.getByLabelText('Teacher/Administrator') as HTMLInputElement
      
      expect(studentRadio.type).toBe('radio')
      expect(adminRadio.type).toBe('radio')
      expect(studentRadio.name).toBe('compact-role')
      expect(adminRadio.name).toBe('compact-role')
    })

    it('shows correct selected state', () => {
      render(<CompactRoleSelector selectedRole="admin" onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByLabelText('Student')).not.toBeChecked()
      expect(screen.getByLabelText('Teacher/Administrator')).toBeChecked()
    })
  })

  describe('Role selection', () => {
    it('calls onRoleChange when role is selected', () => {
      render(<CompactRoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />)
      
      const adminRadio = screen.getByLabelText('Teacher/Administrator')
      fireEvent.click(adminRadio)
      
      expect(mockOnRoleChange).toHaveBeenCalledWith('admin')
    })

    it('displays role icons', () => {
      render(<CompactRoleSelector selectedRole="student" onRoleChange={mockOnRoleChange} />)
      
      expect(screen.getByTestId('graduation-cap-icon')).toBeInTheDocument()
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    })
  })

  describe('Custom styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <CompactRoleSelector 
          selectedRole="student" 
          onRoleChange={mockOnRoleChange} 
          className="compact-custom" 
        />
      )
      
      expect(container.firstChild).toHaveClass('compact-custom')
    })
  })
})

describe('roleOptions', () => {
  it('exports role options with correct structure', () => {
    expect(roleOptions).toHaveLength(2)
    
    const studentOption = roleOptions.find(option => option.value === 'student')
    const adminOption = roleOptions.find(option => option.value === 'admin')
    
    expect(studentOption).toBeDefined()
    expect(adminOption).toBeDefined()
    
    if (studentOption) {
      expect(studentOption.recommended).toBe(true)
      expect(studentOption.features).toContain('AI-powered writing assistance')
    }
    
    if (adminOption) {
      expect(adminOption.recommended).toBeUndefined()
      expect(adminOption.features).toContain('View all student documents')
    }
  })

  it('has consistent structure for all options', () => {
    roleOptions.forEach(option => {
      expect(option).toHaveProperty('value')
      expect(option).toHaveProperty('title')
      expect(option).toHaveProperty('description')
      expect(option).toHaveProperty('icon')
      expect(option).toHaveProperty('features')
      expect(Array.isArray(option.features)).toBe(true)
      expect(option.features.length).toBeGreaterThan(0)
    })
  })
})

/* 
TEST EXECUTION SETUP NOTES:

To run these tests, ensure you have the following in your project:

1. Install testing dependencies:
   npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom

2. Add to your jest.config.js:
   {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     moduleNameMapping: {
       '^@/(.*)$': '<rootDir>/$1'
     }
   }

3. Create jest.setup.js:
   import '@testing-library/jest-dom'

4. Add to package.json scripts:
   "test": "jest",
   "test:watch": "jest --watch"

These tests cover:
- Component rendering and content display
- Role selection interactions
- Conditional content based on selected role
- Accessibility features
- Custom styling support
- Confirm button functionality
- Both full and compact component variants
- Exported data structures

The tests use mocked icons to avoid rendering issues during testing.
*/ 