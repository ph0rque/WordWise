import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, hasConsented, privacyLevel = 'anonymized', dataRetentionDays = 30, allowTeacherReview = true } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Insert or update consent record
    const { error } = await supabase
      .from('keystroke_consent')
      .upsert({
        user_id: userId,
        privacy_level: privacyLevel,
        data_retention_days: dataRetentionDays,
        allow_teacher_review: allowTeacherReview,
        allow_playback_review: hasConsented,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving consent:', error);
      return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
    }

    console.log(`✅ Consent saved for user ${userId}: ${hasConsented ? 'GRANTED' : 'DENIED'}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Consent saved successfully',
      hasConsented 
    });

  } catch (error) {
    console.error('Error in consent save API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 