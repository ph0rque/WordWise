// Encryption/decryption removed for simplicity

/**
 * Keystroke Playback Engine
 * 
 * Provides functionality to replay keystroke recordings with:
 * - Timeline controls (play, pause, stop, seek)
 * - Speed adjustment (0.25x to 4x)
 * - Event reconstruction and DOM manipulation
 * - Progress tracking and analytics
 * - Visual feedback and highlighting
 */

export interface PlaybackEvent {
  id: string;
  eventId: string;
  sequenceNumber: number;
  timestampMs: number;
  absoluteTimestamp: Date;
  eventType: string;
  originalData: any;
  targetElement?: string;
  hasModifierKeys?: boolean;
  isFunctionalKey?: boolean;
}

export interface PlaybackRecording {
  id: string;
  sessionId: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  durationMs: number;
  totalKeystrokes: number;
  totalCharacters: number;
  averageWpm?: number;
  events: PlaybackEvent[];
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number; // milliseconds from start
  totalDuration: number;
  playbackSpeed: number;
  currentEventIndex: number;
  progress: number; // 0-1
}

export interface PlaybackConfig {
  autoPlay: boolean;
  showCursor: boolean;
  highlightChanges: boolean;
  preserveTimingAccuracy: boolean;
  maxPlaybackSpeed: number;
  minPlaybackSpeed: number;
  seekStepSize: number; // milliseconds
}

export interface PlaybackAnalytics {
  sessionStartTime: Date;
  totalPlayTime: number;
  pauseCount: number;
  seekCount: number;
  speedChanges: number;
  completionRate: number;
  averageSpeed: number;
}

export class KeystrokePlaybackEngine {
  private recording: PlaybackRecording | null = null;
  private state: PlaybackState;
  private config: PlaybackConfig;
  private analytics: PlaybackAnalytics;
  
  // Playback control
  private playbackTimer: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  
  // Event handling
  private eventListeners: Map<string, Function[]> = new Map();
  private currentContent: string = '';
  private contentHistory: Array<{ time: number; content: string; cursor: number }> = [];
  
  // DOM elements
  private targetElement: HTMLElement | null = null;
  private cursorElement: HTMLElement | null = null;
  
  // Performance optimization
  private eventCache: Map<number, PlaybackEvent> = new Map();
  private lastProcessedIndex: number = -1;

  constructor(config: Partial<PlaybackConfig> = {}) {
    this.config = {
      autoPlay: false,
      showCursor: true,
      highlightChanges: true,
      preserveTimingAccuracy: true,
      maxPlaybackSpeed: 4.0,
      minPlaybackSpeed: 0.25,
      seekStepSize: 1000,
      ...config
    };

    this.state = {
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      totalDuration: 0,
      playbackSpeed: 1.0,
      currentEventIndex: 0,
      progress: 0
    };

    this.analytics = {
      sessionStartTime: new Date(),
      totalPlayTime: 0,
      pauseCount: 0,
      seekCount: 0,
      speedChanges: 0,
      completionRate: 0,
      averageSpeed: 1.0
    };
  }

  /**
   * Load a keystroke recording for playback
   */
  async loadRecording(recordingId: string): Promise<void> {
    try {
      // Fetch recording data from API
      const response = await fetch(`/api/keystroke/recordings?recordingId=${recordingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recording');
      }

      const data = await response.json();
      const recordingData = data.recording;
      const eventsData = data.events || [];
      
      console.log('🔍 Raw events data:', eventsData.slice(0, 3)); // Debug first 3 events
      
      // Process events (no encryption/decryption)
      const processedEvents = eventsData.map((event: any) => {
        let originalData;
        
        // Check if we have direct columns first (preferred), then fall back to encrypted_data
        if (event.key !== undefined || event.code !== undefined || event.data !== undefined) {
          // Use direct event fields (new schema)
          originalData = {
            key: event.key || 'unknown',
            code: event.code || 'unknown', 
            data: event.data || event.key || '',
            type: event.event_type,
            ctrlKey: event.ctrlKey || false,
            shiftKey: event.shiftKey || false,
            altKey: event.altKey || false,
            metaKey: event.metaKey || false
          };
          console.log('✅ Using direct columns for event:', event.sequence_number, originalData);
        } else if (event.encrypted_data) {
          try {
            // Parse JSON data from encrypted_data field (fallback)
            let jsonString = event.encrypted_data;
            
            // Handle different data formats
            if (typeof jsonString === 'string') {
              // Check if it's hex-encoded (starts with \x)
              if (jsonString.startsWith('\\x')) {
                // Remove the \x prefix and decode from hex
                const hexString = jsonString.substring(2);
                // Decode hex to string (browser-compatible)
                jsonString = hexString.match(/.{1,2}/g)?.map((byte: string) => String.fromCharCode(parseInt(byte, 16))).join('') || '';
              }
              
              // Try to parse as JSON
              originalData = JSON.parse(jsonString);
            } else if (typeof jsonString === 'object' && jsonString !== null) {
              // Already an object, use directly
              originalData = jsonString;
            } else {
              // Convert buffer/binary data to string and parse
              const buffer = new Uint8Array(jsonString);
              const textDecoder = new TextDecoder('utf-8');
              const decodedString = textDecoder.decode(buffer);
              originalData = JSON.parse(decodedString);
            }
            
            console.log('⚠️ Using encrypted_data for event:', event.sequence_number, originalData);
            
            // If the parsed data doesn't have key information, try to infer it from event type
            if (!originalData.key && !originalData.data) {
              // For input events, we might need to reconstruct the data
              if (event.event_type === 'input') {
                originalData.key = 'unknown';
                originalData.data = ''; // We'll have to skip this event
              }
            }
          } catch (error) {
            console.error('❌ Failed to parse encrypted_data:', error, event);
            console.log('Raw encrypted_data type:', typeof event.encrypted_data);
            console.log('Raw encrypted_data sample:', event.encrypted_data);
            originalData = { key: 'unknown', type: 'unknown' };
          }
        } else {
          // No data available
          console.warn('⚠️ No event data available:', event);
          originalData = { key: 'unknown', type: 'unknown' };
        }
        
        return {
          id: event.id,
          eventId: event.event_id || event.id,
          sequenceNumber: event.sequence_number,
          timestampMs: event.timestamp_ms,
          absoluteTimestamp: new Date(event.absolute_timestamp),
          eventType: event.event_type,
          originalData: originalData,
          targetElement: event.target_element,
          hasModifierKeys: event.has_modifier_keys,
          isFunctionalKey: event.is_functional_key
        };
      });

      console.log('🎯 Processed events sample:', processedEvents.slice(0, 3));

      // Sort events by sequence number
      processedEvents.sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);

      this.recording = {
        id: recordingData.id,
        sessionId: recordingData.session_id,
        title: recordingData.title,
        startTime: new Date(recordingData.start_time),
        endTime: recordingData.end_time ? new Date(recordingData.end_time) : undefined,
        durationMs: recordingData.duration_ms,
        totalKeystrokes: recordingData.total_keystrokes,
        totalCharacters: recordingData.total_characters,
        averageWpm: recordingData.average_wpm,
        events: processedEvents
      };

      console.log('📊 Recording loaded:', {
        id: this.recording.id,
        title: this.recording.title,
        eventCount: this.recording.events.length,
        duration: this.recording.durationMs
      });

      // Update state
      this.state.totalDuration = this.recording.durationMs;
      this.state.currentTime = 0;
      this.state.currentEventIndex = 0;
      this.state.progress = 0;

      // Cache events for performance
      this.cacheEvents();

      // Reset content
      this.currentContent = '';
      this.contentHistory = [];

      this.emit('recordingLoaded', this.recording);
      
    } catch (error) {
      console.error('Error loading recording:', error);
      throw error;
    }
  }

  /**
   * Set the target DOM element for playback
   */
  setTargetElement(element: HTMLElement): void {
    this.targetElement = element;
    
    // Create cursor element if needed
    if (this.config.showCursor && !this.cursorElement) {
      this.createCursor();
    }
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.recording) {
      throw new Error('No recording loaded');
    }

    if (this.state.isPlaying) {
      return;
    }

    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.startTime = Date.now() - this.pausedTime;
    
    this.startPlaybackLoop();
    this.emit('play', this.state);
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.state.isPlaying) {
      return;
    }

    this.state.isPlaying = false;
    this.state.isPaused = true;
    this.pausedTime = this.state.currentTime;
    
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.analytics.pauseCount++;
    this.emit('pause', this.state);
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.currentTime = 0;
    this.state.currentEventIndex = 0;
    this.state.progress = 0;
    this.pausedTime = 0;
    
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    // Reset content
    this.currentContent = '';
    this.lastProcessedIndex = -1;
    
    if (this.targetElement) {
      this.updateTargetElement('');
    }

    this.emit('stop', this.state);
  }

  /**
   * Seek to a specific time position
   */
  seek(timeMs: number): void {
    if (!this.recording) {
      return;
    }

    const clampedTime = Math.max(0, Math.min(timeMs, this.state.totalDuration));
    const wasPlaying = this.state.isPlaying;
    
    if (wasPlaying) {
      this.pause();
    }

    this.state.currentTime = clampedTime;
    this.state.progress = clampedTime / this.state.totalDuration;
    
    // Find the appropriate event index
    this.state.currentEventIndex = this.findEventIndexAtTime(clampedTime);
    
    // Reconstruct content up to this point
    this.reconstructContentUpToTime(clampedTime);
    
    this.analytics.seekCount++;
    this.emit('seek', { time: clampedTime, progress: this.state.progress });

    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    const clampedSpeed = Math.max(
      this.config.minPlaybackSpeed,
      Math.min(speed, this.config.maxPlaybackSpeed)
    );

    if (clampedSpeed !== this.state.playbackSpeed) {
      this.state.playbackSpeed = clampedSpeed;
      this.analytics.speedChanges++;
      this.emit('speedChange', clampedSpeed);
    }
  }

  /**
   * Skip forward by step size
   */
  skipForward(): void {
    this.seek(this.state.currentTime + this.config.seekStepSize);
  }

  /**
   * Skip backward by step size
   */
  skipBackward(): void {
    this.seek(this.state.currentTime - this.config.seekStepSize);
  }

  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    return { ...this.state };
  }

  /**
   * Get recording information
   */
  getRecording(): PlaybackRecording | null {
    return this.recording;
  }

  /**
   * Get playback analytics
   */
  getAnalytics(): PlaybackAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get current content
   */
  getCurrentContent(): string {
    return this.currentContent;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Start the playback loop
   */
  private startPlaybackLoop(): void {
    if (!this.recording || !this.state.isPlaying) {
      return;
    }

    const now = Date.now();
    const elapsed = (now - this.startTime) * this.state.playbackSpeed;
    this.state.currentTime = elapsed;
    this.state.progress = Math.min(1, elapsed / this.state.totalDuration);

    // Process events that should have occurred by now
    this.processEventsUpToTime(elapsed);

    // Check if playback is complete
    if (elapsed >= this.state.totalDuration) {
      this.state.isPlaying = false;
      this.analytics.completionRate = 1;
      this.emit('complete', this.state);
      return;
    }

    // Schedule next frame
    const nextFrameDelay = this.config.preserveTimingAccuracy ? 16 : 50; // 60fps or 20fps
    this.playbackTimer = setTimeout(() => this.startPlaybackLoop(), nextFrameDelay);

    this.emit('timeUpdate', {
      currentTime: this.state.currentTime,
      progress: this.state.progress
    });
  }

  /**
   * Process events that should occur up to the given time
   */
  private processEventsUpToTime(timeMs: number): void {
    if (!this.recording) return;

    while (
      this.state.currentEventIndex < this.recording.events.length &&
      this.recording.events[this.state.currentEventIndex].timestampMs <= timeMs
    ) {
      const event = this.recording.events[this.state.currentEventIndex];
      this.processEvent(event);
      this.state.currentEventIndex++;
    }
  }

  /**
   * Process a single keystroke event
   */
  private processEvent(event: PlaybackEvent): void {
    try {
      const { originalData } = event;
      console.log('🎬 Processing event:', event.sequenceNumber, event.eventType, originalData);
      
      switch (event.eventType) {
        case 'keydown':
        case 'keyup':
          this.processKeyEvent(originalData, event.eventType);
          break;
        case 'key':
          // Handle 'key' event type (which seems to be what's recorded)
          this.processKeyEvent(originalData, 'keydown');
          break;
        case 'input':
          this.processInputEvent(originalData);
          break;
        case 'paste':
          this.processPasteEvent(originalData);
          break;
        case 'cut':
          this.processCutEvent(originalData);
          break;
        case 'selection':
          this.processSelectionEvent(originalData);
          break;
        default:
          console.warn('Unknown event type:', event.eventType, originalData);
      }

      this.emit('eventProcessed', event);
      
    } catch (error) {
      console.error('Error processing event:', error, event);
    }
  }

  /**
   * Process key events (keydown/keyup)
   */
  private processKeyEvent(data: any, eventType: string): void {
    if (eventType === 'keydown') {
      this.handleKeyDown(data);
    }
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(data: any): void {
    const { key } = data;

    switch (key) {
      case 'Backspace':
        this.handleBackspace();
        break;
      case 'Delete':
        this.handleDelete();
        break;
      case 'Enter':
        this.handleEnter();
        break;
      case 'Tab':
        this.handleTab();
        break;
      default:
        // Regular character input is handled by input events
        break;
    }
  }

  /**
   * Process input events
   */
  private processInputEvent(data: any): void {
    console.log('⌨️ Processing input event:', data);
    
    // Handle both new format (inputType) and recorded format (key-based)
    if (data.inputType === 'insertText' && data.data) {
      console.log('⌨️ insertText with data:', data.data);
      this.insertText(data.data);
    } else if (data.inputType === 'deleteContentBackward') {
      console.log('⌨️ deleteContentBackward');
      this.handleBackspace();
    } else if (data.inputType === 'deleteContentForward') {
      console.log('⌨️ deleteContentForward');
      this.handleDelete();
    } else if (data.key && data.data && data.key !== 'Backspace' && data.key !== 'Delete' && data.key !== 'Enter' && data.key !== 'Tab') {
      // Handle recorded format: insert the character if it's a printable character
      if (data.data.length === 1 && data.data !== '\n' && data.data !== '\t') {
        console.log('⌨️ Single character from data:', data.data);
        this.insertText(data.data);
      } else if (data.key.length === 1) {
        // Fallback to key if data is not available
        console.log('⌨️ Single character from key:', data.key);
        this.insertText(data.key);
      }
    } else {
      console.log('⌨️ Unhandled input event:', data);
    }
  }

  /**
   * Process paste events
   */
  private processPasteEvent(data: any): void {
    if (data.clipboardData) {
      this.insertText(data.clipboardData);
    }
  }

  /**
   * Process cut events
   */
  private processCutEvent(data: any): void {
    if (data.selectionStart !== undefined && data.selectionEnd !== undefined) {
      this.deleteRange(data.selectionStart, data.selectionEnd);
    }
  }

  /**
   * Process selection events
   */
  private processSelectionEvent(data: any): void {
    if (this.cursorElement && data.selectionStart !== undefined) {
      this.updateCursorPosition(data.selectionStart);
    }
  }

  /**
   * Insert text at current cursor position
   */
  private insertText(text: string): void {
    console.log('📝 Inserting text:', JSON.stringify(text), 'Current content length:', this.currentContent.length);
    this.currentContent += text;
    console.log('📝 New content length:', this.currentContent.length, 'Preview:', this.currentContent.slice(-20));
    this.updateTargetElement(this.currentContent);
    
    this.contentHistory.push({
      time: this.state.currentTime,
      content: this.currentContent,
      cursor: this.currentContent.length
    });
  }

  /**
   * Handle backspace key
   */
  private handleBackspace(): void {
    if (this.currentContent.length > 0) {
      this.currentContent = this.currentContent.slice(0, -1);
      this.updateTargetElement(this.currentContent);
    }
  }

  /**
   * Handle delete key
   */
  private handleDelete(): void {
    this.handleBackspace();
  }

  /**
   * Handle enter key
   */
  private handleEnter(): void {
    this.insertText('\n');
  }

  /**
   * Handle tab key
   */
  private handleTab(): void {
    this.insertText('\t');
  }

  /**
   * Delete text in range
   */
  private deleteRange(start: number, end: number): void {
    this.currentContent = 
      this.currentContent.slice(0, start) + 
      this.currentContent.slice(end);
    this.updateTargetElement(this.currentContent);
  }

  /**
   * Update the target element content
   */
  private updateTargetElement(content: string): void {
    // Don't update DOM directly - let React handle it through events
    // Just emit a content change event
    this.emit('contentChanged', content);
    
    if (this.targetElement && this.config.highlightChanges) {
      this.highlightRecentChanges();
    }
  }

  /**
   * Highlight recent changes
   */
  private highlightRecentChanges(): void {
    if (this.targetElement) {
      this.targetElement.style.backgroundColor = '#fffacd';
      setTimeout(() => {
        if (this.targetElement) {
          this.targetElement.style.backgroundColor = '';
        }
      }, 200);
    }
  }

  /**
   * Create cursor element
   */
  private createCursor(): void {
    this.cursorElement = document.createElement('div');
    this.cursorElement.style.cssText = `
      position: absolute;
      width: 2px;
      height: 20px;
      background-color: #007acc;
      animation: blink 1s infinite;
      pointer-events: none;
      z-index: 1000;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update cursor position
   */
  private updateCursorPosition(position: number): void {
    if (this.cursorElement && this.targetElement) {
      const rect = this.targetElement.getBoundingClientRect();
      this.cursorElement.style.left = `${rect.left + position * 8}px`;
      this.cursorElement.style.top = `${rect.top}px`;
    }
  }

  /**
   * Cache events for performance
   */
  private cacheEvents(): void {
    if (!this.recording) return;

    this.eventCache.clear();
    this.recording.events.forEach((event, index) => {
      this.eventCache.set(index, event);
    });
  }

  /**
   * Find event index at specific time
   */
  private findEventIndexAtTime(timeMs: number): number {
    if (!this.recording) return 0;

    let left = 0;
    let right = this.recording.events.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const event = this.recording.events[mid];
      
      if (event.timestampMs <= timeMs) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return Math.max(0, right);
  }

  /**
   * Reconstruct content up to specific time
   */
  private reconstructContentUpToTime(timeMs: number): void {
    if (!this.recording) return;

    this.currentContent = '';
    this.lastProcessedIndex = -1;

    for (let i = 0; i < this.recording.events.length; i++) {
      const event = this.recording.events[i];
      if (event.timestampMs > timeMs) break;
      
      this.processEvent(event);
      this.lastProcessedIndex = i;
    }

    this.state.currentEventIndex = this.lastProcessedIndex + 1;
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.eventListeners.clear();
    this.eventCache.clear();
    this.contentHistory = [];
    
    if (this.cursorElement && this.cursorElement.parentNode) {
      this.cursorElement.parentNode.removeChild(this.cursorElement);
    }
  }
} 