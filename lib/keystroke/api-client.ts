/**
 * Keystroke Recording API Client
 * 
 * Provides a unified interface for all keystroke recording API operations
 * including session management, event storage, analytics, and data retention.
 */

export interface KeystrokeEvent {
  id?: string;
  key: string;
  code: string;
  type: 'keydown' | 'keyup';
  timestamp: number;
  value?: string;
  cursorPosition?: number;
}

export interface KeystrokeSession {
  id: string;
  userId: string;
  documentId: string;
  title?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  privacyLevel: 'full' | 'anonymized' | 'metadata_only';
  consentGiven: boolean;
  startTime: string;
  endTime?: string;
  lastActivity?: string;
  eventCount: number;
  metadata: {
    documentTitle?: string;
    assignmentType?: string;
    wordCount?: number;
    keystrokes?: number;
    duration?: number;
    averageWPM?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SessionAnalytics {
  sessionId: string;
  userId: string;
  documentId: string;
  totalDuration: number;
  activeWritingTime: number;
  totalKeystrokes: number;
  productiveKeystrokes: number;
  wordsPerMinute: number;
  charactersPerMinute: number;
  timeOnTask: number;
  focusScore: number;
  productivityScore: number;
  engagementScore: number;
  sessionType: 'focused' | 'distracted' | 'exploratory' | 'editing';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class KeystrokeApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/keystroke') {
    this.baseUrl = baseUrl;
  }

  /**
   * Session Management
   */
  
  async createSession(params: {
    userId: string;
    documentId: string;
    title?: string;
    privacyLevel?: 'full' | 'anonymized' | 'metadata_only';
    consentGiven: boolean;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<KeystrokeSession>> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create session' };
      }

      return { success: true, data: data.session, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error creating session' };
    }
  }

  async getSession(sessionId: string): Promise<ApiResponse<KeystrokeSession>> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get session' };
      }

      return { success: true, data: data.session };
    } catch (error) {
      return { success: false, error: 'Network error getting session' };
    }
  }

  async getSessions(params: {
    userId?: string;
    documentId?: string;
    status?: string;
  } & PaginationOptions): Promise<ApiResponse<PaginatedResponse<KeystrokeSession>>> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/sessions?${searchParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get sessions' };
      }

      return { 
        success: true, 
        data: { 
          items: data.sessions, 
          pagination: data.pagination 
        } 
      };
    } catch (error) {
      return { success: false, error: 'Network error getting sessions' };
    }
  }

  async updateSession(sessionId: string, updates: Partial<KeystrokeSession>): Promise<ApiResponse<KeystrokeSession>> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, updates })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update session' };
      }

      return { success: true, data: data.session, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error updating session' };
    }
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions?sessionId=${sessionId}&confirm=true`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to delete session' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error deleting session' };
    }
  }

  /**
   * Event Storage and Retrieval
   */

  async storeEvents(params: {
    recordingId: string;
    events: KeystrokeEvent[];
    sessionMetadata?: Record<string, any>;
    encryptionKey?: string;
    privacyLevel?: 'full' | 'anonymized' | 'metadata_only';
  }): Promise<ApiResponse<{ events: any[]; recordingId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to store events' };
      }

      return { success: true, data: { events: data.events, recordingId: data.recordingId }, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error storing events' };
    }
  }

  async getEvents(params: {
    recordingId?: string;
    userId?: string;
    startTime?: string;
    endTime?: string;
    includeDecrypted?: boolean;
  } & PaginationOptions): Promise<ApiResponse<{ events: any[]; metadata: any }>> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/events?${searchParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get events' };
      }

      return { success: true, data: { events: data.events, metadata: data.metadata } };
    } catch (error) {
      return { success: false, error: 'Network error getting events' };
    }
  }

  async updateEvents(params: {
    recordingId: string;
    eventIds: string[];
    updates: Record<string, any>;
  }): Promise<ApiResponse<{ events: any[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update events' };
      }

      return { success: true, data: { events: data.events }, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error updating events' };
    }
  }

  async deleteEvents(recordingId: string, eventIds?: string[]): Promise<ApiResponse<void>> {
    try {
      const params = new URLSearchParams({ recordingId, confirm: 'true' });
      if (eventIds) {
        params.append('eventIds', eventIds.join(','));
      }

      const response = await fetch(`${this.baseUrl}/events?${params}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to delete events' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error deleting events' };
    }
  }

  /**
   * Analytics
   */

  async analyzeSession(params: {
    sessionId: string;
    userId: string;
    documentId: string;
    events: KeystrokeEvent[];
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<SessionAnalytics>> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to analyze session' };
      }

      return { success: true, data: data.analytics };
    } catch (error) {
      return { success: false, error: 'Network error analyzing session' };
    }
  }

  async getAnalytics(params: {
    userId: string;
    documentId?: string;
    sessionIds?: string[];
  }): Promise<ApiResponse<{ analytics: SessionAnalytics[]; summary?: any }>> {
    try {
      const searchParams = new URLSearchParams({ userId });
      if (params.documentId) searchParams.append('documentId', params.documentId);
      if (params.sessionIds) searchParams.append('sessionIds', params.sessionIds.join(','));

      const response = await fetch(`${this.baseUrl}/analytics?${searchParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get analytics' };
      }

      return { success: true, data: { analytics: data.analytics, summary: data.summary } };
    } catch (error) {
      return { success: false, error: 'Network error getting analytics' };
    }
  }

  /**
   * Data Retention and Privacy
   */

  async getRetentionStatus(recordingId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/data-retention?action=status&recordingId=${recordingId}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get retention status' };
      }

      return { success: true, data: data.status };
    } catch (error) {
      return { success: false, error: 'Network error getting retention status' };
    }
  }

  async requestDataExport(params: {
    userId: string;
    recordingIds: string[];
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/data-retention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          userId: params.userId,
          requestedBy: params.userId,
          recordingIds: params.recordingIds,
          format: params.format || 'json'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to request data export' };
      }

      return { success: true, data: data.exportRequest };
    } catch (error) {
      return { success: false, error: 'Network error requesting data export' };
    }
  }

  async requestDataDeletion(params: {
    userId: string;
    recordingIds: string[];
    reason: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/data-retention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: params.userId,
          requestedBy: params.userId,
          recordingIds: params.recordingIds,
          reason: params.reason
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to request data deletion' };
      }

      return { success: true, data: data.deletionRequest };
    } catch (error) {
      return { success: false, error: 'Network error requesting data deletion' };
    }
  }

  /**
   * Convenience Methods
   */

  async startRecording(params: {
    userId: string;
    documentId: string;
    title?: string;
    privacyLevel?: 'full' | 'anonymized' | 'metadata_only';
    consentGiven: boolean;
  }): Promise<ApiResponse<KeystrokeSession>> {
    return this.createSession({
      ...params,
      metadata: {
        documentTitle: params.title,
        startTime: new Date().toISOString()
      }
    });
  }

  async stopRecording(sessionId: string): Promise<ApiResponse<KeystrokeSession>> {
    return this.updateSession(sessionId, {
      status: 'completed',
      endTime: new Date().toISOString()
    });
  }

  async pauseRecording(sessionId: string): Promise<ApiResponse<KeystrokeSession>> {
    return this.updateSession(sessionId, {
      status: 'paused',
      lastActivity: new Date().toISOString()
    });
  }

  async resumeRecording(sessionId: string): Promise<ApiResponse<KeystrokeSession>> {
    return this.updateSession(sessionId, {
      status: 'active',
      lastActivity: new Date().toISOString()
    });
  }

  /**
   * Batch Operations
   */

  async batchStoreEvents(
    recordingId: string, 
    eventBatches: KeystrokeEvent[][]
  ): Promise<ApiResponse<{ totalStored: number; batches: number }>> {
    try {
      let totalStored = 0;
      const batchResults = [];

      for (const events of eventBatches) {
        const result = await this.storeEvents({ recordingId, events });
        if (result.success) {
          totalStored += events.length;
          batchResults.push(result);
        } else {
          return { success: false, error: `Batch storage failed: ${result.error}` };
        }
      }

      return { 
        success: true, 
        data: { totalStored, batches: batchResults.length },
        message: `Successfully stored ${totalStored} events in ${batchResults.length} batches`
      };
    } catch (error) {
      return { success: false, error: 'Network error in batch storage' };
    }
  }

  /**
   * Health Check
   */

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: 'Health check failed' };
      }

      return { 
        success: true, 
        data: { 
          status: 'healthy', 
          timestamp: new Date().toISOString() 
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'Network error during health check',
        data: { 
          status: 'error', 
          timestamp: new Date().toISOString() 
        }
      };
    }
  }
}

// Export singleton instance
export const keystrokeApi = new KeystrokeApiClient();
export default keystrokeApi; 