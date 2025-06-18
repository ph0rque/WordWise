/**
 * API endpoint for data retention policy management
 * Handles retention policies, data export requests, and secure deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import DataRetentionManager from '@/lib/keystroke/data-retention';

// GET - Retrieve retention status or policies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const recordingId = searchParams.get('recordingId');

    switch (action) {
      case 'status':
        if (!recordingId) {
          return NextResponse.json(
            { error: 'recordingId is required for status check' },
            { status: 400 }
          );
        }

        // Mock recording data for demo
        const createdAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const privacyLevel = 'full';
        
        const status = DataRetentionManager.calculateRetentionStatus(
          recordingId,
          createdAt,
          privacyLevel
        );

        return NextResponse.json({
          success: true,
          status
        });

      case 'policies':
        const policies = [
          DataRetentionManager.getRetentionPolicy('full'),
          DataRetentionManager.getRetentionPolicy('anonymized'),
          DataRetentionManager.getRetentionPolicy('metadata_only')
        ];

        return NextResponse.json({
          success: true,
          policies
        });

      case 'logs':
        if (!userId && !recordingId) {
          return NextResponse.json(
            { error: 'userId or recordingId is required for logs' },
            { status: 400 }
          );
        }

        const logs = await DataRetentionManager.getDataHandlingLogs(
          userId || undefined,
          recordingId || undefined
        );

        return NextResponse.json({
          success: true,
          logs
        });

      case 'compliance':
        const compliance = await DataRetentionManager.validateCompliance();
        
        return NextResponse.json({
          success: true,
          compliance
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, policies, logs, or compliance' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in data retention GET:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST - Create export or deletion requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, requestedBy, recordingIds, format, reason } = body;

    if (!action || !userId || !requestedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId, requestedBy' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'export':
        if (!Array.isArray(recordingIds) || recordingIds.length === 0) {
          return NextResponse.json(
            { error: 'recordingIds array is required for export' },
            { status: 400 }
          );
        }

        const exportRequest = await DataRetentionManager.createExportRequest(
          userId,
          requestedBy,
          recordingIds,
          format || 'json'
        );

        return NextResponse.json({
          success: true,
          exportRequest
        });

      case 'delete':
        if (!Array.isArray(recordingIds) || recordingIds.length === 0) {
          return NextResponse.json(
            { error: 'recordingIds array is required for deletion' },
            { status: 400 }
          );
        }

        if (!reason) {
          return NextResponse.json(
            { error: 'Deletion reason is required' },
            { status: 400 }
          );
        }

        const deletionRequest = await DataRetentionManager.createDeletionRequest(
          userId,
          requestedBy,
          recordingIds,
          reason
        );

        return NextResponse.json({
          success: true,
          deletionRequest
        });

      case 'anonymize':
        if (!recordingIds || !Array.isArray(recordingIds)) {
          return NextResponse.json(
            { error: 'recordingIds array is required for anonymization' },
            { status: 400 }
          );
        }

        const anonymizeResults = [];
        for (const recordingId of recordingIds) {
          const success = await DataRetentionManager.anonymizeRecording(recordingId);
          anonymizeResults.push({ recordingId, success });
        }

        return NextResponse.json({
          success: true,
          results: anonymizeResults
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: export, delete, or anonymize' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in data retention POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// PUT - Confirm deletion or update policies
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, requestId, confirmationCode } = body;

    switch (action) {
      case 'confirm-deletion':
        if (!requestId || !confirmationCode) {
          return NextResponse.json(
            { error: 'requestId and confirmationCode are required' },
            { status: 400 }
          );
        }

        const confirmed = await DataRetentionManager.confirmDeletion(
          requestId,
          confirmationCode
        );

        if (!confirmed) {
          return NextResponse.json(
            { error: 'Invalid confirmation code or request not found' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Deletion confirmed and will be processed'
        });

      case 'process-retention':
        // Manual trigger for retention policy processing
        const results = await DataRetentionManager.processRetentionPolicies();
        
        return NextResponse.json({
          success: true,
          results
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: confirm-deletion or process-retention' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in data retention PUT:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE - Emergency data deletion (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingIds = searchParams.get('recordingIds')?.split(',');
    const emergency = searchParams.get('emergency') === 'true';

    if (!recordingIds || recordingIds.length === 0) {
      return NextResponse.json(
        { error: 'recordingIds parameter is required' },
        { status: 400 }
      );
    }

    // In a real implementation, verify admin permissions here
    if (!emergency) {
      return NextResponse.json(
        { error: 'Emergency deletion requires emergency=true parameter' },
        { status: 400 }
      );
    }

    const result = await DataRetentionManager.secureDelete(recordingIds);

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      failed: result.failed,
      message: `Emergency deletion completed. ${result.deleted.length} deleted, ${result.failed.length} failed.`
    });

  } catch (error) {
    console.error('Error in emergency deletion:', error);
    return NextResponse.json(
      { error: 'Failed to process emergency deletion' },
      { status: 500 }
    );
  }
} 