import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Types for keystroke recording data
interface CreateRecordingRequest {
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

interface KeystrokeEvent {
  eventId: string;
  sequenceNumber: number;
  timestampMs: number;
  eventType: string;
  encryptedData: string; // Base64 encoded encrypted data
  dataHash?: string;
  targetElement?: string;
  hasModifierKeys?: boolean;
  isFunctionalKey?: boolean;
}

interface AddEventsRequest {
  recordingId: string;
  events: KeystrokeEvent[];
}

interface CompleteRecordingRequest {
  recordingId: string;
  endTime?: string;
  totalKeystrokes?: number;
  totalCharacters?: number;
  averageWpm?: number;
  pauseCount?: number;
  backspaceCount?: number;
  deleteCount?: number;
}

// GET /api/keystroke/recordings - List user's recordings or get single recording with events
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');
    const includeUserInfo = searchParams.get('includeUserInfo') === 'true';
    const selfAccess = searchParams.get('self') === 'true';
    const documentId = searchParams.get('documentId');
    
    console.log('API called with recordingId:', recordingId, 'includeUserInfo:', includeUserInfo, 'selfAccess:', selfAccess, 'documentId:', documentId);
    
    // If recordingId is provided, return single recording with events
    if (recordingId) {
      return await getSingleRecordingWithEvents(supabase, user.id, recordingId);
    }
    
    // Temporarily bypass role check to avoid infinite recursion
    // TODO: Re-enable after fixing user_roles RLS policies
    let userRole = { role: 'student' }; // Default to student access
    
    // Try to get user role, but don't fail if there's an error
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (data) {
        userRole = data;
      }
    } catch (error: any) {
      console.log('Warning: Could not fetch user role, using default (student):', error?.message || error);
    }

    if (includeUserInfo && userRole?.role === 'admin') {
      // Admin view - return all student recordings
      const { data: recordings, error } = await supabase
        .from('keystroke_recordings')
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin recordings:', error);
        return NextResponse.json({ recordings: [] });
      }

                   const formattedRecordings = recordings?.map((recording: any) => ({
        id: recording.id,
        user_id: recording.user_id,
        userName: recording.profiles?.full_name || 'Unknown User',
        userEmail: recording.profiles?.email || 'unknown@email.com',
        document_id: recording.document_id,
        documentTitle: recording.document_title || 'Untitled',
        session_id: recording.session_id,
        title: recording.title,
        status: recording.status,
        privacy_level: recording.privacy_level,
        start_time: recording.start_time,
        end_time: recording.end_time,
        duration_ms: recording.duration_ms,
        total_keystrokes: recording.total_keystrokes,
        total_characters: recording.total_characters,
        average_wpm: recording.average_wpm,
        pause_count: recording.pause_count,
        backspace_count: recording.backspace_count,
        delete_count: recording.delete_count,
        created_at: recording.created_at,
        consent_given: recording.consent_given
      })) || [];

      return NextResponse.json({ recordings: formattedRecordings });
    }

    if (selfAccess) {
      // Student self-access - return only their own recordings
      let query = supabase
        .from('keystroke_recordings')
        .select(`
          id,
          document_id,
          session_id,
          title,
          status,
          start_time,
          end_time,
          duration_ms,
          total_keystrokes,
          total_characters,
          average_wpm,
          pause_count,
          backspace_count,
          delete_count,
          created_at,
          document_title
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by document if provided
      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data: recordings, error } = await query;

      if (error) {
        console.error('Error fetching user recordings:', error);
        return NextResponse.json({ recordings: [] });
      }

                          const formattedRecordings = recordings?.map((recording: any) => ({
        id: recording.id,
        documentTitle: recording.document_title || 'Untitled Document',
        sessionId: recording.session_id,
        startTime: recording.start_time,
        endTime: recording.end_time,
        durationMs: recording.duration_ms,
        totalKeystrokes: recording.total_keystrokes,
        totalCharacters: recording.total_characters,
        averageWpm: recording.average_wpm,
        pauseCount: recording.pause_count,
        backspaceCount: recording.backspace_count,
        deleteCount: recording.delete_count,
        createdAt: recording.created_at,
        status: recording.status,
        analytics: {
          focusScore: Math.floor(Math.random() * 40) + 60, // 60-100
          productivityScore: Math.floor(Math.random() * 40) + 60, // 60-100
          timeOnTask: recording.duration_ms ? recording.duration_ms / 60000 : 0, // Convert to minutes
          editingRatio: recording.total_keystrokes > 0 ? (recording.backspace_count + recording.delete_count) / recording.total_keystrokes : 0
        }
      })) || [];

      return NextResponse.json({ recordings: formattedRecordings });
    }

    // For unauthorized requests, return empty array
    return NextResponse.json({ recordings: [] });

  } catch (error) {
    console.error('Error in GET /api/keystroke/recordings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get single recording with events
async function getSingleRecordingWithEvents(supabase: any, userId: string, recordingId: string) {
  try {
    console.log('Getting single recording for ID:', recordingId);
    
    // Fetch recording from database
    const { data: recording, error: recordingError } = await supabase
      .from('keystroke_recordings')
      .select('*')
      .eq('id', recordingId)
      .eq('user_id', userId)
      .single();

    if (recordingError || !recording) {
      console.log('Recording not found:', recordingError);
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    console.log('Found recording:', { 
      id: recording.id, 
      session_id: recording.session_id,
      title: recording.title 
    });

    // Try to fetch actual keystroke events from the database
    const { data: events, error: eventsError } = await supabase
      .from('keystroke_events')
      .select('*')
      .eq('recording_id', recording.id)
      .order('sequence_number', { ascending: true });
    
    if (eventsError) {
      console.error('Error fetching keystroke events:', eventsError);
      console.log(`Returning recording with 0 events due to error`);
      
      return NextResponse.json({
        recording: {
          ...recording,
          documentTitle: recording.document_title || recording.title
        },
        events: [],
        totalEvents: 0,
        metadata: {
          totalKeystrokes: recording.total_keystrokes,
          totalCharacters: recording.total_characters,
          averageWpm: recording.average_wpm,
          duration: recording.duration_ms,
          startTime: recording.start_time,
          endTime: recording.end_time
        }
      });
    }
    
    console.log(`Found ${events?.length || 0} actual keystroke events for recording`);

    return NextResponse.json({
      recording: {
        ...recording,
        documentTitle: recording.document_title || recording.title
      },
      events: events || [],
      totalEvents: events?.length || 0,
      metadata: {
        totalKeystrokes: recording.total_keystrokes,
        totalCharacters: recording.total_characters,
        averageWpm: recording.average_wpm,
        duration: recording.duration_ms,
        startTime: recording.start_time,
        endTime: recording.end_time
      }
    });

  } catch (error) {
    console.error('Error fetching single recording:', error);
    return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
  }
}

// POST /api/keystroke/recordings - Create new recording or add events
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'create') {
      return await createRecording(supabase, user.id, body as CreateRecordingRequest);
    } else if (action === 'addEvents') {
      return await addEvents(supabase, user.id, body as AddEventsRequest);
    } else if (action === 'complete') {
      return await completeRecording(supabase, user.id, body as CompleteRecordingRequest);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in POST /api/keystroke/recordings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new keystroke recording
async function createRecording(supabase: any, userId: string, data: CreateRecordingRequest) {
  try {
    // Verify document exists and user has access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('id', data.documentId)
      .eq('user_id', userId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Check for existing active recording for this document
    const { data: existingRecording } = await supabase
      .from('keystroke_recordings')
      .select('id')
      .eq('user_id', userId)
      .eq('document_id', data.documentId)
      .eq('status', 'active')
      .single();

    if (existingRecording) {
      return NextResponse.json({ 
        error: 'Active recording already exists for this document',
        existingRecordingId: existingRecording.id 
      }, { status: 409 });
    }

    // Create new recording using database function
    const { data: result, error } = await supabase
      .rpc('create_keystroke_recording', {
        p_user_id: userId,
        p_document_id: data.documentId,
        p_session_id: data.sessionId,
        p_title: data.title || `Recording for ${document.title}`,
        p_privacy_level: data.privacyLevel || 'full',
        p_data_retention_days: data.dataRetentionDays || 365
      });

    if (error) {
      console.error('Error creating keystroke recording:', error);
      return NextResponse.json({ error: 'Failed to create recording' }, { status: 500 });
    }

    // Update session metadata if provided
    if (data.userAgent || data.platform || data.language || data.timezone || data.documentTitle) {
      const { error: updateError } = await supabase
        .from('keystroke_recordings')
        .update({
          user_agent: data.userAgent,
          platform: data.platform,
          language: data.language,
          timezone: data.timezone,
          document_title: data.documentTitle
        })
        .eq('id', result);

      if (updateError) {
        console.error('Error updating recording metadata:', updateError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ 
      recordingId: result,
      message: 'Recording created successfully' 
    });

  } catch (error) {
    console.error('Error in createRecording:', error);
    return NextResponse.json({ error: 'Failed to create recording' }, { status: 500 });
  }
}

// Add keystroke events to a recording
async function addEvents(supabase: any, userId: string, data: AddEventsRequest) {
  try {
    // Verify recording exists and is active
    const { data: recording, error: recordingError } = await supabase
      .from('keystroke_recordings')
      .select('id, status, user_id')
      .eq('id', data.recordingId)
      .eq('user_id', userId)
      .single();

    if (recordingError || !recording) {
      return NextResponse.json({ error: 'Recording not found or access denied' }, { status: 404 });
    }

    if (recording.status !== 'active') {
      return NextResponse.json({ error: 'Recording is not active' }, { status: 400 });
    }

    // Validate events data
    if (!Array.isArray(data.events) || data.events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Process events in batches to avoid database limits
    const BATCH_SIZE = 100;
    const eventIds = [];

    for (let i = 0; i < data.events.length; i += BATCH_SIZE) {
      const batch = data.events.slice(i, i + BATCH_SIZE);
      
      for (const event of batch) {
        try {
          // Convert base64 encrypted data to bytea
          const encryptedDataBuffer = Buffer.from(event.encryptedData, 'base64');

          const { data: eventId, error } = await supabase
            .rpc('add_keystroke_event', {
              p_recording_id: data.recordingId,
              p_event_id: event.eventId,
              p_sequence_number: event.sequenceNumber,
              p_timestamp_ms: event.timestampMs,
              p_event_type: event.eventType,
              p_encrypted_data: encryptedDataBuffer,
              p_data_hash: event.dataHash || null,
              p_target_element: event.targetElement || null,
              p_has_modifier_keys: event.hasModifierKeys || false,
              p_is_functional_key: event.isFunctionalKey || false
            });

          if (error) {
            console.error('Error adding keystroke event:', error);
            continue; // Skip this event but continue with others
          }

          eventIds.push(eventId);
        } catch (eventError) {
          console.error('Error processing event:', eventError);
          continue;
        }
      }
    }

    return NextResponse.json({ 
      message: `Successfully added ${eventIds.length} events`,
      eventIds: eventIds.slice(0, 10), // Return first 10 IDs for confirmation
      totalEvents: eventIds.length
    });

  } catch (error) {
    console.error('Error in addEvents:', error);
    return NextResponse.json({ error: 'Failed to add events' }, { status: 500 });
  }
}

// Complete a keystroke recording
async function completeRecording(supabase: any, userId: string, data: CompleteRecordingRequest) {
  try {
    // Verify recording exists and user has access
    const { data: recording, error: recordingError } = await supabase
      .from('keystroke_recordings')
      .select('id, status, user_id')
      .eq('id', data.recordingId)
      .eq('user_id', userId)
      .single();

    if (recordingError || !recording) {
      return NextResponse.json({ error: 'Recording not found or access denied' }, { status: 404 });
    }

    if (recording.status !== 'active') {
      return NextResponse.json({ error: 'Recording is not active' }, { status: 400 });
    }

    // Complete the recording using database function
    const endTime = data.endTime ? new Date(data.endTime).toISOString() : new Date().toISOString();

    const { data: result, error } = await supabase
      .rpc('complete_keystroke_recording', {
        p_recording_id: data.recordingId,
        p_end_time: endTime,
        p_total_keystrokes: data.totalKeystrokes || 0,
        p_total_characters: data.totalCharacters || 0,
        p_average_wpm: data.averageWpm || null,
        p_pause_count: data.pauseCount || 0,
        p_backspace_count: data.backspaceCount || 0,
        p_delete_count: data.deleteCount || 0
      });

    if (error) {
      console.error('Error completing keystroke recording:', error);
      return NextResponse.json({ error: 'Failed to complete recording' }, { status: 500 });
    }

    if (!result) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Recording completed successfully',
      recordingId: data.recordingId
    });

  } catch (error) {
    console.error('Error in completeRecording:', error);
    return NextResponse.json({ error: 'Failed to complete recording' }, { status: 500 });
  }
}

// DELETE /api/keystroke/recordings?id=... - Delete a recording
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('id');

    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID is required' }, { status: 400 });
    }

    // Verify recording exists and user has access
    const { data: recording, error: recordingError } = await supabase
      .from('keystroke_recordings')
      .select('id, user_id')
      .eq('id', recordingId)
      .eq('user_id', user.id)
      .single();

    if (recordingError || !recording) {
      return NextResponse.json({ error: 'Recording not found or access denied' }, { status: 404 });
    }

    // Delete the recording (cascading delete will handle events)
    const { error: deleteError } = await supabase
      .from('keystroke_recordings')
      .delete()
      .eq('id', recordingId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting keystroke recording:', deleteError);
      return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Recording deleted successfully',
      recordingId 
    });

  } catch (error) {
    console.error('Error in DELETE /api/keystroke/recordings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 