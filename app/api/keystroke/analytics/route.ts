/**
 * API endpoint for keystroke analytics
 * Provides session analysis and time-on-task measurements
 */

import { NextRequest, NextResponse } from 'next/server';
import KeystrokeAnalytics, { WritingSession, SessionAnalytics } from '@/lib/keystroke/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, documentId, events, metadata } = body;

    // Validate required fields
    if (!sessionId || !userId || !documentId || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userId, documentId, events' },
        { status: 400 }
      );
    }

    // Create writing session object
    const session: WritingSession = {
      id: sessionId,
      userId,
      documentId,
      startTime: events.length > 0 ? events[0].timestamp : Date.now(),
      endTime: events.length > 0 ? events[events.length - 1].timestamp : Date.now(),
      events,
      metadata: {
        documentTitle: metadata?.documentTitle || 'Untitled Document',
        assignmentType: metadata?.assignmentType || 'essay',
        privacyLevel: metadata?.privacyLevel || 'full'
      }
    };

    // Analyze the session
    const analytics = KeystrokeAnalytics.analyzeSession(session);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error analyzing keystroke session:', error);
    return NextResponse.json(
      { error: 'Failed to analyze session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');
    const sessionIds = searchParams.get('sessionIds')?.split(',');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // For demo purposes, return mock analytics data
    // In a real implementation, this would fetch from the database
    const mockAnalytics: SessionAnalytics[] = [
      {
        sessionId: 'session-1',
        userId,
        documentId: documentId || 'doc-1',
        totalDuration: 1800000, // 30 minutes
        activeWritingTime: 1200000, // 20 minutes
        totalKeystrokes: 450,
        productiveKeystrokes: 380,
        wordsPerMinute: 22.5,
        charactersPerMinute: 112.5,
        timeOnTask: 20, // minutes
        totalPauses: 25,
        averagePauseLength: 2500,
        longestPause: 15000,
        shortPauses: 18,
        mediumPauses: 5,
        longPauses: 2,
        burstsOfActivity: [
          {
            startTime: Date.now() - 1800000,
            endTime: Date.now() - 1650000,
            keystrokes: 85,
            duration: 150000,
            averageWPM: 34
          },
          {
            startTime: Date.now() - 900000,
            endTime: Date.now() - 600000,
            keystrokes: 120,
            duration: 300000,
            averageWPM: 24
          }
        ],
        editingRatio: 0.18,
        revisionPatterns: [
          {
            timestamp: Date.now() - 1200000,
            type: 'deletion',
            length: 3
          },
          {
            timestamp: Date.now() - 800000,
            type: 'deletion',
            length: 7
          }
        ],
        focusScore: 78,
        productivityScore: 82,
        engagementScore: 85,
        sessionType: 'focused',
        peakProductivityPeriod: {
          start: Date.now() - 900000,
          end: Date.now() - 840000,
          duration: 60000
        },
        strugglingPeriods: [
          {
            start: Date.now() - 1200000,
            end: Date.now() - 1080000,
            duration: 120000
          }
        ]
      },
      {
        sessionId: 'session-2',
        userId,
        documentId: documentId || 'doc-1',
        totalDuration: 2400000, // 40 minutes
        activeWritingTime: 1800000, // 30 minutes
        totalKeystrokes: 520,
        productiveKeystrokes: 445,
        wordsPerMinute: 18.5,
        charactersPerMinute: 92.5,
        timeOnTask: 30, // minutes
        totalPauses: 35,
        averagePauseLength: 3200,
        longestPause: 25000,
        shortPauses: 22,
        mediumPauses: 8,
        longPauses: 5,
        burstsOfActivity: [
          {
            startTime: Date.now() - 2400000,
            endTime: Date.now() - 2100000,
            keystrokes: 95,
            duration: 300000,
            averageWPM: 19
          }
        ],
        editingRatio: 0.14,
        revisionPatterns: [
          {
            timestamp: Date.now() - 1800000,
            type: 'deletion',
            length: 5
          }
        ],
        focusScore: 65,
        productivityScore: 68,
        engagementScore: 72,
        sessionType: 'exploratory',
        peakProductivityPeriod: {
          start: Date.now() - 2100000,
          end: Date.now() - 2040000,
          duration: 60000
        },
        strugglingPeriods: [
          {
            start: Date.now() - 1800000,
            end: Date.now() - 1620000,
            duration: 180000
          }
        ]
      }
    ];

    // Filter by sessionIds if provided
    const filteredAnalytics = sessionIds 
      ? mockAnalytics.filter(a => sessionIds.includes(a.sessionId))
      : mockAnalytics;

    // Generate summary if multiple sessions
    const summary = filteredAnalytics.length > 1 
      ? KeystrokeAnalytics.generateSessionSummary(filteredAnalytics)
      : null;

    return NextResponse.json({
      success: true,
      analytics: filteredAnalytics,
      summary
    });

  } catch (error) {
    console.error('Error fetching keystroke analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Get analytics for a specific session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // For demo purposes, return mock session data
    // In a real implementation, this would fetch the session from database
    const mockSession: WritingSession = {
      id: sessionId,
      userId: 'demo-user',
      documentId: 'demo-doc',
      startTime: Date.now() - 1800000, // 30 minutes ago
      endTime: Date.now(),
      events: [
        // Mock keystroke events for demonstration
        {
          id: 'event-1',
          key: 'T',
          code: 'KeyT',
          type: 'keydown',
          timestamp: Date.now() - 1800000,
          value: 'T',
          cursorPosition: 0
        },
        {
          id: 'event-2',
          key: 'h',
          code: 'KeyH',
          type: 'keydown',
          timestamp: Date.now() - 1799500,
          value: 'h',
          cursorPosition: 1
        },
        // ... more events would be here in a real implementation
      ],
      metadata: {
        documentTitle: 'Sample Essay',
        assignmentType: 'essay',
        privacyLevel: 'full'
      }
    };

    const analytics = KeystrokeAnalytics.analyzeSession(mockSession);

    return NextResponse.json({
      success: true,
      session: mockSession,
      analytics
    });

  } catch (error) {
    console.error('Error analyzing specific session:', error);
    return NextResponse.json(
      { error: 'Failed to analyze session' },
      { status: 500 }
    );
  }
} 