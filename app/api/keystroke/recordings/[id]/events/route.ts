import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

// GET /api/keystroke/recordings/[id]/events - Get events for a recording
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

    // Verify recording exists and user has access
    const { data: recording, error: recordingError } = await supabase
      .from('keystroke_recordings')
      .select('id, user_id, title, status')
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

    // Fetch events for the recording
    const { data: events, error: eventsError } = await supabase
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

    if (eventsError) {
      console.error('Error fetching keystroke events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Convert binary data to base64 for JSON response
    const processedEvents = events.map(event => ({
      ...event,
      encryptedData: Buffer.from(event.encrypted_data).toString('base64')
    }));

    return NextResponse.json({
      recording: {
        id: recording.id,
        title: recording.title,
        status: recording.status
      },
      events: processedEvents,
      totalEvents: processedEvents.length
    });

  } catch (error) {
    console.error('Error in GET /api/keystroke/recordings/[id]/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 