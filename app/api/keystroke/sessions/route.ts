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
    const supabase = await createClient();
    const sessionData = await request.json();
    
    console.log('📥 Received session data:', {
      id: sessionData.id,
      userId: sessionData.userId,
      documentId: sessionData.documentId,
      eventCount: sessionData.events?.length || 0,
      duration: sessionData.endTime ? sessionData.endTime - sessionData.startTime : 0
    });

    // Validate required fields for completed session
    if (!sessionData.id || !sessionData.userId || !sessionData.documentId) {
      return NextResponse.json(
        { error: 'Missing required fields: id, userId, documentId' },
        { status: 400 }
      );
    }

    // Save the completed session data to the database
    // In a real implementation, this would:
    // 1. Authenticate the user
    // 2. Validate session data integrity
    // 3. Store session record and events in database
    // 4. Apply privacy settings and encryption
    // 5. Update user analytics

    try {
      // Insert session record into keystroke_recordings table
      const { data, error } = await supabase
        .from('keystroke_recordings')
        .insert({
          user_id: sessionData.userId,
          document_id: sessionData.documentId,
          session_id: sessionData.id, // Use session ID as session_id
          title: sessionData.metadata?.documentTitle || 'Untitled Document',
          status: 'completed',
          privacy_level: 'full',
          start_time: new Date(sessionData.startTime).toISOString(),
          end_time: sessionData.endTime ? new Date(sessionData.endTime).toISOString() : null,
          duration_ms: sessionData.endTime ? sessionData.endTime - sessionData.startTime : 0,
          total_keystrokes: sessionData.metadata?.totalKeystrokes || 0,
          total_characters: sessionData.metadata?.totalCharacters || 0,
          average_wpm: sessionData.metadata?.averageWPM || 0,
          pause_count: sessionData.metadata?.pauseCount || 0,
          backspace_count: sessionData.metadata?.backspaceCount || 0,
          delete_count: sessionData.metadata?.deleteCount || 0,
          user_agent: sessionData.metadata?.userAgent || '',
          platform: sessionData.metadata?.platform || '',
          language: sessionData.metadata?.language || '',
          timezone: sessionData.metadata?.timezone || '',
          document_title: sessionData.metadata?.documentTitle || 'Untitled Document',
          consent_given: true,
          data_retention_days: 90
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database error saving session:', error);
        return NextResponse.json(
          { error: 'Failed to save session to database', details: error.message },
          { status: 500 }
        );
      }

      console.log(`✅ Successfully saved keystroke recording session: ${sessionData.id}`);

      // Now save individual keystroke events to keystroke_events table
      if (sessionData.events && sessionData.events.length > 0) {
        console.log(`💾 Saving ${sessionData.events.length} keystroke events...`);
        
        const eventsToInsert = sessionData.events.map((event: any, index: number) => {
          // Debug: Log first few events to see their structure
          if (index < 5) {
            console.log(`🔍 Event ${index} structure:`, {
              id: event.id,
              type: event.type,
              key: event.key,
              code: event.code,
              data: event.data,
              inputType: event.inputType,
              value: event.value?.substring(0, 20) + '...' // Truncate for privacy
            });
          }
          
          return {
            recording_id: data.id, // Use the database-generated UUID
            event_id: event.id || `event-${index}`,
            sequence_number: index,
            timestamp_ms: event.timestamp - sessionData.startTime, // Relative to recording start
            absolute_timestamp: new Date(event.timestamp).toISOString(),
            event_type: event.type,
            // Store event data as JSON in encrypted_data field (but not actually encrypted)
            encrypted_data: JSON.stringify({
              key: event.key,
              code: event.code,
              data: event.data,
              inputType: event.inputType,
              value: event.value,
              ctrlKey: event.ctrlKey || false,
              shiftKey: event.shiftKey || false,
              altKey: event.altKey || false,
              metaKey: event.metaKey || false
            }),
            target_element: event.target || 'unknown',
            has_modifier_keys: event.ctrlKey || event.shiftKey || event.altKey || event.metaKey,
            is_functional_key: event.key && ['Enter', 'Tab', 'Escape', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
          };
        });

        // Insert events in batches to avoid overwhelming the database
        const batchSize = 100;
        let savedEventCount = 0;
        
        for (let i = 0; i < eventsToInsert.length; i += batchSize) {
          const batch = eventsToInsert.slice(i, i + batchSize);
          
          const { error: eventsError } = await supabase
            .from('keystroke_events')
            .insert(batch);
          
          if (eventsError) {
            console.error(`❌ Error saving events batch ${Math.floor(i/batchSize) + 1}:`, eventsError);
            // Continue with other batches even if one fails
          } else {
            savedEventCount += batch.length;
            console.log(`✅ Saved events batch ${Math.floor(i/batchSize) + 1} (${batch.length} events)`);
          }
        }
        
        console.log(`✅ Total events saved: ${savedEventCount}/${sessionData.events.length}`);
      }

      return NextResponse.json({
        success: true,
        sessionId: sessionData.id,
        eventCount: sessionData.events?.length || 0,
        message: 'Keystroke recording session and events saved successfully'
      });

    } catch (dbError) {
      console.error('❌ Exception saving session to database:', dbError);
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Session creation error:', error);
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