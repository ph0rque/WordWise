/**
 * Unit tests for Keystroke Analytics Engine
 */

import KeystrokeAnalytics, { 
  KeystrokeEvent, 
  WritingSession, 
  SessionAnalytics 
} from './analytics';

describe('KeystrokeAnalytics', () => {
  // Helper function to create mock keystroke events
  const createKeystrokeEvent = (
    key: string, 
    timestamp: number, 
    type: 'keydown' | 'keyup' = 'keydown'
  ): KeystrokeEvent => ({
    id: `event-${timestamp}`,
    key,
    code: `Key${key.toUpperCase()}`,
    type,
    timestamp,
    value: key.length === 1 ? key : undefined,
    cursorPosition: 0
  });

  // Helper function to create a mock writing session
  const createWritingSession = (events: KeystrokeEvent[]): WritingSession => ({
    id: 'test-session-1',
    userId: 'user-123',
    documentId: 'doc-456',
    startTime: events.length > 0 ? events[0].timestamp : Date.now(),
    endTime: events.length > 0 ? events[events.length - 1].timestamp : Date.now(),
    events,
    metadata: {
      documentTitle: 'Test Essay',
      assignmentType: 'essay',
      privacyLevel: 'full'
    }
  });

  describe('analyzeSession', () => {
    it('should handle empty session', () => {
      const session = createWritingSession([]);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.sessionId).toBe('test-session-1');
      expect(analytics.totalKeystrokes).toBe(0);
      expect(analytics.wordsPerMinute).toBe(0);
      expect(analytics.timeOnTask).toBe(0);
      expect(analytics.sessionType).toBe('exploratory');
    });

    it('should calculate basic metrics correctly', () => {
      const events = [
        createKeystrokeEvent('h', 1000),
        createKeystrokeEvent('e', 1100),
        createKeystrokeEvent('l', 1200),
        createKeystrokeEvent('l', 1300),
        createKeystrokeEvent('o', 1400),
        createKeystrokeEvent(' ', 1500),
        createKeystrokeEvent('w', 1600),
        createKeystrokeEvent('o', 1700),
        createKeystrokeEvent('r', 1800),
        createKeystrokeEvent('l', 1900),
        createKeystrokeEvent('d', 2000)
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.totalKeystrokes).toBe(11);
      expect(analytics.productiveKeystrokes).toBe(11);
      expect(analytics.totalDuration).toBe(1000); // 2000 - 1000
      expect(analytics.wordsPerMinute).toBeGreaterThan(0);
    });

    it('should identify pause patterns correctly', () => {
      const events = [
        createKeystrokeEvent('h', 1000),
        createKeystrokeEvent('e', 1100),
        // Short pause (900ms)
        createKeystrokeEvent('l', 2000),
        createKeystrokeEvent('l', 2100),
        // Medium pause (3 seconds)
        createKeystrokeEvent('o', 5100),
        // Long pause (12 seconds)
        createKeystrokeEvent(' ', 17100),
        createKeystrokeEvent('w', 17200)
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.shortPauses).toBe(2); // 100ms gaps + 900ms gap
      expect(analytics.mediumPauses).toBe(1); // 3 second gap
      expect(analytics.longPauses).toBe(1); // 12 second gap
      expect(analytics.longestPause).toBe(12000);
    });

    it('should calculate editing ratio correctly', () => {
      const events = [
        createKeystrokeEvent('h', 1000),
        createKeystrokeEvent('e', 1100),
        createKeystrokeEvent('l', 1200),
        createKeystrokeEvent('Backspace', 1300),
        createKeystrokeEvent('Backspace', 1400),
        createKeystrokeEvent('l', 1500),
        createKeystrokeEvent('l', 1600),
        createKeystrokeEvent('o', 1700)
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      // 2 backspaces out of 6 productive keystrokes = 0.33 ratio
      expect(analytics.editingRatio).toBeCloseTo(0.33, 2);
    });

    it('should identify writing bursts', () => {
      const events = [
        // First burst: 10 keystrokes in 1 second
        ...Array.from({ length: 10 }, (_, i) => 
          createKeystrokeEvent('a', 1000 + i * 100)
        ),
        // Long pause (15 seconds)
        // Second burst: 15 keystrokes in 1.5 seconds
        ...Array.from({ length: 15 }, (_, i) => 
          createKeystrokeEvent('b', 16000 + i * 100)
        )
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.burstsOfActivity.length).toBe(2);
      expect(analytics.burstsOfActivity[0].keystrokes).toBe(10);
      expect(analytics.burstsOfActivity[1].keystrokes).toBe(15);
    });

    it('should determine session type correctly', () => {
      // Test focused session (consistent writing, few pauses)
      const focusedEvents = Array.from({ length: 50 }, (_, i) => 
        createKeystrokeEvent('a', 1000 + i * 200)
      );
      const focusedSession = createWritingSession(focusedEvents);
      const focusedAnalytics = KeystrokeAnalytics.analyzeSession(focusedSession);
      expect(focusedAnalytics.sessionType).toBe('focused');

      // Test editing session (high editing ratio)
      const editingEvents = [
        ...Array.from({ length: 10 }, (_, i) => createKeystrokeEvent('a', 1000 + i * 100)),
        ...Array.from({ length: 5 }, (_, i) => createKeystrokeEvent('Backspace', 2000 + i * 100))
      ];
      const editingSession = createWritingSession(editingEvents);
      const editingAnalytics = KeystrokeAnalytics.analyzeSession(editingSession);
      expect(editingAnalytics.sessionType).toBe('editing');
    });

    it('should calculate quality scores', () => {
      const events = Array.from({ length: 30 }, (_, i) => 
        createKeystrokeEvent('a', 1000 + i * 200)
      );

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.focusScore).toBeGreaterThan(0);
      expect(analytics.focusScore).toBeLessThanOrEqual(100);
      expect(analytics.productivityScore).toBeGreaterThan(0);
      expect(analytics.productivityScore).toBeLessThanOrEqual(100);
      expect(analytics.engagementScore).toBeGreaterThan(0);
      expect(analytics.engagementScore).toBeLessThanOrEqual(100);
    });

    it('should identify struggling periods', () => {
      const events = [
        // Normal writing
        ...Array.from({ length: 10 }, (_, i) => createKeystrokeEvent('a', 1000 + i * 100)),
        // Struggling period (lots of deletions)
        ...Array.from({ length: 5 }, (_, i) => createKeystrokeEvent('b', 2000 + i * 100)),
        ...Array.from({ length: 8 }, (_, i) => createKeystrokeEvent('Backspace', 2500 + i * 100)),
        // More normal writing
        ...Array.from({ length: 10 }, (_, i) => createKeystrokeEvent('c', 10000 + i * 100))
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.strugglingPeriods.length).toBeGreaterThan(0);
    });
  });

  describe('generateSessionSummary', () => {
    it('should handle empty analytics array', () => {
      const summary = KeystrokeAnalytics.generateSessionSummary([]);

      expect(summary.totalSessions).toBe(0);
      expect(summary.totalTimeOnTask).toBe(0);
      expect(summary.averageWPM).toBe(0);
      expect(summary.improvementTrend).toBe('stable');
    });

    it('should calculate summary statistics correctly', () => {
      const mockAnalytics: SessionAnalytics[] = [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          documentId: 'doc-1',
          totalDuration: 60000,
          activeWritingTime: 50000,
          totalKeystrokes: 100,
          productiveKeystrokes: 90,
          wordsPerMinute: 20,
          charactersPerMinute: 100,
          timeOnTask: 5,
          totalPauses: 10,
          averagePauseLength: 1000,
          longestPause: 5000,
          shortPauses: 8,
          mediumPauses: 2,
          longPauses: 0,
          burstsOfActivity: [],
          editingRatio: 0.1,
          revisionPatterns: [],
          focusScore: 80,
          productivityScore: 70,
          engagementScore: 85,
          sessionType: 'focused',
          strugglingPeriods: []
        },
        {
          sessionId: 'session-2',
          userId: 'user-1',
          documentId: 'doc-2',
          totalDuration: 90000,
          activeWritingTime: 70000,
          totalKeystrokes: 150,
          productiveKeystrokes: 130,
          wordsPerMinute: 25,
          charactersPerMinute: 125,
          timeOnTask: 7,
          totalPauses: 15,
          averagePauseLength: 1200,
          longestPause: 6000,
          shortPauses: 12,
          mediumPauses: 3,
          longPauses: 0,
          burstsOfActivity: [],
          editingRatio: 0.15,
          revisionPatterns: [],
          focusScore: 85,
          productivityScore: 75,
          engagementScore: 90,
          sessionType: 'focused',
          strugglingPeriods: []
        }
      ];

      const summary = KeystrokeAnalytics.generateSessionSummary(mockAnalytics);

      expect(summary.totalSessions).toBe(2);
      expect(summary.totalTimeOnTask).toBe(12); // 5 + 7
      expect(summary.averageWPM).toBe(22.5); // (20 + 25) / 2
      expect(summary.averageFocusScore).toBe(83); // (80 + 85) / 2 rounded
      expect(summary.sessionTypeDistribution.focused).toBe(2);
    });

    it('should detect improvement trends', () => {
      // Create analytics showing improvement over time
      const improvingAnalytics: SessionAnalytics[] = Array.from({ length: 8 }, (_, i) => ({
        sessionId: `session-${i}`,
        userId: 'user-1',
        documentId: 'doc-1',
        totalDuration: 60000,
        activeWritingTime: 50000,
        totalKeystrokes: 100,
        productiveKeystrokes: 90,
        wordsPerMinute: 20 + i, // Improving WPM
        charactersPerMinute: 100,
        timeOnTask: 5,
        totalPauses: 10,
        averagePauseLength: 1000,
        longestPause: 5000,
        shortPauses: 8,
        mediumPauses: 2,
        longPauses: 0,
        burstsOfActivity: [],
        editingRatio: 0.1,
        revisionPatterns: [],
        focusScore: 60 + i * 5, // Improving focus
        productivityScore: 50 + i * 5, // Improving productivity
        engagementScore: 70 + i * 3, // Improving engagement
        sessionType: 'focused',
        strugglingPeriods: []
      }));

      const summary = KeystrokeAnalytics.generateSessionSummary(improvingAnalytics);
      expect(summary.improvementTrend).toBe('improving');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle sessions with only non-productive keystrokes', () => {
      const events = [
        createKeystrokeEvent('ArrowLeft', 1000),
        createKeystrokeEvent('ArrowRight', 1100),
        createKeystrokeEvent('Backspace', 1200),
        createKeystrokeEvent('Delete', 1300)
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.productiveKeystrokes).toBe(0);
      expect(analytics.wordsPerMinute).toBe(0);
      expect(analytics.editingRatio).toBe(0); // Division by zero handled
    });

    it('should handle very short sessions', () => {
      const events = [
        createKeystrokeEvent('a', 1000),
        createKeystrokeEvent('b', 1001)
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.totalKeystrokes).toBe(2);
      expect(analytics.totalDuration).toBe(1);
      expect(analytics.burstsOfActivity.length).toBe(0); // Too short for bursts
    });

    it('should handle sessions with extreme pause lengths', () => {
      const events = [
        createKeystrokeEvent('a', 1000),
        createKeystrokeEvent('b', 3601000) // 1 hour pause
      ];

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      expect(analytics.longPauses).toBe(1);
      expect(analytics.longestPause).toBe(3600000);
      expect(analytics.focusScore).toBeLessThan(50); // Should be low due to long pause
    });
  });

  describe('Performance considerations', () => {
    it('should handle large sessions efficiently', () => {
      const startTime = Date.now();
      
      // Create a large session with 1000 events
      const events = Array.from({ length: 1000 }, (_, i) => 
        createKeystrokeEvent(String.fromCharCode(97 + (i % 26)), 1000 + i * 100)
      );

      const session = createWritingSession(events);
      const analytics = KeystrokeAnalytics.analyzeSession(session);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(analytics.totalKeystrokes).toBe(1000);
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 