import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Helper function to create authenticated Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  });
}

// GET /api/keystroke/recordings - List user's recordings or get single recording with events
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, we'll bypass authentication and return mock data
    // In production, proper authentication would be required
    
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');
    const includeUserInfo = searchParams.get('includeUserInfo') === 'true';
    
    console.log('API called with recordingId:', recordingId, 'includeUserInfo:', includeUserInfo);
    
    // If recordingId is provided, return single recording with events
    if (recordingId) {
      return await getSingleRecordingWithEvents(null, 'demo-user', recordingId);
    }
    
    // Return mock data for demo
    if (includeUserInfo) {
      const mockRecordings = [
        {
          id: 'demo-recording-1',
          user_id: 'demo-user-1',
          userName: 'Alice Johnson',
          userEmail: 'alice.johnson@school.edu',
          document_id: 'demo-doc-1',
          documentTitle: 'Essay: Climate Change Impact',
          session_id: 'demo-session-1',
          title: 'Writing Session - Climate Essay',
          status: 'completed',
          privacy_level: 'full',
          start_time: new Date(Date.now() - 86400000).toISOString(),
          end_time: new Date(Date.now() - 86400000 + 3600000).toISOString(),
          duration_ms: 3600000,
          total_keystrokes: 2500,
          total_characters: 2000,
          average_wpm: 45,
          pause_count: 15,
          backspace_count: 120,
          delete_count: 30,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          consent_given: true
        },
        {
          id: 'demo-recording-2',
          user_id: 'demo-user-2',
          userName: 'Bob Smith',
          userEmail: 'bob.smith@school.edu',
          document_id: 'demo-doc-2',
          documentTitle: 'Research Paper: Renewable Energy',
          session_id: 'demo-session-2',
          title: 'Research Writing Session',
          status: 'active',
          privacy_level: 'anonymized',
          start_time: new Date(Date.now() - 3600000).toISOString(),
          duration_ms: 3600000,
          total_keystrokes: 1800,
          total_characters: 1500,
          average_wpm: 38,
          pause_count: 22,
          backspace_count: 95,
          delete_count: 18,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          consent_given: true
        },
        {
          id: 'demo-recording-3',
          user_id: 'demo-user-3',
          userName: 'Carol Davis',
          userEmail: 'carol.davis@school.edu',
          document_id: 'demo-doc-3',
          documentTitle: 'Creative Writing: Short Story',
          session_id: 'demo-session-3',
          title: 'Creative Writing Session',
          status: 'paused',
          privacy_level: 'metadata_only',
          start_time: new Date(Date.now() - 7200000).toISOString(),
          end_time: new Date(Date.now() - 5400000).toISOString(),
          duration_ms: 1800000,
          total_keystrokes: 900,
          total_characters: 750,
          average_wpm: 42,
          pause_count: 8,
          backspace_count: 45,
          delete_count: 12,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          consent_given: true
        }
      ];

      console.log('Returning mock recordings:', mockRecordings.length);
      return NextResponse.json({ recordings: mockRecordings });
    }

    // For non-admin requests, return empty array
    return NextResponse.json({ recordings: [] });

  } catch (error) {
    console.error('Error in GET /api/keystroke/recordings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get single recording with events
async function getSingleRecordingWithEvents(supabase: any, userId: string, recordingId: string) {
  try {
    // For demo purposes, return mock data based on recordingId
    console.log('Getting single recording for ID:', recordingId);
    
    // Mock recording data
    const mockRecordings = {
      'demo-recording-1': {
        id: 'demo-recording-1',
        user_id: 'demo-user-1',
        document_id: 'demo-doc-1',
        session_id: 'demo-session-1',
        title: 'Writing Session - Climate Essay',
        status: 'completed',
        privacy_level: 'full',
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() - 86400000 + 3600000).toISOString(),
        duration_ms: 3600000,
        total_keystrokes: 2500,
        total_characters: 2000,
        average_wpm: 45,
        pause_count: 15,
        backspace_count: 120,
        delete_count: 30,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        consent_given: true
      },
      'demo-recording-2': {
        id: 'demo-recording-2',
        user_id: 'demo-user-2',
        document_id: 'demo-doc-2',
        session_id: 'demo-session-2',
        title: 'Research Writing Session',
        status: 'active',
        privacy_level: 'anonymized',
        start_time: new Date(Date.now() - 3600000).toISOString(),
        duration_ms: 3600000,
        total_keystrokes: 1800,
        total_characters: 1500,
        average_wpm: 38,
        pause_count: 22,
        backspace_count: 95,
        delete_count: 18,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        consent_given: true
      },
      'demo-recording-3': {
        id: 'demo-recording-3',
        user_id: 'demo-user-3',
        document_id: 'demo-doc-3',
        session_id: 'demo-session-3',
        title: 'Creative Writing Session',
        status: 'paused',
        privacy_level: 'metadata_only',
        start_time: new Date(Date.now() - 7200000).toISOString(),
        end_time: new Date(Date.now() - 5400000).toISOString(),
        duration_ms: 1800000,
        total_keystrokes: 900,
        total_characters: 750,
        average_wpm: 42,
        pause_count: 8,
        backspace_count: 45,
        delete_count: 12,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        consent_given: true
      }
    };

    const recording = mockRecordings[recordingId as keyof typeof mockRecordings];
    
    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Generate mock keystroke events
    const mockEvents = [];
    const eventCount = Math.min(recording.total_keystrokes, 100); // Limit for demo
    
    for (let i = 0; i < eventCount; i++) {
      mockEvents.push({
        id: `event-${recordingId}-${i}`,
        event_id: `evt_${recordingId}_${i}`,
        sequence_number: i,
        timestamp_ms: i * 100, // 100ms intervals
        absolute_timestamp: new Date(Date.now() - 3600000 + (i * 100)).toISOString(),
        event_type: i % 10 === 0 ? 'backspace' : 'keypress',
        encryptedData: Buffer.from(`mock_encrypted_data_${i}`).toString('base64'),
        data_hash: `hash_${i}`,
        target_element: 'textarea',
        has_modifier_keys: i % 20 === 0,
        is_functional_key: i % 15 === 0,
        created_at: new Date(Date.now() - 3600000 + (i * 100)).toISOString()
      });
    }

    console.log(`Returning mock recording with ${mockEvents.length} events`);

    return NextResponse.json({
      recording: recording,
      events: mockEvents,
      totalEvents: mockEvents.length
    });

  } catch (error) {
    console.error('Error fetching single recording:', error);
    return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
  }
}

// POST /api/keystroke/recordings - Create new recording or add events
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

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
    const supabase = createSupabaseClient();

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