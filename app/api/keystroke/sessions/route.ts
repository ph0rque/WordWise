/**
 * API endpoint for keystroke recording session management
 * Handles session creation, updates, and lifecycle management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface KeystrokeSession {
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { 
      userId, 
      documentId, 
      title,
      privacyLevel = 'full',
      consentGiven = false,
      metadata = {}
    } = body;

    // Validate required fields
    if (!userId || !documentId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, documentId' },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: 'User consent is required to start keystroke recording' },
        { status: 400 }
      );
    }

    // For demo purposes, create a mock session
    // In a real implementation, this would:
    // 1. Authenticate the user
    // 2. Validate consent and privacy settings
    // 3. Create session record in database
    // 4. Initialize encryption keys
    // 5. Set up real-time event streaming

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const session: KeystrokeSession = {
      id: sessionId,
      userId,
      documentId,
      title: title || 'Untitled Document',
      status: 'active',
      privacyLevel,
      consentGiven,
      startTime: now,
      eventCount: 0,
      metadata: {
        documentTitle: metadata.documentTitle || 'Untitled Document',
        assignmentType: metadata.assignmentType || 'essay',
        wordCount: 0,
        keystrokes: 0,
        duration: 0,
        averageWPM: 0
      },
      createdAt: now,
      updatedAt: now
    };

    console.log(`Created keystroke recording session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      session,
      message: 'Keystroke recording session started successfully'
    });

  } catch (error) {
    console.error('Error creating keystroke session:', error);
    return NextResponse.json(
      { error: 'Failed to create keystroke recording session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // For demo purposes, return mock sessions
    // In a real implementation, this would:
    // 1. Authenticate the user
    // 2. Query database with proper filtering
    // 3. Apply user permissions and privacy settings
    // 4. Return paginated results

    if (sessionId) {
      // Return specific session
      const session: KeystrokeSession = {
        id: sessionId,
        userId: userId || 'demo-user',
        documentId: documentId || 'demo-document',
        title: 'Sample Essay',
        status: 'completed',
        privacyLevel: 'full',
        consentGiven: true,
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        lastActivity: new Date(Date.now() - 600000).toISOString(),
        eventCount: 1247,
        metadata: {
          documentTitle: 'Sample Essay',
          assignmentType: 'essay',
          wordCount: 342,
          keystrokes: 1247,
          duration: 3000, // 50 minutes
          averageWPM: 22.5
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 600000).toISOString()
      };

      return NextResponse.json({
        success: true,
        session
      });
    }

    // Return list of sessions
    const mockSessions: KeystrokeSession[] = [
      {
        id: 'session-1',
        userId: userId || 'demo-user',
        documentId: 'doc-1',
        title: 'Essay Draft 1',
        status: 'completed',
        privacyLevel: 'full',
        consentGiven: true,
        startTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        endTime: new Date(Date.now() - 82800000).toISOString(),
        lastActivity: new Date(Date.now() - 82800000).toISOString(),
        eventCount: 892,
        metadata: {
          documentTitle: 'Essay Draft 1',
          assignmentType: 'essay',
          wordCount: 278,
          keystrokes: 892,
          duration: 3600, // 60 minutes
          averageWPM: 18.5
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 82800000).toISOString()
      },
      {
        id: 'session-2',
        userId: userId || 'demo-user',
        documentId: 'doc-2',
        title: 'Research Notes',
        status: 'active',
        privacyLevel: 'anonymized',
        consentGiven: true,
        startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        lastActivity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        eventCount: 456,
        metadata: {
          documentTitle: 'Research Notes',
          assignmentType: 'notes',
          wordCount: 145,
          keystrokes: 456,
          duration: 1500, // 25 minutes
          averageWPM: 24.2
        },
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 300000).toISOString()
      }
    ];

    // Apply filters
    let filteredSessions = mockSessions;
    if (userId) {
      filteredSessions = filteredSessions.filter(s => s.userId === userId);
    }
    if (documentId) {
      filteredSessions = filteredSessions.filter(s => s.documentId === documentId);
    }
    if (status) {
      filteredSessions = filteredSessions.filter(s => s.status === status);
    }

    // Apply pagination
    const paginatedSessions = filteredSessions.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      sessions: paginatedSessions,
      pagination: {
        total: filteredSessions.length,
        limit,
        offset,
        hasMore: offset + limit < filteredSessions.length
      }
    });

  } catch (error) {
    console.error('Error retrieving keystroke sessions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve keystroke sessions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // For demo purposes, simulate successful update
    // In a real implementation, this would:
    // 1. Authenticate the user
    // 2. Validate session ownership
    // 3. Update session record in database
    // 4. Handle status transitions (active -> paused -> completed)
    // 5. Update session statistics

    const allowedUpdates = ['status', 'title', 'privacyLevel', 'metadata', 'endTime'];
    const validUpdates = Object.keys(updates).filter(key => allowedUpdates.includes(key));

    if (validUpdates.length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    console.log(`Updating session ${sessionId} with:`, validUpdates);

    const updatedSession = {
      id: sessionId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: `Session updated successfully`
    });

  } catch (error) {
    console.error('Error updating keystroke session:', error);
    return NextResponse.json(
      { error: 'Failed to update keystroke session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const confirmDelete = searchParams.get('confirm') === 'true';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Deletion requires confirm=true parameter for safety' },
        { status: 400 }
      );
    }

    // For demo purposes, simulate successful deletion
    // In a real implementation, this would:
    // 1. Authenticate the user
    // 2. Validate session ownership or admin permissions
    // 3. Securely delete session and all associated events
    // 4. Clean up encryption keys
    // 5. Log the deletion action

    console.log(`Deleting keystroke session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      sessionId,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting keystroke session:', error);
    return NextResponse.json(
      { error: 'Failed to delete keystroke session' },
      { status: 500 }
    );
  }
} 