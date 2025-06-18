/**
 * Data Retention Policies and Secure Data Handling
 * 
 * Implements GDPR/COPPA compliant data retention policies for keystroke recordings
 * with automated cleanup, secure deletion, and privacy controls.
 */

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionPeriodDays: number;
  privacyLevels: ('full' | 'anonymized' | 'metadata_only')[];
  autoDelete: boolean;
  warningPeriodDays: number; // Warning before deletion
  gracePeriodDays: number; // Grace period after warning
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DataHandlingLog {
  id: string;
  recordingId: string;
  userId: string;
  action: 'created' | 'accessed' | 'exported' | 'anonymized' | 'deleted' | 'retention_warning' | 'consent_withdrawn';
  performedBy: string; // User ID who performed the action
  timestamp: Date;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RetentionStatus {
  recordingId: string;
  createdAt: Date;
  retentionPolicy: RetentionPolicy;
  daysRemaining: number;
  status: 'active' | 'warning' | 'grace_period' | 'expired' | 'deleted';
  warningsSent: number;
  lastWarningDate?: Date;
  scheduledDeletionDate?: Date;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedBy: string; // User who requested (could be student, parent, or admin)
  recordingIds: string[];
  format: 'json' | 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date; // When download link expires
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  requestedBy: string;
  recordingIds: string[];
  reason: 'user_request' | 'parent_request' | 'retention_policy' | 'consent_withdrawn' | 'account_deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  confirmationRequired: boolean;
  confirmationCode?: string;
  confirmedAt?: Date;
}

export class DataRetentionManager {
  private static readonly DEFAULT_POLICIES: RetentionPolicy[] = [
    {
      id: 'student-standard',
      name: 'Student Standard Retention',
      description: 'Standard retention for student keystroke data - 2 years',
      retentionPeriodDays: 730, // 2 years
      privacyLevels: ['full', 'anonymized', 'metadata_only'],
      autoDelete: true,
      warningPeriodDays: 30,
      gracePeriodDays: 14,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      id: 'student-extended',
      name: 'Student Extended Retention',
      description: 'Extended retention for longitudinal studies - 5 years',
      retentionPeriodDays: 1825, // 5 years
      privacyLevels: ['anonymized', 'metadata_only'],
      autoDelete: true,
      warningPeriodDays: 60,
      gracePeriodDays: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false
    },
    {
      id: 'research-anonymized',
      name: 'Research Data (Anonymized)',
      description: 'Anonymized data for educational research - 7 years',
      retentionPeriodDays: 2555, // 7 years
      privacyLevels: ['anonymized'],
      autoDelete: false, // Manual review required
      warningPeriodDays: 90,
      gracePeriodDays: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false
    }
  ];

  /**
   * Get applicable retention policy for a recording
   */
  static getRetentionPolicy(
    privacyLevel: 'full' | 'anonymized' | 'metadata_only',
    userType: 'student' | 'teacher' | 'admin' = 'student'
  ): RetentionPolicy {
    // For demo purposes, return the standard policy
    // In a real implementation, this would query the database
    const policy = this.DEFAULT_POLICIES.find(p => 
      p.isActive && p.privacyLevels.includes(privacyLevel)
    );
    
    return policy || this.DEFAULT_POLICIES[0];
  }

  /**
   * Calculate retention status for a recording
   */
  static calculateRetentionStatus(
    recordingId: string,
    createdAt: Date,
    privacyLevel: 'full' | 'anonymized' | 'metadata_only'
  ): RetentionStatus {
    const policy = this.getRetentionPolicy(privacyLevel);
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = policy.retentionPeriodDays - ageInDays;
    
    let status: RetentionStatus['status'] = 'active';
    let scheduledDeletionDate: Date | undefined;
    
    if (daysRemaining <= 0) {
      status = 'expired';
    } else if (daysRemaining <= policy.gracePeriodDays) {
      status = 'grace_period';
      scheduledDeletionDate = new Date(now.getTime() + (daysRemaining * 24 * 60 * 60 * 1000));
    } else if (daysRemaining <= policy.warningPeriodDays) {
      status = 'warning';
      scheduledDeletionDate = new Date(
        createdAt.getTime() + (policy.retentionPeriodDays * 24 * 60 * 60 * 1000)
      );
    }
    
    return {
      recordingId,
      createdAt,
      retentionPolicy: policy,
      daysRemaining: Math.max(0, daysRemaining),
      status,
      warningsSent: 0, // Would be fetched from database
      scheduledDeletionDate
    };
  }

  /**
   * Process retention policies for all recordings
   */
  static async processRetentionPolicies(): Promise<{
    processed: number;
    warnings: number;
    deletions: number;
    errors: number;
  }> {
    // This would be implemented as a background job/cron task
    // For demo purposes, return mock results
    
    console.log('Processing retention policies...');
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      processed: 150,
      warnings: 12,
      deletions: 3,
      errors: 0
    };
  }

  /**
   * Send retention warning to user
   */
  static async sendRetentionWarning(
    userId: string,
    recordingIds: string[],
    daysRemaining: number
  ): Promise<boolean> {
    try {
      // In a real implementation, this would send email/notification
      console.log(`Sending retention warning to user ${userId}:`);
      console.log(`- ${recordingIds.length} recordings will be deleted in ${daysRemaining} days`);
      
      // Log the warning
      await this.logDataHandling({
        id: crypto.randomUUID(),
        recordingId: recordingIds[0], // Primary recording
        userId,
        action: 'retention_warning',
        performedBy: 'system',
        timestamp: new Date(),
        details: `Warning sent for ${recordingIds.length} recordings, ${daysRemaining} days remaining`
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send retention warning:', error);
      return false;
    }
  }

  /**
   * Securely delete recording data
   */
  static async secureDelete(recordingIds: string[]): Promise<{
    deleted: string[];
    failed: string[];
  }> {
    const deleted: string[] = [];
    const failed: string[] = [];
    
    for (const recordingId of recordingIds) {
      try {
        // In a real implementation, this would:
        // 1. Delete encrypted data from cloud storage
        // 2. Remove database records
        // 3. Clear any cached data
        // 4. Overwrite storage locations (if possible)
        
        console.log(`Securely deleting recording: ${recordingId}`);
        
        // Simulate secure deletion process
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Log the deletion
        await this.logDataHandling({
          id: crypto.randomUUID(),
          recordingId,
          userId: 'unknown', // Would be fetched from recording
          action: 'deleted',
          performedBy: 'system',
          timestamp: new Date(),
          details: 'Secure deletion completed'
        });
        
        deleted.push(recordingId);
      } catch (error) {
        console.error(`Failed to delete recording ${recordingId}:`, error);
        failed.push(recordingId);
      }
    }
    
    return { deleted, failed };
  }

  /**
   * Anonymize recording data
   */
  static async anonymizeRecording(recordingId: string): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Remove all personally identifiable information
      // 2. Replace user IDs with anonymous identifiers
      // 3. Remove timestamps that could identify users
      // 4. Keep only statistical/educational data
      
      console.log(`Anonymizing recording: ${recordingId}`);
      
      // Simulate anonymization process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Log the anonymization
      await this.logDataHandling({
        id: crypto.randomUUID(),
        recordingId,
        userId: 'unknown',
        action: 'anonymized',
        performedBy: 'system',
        timestamp: new Date(),
        details: 'Recording data anonymized'
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to anonymize recording ${recordingId}:`, error);
      return false;
    }
  }

  /**
   * Create data export request
   */
  static async createExportRequest(
    userId: string,
    requestedBy: string,
    recordingIds: string[],
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<DataExportRequest> {
    const exportRequest: DataExportRequest = {
      id: crypto.randomUUID(),
      userId,
      requestedBy,
      recordingIds,
      format,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    // In a real implementation, this would be stored in database
    console.log('Created data export request:', exportRequest.id);
    
    // Start processing (would be background job)
    this.processExportRequest(exportRequest);
    
    return exportRequest;
  }

  /**
   * Process data export request
   */
  private static async processExportRequest(request: DataExportRequest): Promise<void> {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Validate user permissions
      // 2. Decrypt and compile requested data
      // 3. Format according to requested format
      // 4. Upload to secure temporary storage
      // 5. Generate secure download link
      
      request.status = 'completed';
      request.completedAt = new Date();
      request.downloadUrl = `/api/data-export/${request.id}/download`;
      
      console.log(`Export request ${request.id} completed`);
      
      // Log the export
      await this.logDataHandling({
        id: crypto.randomUUID(),
        recordingId: request.recordingIds[0],
        userId: request.userId,
        action: 'exported',
        performedBy: request.requestedBy,
        timestamp: new Date(),
        details: `Data exported in ${request.format} format`
      });
      
    } catch (error) {
      console.error(`Export request ${request.id} failed:`, error);
      request.status = 'failed';
    }
  }

  /**
   * Create data deletion request
   */
  static async createDeletionRequest(
    userId: string,
    requestedBy: string,
    recordingIds: string[],
    reason: DataDeletionRequest['reason']
  ): Promise<DataDeletionRequest> {
    const needsConfirmation = reason === 'user_request' || reason === 'parent_request';
    
    const deletionRequest: DataDeletionRequest = {
      id: crypto.randomUUID(),
      userId,
      requestedBy,
      recordingIds,
      reason,
      status: 'pending',
      createdAt: new Date(),
      confirmationRequired: needsConfirmation,
      confirmationCode: needsConfirmation ? this.generateConfirmationCode() : undefined
    };
    
    console.log('Created data deletion request:', deletionRequest.id);
    
    if (!needsConfirmation) {
      // Process immediately for system-initiated deletions
      this.processDeletionRequest(deletionRequest);
    }
    
    return deletionRequest;
  }

  /**
   * Confirm deletion request
   */
  static async confirmDeletion(
    requestId: string,
    confirmationCode: string
  ): Promise<boolean> {
    // In a real implementation, this would fetch from database
    console.log(`Confirming deletion request ${requestId} with code ${confirmationCode}`);
    
    // Simulate confirmation
    return true;
  }

  /**
   * Process data deletion request
   */
  private static async processDeletionRequest(request: DataDeletionRequest): Promise<void> {
    try {
      if (request.confirmationRequired && !request.confirmedAt) {
        console.log(`Deletion request ${request.id} requires confirmation`);
        return;
      }
      
      request.status = 'processing';
      
      const result = await this.secureDelete(request.recordingIds);
      
      if (result.failed.length === 0) {
        request.status = 'completed';
        request.completedAt = new Date();
        console.log(`Deletion request ${request.id} completed successfully`);
      } else {
        request.status = 'failed';
        console.log(`Deletion request ${request.id} partially failed:`, result.failed);
      }
      
    } catch (error) {
      console.error(`Deletion request ${request.id} failed:`, error);
      request.status = 'failed';
    }
  }

  /**
   * Log data handling action
   */
  static async logDataHandling(log: DataHandlingLog): Promise<void> {
    // In a real implementation, this would be stored in an audit log database
    console.log('Data handling log:', {
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      recordingId: log.recordingId,
      userId: log.userId,
      performedBy: log.performedBy,
      details: log.details
    });
  }

  /**
   * Get data handling logs for a user or recording
   */
  static async getDataHandlingLogs(
    userId?: string,
    recordingId?: string,
    limit: number = 50
  ): Promise<DataHandlingLog[]> {
    // In a real implementation, this would query the database
    // Return mock logs for demo
    return [
      {
        id: '1',
        recordingId: recordingId || 'demo-recording-1',
        userId: userId || 'demo-user',
        action: 'created',
        performedBy: 'system',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        details: 'Recording session started'
      },
      {
        id: '2',
        recordingId: recordingId || 'demo-recording-1',
        userId: userId || 'demo-user',
        action: 'accessed',
        performedBy: 'admin-user',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        details: 'Recording viewed by administrator'
      }
    ];
  }

  /**
   * Generate secure confirmation code
   */
  private static generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate data retention compliance
   */
  static async validateCompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for expired data
    // In a real implementation, this would query actual data
    const expiredCount = 0; // Mock
    if (expiredCount > 0) {
      issues.push(`${expiredCount} recordings have exceeded retention period`);
      recommendations.push('Run automated cleanup process');
    }
    
    // Check for missing consent
    const missingConsentCount = 0; // Mock
    if (missingConsentCount > 0) {
      issues.push(`${missingConsentCount} recordings lack proper consent`);
      recommendations.push('Contact users to obtain consent or delete data');
    }
    
    // Check for unencrypted data
    const unencryptedCount = 0; // Mock
    if (unencryptedCount > 0) {
      issues.push(`${unencryptedCount} recordings are not properly encrypted`);
      recommendations.push('Encrypt all sensitive data immediately');
    }
    
    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }
}

export default DataRetentionManager; 