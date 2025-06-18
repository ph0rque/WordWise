import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get keystroke recordings summary for the user
    const { data: recordingsSummary, error: recordingsError } = await supabase
      .rpc('get_user_keystroke_summary', { user_id: user.id });

    if (recordingsError) {
      console.error('Error fetching keystroke summary:', recordingsError);
      return NextResponse.json(
        { error: 'Failed to fetch data summary' },
        { status: 500 }
      );
    }

    // Get total keystroke count
    const { data: keystrokeCount, error: keystrokeError } = await supabase
      .from('keystroke_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    if (keystrokeError) {
      console.error('Error counting keystrokes:', keystrokeError);
    }

    // Get data size estimate (rough calculation)
    const avgEventSize = 150; // bytes per keystroke event
    const totalKeystrokes = keystrokeCount?.length || 0;
    const estimatedSize = totalKeystrokes * avgEventSize;
    
    const formatDataSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const summary = {
      totalRecordings: recordingsSummary?.total_recordings || 0,
      oldestRecording: recordingsSummary?.oldest_recording || new Date(),
      newestRecording: recordingsSummary?.newest_recording || new Date(),
      totalKeystrokes: totalKeystrokes,
      dataSize: formatDataSize(estimatedSize)
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error in data summary endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 