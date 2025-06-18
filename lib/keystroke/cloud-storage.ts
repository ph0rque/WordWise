import { encrypt, hashString, generateSecureId } from '../utils/encryption';

/**
 * Cloud Storage Manager for Keystroke Recordings
 * 
 * Handles secure storage of encrypted keystroke data with:
 * - End-to-end encryption
 * - Automatic batching and compression
 * - Privacy controls and data retention
 * - Error handling and retry logic
 */

export interface StorageConfig {
  batchSize: number;
  uploadInterval: number; // milliseconds
  maxRetries: number;
  compressionEnabled: boolean;
  privacyLevel: 'full' | 'anonymized' | 'metadata_only';
  dataRetentionDays: number;
}

export interface RecordingMetadata {
  documentId: string;
  sessionId: string;
  title?: string;
  privacyLevel?: 'full' | 'anonymized' | 'metadata_only';
  dataRetentionDays?: number;
  userAgent?: string;
  platform?: string;
  language?: string;
  timezone?: string;
  documentTitle?: string;
}

export interface KeystrokeEventData {
  eventId: string;
  sequenceNumber: number;
  timestampMs: number;
  eventType: string;
  originalData: any; // Raw event data before encryption
  targetElement?: string;
  hasModifierKeys?: boolean;
  isFunctionalKey?: boolean;
}

export interface UploadBatch {
  events: KeystrokeEventData[];
  batchId: string;
  timestamp: number;
  compressed: boolean;
}

export class CloudStorageManager {
  private config: StorageConfig;
  private activeRecordingId: string | null = null;
  private pendingEvents: KeystrokeEventData[] = [];
  private uploadQueue: UploadBatch[] = [];
  private uploadTimer: NodeJS.Timeout | null = null;
  private isUploading = false;
  
  // Error handling and retry
  private retryCount = 0;
  private lastUploadError: Error | null = null;
  
  // Analytics tracking
  private stats = {
    totalEvents: 0,
    totalUploads: 0,
    failedUploads: 0,
    bytesUploaded: 0,
    lastUploadTime: 0
  };

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      batchSize: 50,
      uploadInterval: 5000, // 5 seconds
      maxRetries: 3,
      compressionEnabled: true,
      privacyLevel: 'full',
      dataRetentionDays: 365,
      ...config
    };
  }

  /**
   * Start a new recording session
   */
  async startRecording(metadata: RecordingMetadata): Promise<string> {
    try {
      // Stop any existing recording
      if (this.activeRecordingId) {
        await this.stopRecording();
      }

      // Create new recording via API
      const response = await fetch('/api/keystroke/recordings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...metadata,
          privacyLevel: metadata.privacyLevel || this.config.privacyLevel,
          dataRetentionDays: metadata.dataRetentionDays || this.config.dataRetentionDays
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create recording');
      }

      const result = await response.json();
      this.activeRecordingId = result.recordingId;
      
      // Reset state
      this.pendingEvents = [];
      this.uploadQueue = [];
      this.retryCount = 0;
      this.lastUploadError = null;
      
      // Start upload timer
      this.startUploadTimer();
      
      console.log(`Keystroke recording started: ${this.activeRecordingId}`);
      return this.activeRecordingId;
      
    } catch (error) {
      console.error('Error starting keystroke recording:', error);
      throw error;
    }
  }

  /**
   * Add keystroke event to the recording
   */
  async addEvent(eventData: KeystrokeEventData): Promise<void> {
    if (!this.activeRecordingId) {
      throw new Error('No active recording session');
    }

    try {
      // Apply privacy filtering based on configuration
      const filteredData = this.applyPrivacyFilter(eventData);
      
      // Add to pending events
      this.pendingEvents.push(filteredData);
      this.stats.totalEvents++;
      
      // Check if we should upload immediately (batch size reached)
      if (this.pendingEvents.length >= this.config.batchSize) {
        await this.uploadPendingEvents();
      }
      
    } catch (error) {
      console.error('Error adding keystroke event:', error);
      // Don't throw - we want to continue recording even if one event fails
    }
  }

  /**
   * Stop the current recording session
   */
  async stopRecording(finalStats?: {
    totalKeystrokes?: number;
    totalCharacters?: number;
    averageWpm?: number;
    pauseCount?: number;
    backspaceCount?: number;
    deleteCount?: number;
  }): Promise<void> {
    if (!this.activeRecordingId) {
      return;
    }

    const recordingId = this.activeRecordingId!; // Store before clearing (we already checked for null)

    try {
      // Stop upload timer
      if (this.uploadTimer) {
        clearInterval(this.uploadTimer);
        this.uploadTimer = null;
      }
      
      // Upload any remaining events
      if (this.pendingEvents.length > 0) {
        await this.uploadPendingEvents();
      }
      
      // Process any remaining upload queue
      await this.processUploadQueue();
      
      // Complete the recording via API
      const response = await fetch('/api/keystroke/recordings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete',
          recordingId: recordingId,
          endTime: new Date().toISOString(),
          ...finalStats
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error completing recording:', error.error);
        // Don't throw - recording data is already saved
      }
      
      console.log(`Keystroke recording completed: ${this.activeRecordingId}`);
      console.log('Recording stats:', this.stats);
      
    } catch (error) {
      console.error('Error stopping keystroke recording:', error);
    } finally {
      this.activeRecordingId = null;
      this.pendingEvents = [];
      this.uploadQueue = [];
    }
  }

  /**
   * Get current recording status
   */
  getStatus() {
    return {
      isRecording: !!this.activeRecordingId,
      recordingId: this.activeRecordingId,
      pendingEvents: this.pendingEvents.length,
      uploadQueueSize: this.uploadQueue.length,
      isUploading: this.isUploading,
      stats: { ...this.stats },
      lastError: this.lastUploadError?.message || null,
      config: { ...this.config }
    };
  }

  /**
   * Apply privacy filtering based on configuration
   */
  private applyPrivacyFilter(eventData: KeystrokeEventData): KeystrokeEventData {
    const filtered = { ...eventData };
    
    switch (this.config.privacyLevel) {
      case 'metadata_only':
        // Only keep timing and structural data
        filtered.originalData = {
          type: eventData.originalData.type,
          timestamp: eventData.originalData.timestamp,
          target: eventData.targetElement || 'editor'
        };
        break;
        
      case 'anonymized':
        // Remove specific key values but keep structure
        if (filtered.originalData.key) {
          filtered.originalData.key = this.anonymizeKey(filtered.originalData.key);
        }
        if (filtered.originalData.data) {
          filtered.originalData.data = '[REDACTED]';
        }
        break;
        
      case 'full':
      default:
        // Keep all data (will be encrypted)
        break;
    }
    
    return filtered;
  }

  /**
   * Anonymize key data while preserving structure
   */
  private anonymizeKey(key: string): string {
    // Preserve functional keys
    const functionalKeys = [
      'Enter', 'Tab', 'Escape', 'Backspace', 'Delete',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown',
      'Shift', 'Control', 'Alt', 'Meta'
    ];
    
    if (functionalKeys.includes(key)) {
      return key;
    }
    
    // Replace letters with 'X', numbers with '0', others with '*'
    if (/^[a-zA-Z]$/.test(key)) return 'X';
    if (/^[0-9]$/.test(key)) return '0';
    if (key === ' ') return ' ';
    return '*';
  }

  /**
   * Start the upload timer for periodic uploads
   */
  private startUploadTimer(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }
    
    this.uploadTimer = setInterval(() => {
      if (this.pendingEvents.length > 0 && !this.isUploading) {
        this.uploadPendingEvents().catch(error => {
          console.error('Periodic upload failed:', error);
        });
      }
    }, this.config.uploadInterval);
  }

  /**
   * Upload pending events to the server
   */
  private async uploadPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0 || this.isUploading) {
      return;
    }

    this.isUploading = true;
    
    try {
      // Create batch
      const batch: UploadBatch = {
        events: [...this.pendingEvents],
        batchId: this.generateBatchId(),
        timestamp: Date.now(),
        compressed: this.config.compressionEnabled
      };
      
      // Clear pending events
      this.pendingEvents = [];
      
      // Add to upload queue
      this.uploadQueue.push(batch);
      
      // Process upload queue
      await this.processUploadQueue();
      
    } catch (error) {
      console.error('Error uploading events:', error);
      this.lastUploadError = error as Error;
      this.stats.failedUploads++;
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Process the upload queue
   */
  private async processUploadQueue(): Promise<void> {
    while (this.uploadQueue.length > 0) {
      const batch = this.uploadQueue[0];
      
      try {
        await this.uploadBatch(batch);
        this.uploadQueue.shift(); // Remove successful batch
        this.retryCount = 0; // Reset retry count on success
        
      } catch (error) {
        console.error('Batch upload failed:', error);
        
        if (this.retryCount < this.config.maxRetries) {
          this.retryCount++;
          console.log(`Retrying upload (${this.retryCount}/${this.config.maxRetries})`);
          await this.delay(1000 * this.retryCount); // Exponential backoff
        } else {
          console.error('Max retries exceeded, dropping batch');
          this.uploadQueue.shift(); // Drop failed batch
          this.retryCount = 0;
          this.stats.failedUploads++;
        }
        break; // Stop processing queue on error
      }
    }
  }

  /**
   * Upload a single batch of events
   */
  private async uploadBatch(batch: UploadBatch): Promise<void> {
    if (!this.activeRecordingId) {
      throw new Error('No active recording session');
    }

    // Encrypt events
    const encryptedEvents = await Promise.all(
      batch.events.map(async (event, index) => {
        const dataToEncrypt = JSON.stringify(event.originalData);
        const encryptedData = await encrypt(dataToEncrypt);
        const dataHash = await hashString(dataToEncrypt);
        
        return {
          eventId: event.eventId,
          sequenceNumber: event.sequenceNumber,
          timestampMs: event.timestampMs,
          eventType: event.eventType,
          encryptedData: encryptedData, // Base64 string
          dataHash: dataHash,
          targetElement: event.targetElement,
          hasModifierKeys: event.hasModifierKeys,
          isFunctionalKey: event.isFunctionalKey
        };
      })
    );

    // Upload to API
    const response = await fetch('/api/keystroke/recordings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addEvents',
        recordingId: this.activeRecordingId,
        events: encryptedEvents
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload events');
    }

    const result = await response.json();
    
    // Update stats
    this.stats.totalUploads++;
    this.stats.bytesUploaded += JSON.stringify(encryptedEvents).length;
    this.stats.lastUploadTime = Date.now();
    
    console.log(`Uploaded batch: ${result.totalEvents} events`);
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${generateSecureId(8)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user's recording history
   */
  async getRecordingHistory(options: {
    status?: string;
    documentId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.documentId) params.append('documentId', options.documentId);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`/api/keystroke/recordings?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recordings');
      }

      const result = await response.json();
      return result.recordings || [];
      
    } catch (error) {
      console.error('Error fetching recording history:', error);
      throw error;
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      const response = await fetch(`/api/keystroke/recordings?id=${recordingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete recording');
      }

      console.log(`Recording deleted: ${recordingId}`);
      
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  /**
   * Update storage configuration
   */
  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart upload timer if interval changed
    if (newConfig.uploadInterval && this.uploadTimer) {
      this.startUploadTimer();
    }
  }
} 