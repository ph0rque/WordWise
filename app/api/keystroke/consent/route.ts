import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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

// GET /api/keystroke/consent - Get consent status
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, return no consent initially
    return NextResponse.json({ hasConsent: false });
  } catch (error) {
    console.error('Error in consent GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/keystroke/consent - Set consent
export async function POST(request: NextRequest) {
  try {
    const consentData = await request.json();
    
    // Validate required fields
    if (!consentData.privacyLevel || !consentData.dataRetentionDays) {
      return NextResponse.json({ error: 'Missing required consent data' }, { status: 400 });
    }

    // For demo purposes, just return success
    return NextResponse.json({ 
      success: true,
      settings: {
        privacyLevel: consentData.privacyLevel,
        dataRetentionDays: consentData.dataRetentionDays,
        allowTeacherReview: consentData.allowTeacherReview || false,
        allowPlaybackReview: consentData.allowPlaybackReview || false,
        consentDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in consent POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/keystroke/consent - Update consent
export async function PUT(request: NextRequest) {
  try {
    const updateData = await request.json();
    
    // For demo purposes, just return success
    return NextResponse.json({ 
      success: true,
      settings: {
        privacyLevel: updateData.privacyLevel,
        dataRetentionDays: updateData.dataRetentionDays,
        allowTeacherReview: updateData.allowTeacherReview,
        allowPlaybackReview: updateData.allowPlaybackReview,
        consentDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in consent PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/keystroke/consent - Delete consent
export async function DELETE(request: NextRequest) {
  try {
    // For demo purposes, just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in consent DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 