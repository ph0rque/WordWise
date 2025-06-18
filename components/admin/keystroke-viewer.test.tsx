import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KeystrokeViewer } from './keystroke-viewer';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the playback viewer component
jest.mock('@/components/keystroke/playback-viewer', () => ({
  PlaybackViewer: ({ recordingId, onRecordingLoad, onPlaybackComplete }: any) => (
    <div data-testid="playback-viewer">
      <div>Recording ID: {recordingId}</div>
      <button onClick={() => onRecordingLoad?.({ id: recordingId, title: 'Test Recording' })}>
        Load Recording
      </button>
      <button onClick={() => onPlaybackComplete?.({ totalEvents: 100 })}>
        Complete Playback
      </button>
    </div>
  )
}));

const mockRecordings = [
  {
    id: 'recording-1',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    documentId: 'doc-1',
    documentTitle: 'Essay 1',
    sessionId: 'session-1',
    title: 'Writing Session 1',
    status: 'completed' as const,
    privacyLevel: 'full' as const,
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T11:00:00Z',
    durationMs: 3600000,
    totalKeystrokes: 1500,
    totalCharacters: 1200,
    averageWpm: 45,
    pauseCount: 10,
    backspaceCount: 50,
    deleteCount: 20,
    createdAt: '2024-01-01T10:00:00Z',
    consentGiven: true
  },
  {
    id: 'recording-2',
    userId: 'user-2',
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    documentId: 'doc-2',
    documentTitle: 'Essay 2',
    sessionId: 'session-2',
    title: 'Writing Session 2',
    status: 'active' as const,
    privacyLevel: 'anonymized' as const,
    startTime: '2024-01-02T14:00:00Z',
    durationMs: 1800000,
    totalKeystrokes: 800,
    totalCharacters: 650,
    averageWpm: 38,
    pauseCount: 5,
    backspaceCount: 25,
    deleteCount: 10,
    createdAt: '2024-01-02T14:00:00Z',
    consentGiven: true
  }
];

describe('KeystrokeViewer', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ recordings: [] })
      }), 100))
    );

    render(<KeystrokeViewer />);
    
    expect(screen.getByText('Loading keystroke recordings...')).toBeInTheDocument();
  });

  it('renders recordings list after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ recordings: mockRecordings })
    });

    render(<KeystrokeViewer />);

    await waitFor(() => {
      expect(screen.getByText('Keystroke Recordings')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Essay 1')).toBeInTheDocument();
    expect(screen.getByText('Writing Session 2')).toBeInTheDocument();
  });

  it('displays correct recording statistics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ recordings: mockRecordings })
    });

    render(<KeystrokeViewer />);

    await waitFor(() => {
      expect(screen.getByText('2 recordings')).toBeInTheDocument();
    });

    expect(screen.getByText('1500 keys')).toBeInTheDocument();
    expect(screen.getByText('800 keys')).toBeInTheDocument();
  });

  it('shows status and privacy badges correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ recordings: mockRecordings })
    });

    render(<KeystrokeViewer />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('FULL')).toBeInTheDocument();
      expect(screen.getByText('ANONYMIZED')).toBeInTheDocument();
    });
  });

  it('filters recordings by search term', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ recordings: mockRecordings })
    });

    render(<KeystrokeViewer />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search students, documents...');
    fireEvent.change(searchInput, { target: { value: 'jane' } });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('opens playback dialog when view button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ recordings: mockRecordings })
    });

    render(<KeystrokeViewer />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('playback-viewer')).toBeInTheDocument();
      expect(screen.getByText('Recording ID: recording-1')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<KeystrokeViewer />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load keystroke recordings. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no recordings exist', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ recordings: [] })
    });

    render(<KeystrokeViewer />);

    await waitFor(() => {
      expect(screen.getByText('No keystroke recordings found.')).toBeInTheDocument();
    });
  });
}); 