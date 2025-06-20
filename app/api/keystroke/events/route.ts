/**
 * API endpoint for keystroke event storage and retrieval
 * Handles real-time keystroke data with encryption and privacy controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const { events, sessionId, userId } = body;

    // Validate required fields
    if (!events || !sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: events, sessionId, userId' },
        { status: 400 }
      );
    }

    // For demo purposes, just log the events
    // In a real implementation, this would:
    // 1. Validate user permissions
    // 2. Encrypt sensitive data
    // 3. Store events in database
    // 4. Update session statistics
    // 5. Trigger real-time analytics

    console.log(`Received ${events.length} keystroke events for session ${sessionId}`);
    console.log('Events preview:', events.slice(0, 3)); // Log first 3 events for debugging

    // Mock response
    return NextResponse.json({
      success: true,
      eventsProcessed: events.length,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Keystroke events processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process keystroke events' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');
    const userId = searchParams.get('userId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeDecrypted = searchParams.get('includeDecrypted') === 'true';

    if (!recordingId && !userId) {
      return NextResponse.json(
        { error: 'Either recordingId or userId is required' },
        { status: 400 }
      );
    }

    // For demo purposes, return mock keystroke events
    // In a real implementation, this would:
    // 1. Authenticate the user and check permissions
    // 2. Query database with proper filtering
    // 3. Decrypt data if authorized
    // 4. Apply privacy filters based on user role

    console.log(`Retrieving keystroke events for recording: ${recordingId || 'user: ' + userId}`);

    // Generate mock keystroke events
    const mockEvents = Array.from({ length: Math.min(limit, 100) }, (_, i) => {
      const timestamp = Date.now() - (100 - i) * 1000; // Events over last 100 seconds
      const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' ', 'Backspace'];
      const key = keys[Math.floor(Math.random() * keys.length)];
      
      return {
        id: `event-${recordingId || 'demo'}-${timestamp}-${i}`,
        recordingId: recordingId || `demo-recording-${userId}`,
        timestamp,
        encryptedData: includeDecrypted ? null : `encrypted_${key}_${timestamp}`,
        decryptedData: includeDecrypted ? {
          key,
          code: `Key${key.toUpperCase()}`,
          type: 'keydown',
          value: key.length === 1 ? key : undefined,
          cursorPosition: i
        } : null,
        privacyLevel: 'full',
        createdAt: new Date(timestamp).toISOString()
      };
    });

    // Apply time filtering if specified
    let filteredEvents = mockEvents;
    if (startTime) {
      const start = new Date(startTime).getTime();
      filteredEvents = filteredEvents.filter(event => event.timestamp >= start);
    }
    if (endTime) {
      const end = new Date(endTime).getTime();
      filteredEvents = filteredEvents.filter(event => event.timestamp <= end);
    }

    // Apply pagination
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      events: paginatedEvents,
      pagination: {
        total: filteredEvents.length,
        limit,
        offset,
        hasMore: offset + limit < filteredEvents.length
      },
      metadata: {
        recordingId: recordingId || `demo-recording-${userId}`,
        eventCount: paginatedEvents.length,
        timeRange: paginatedEvents.length > 0 ? {
          start: new Date(paginatedEvents[0].timestamp).toISOString(),
          end: new Date(paginatedEvents[paginatedEvents.length - 1].timestamp).toISOString()
        } : null,
        encrypted: !includeDecrypted,
        privacyLevel: 'full'
      }
    });

  } catch (error) {
    console.error('Error retrieving keystroke events:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve keystroke events' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordingId, eventIds, updates } = body;

    if (!recordingId || !Array.isArray(eventIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: recordingId, eventIds' },
        { status: 400 }
      );
    }

    // For demo purposes, simulate successful update
    // In a real implementation, this would:
    // 1. Authenticate the user and check permissions
    // 2. Validate the recording belongs to the user
    // 3. Update the specified events
    // 4. Log the update action

    console.log(`Updating ${eventIds.length} keystroke events for recording ${recordingId}`);

    const updatedEvents = eventIds.map((eventId: string) => ({
      id: eventId,
      recordingId,
      updatedAt: new Date().toISOString(),
      updates: updates || {}
    }));

    return NextResponse.json({
      success: true,
      message: `Updated ${eventIds.length} keystroke events`,
      events: updatedEvents
    });

  } catch (error) {
    console.error('Error updating keystroke events:', error);
    return NextResponse.json(
      { error: 'Failed to update keystroke events' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');
    const eventIds = searchParams.get('eventIds')?.split(',');
    const confirmDelete = searchParams.get('confirm') === 'true';

    if (!recordingId || (!eventIds && !confirmDelete)) {
      return NextResponse.json(
        { error: 'Missing required parameters: recordingId and (eventIds or confirm=true for all)' },
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
    // 1. Authenticate the user and check permissions
    // 2. Validate the recording belongs to the user or user is admin
    // 3. Securely delete the specified events or entire recording
    // 4. Log the deletion action
    // 5. Update recording statistics

    const deletedCount = eventIds ? eventIds.length : 100; // Mock count
    console.log(`Deleting ${deletedCount} keystroke events for recording ${recordingId}`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} keystroke events`,
      recordingId,
      deletedCount,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting keystroke events:', error);
    return NextResponse.json(
      { error: 'Failed to delete keystroke events' },
      { status: 500 }
    );
  }
} 