import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConsentNotice, ConsentSettings } from './consent-notice';

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${variant} ${className}`}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span className={variant}>{children}</span>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      data-testid="switch"
    />
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-current-tab={value} onChange={onValueChange}>{children}</div>
  ),
  TabsContent: ({ children, value }: any) => <div data-tab-content={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button onClick={() => onClick?.(value)} data-tab-trigger={value}>
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
}));

describe('ConsentNotice', () => {
  const mockOnConsent = jest.fn();
  const mockOnDecline = jest.fn();

  const defaultProps = {
    isVisible: true,
    onConsent: mockOnConsent,
    onDecline: mockOnDecline,
    studentName: 'John Doe',
    documentTitle: 'Essay Assignment',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getByText('Keystroke Recording Consent')).toBeInTheDocument();
      expect(screen.getByText(/Essay Assignment/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<ConsentNotice {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Keystroke Recording Consent')).not.toBeInTheDocument();
    });

    it('shows sections read progress', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getByText('0/4 sections read')).toBeInTheDocument();
    });

    it('renders all required tabs', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Usage')).toBeInTheDocument();
      expect(screen.getByText('Your Rights')).toBeInTheDocument();
    });
  });

  describe('Section Reading Flow', () => {
    it('allows marking sections as read', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const markAsReadButton = screen.getByText('Mark as Read');
      fireEvent.click(markAsReadButton);
      
      expect(screen.getByText('Section Read')).toBeInTheDocument();
    });

    it('shows consent form only after all sections are read', async () => {
      render(<ConsentNotice {...defaultProps} />);
      
      // Initially no consent form
      expect(screen.queryByText('Digital Consent Form')).not.toBeInTheDocument();
      
      // Mark all sections as read
      const markAsReadButtons = screen.getAllByText('Mark as Read');
      markAsReadButtons.forEach(button => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Digital Consent Form')).toBeInTheDocument();
      });
    });

    it('updates sections read count', async () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const markAsReadButton = screen.getByText('Mark as Read');
      fireEvent.click(markAsReadButton);
      
      await waitFor(() => {
        expect(screen.getByText('1/4 sections read')).toBeInTheDocument();
      });
    });
  });

  describe('Privacy Settings', () => {
    it('defaults to anonymized privacy level', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const anonymizedRadio = screen.getByDisplayValue('anonymized');
      expect(anonymizedRadio).toBeChecked();
    });

    it('allows changing privacy level', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const fullRadio = screen.getByDisplayValue('full');
      fireEvent.click(fullRadio);
      
      expect(fullRadio).toBeChecked();
    });

    it('disables playback review when not full recording', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const metadataRadio = screen.getByDisplayValue('metadata_only');
      fireEvent.click(metadataRadio);
      
      const playbackSwitch = screen.getAllByTestId('switch').find(
        (switch_) => switch_.closest('div')?.textContent?.includes('Playback Review')
      );
      expect(playbackSwitch).toBeDisabled();
    });

    it('allows changing data retention period', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const retentionSelect = screen.getByDisplayValue('30');
      fireEvent.change(retentionSelect, { target: { value: '90' } });
      
      expect(retentionSelect).toHaveValue('90');
    });
  });

  describe('Consent Submission', () => {
    const fillAllSectionsAndForm = async (container: HTMLElement) => {
      // Mark all sections as read
      const markAsReadButtons = screen.getAllByText('Mark as Read');
      markAsReadButtons.forEach(button => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Digital Consent Form')).toBeInTheDocument();
      });
      
      // Fill in signature
      const signatureInput = screen.getByPlaceholderText('Type your full name here');
      fireEvent.change(signatureInput, { target: { value: 'John Doe' } });
    };

    it('requires all sections to be read before consent', async () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const consentButton = screen.getByText('Give Consent & Start Recording');
      expect(consentButton).toBeDisabled();
    });

    it('requires digital signature before consent', async () => {
      render(<ConsentNotice {...defaultProps} />);
      
      await fillAllSectionsAndForm(document.body);
      
      // Clear signature
      const signatureInput = screen.getByPlaceholderText('Type your full name here');
      fireEvent.change(signatureInput, { target: { value: '' } });
      
      const consentButton = screen.getByText('Give Consent & Start Recording');
      expect(consentButton).toBeDisabled();
    });

    it('calls onConsent with correct settings when form is submitted', async () => {
      render(<ConsentNotice {...defaultProps} />);
      
      await fillAllSectionsAndForm(document.body);
      
      const consentButton = screen.getByText('Give Consent & Start Recording');
      fireEvent.click(consentButton);
      
      expect(mockOnConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          recordingEnabled: true,
          privacyLevel: 'anonymized',
          dataRetentionDays: 30,
          allowTeacherReview: true,
          allowPlaybackReview: false,
          studentSignature: 'John Doe',
          consentTimestamp: expect.any(Date),
        })
      );
    });

    it('shows consent summary with current settings', async () => {
      render(<ConsentNotice {...defaultProps} />);
      
      await fillAllSectionsAndForm(document.body);
      
      expect(screen.getByText(/Privacy Level: anonymized/)).toBeInTheDocument();
      expect(screen.getByText(/Data Retention: 30 days/)).toBeInTheDocument();
      expect(screen.getByText(/Teacher Review: Allowed/)).toBeInTheDocument();
      expect(screen.getByText(/Playback Review: Not allowed/)).toBeInTheDocument();
    });
  });

  describe('Decline Flow', () => {
    it('calls onDecline when decline button is clicked', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const declineButton = screen.getByText('Decline Recording');
      fireEvent.click(declineButton);
      
      expect(mockOnDecline).toHaveBeenCalled();
    });
  });

  describe('Educational Content', () => {
    it('shows what is recorded information', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getByText('What We Record')).toBeInTheDocument();
      expect(screen.getByText(/Typing speed and rhythm/)).toBeInTheDocument();
      expect(screen.getByText(/Pause patterns while thinking/)).toBeInTheDocument();
    });

    it('shows benefits information', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getByText('How It Helps You')).toBeInTheDocument();
      expect(screen.getByText(/Identify your writing strengths/)).toBeInTheDocument();
      expect(screen.getByText(/Get personalized feedback/)).toBeInTheDocument();
    });

    it('shows privacy level descriptions', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getByText(/Complete keystroke data including exact content/)).toBeInTheDocument();
      expect(screen.getByText(/Keystroke patterns and timing without personal identifiers/)).toBeInTheDocument();
      expect(screen.getByText(/Only basic statistics like typing speed/)).toBeInTheDocument();
    });

    it('shows student rights information', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getByText(/Withdraw consent at any time/)).toBeInTheDocument();
      expect(screen.getByText(/Request to see your data/)).toBeInTheDocument();
      expect(screen.getByText(/Recording is completely optional/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      expect(screen.getAllByRole('alert')).toHaveLength(4); // One alert per tab
    });

    it('supports keyboard navigation', () => {
      render(<ConsentNotice {...defaultProps} />);
      
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'privacyLevel');
      });
    });
  });

  describe('Error Handling', () => {
    it('shows alert when trying to submit without signature', async () => {
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<ConsentNotice {...defaultProps} />);
      
      // Mark all sections as read
      const markAsReadButtons = screen.getAllByText('Mark as Read');
      markAsReadButtons.forEach(button => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Digital Consent Form')).toBeInTheDocument();
      });
      
      const consentButton = screen.getByText('Give Consent & Start Recording');
      fireEvent.click(consentButton);
      
      expect(alertSpy).toHaveBeenCalledWith('Please provide your digital signature to confirm consent.');
      
      alertSpy.mockRestore();
    });
  });
}); 