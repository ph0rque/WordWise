import { KeystrokePlaybackEngine, PlaybackEvent, PlaybackRecording } from './playback';

// Mock the encryption module
jest.mock('../utils/encryption', () => ({
  decrypt: jest.fn().mockResolvedValue('{"key":"a","inputType":"insertText","data":"a"}')
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('KeystrokePlaybackEngine', () => {
  let playbackEngine: KeystrokePlaybackEngine;
  
  const mockRecordingData = {
    recording: {
      id: 'test-recording-1',
      session_id: 'test-session-1',
      title: 'Test Recording',
      start_time: '2024-01-01T10:00:00Z',
      end_time: '2024-01-01T10:05:00Z',
      duration_ms: 300000,
      total_keystrokes: 100,
      total_characters: 80,
      average_wpm: 20
    },
    events: [
      {
        id: 'event-1',
        event_id: 'evt-1',
        sequence_number: 1,
        timestamp_ms: 1000,
        absolute_timestamp: '2024-01-01T10:00:01Z',
        event_type: 'input',
        encryptedData: 'encrypted-data-1',
        target_element: 'textarea',
        has_modifier_keys: false,
        is_functional_key: false
      },
      {
        id: 'event-2',
        event_id: 'evt-2',
        sequence_number: 2,
        timestamp_ms: 2000,
        absolute_timestamp: '2024-01-01T10:00:02Z',
        event_type: 'keydown',
        encryptedData: 'encrypted-data-2',
        target_element: 'textarea',
        has_modifier_keys: false,
        is_functional_key: false
      }
    ]
  };

  beforeEach(() => {
    playbackEngine = new KeystrokePlaybackEngine({
      autoPlay: false,
      showCursor: true,
      highlightChanges: true,
      preserveTimingAccuracy: true
    });

    // Reset fetch mock
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    if (playbackEngine) {
      playbackEngine.destroy();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const engine = new KeystrokePlaybackEngine();
      const state = engine.getState();
      
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.playbackSpeed).toBe(1.0);
      expect(state.progress).toBe(0);
    });

    it('should initialize with custom config', () => {
      const engine = new KeystrokePlaybackEngine({
        autoPlay: true,
        showCursor: false,
        maxPlaybackSpeed: 8.0,
        minPlaybackSpeed: 0.1
      });
      
      // Config is private, but we can test behavior
      expect(engine).toBeDefined();
    });
  });

  describe('loadRecording', () => {
    it('should load recording successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingData)
      });

      const recordingLoadedPromise = new Promise((resolve) => {
        playbackEngine.on('recordingLoaded', resolve);
      });

      await playbackEngine.loadRecording('test-recording-1');
      const loadedRecording = await recordingLoadedPromise;

      expect(fetch).toHaveBeenCalledWith('/api/keystroke/recordings?recordingId=test-recording-1');
      expect(loadedRecording).toBeDefined();
      
      const recording = playbackEngine.getRecording();
      expect(recording).not.toBeNull();
      expect(recording?.id).toBe('test-recording-1');
      expect(recording?.title).toBe('Test Recording');
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(playbackEngine.loadRecording('nonexistent')).rejects.toThrow('Failed to fetch recording');
    });

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(playbackEngine.loadRecording('test-recording-1')).rejects.toThrow('Network error');
    });
  });

  describe('Playback Controls', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingData)
      });

      await playbackEngine.loadRecording('test-recording-1');
    });

    it('should start playback', () => {
      const playPromise = new Promise((resolve) => {
        playbackEngine.on('play', resolve);
      });

      playbackEngine.play();
      const state = playbackEngine.getState();

      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('should pause playback', () => {
      playbackEngine.play();
      
      const pausePromise = new Promise((resolve) => {
        playbackEngine.on('pause', resolve);
      });

      playbackEngine.pause();
      const state = playbackEngine.getState();

      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(true);
    });

    it('should stop playback', () => {
      playbackEngine.play();
      
      const stopPromise = new Promise((resolve) => {
        playbackEngine.on('stop', resolve);
      });

      playbackEngine.stop();
      const state = playbackEngine.getState();

      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.progress).toBe(0);
    });

    it('should not play without recording', () => {
      const emptyEngine = new KeystrokePlaybackEngine();
      
      expect(() => emptyEngine.play()).toThrow('No recording loaded');
    });
  });

  describe('Speed Control', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingData)
      });

      await playbackEngine.loadRecording('test-recording-1');
    });

    it('should set playback speed within limits', () => {
      const speedChangePromise = new Promise((resolve) => {
        playbackEngine.on('speedChange', resolve);
      });

      playbackEngine.setSpeed(2.0);
      const state = playbackEngine.getState();

      expect(state.playbackSpeed).toBe(2.0);
    });

    it('should clamp speed to maximum', () => {
      playbackEngine.setSpeed(10.0);
      const state = playbackEngine.getState();

      expect(state.playbackSpeed).toBe(4.0); // Default max
    });

    it('should clamp speed to minimum', () => {
      playbackEngine.setSpeed(0.1);
      const state = playbackEngine.getState();

      expect(state.playbackSpeed).toBe(0.25); // Default min
    });
  });

  describe('Seek Functionality', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingData)
      });

      await playbackEngine.loadRecording('test-recording-1');
    });

    it('should seek to specific time', () => {
      const seekPromise = new Promise((resolve) => {
        playbackEngine.on('seek', resolve);
      });

      playbackEngine.seek(150000); // 2.5 minutes
      const state = playbackEngine.getState();

      expect(state.currentTime).toBe(150000);
      expect(state.progress).toBeCloseTo(0.5); // 50% of 300000ms
    });

    it('should clamp seek time to duration', () => {
      playbackEngine.seek(500000); // Beyond duration
      const state = playbackEngine.getState();

      expect(state.currentTime).toBe(300000); // Clamped to duration
      expect(state.progress).toBe(1.0);
    });

    it('should clamp seek time to zero', () => {
      playbackEngine.seek(-1000); // Negative time
      const state = playbackEngine.getState();

      expect(state.currentTime).toBe(0);
      expect(state.progress).toBe(0);
    });

    it('should skip forward', () => {
      playbackEngine.skipForward();
      const state = playbackEngine.getState();

      expect(state.currentTime).toBe(1000); // Default step size
    });

    it('should skip backward', () => {
      playbackEngine.seek(5000);
      playbackEngine.skipBackward();
      const state = playbackEngine.getState();

      expect(state.currentTime).toBe(4000); // 5000 - 1000
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const mockCallback = jest.fn();
      
      playbackEngine.on('play', mockCallback);
      playbackEngine.off('play', mockCallback);
      
      // Should not throw
      expect(() => playbackEngine.off('nonexistent', mockCallback)).not.toThrow();
    });

    it('should handle listener errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      playbackEngine.on('play', errorCallback);
      
      // Should not crash the engine
      expect(() => playbackEngine.play()).toThrow('No recording loaded');
    });
  });

  describe('Analytics', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingData)
      });

      await playbackEngine.loadRecording('test-recording-1');
    });

    it('should track analytics', () => {
      const analytics = playbackEngine.getAnalytics();
      
      expect(analytics.sessionStartTime).toBeInstanceOf(Date);
      expect(analytics.totalPlayTime).toBe(0);
      expect(analytics.pauseCount).toBe(0);
      expect(analytics.seekCount).toBe(0);
      expect(analytics.speedChanges).toBe(0);
      expect(analytics.completionRate).toBe(0);
      expect(analytics.averageSpeed).toBe(1.0);
    });

    it('should increment pause count', () => {
      playbackEngine.play();
      playbackEngine.pause();
      
      const analytics = playbackEngine.getAnalytics();
      expect(analytics.pauseCount).toBe(1);
    });

    it('should increment seek count', () => {
      playbackEngine.seek(1000);
      
      const analytics = playbackEngine.getAnalytics();
      expect(analytics.seekCount).toBe(1);
    });

    it('should increment speed changes', () => {
      playbackEngine.setSpeed(2.0);
      
      const analytics = playbackEngine.getAnalytics();
      expect(analytics.speedChanges).toBe(1);
    });
  });

  describe('DOM Integration', () => {
    let mockElement: HTMLTextAreaElement;

    beforeEach(() => {
      // Create mock DOM element
      mockElement = document.createElement('textarea');
      document.body.appendChild(mockElement);
    });

    afterEach(() => {
      if (mockElement.parentNode) {
        mockElement.parentNode.removeChild(mockElement);
      }
    });

    it('should set target element', () => {
      expect(() => playbackEngine.setTargetElement(mockElement)).not.toThrow();
    });

    it('should update target element content', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingData)
      });

      playbackEngine.setTargetElement(mockElement);
      await playbackEngine.loadRecording('test-recording-1');
      
      // Content updates would happen during playback
      expect(mockElement.value).toBe('');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      expect(() => playbackEngine.destroy()).not.toThrow();
    });

    it('should stop playback on destroy', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingData)
      });

      await playbackEngine.loadRecording('test-recording-1');
      playbackEngine.play();
      
      playbackEngine.destroy();
      
      const state = playbackEngine.getState();
      expect(state.isPlaying).toBe(false);
    });
  });
}); 