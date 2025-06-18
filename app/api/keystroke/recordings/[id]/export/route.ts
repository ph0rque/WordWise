import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

// GET /api/keystroke/recordings/[id]/export - Export recording data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recordingId = params.id;

    // Verify recording exists and get details
    const { data: recording, error: recordingError } = await supabase
      .from('keystroke_recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Check if user has access (owner or admin)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = userRole?.role === 'admin';
    const isOwner = recording.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get user information for the recording owner
    let ownerInfo = null;
    if (isAdmin) {
      const { data: owner } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('id', recording.user_id)
        .single();

      if (owner) {
        ownerInfo = {
          id: owner.id,
          email: owner.email,
          name: owner.raw_user_meta_data?.full_name || 
                owner.raw_user_meta_data?.name || 
                'Unknown User'
        };
      }
    }

    // Fetch events for the recording (if privacy level allows)
    let events = [];
    if (recording.privacy_level !== 'metadata_only') {
      const { data: eventData, error: eventsError } = await supabase
        .from('keystroke_events')
        .select(`
          id,
          event_id,
          sequence_number,
          timestamp_ms,
          absolute_timestamp,
          event_type,
          encrypted_data,
          data_hash,
          target_element,
          has_modifier_keys,
          is_functional_key,
          created_at
        `)
        .eq('recording_id', recordingId)
        .order('sequence_number', { ascending: true });

      if (!eventsError && eventData) {
        // Convert binary data to base64 for export
        events = eventData.map((event: any) => ({
          ...event,
          encrypted_data: Buffer.from(event.encrypted_data).toString('base64')
        }));
      }
    }

    // Prepare export data
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.id,
        exportType: 'keystroke_recording',
        version: '1.0'
      },
      recording: {
        id: recording.id,
        sessionId: recording.session_id,
        documentId: recording.document_id,
        title: recording.title,
        status: recording.status,
        privacyLevel: recording.privacy_level,
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
        updatedAt: recording.updated_at,
        consentGiven: recording.consent_given,
        dataRetentionDays: recording.data_retention_days
      },
      owner: ownerInfo,
      events: events,
      statistics: {
        totalEvents: events.length,
        eventTypes: events.reduce((acc: any, event: any) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {}),
        hasEncryptedData: events.some((event: any) => event.encrypted_data),
        privacyLevel: recording.privacy_level
      }
    };

    // Return as downloadable JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="keystroke-recording-${recordingId}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Error exporting recording:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 